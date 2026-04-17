import { prisma, prismaRead } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import { publishUserEvent } from "../../lib/realtime.js";
import { createPersonalized25DayPlan } from "./personalizedPlan.js";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

const COMPLETE_STATUSES = new Set(["PENDING", "APPROVED"] as const);
const TODAY_PLAN_CACHE_TTL_MS = 15_000;
const TODAY_PLAN_LITE_CACHE_TTL_MS = 8_000;
// Safety limit: evict oldest entries when either cache exceeds this size.
const PLAN_CACHE_MAX_SIZE = 2_000;

const STUDENT_NOTE_PREFIX = "Student note:";

const normalizeWhatsAppNumber = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, "");
  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    throw HttpError.badRequest("Trainer WhatsApp number is invalid. Please update trainer profile.");
  }
  return digitsOnly;
};

const buildProofReference = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `AHG-${yyyy}${mm}${dd}-${hh}${min}-${suffix}`;
};

const extractStudentNote = (trainerNote: string | null): string => {
  if (!trainerNote) return "";
  if (!trainerNote.startsWith(STUDENT_NOTE_PREFIX)) return "";
  return trainerNote.replace(STUDENT_NOTE_PREFIX, "").trim();
};

const composeReviewNote = (existingTrainerNote: string | null, reviewNote?: string): string | null => {
  const studentNote = extractStudentNote(existingTrainerNote);
  const trimmedReviewNote = reviewNote?.trim() ?? "";

  if (studentNote && trimmedReviewNote) {
    return `${STUDENT_NOTE_PREFIX} ${studentNote}\n\nTrainer note: ${trimmedReviewNote}`;
  }
  if (studentNote) {
    return `${STUDENT_NOTE_PREFIX} ${studentNote}`;
  }
  if (trimmedReviewNote) {
    return trimmedReviewNote;
  }
  return null;
};

const elapsedMs = (startedAt: number): number => Number((performance.now() - startedAt).toFixed(2));

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const READ_ATTEMPT_TIMEOUT = "READ_ATTEMPT_TIMEOUT";

const withAttemptTimeout = async <T>(work: () => Promise<T>, timeoutMs: number): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(READ_ATTEMPT_TIMEOUT));
    }, timeoutMs);

    work()
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

const isRetryablePrismaError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const maybeCode = (error as { code?: string }).code;
  const maybeMessage = String((error as { message?: string }).message ?? "").toLowerCase();
  return (
    maybeCode === "P2024" ||
    maybeCode === "P2028" ||
    maybeMessage.includes("transaction already closed") ||
    maybeMessage.includes("transaction not found") ||
    maybeMessage.includes("timed out fetching a new connection from the connection pool")
  );
};

const isRetryableReadPrismaError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const maybeCode = (error as { code?: string }).code;
  const maybeMessage = String((error as { message?: string }).message ?? "").toLowerCase();
  return (
    maybeCode === "P2024" ||
    maybeMessage.includes("timed out fetching a new connection from the connection pool") ||
    maybeMessage.includes(READ_ATTEMPT_TIMEOUT.toLowerCase())
  );
};

const withReadRetry = async <T>(operation: string, userId: string, work: () => Promise<T>): Promise<T> => {
  const maxAttempts = 2;
  const maxTotalMs = 10_500;
  const startedAt = performance.now();

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await withAttemptTimeout(work, 5_000);
    } catch (error) {
      const totalMs = elapsedMs(startedAt);
      if (isRetryableReadPrismaError(error) && attempt < maxAttempts && totalMs < maxTotalMs) {
        logger.warn("read.retry", {
          scope: operation,
          userId,
          attempt,
          message: error instanceof Error ? error.message : String(error),
        });
        await wait(80 * attempt);
        continue;
      }

      if (isRetryableReadPrismaError(error)) {
        logger.warn("read.db_busy", {
          scope: operation,
          userId,
          attempts: attempt,
          totalMs,
          message: error instanceof Error ? error.message : String(error),
        });
        throw new HttpError(503, "Data is temporarily unavailable. Please retry.");
      }

      throw error;
    }
  }

  throw new HttpError(503, "Data is temporarily unavailable. Please retry.");
};

const computeCalendarDay = (createdAt: Date, totalDays: number): number => {
  const startOfDay = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  
  const createdDate = startOfDay(createdAt);
  const currentDate = startOfDay(new Date());
  
  const elapsedDays = Math.floor((currentDate - createdDate) / msPerDay);
  return Math.max(1, Math.min(totalDays, elapsedDays + 1));
};

/**
 * calculateStreak — determines consecutive days of approved activity ending either today or yesterday.
 */
async function calculateStreak(userId: string, createdAt: Date): Promise<number> {
  const startOfDayUTC = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  const now = new Date();
  
  const createdDate = startOfDayUTC(createdAt);
  const currentDate = startOfDayUTC(now);
  const currentDayNumber = Math.floor((currentDate - createdDate) / msPerDay) + 1;

  // Fetch all approved submissions for this student
  const approved = await prismaRead.submission.findMany({
    where: { studentId: userId, status: "APPROVED" },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" }
  });

  if (approved.length === 0) return 0;

  // Map to unique day numbers since account creation
  const activityDays = new Set(
    approved.map(sub => Math.floor((startOfDayUTC(sub.createdAt) - createdDate) / msPerDay) + 1)
  );

  let streak = 0;
  let checkDay = activityDays.has(currentDayNumber) ? currentDayNumber : currentDayNumber - 1;

  while (checkDay > 0 && activityDays.has(checkDay)) {
    streak += 1;
    checkDay -= 1;
  }

  return streak;
}


const resolveUnlockedDay = (
  planDays: Array<{ day: number; tasks: Array<{ id: string }> }>,
  latestByTask: Map<string, { status: string }>,
  calendarDay: number,
): number => {
  const sortedDays = [...planDays].sort((a, b) => a.day - b.day);
  const firstIncompleteDay =
    sortedDays.find((day) => {
      if (day.tasks.length === 0) return false;
      return day.tasks.some((task) => {
        const latestSubmission = latestByTask.get(task.id);
        return !latestSubmission || !COMPLETE_STATUSES.has(latestSubmission.status as "PENDING" | "APPROVED");
      });
    })?.day ?? sortedDays[sortedDays.length - 1]?.day ?? 1;

  return Math.max(1, Math.min(calendarDay, firstIncompleteDay));
};

const todayPlanCache = new Map<string, { expiresAt: number; value: unknown }>();
const todayPlanLiteCache = new Map<string, { expiresAt: number; value: unknown }>();

const getCachedTodayPlan = (userId: string): unknown | null => {
  const cached = todayPlanCache.get(userId);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    todayPlanCache.delete(userId);
    return null;
  }
  return cached.value;
};

const evictOldestFromCache = (cache: Map<string, { expiresAt: number; value: unknown }>): void => {
  // First try to remove already-expired entries.
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
  // If still over limit, remove the first (oldest-inserted) entry.
  if (cache.size >= PLAN_CACHE_MAX_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
};

const setCachedTodayPlan = (userId: string, value: unknown): void => {
  if (!todayPlanCache.has(userId) && todayPlanCache.size >= PLAN_CACHE_MAX_SIZE) {
    evictOldestFromCache(todayPlanCache);
  }
  todayPlanCache.set(userId, {
    value,
    expiresAt: Date.now() + TODAY_PLAN_CACHE_TTL_MS,
  });
};

const invalidateTodayPlanCache = (userId: string): void => {
  todayPlanCache.delete(userId);
};

const getCachedTodayPlanLite = (userId: string): unknown | null => {
  const cached = todayPlanLiteCache.get(userId);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    todayPlanLiteCache.delete(userId);
    return null;
  }
  return cached.value;
};

const setCachedTodayPlanLite = (userId: string, value: unknown): void => {
  if (!todayPlanLiteCache.has(userId) && todayPlanLiteCache.size >= PLAN_CACHE_MAX_SIZE) {
    evictOldestFromCache(todayPlanLiteCache);
  }
  todayPlanLiteCache.set(userId, {
    value,
    expiresAt: Date.now() + TODAY_PLAN_LITE_CACHE_TTL_MS,
  });
};

const invalidateTodayPlanLiteCache = (userId: string): void => {
  todayPlanLiteCache.delete(userId);
};

export async function getTodayPlan(userId: string) {
  const cached = getCachedTodayPlan(userId);
  if (cached) {
    return cached;
  }

  return withReadRetry("student.today_plan", userId, async () => {
    const profile = await prismaRead.studentProfile.findUnique({
      where: { userId },
      select: { currentPlanId: true, streak: true, user: { select: { createdAt: true } } },
    });
    if (!profile?.currentPlanId) return null;

    const plan = await prismaRead.plan.findUnique({
      where: { id: profile.currentPlanId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        days: {
          orderBy: { day: "asc" },
          select: {
            id: true,
            day: true,
            tasks: {
              select: {
                id: true,
                title: true,
                description: true,
                type: true,
                intensity: true,
              },
            },
          },
        },
      },
    });
    if (!plan) return null;

    const totalDays = Math.max(plan.days.length, 1);
    const currentDay = computeCalendarDay(profile.user.createdAt, totalDays);
    
    // Sync streak on every direct fetch
    const calculatedStreak = await calculateStreak(userId, profile.user.createdAt);
    if (calculatedStreak !== (profile as { streak?: number }).streak) {
      await prisma.studentProfile.update({
        where: { userId },
        data: { streak: calculatedStreak }
      });
    }

    const allTaskIds = plan.days.flatMap((day) => day.tasks.map((task) => task.id));
    const latestTaskSubmissions =
      allTaskIds.length === 0
        ? []
        : await prismaRead.submission.findMany({
            where: { studentId: userId, planTaskId: { in: allTaskIds } },
            orderBy: [{ planTaskId: "asc" }, { createdAt: "desc" }],
            distinct: ["planTaskId"],
            select: {
              id: true,
              planTaskId: true,
              status: true,
              trainerNote: true,
              createdAt: true,
            },
          });

    const latestByTask = new Map<string, (typeof latestTaskSubmissions)[number]>();
    for (const sub of latestTaskSubmissions) {
      if (!sub.planTaskId) continue;
      latestByTask.set(sub.planTaskId, sub);
    }

    const today = plan.days.find((day) => day.day === currentDay) ?? null;

    const decorateTask = (task: (typeof plan.days)[number]["tasks"][number]) => {
      const latestSubmission = latestByTask.get(task.id) ?? null;
      return {
        ...task,
        submissionStatus: latestSubmission?.status ?? "NOT_SUBMITTED",
        latestSubmission,
      };
    };

    const response = {
      ...plan,
      currentDay,
      totalDays,
      today: today
        ? {
            ...today,
            tasks: today.tasks.map(decorateTask),
          }
        : null,
      todaysTasks: today ? today.tasks.map(decorateTask) : [],
      days: plan.days.map((day) => ({
        ...day,
        tasks: day.tasks.map(decorateTask),
      })),
    };

    setCachedTodayPlan(userId, response);
    return response;
  });
}

export async function getTodayPlanLite(userId: string) {
  const cached = getCachedTodayPlanLite(userId);
  if (cached) {
    return cached;
  }

  return withReadRetry("student.today_plan_lite", userId, async () => {
    const profile = await prismaRead.studentProfile.findUnique({
      where: { userId },
      select: { currentPlanId: true, user: { select: { createdAt: true } } },
    });
    if (!profile?.currentPlanId) return null;

    const [plan, planDays] = await Promise.all([
      prismaRead.plan.findUnique({
        where: { id: profile.currentPlanId },
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: { select: { days: true } },
        },
      }),
      prismaRead.planDay.findMany({
        where: { planId: profile.currentPlanId },
        orderBy: { day: "asc" },
        select: {
          id: true,
          day: true,
          tasks: { select: { id: true } },
        },
      }),
    ]);

    if (!plan) return null;

    const totalDays = Math.max(plan._count.days, 1);
    
    // Calculate currentDay purely based on account creation date
    const currentDay = computeCalendarDay(profile.user.createdAt, totalDays);

    const allTaskIds = planDays.flatMap((day) => day.tasks.map((task) => task.id));
    const latestTaskSubmissions =
      allTaskIds.length === 0
        ? []
        : await prismaRead.submission.findMany({
            where: { studentId: userId, planTaskId: { in: allTaskIds } },
            orderBy: [{ planTaskId: "asc" }, { createdAt: "desc" }],
            distinct: ["planTaskId"],
            select: {
              id: true,
              planTaskId: true,
              status: true,
              trainerNote: true,
              createdAt: true,
            },
          });

    const latestByTask = new Map<string, (typeof latestTaskSubmissions)[number]>();
    for (const sub of latestTaskSubmissions) {
      if (!sub.planTaskId) continue;
      latestByTask.set(sub.planTaskId, sub);
    }

    const todayDay = await prismaRead.planDay.findFirst({
      where: { planId: plan.id, day: currentDay },
      select: {
        id: true,
        day: true,
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            intensity: true,
          },
        },
      },
    });

    const todaysTasks = (todayDay?.tasks ?? []).map((task) => {
      const latestSubmission = latestByTask.get(task.id) ?? null;
      return {
        ...task,
        submissionStatus: latestSubmission?.status ?? "NOT_SUBMITTED",
        latestSubmission,
      };
    });

    const response = {
      planId: plan.id,
      planName: plan.name,
      currentDay,
      totalDays,
      todaysTasks,
      metrics: {
        totalTasks: todaysTasks.length,
        completedTasks: todaysTasks.filter((task) => task.submissionStatus === "APPROVED").length,
        pendingTasks: todaysTasks.filter((task) => task.submissionStatus === "PENDING").length,
      },
    };

    setCachedTodayPlanLite(userId, response);
    return response;
  });
}

export async function createSubmission(studentId: string, input: { planTaskId: string; studentNote?: string }) {
  const startedAt = performance.now();
  const timings: Record<string, number> = {};

  const profileStartedAt = performance.now();
  const profile = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
  timings.profileLookupMs = elapsedMs(profileStartedAt);
  if (!profile?.currentPlanId) {
    throw HttpError.badRequest("No active plan found for student");
  }

  const taskStartedAt = performance.now();
  const task = await prisma.planTask.findUnique({
    where: { id: input.planTaskId },
    include: {
      planDay: {
        include: {
          plan: {
            include: {
              days: {
                include: { tasks: true },
                orderBy: { day: "asc" },
              },
            },
          },
        },
      },
    },
  });
  timings.taskLookupMs = elapsedMs(taskStartedAt);

  if (!task) {
    throw HttpError.notFound("Plan task not found");
  }

  if (!profile.trainerId) {
    throw HttpError.badRequest("No trainer assigned. Please contact admin.");
  }

  const trainerProfileStartedAt = performance.now();
  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId: profile.trainerId },
  });
  timings.trainerProfileLookupMs = elapsedMs(trainerProfileStartedAt);

  const fallbackNumber = env.DEFAULT_TRAINER_WHATSAPP_NUMBER?.trim() ?? "";
  const trainerWhatsAppRaw = trainerProfile?.whatsappNumber?.trim() || fallbackNumber;
  if (!trainerWhatsAppRaw) {
    throw HttpError.badRequest("Trainer WhatsApp number is not configured. Please ask trainer/admin to update profile.");
  }

  const trainerWhatsAppNumber = normalizeWhatsAppNumber(trainerWhatsAppRaw);

  if (task.planDay.planId !== profile.currentPlanId) {
    throw HttpError.forbidden("Task does not belong to your active plan");
  }

  const plan = task.planDay.plan;
  const allTaskIds = plan.days.flatMap((day) => day.tasks.map((candidate) => candidate.id));
  const latestSubmissionsStartedAt = performance.now();
  const latestSubmissions =
    allTaskIds.length === 0
      ? []
      : await prisma.submission.findMany({
          where: { studentId, planTaskId: { in: allTaskIds } },
          orderBy: { createdAt: "desc" },
          select: { planTaskId: true, status: true },
        });
  timings.latestSubmissionsLookupMs = elapsedMs(latestSubmissionsStartedAt);

  const latestByTask = new Map<string, { status: string }>();
  for (const sub of latestSubmissions) {
    if (!sub.planTaskId || latestByTask.has(sub.planTaskId)) continue;
    latestByTask.set(sub.planTaskId, { status: sub.status });
  }

  const totalDays = Math.max(plan.days.length, 1);
  const calendarDay = computeCalendarDay(plan.createdAt, totalDays);
  const unlockedDay = resolveUnlockedDay(plan.days, latestByTask, calendarDay);

  if (task.planDay.day !== unlockedDay) {
    if (task.planDay.day > unlockedDay) {
      throw HttpError.forbidden("Complete the current day first. Next day unlocks only on the following day.");
    }
    throw HttpError.forbidden("You can only submit tasks for your currently unlocked day.");
  }

  const latestForTarget = latestByTask.get(task.id);
  if (latestForTarget && latestForTarget.status === "PENDING") {
    throw HttpError.badRequest("Task proof is already pending review");
  }
  if (latestForTarget && latestForTarget.status === "APPROVED") {
    throw HttpError.badRequest("Task already approved");
  }

  const studentLookupStartedAt = performance.now();
  const studentUser = await prisma.user.findUnique({
    where: { id: studentId },
    select: { name: true },
  });
  timings.studentLookupMs = elapsedMs(studentLookupStartedAt);

  const proofRefId = buildProofReference();
  const safeStudentNote = (input.studentNote ?? "").trim();

  const whatsappMessage = [
    "Hello Coach, I have completed my AHG task and I am sharing proof here.",
    `Reference: ${proofRefId}`,
    `Student: ${studentUser?.name ?? "Student"}`,
    `Task: ${task.title}`,
    `Day: ${task.planDay.day}`,
    `Plan: ${plan.name}`,
    safeStudentNote ? `Note: ${safeStudentNote}` : "",
    "Please verify in AHG dashboard after reviewing this proof.",
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappUrl = `https://wa.me/${trainerWhatsAppNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const createSubmissionStartedAt = performance.now();
  const createdSubmission = await prisma.submission.create({
    data: {
      studentId,
      planTaskId: task.id,
      mediaUrl: `whatsapp://proof/${proofRefId}`,
      trainerNote: safeStudentNote ? `${STUDENT_NOTE_PREFIX} ${safeStudentNote}` : null,
    },
    include: {
      student: { select: { id: true, name: true } },
      planTask: { include: { planDay: true } },
    },
  });
  timings.submissionInsertMs = elapsedMs(createSubmissionStartedAt);

  const submissionCreatedPayload = {
    submissionId: createdSubmission.id,
    studentId,
    studentName: createdSubmission.student.name,
    planTaskId: task.id,
    taskName: createdSubmission.planTask?.title ?? "Task",
    taskType: createdSubmission.planTask?.type ?? "workout",
    dayNumber: createdSubmission.planTask?.planDay?.day ?? null,
    mediaUrl: createdSubmission.mediaUrl,
    proofRefId,
    whatsappUrl,
    status: createdSubmission.status,
    trainerNote: createdSubmission.trainerNote ?? "",
    createdAt: createdSubmission.createdAt.toISOString(),
  };

  if (profile.trainerId) {
    publishUserEvent(profile.trainerId, "submission.created", {
      ...submissionCreatedPayload,
    });
  }

  publishUserEvent(studentId, "submission.created", {
    ...submissionCreatedPayload,
  });

  logger.info("submission.create.db_timing", {
    studentId,
    planTaskId: input.planTaskId,
    ...timings,
    totalMs: elapsedMs(startedAt),
  });

  invalidateTodayPlanCache(studentId);
  invalidateTodayPlanLiteCache(studentId);

  return {
    ...createdSubmission,
    proofRefId,
    whatsappUrl,
    trainerWhatsappNumber: trainerWhatsAppNumber,
  };
}

export async function generatePersonalizedPlan(studentId: string) {
  return createPersonalized25DayPlan(prisma, studentId);
}

export async function approveSubmission(reviewerId: string, reviewerRole: string, submissionId: string, note?: string) {
  const startedAt = performance.now();
  const timings: Record<string, number> = {};

  const maxAttempts = 3;
  let txResult:
    | {
        updated: {
          id: string;
          status: string;
          reviewedAt: Date | null;
        };
        studentId: string;
        trainerId: string | null;
        notificationMessage: string;
      }
    | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const transactionStartedAt = performance.now();
    try {
      txResult = await prisma.$transaction(async (tx) => {
    const lookupStartedAt = performance.now();
    const sub = await tx.submission.findUnique({
      where: { id: submissionId },
      include: { student: { include: { studentProfile: true } } },
    });
    timings.lookupSubmissionMs = elapsedMs(lookupStartedAt);
    if (!sub) throw HttpError.notFound("Submission not found");
    if (sub.status !== "PENDING") throw HttpError.badRequest("Already reviewed");
    if (reviewerRole === "TRAINER" && sub.student.studentProfile?.trainerId !== reviewerId) {
      throw HttpError.forbidden("You can only review submissions from your assigned students");
    }

    const updateSubmissionStartedAt = performance.now();
    const updated = await tx.submission.update({
      where: { id: submissionId },
      data: {
        status: "APPROVED",
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        trainerNote: composeReviewNote(sub.trainerNote, note),
      },
    });
    timings.updateSubmissionMs = elapsedMs(updateSubmissionStartedAt);

    // Award points
    if (sub.planTaskId) {
      const fetchTaskStartedAt = performance.now();
      const task = await tx.planTask.findUnique({ where: { id: sub.planTaskId } });
      timings.fetchTaskMs = elapsedMs(fetchTaskStartedAt);
      if (task) {
        const incrementPointsStartedAt = performance.now();
        await tx.studentProfile.update({
          where: { userId: sub.studentId },
          data: { totalPoints: { increment: task.points } },
        });
        timings.incrementPointsMs = elapsedMs(incrementPointsStartedAt);
      }
    }

    return {
      updated,
      studentId: sub.studentId,
      trainerId: sub.student.studentProfile?.trainerId ?? null,
      notificationMessage: note ? `Your submission was approved: "${note}"` : "Your submission was approved!",
    };
      }, {
        maxWait: 20_000,
        timeout: 30_000,
      });

      timings.transactionMs = elapsedMs(transactionStartedAt);

      // Trigger streak Sync after successful approval
      try {
        const student = await prismaRead.studentProfile.findUnique({
          where: { userId: txResult!.studentId },
          include: { user: { select: { createdAt: true } } }
        });
        if (student) {
          const newStreak = await calculateStreak(student.userId, student.user.createdAt);
          if (newStreak !== student.streak) {
            await prisma.studentProfile.update({
              where: { userId: student.userId },
              data: { streak: newStreak }
            });
          }
        }
      } catch (streakErr) {
        logger.error("streak.sync.failed", { userId: txResult!.studentId, error: streakErr });
      }

      break;
    } catch (error) {
      timings.transactionMs = elapsedMs(transactionStartedAt);

      if (isRetryablePrismaError(error) && attempt < maxAttempts) {
        logger.warn("submission.approve.retry", {
          submissionId,
          reviewerId,
          attempt,
          message: error instanceof Error ? error.message : String(error),
        });
        await wait(120 * attempt);
        continue;
      }

      if (isRetryablePrismaError(error)) {
        logger.warn("submission.approve.db_busy", {
          submissionId,
          reviewerId,
          attempts: attempt,
          totalMs: elapsedMs(startedAt),
          message: error instanceof Error ? error.message : String(error),
        });
        throw new HttpError(503, "Approval is temporarily unavailable. Please retry.");
      }

      throw error;
    }
  }

  if (!txResult) {
    throw new HttpError(503, "Approval is temporarily unavailable. Please retry.");
  }

  try {
    const notificationStartedAt = performance.now();
    const createdNotification = await prisma.notification.create({
      data: {
        userId: txResult.studentId,
        type: "trainer",
        title: "Submission Approved",
        message: txResult.notificationMessage,
      },
    });
    timings.notificationInsertMs = elapsedMs(notificationStartedAt);

    publishUserEvent(txResult.studentId, "notification.created", {
      notificationId: createdNotification.id,
      type: createdNotification.type,
      title: createdNotification.title,
      createdAt: createdNotification.createdAt.toISOString(),
    });
  } catch (error) {
    logger.warn("submission.approve.notification_failed", {
      submissionId,
      reviewerId,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  if (txResult.trainerId) {
    publishUserEvent(txResult.trainerId, "submission.updated", {
      submissionId: txResult.updated.id,
      status: txResult.updated.status,
      reviewedAt: txResult.updated.reviewedAt?.toISOString() ?? null,
    });
  }

  publishUserEvent(txResult.studentId, "submission.updated", {
    submissionId: txResult.updated.id,
    status: txResult.updated.status,
    reviewedAt: txResult.updated.reviewedAt?.toISOString() ?? null,
  });

  logger.info("submission.approve.db_timing", {
    submissionId,
    reviewerId,
    ...timings,
    totalMs: elapsedMs(startedAt),
  });

  invalidateTodayPlanCache(txResult.studentId);
  invalidateTodayPlanLiteCache(txResult.studentId);

  return txResult.updated;
}

export async function rejectSubmission(reviewerId: string, reviewerRole: string, submissionId: string, note: string) {
  if (!note.trim()) throw HttpError.badRequest("Rejection reason is required");
  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { student: { include: { studentProfile: true } } },
  });
  if (!sub) throw HttpError.notFound("Submission not found");
  if (sub.status !== "PENDING") throw HttpError.badRequest("Already reviewed");
  if (reviewerRole === "TRAINER" && sub.student.studentProfile?.trainerId !== reviewerId) {
    throw HttpError.forbidden("You can only review submissions from your assigned students");
  }

  const updated = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: "REJECTED",
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      trainerNote: composeReviewNote(sub.trainerNote, note),
    },
  });

  // Notify student
  const createdNotification = await prisma.notification.create({
    data: {
      userId: sub.studentId,
      type: "trainer",
      title: "Submission Rejected",
      message: `Your submission was rejected: "${note}"`,
    },
  });

  publishUserEvent(sub.studentId, "notification.created", {
    notificationId: createdNotification.id,
    type: createdNotification.type,
    title: createdNotification.title,
    createdAt: createdNotification.createdAt.toISOString(),
  });

  if (sub.student.studentProfile?.trainerId) {
    publishUserEvent(sub.student.studentProfile.trainerId, "submission.updated", {
      submissionId: updated.id,
      status: updated.status,
      reviewedAt: updated.reviewedAt?.toISOString() ?? null,
    });
  }

  publishUserEvent(sub.studentId, "submission.updated", {
    submissionId: updated.id,
    status: updated.status,
    reviewedAt: updated.reviewedAt?.toISOString() ?? null,
  });

  invalidateTodayPlanCache(sub.studentId);
  invalidateTodayPlanLiteCache(sub.studentId);

  return updated;
}

export async function createPlan(trainerId: string, input: { 
  name: string; 
  duration: number; 
  goalType: string; 
  difficulty: string; 
  studentIds: string[];
}) {
  const plan = await prisma.$transaction(async (tx) => {
    const created = await tx.plan.create({
      data: {
        name: input.name,
        trainerId,
        difficulty: input.difficulty,
        goalType: input.goalType,
        status: "ACTIVE",
      },
    });

    const daysData = Array.from({ length: input.duration }, (_, i) => ({
      planId: created.id,
      day: i + 1,
    }));

    await tx.planDay.createMany({ data: daysData });

    if (input.studentIds.length > 0) {
      await tx.studentProfile.updateMany({
        where: { userId: { in: input.studentIds } },
        data: {
          currentPlanId: created.id,
          onboardingCompleted: true,
        },
      });
    }

    return created;
  });

  // Post-commit: create notifications and publish events outside the
  // transaction to avoid inflating lock time for large student groups.
  if (input.studentIds.length > 0) {
    const planName = input.name;
    const planId = plan.id;
    void Promise.allSettled(
      input.studentIds.map(async (studentId) => {
        try {
          const createdNotification = await prisma.notification.create({
            data: {
              userId: studentId,
              type: "plan",
              title: "New Plan Assigned",
              message: `You've been assigned a new plan: "${planName}"`,
            },
          });
          publishUserEvent(studentId, "notification.created", {
            notificationId: createdNotification.id,
            type: createdNotification.type,
            title: createdNotification.title,
            createdAt: createdNotification.createdAt.toISOString(),
          });
          // Invalidate the student's cached plan so they see the new one.
          invalidateTodayPlanCache(studentId);
          invalidateTodayPlanLiteCache(studentId);
        } catch (err) {
          logger.warn("plan.create.notify_failed", {
            planId,
            studentId,
            message: err instanceof Error ? err.message : String(err),
          });
        }
      })
    );
  }

  return plan;
}

export async function submitPlanForApproval(studentId: string, planId: string) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw HttpError.notFound("Plan not found");
  if (plan.studentId !== studentId) throw HttpError.forbidden("Not your plan");
  if (plan.status !== "DRAFT") throw HttpError.badRequest("Plan is not in draft status");

  const updated = await prisma.plan.update({
    where: { id: planId },
    data: { status: "PENDING_APPROVAL" },
  });

  // Notify trainer if assigned
  if (plan.trainerId) {
    const createdNotification = await prisma.notification.create({
      data: {
        userId: plan.trainerId,
        type: "plan",
        title: "Plan Review Requested",
        message: `A student submitted plan "${plan.name}" for your review`,
      },
    });

    publishUserEvent(plan.trainerId, "notification.created", {
      notificationId: createdNotification.id,
      type: createdNotification.type,
      title: createdNotification.title,
      createdAt: createdNotification.createdAt.toISOString(),
    });
  }

  return updated;
}

export async function reviewPlan(reviewerId: string, planId: string, action: "approve" | "reject", note?: string) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw HttpError.notFound("Plan not found");
  if (plan.status !== "PENDING_APPROVAL") throw HttpError.badRequest("Plan is not pending approval");

  const newStatus = action === "approve" ? "ACTIVE" : "REJECTED";
  
  const updated = await prisma.plan.update({
    where: { id: planId },
    data: { status: newStatus, reviewNote: note },
  });

  // If approved, assign to student
  if (action === "approve" && plan.studentId) {
    await prisma.studentProfile.update({
      where: { userId: plan.studentId },
      data: { currentPlanId: planId },
    });
  }

  // Notify student
  if (plan.studentId) {
    const createdNotification = await prisma.notification.create({
      data: {
        userId: plan.studentId,
        type: "plan",
        title: action === "approve" ? "Plan Approved!" : "Plan Needs Changes",
        message: note || (action === "approve" ? "Your plan has been approved and is now active." : "Your plan was not approved. Please review the feedback."),
      },
    });

    publishUserEvent(plan.studentId, "notification.created", {
      notificationId: createdNotification.id,
      type: createdNotification.type,
      title: createdNotification.title,
      createdAt: createdNotification.createdAt.toISOString(),
    });
  }

  return updated;
}

export async function getPendingPlans(trainerId: string) {
  return prisma.plan.findMany({
    where: { trainerId, status: "PENDING_APPROVAL" },
    include: { days: { include: { tasks: true }, orderBy: { day: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTrainerStudents(trainerId: string) {
  return prisma.studentProfile.findMany({
    where: { trainerId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          isBanned: true,
        },
      },
    }
  });
}

export async function assignStudentToTrainer(trainerId: string, studentId: string) {
  const student = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
  if (!student) throw HttpError.notFound("Student not found");

  await prisma.studentProfile.update({
    where: { userId: studentId },
    data: { trainerId },
  });

  const createdNotification = await prisma.notification.create({
    data: {
      userId: studentId,
      type: "trainer",
      title: "Trainer Assigned",
      message: "You've been assigned a new trainer!",
    },
  });

  publishUserEvent(studentId, "notification.created", {
    notificationId: createdNotification.id,
    type: createdNotification.type,
    title: createdNotification.title,
    createdAt: createdNotification.createdAt.toISOString(),
  });
}

export async function unassignStudent(trainerId: string, studentId: string) {
  const student = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
  if (!student) throw HttpError.notFound("Student not found");
  if (student.trainerId !== trainerId) throw HttpError.forbidden("Not your student");

  await prisma.studentProfile.update({
    where: { userId: studentId },
    data: { trainerId: null },
  });
}

export async function getSubmissions(userId: string, role: string) {
  if (role === "ADMIN") {
    return prisma.submission.findMany({
      include: { 
        student: { select: { id: true, name: true, avatar: true } },
        planTask: { 
          include: { 
            planDay: { 
              include: { 
                plan: { select: { name: true } } 
              } 
            } 
          } 
        }
      },
      orderBy: { createdAt: "desc" },
    });
  }
  
  return prisma.submission.findMany({
    where: {
      student: { studentProfile: { trainerId: userId } }
    },
    include: {
      student: { select: { id: true, name: true, avatar: true } },
      planTask: { 
        include: { 
          planDay: { 
            include: { 
              plan: { select: { name: true } } 
            } 
          } 
        } 
      }
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStudentDetail(trainerId: string, studentId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: studentId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true, role: true, createdAt: true },
      },
    },
  });

  if (!profile) throw HttpError.notFound("Student not found");
  if (profile.trainerId !== trainerId) throw HttpError.forbidden("Not your student");

  const [submissions, currentPlan, progressEntries] = await Promise.all([
    prisma.submission.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { planTask: true },
    }),
    profile.currentPlanId
      ? prisma.plan.findUnique({
          where: { id: profile.currentPlanId },
          include: { days: { include: { tasks: true }, orderBy: { day: "asc" } } },
        })
      : null,
    prisma.progressEntry.findMany({
      where: { userId: studentId },
      orderBy: { date: "desc" },
      take: 30,
    }),
  ]);

  return {
    profile,
    submissions,
    currentPlan,
    progressEntries,
  };
}
