import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import { publishUserEvent } from "../../lib/realtime.js";
import { createPersonalized25DayPlan } from "./personalizedPlan.js";
import { env } from "../../config/env.js";

const COMPLETE_STATUSES = new Set(["PENDING", "APPROVED"] as const);

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

const computeCalendarDay = (createdAt: Date, totalDays: number): number => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const elapsedDays = Math.floor((Date.now() - createdAt.getTime()) / msPerDay);
  return Math.max(1, Math.min(totalDays, elapsedDays + 1));
};

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

export async function getTodayPlan(userId: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile?.currentPlanId) return null;

  const plan = await prisma.plan.findUnique({
    where: { id: profile.currentPlanId },
    include: { days: { include: { tasks: true }, orderBy: { day: "asc" } } },
  });
  if (!plan) return null;

  const totalDays = Math.max(plan.days.length, 1);
  const calendarDay = computeCalendarDay(plan.createdAt, totalDays);

  const allTaskIds = plan.days.flatMap((day) => day.tasks.map((task) => task.id));
  const taskSubmissions =
    allTaskIds.length === 0
      ? []
      : await prisma.submission.findMany({
          where: { studentId: userId, planTaskId: { in: allTaskIds } },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            planTaskId: true,
            status: true,
            mediaUrl: true,
            trainerNote: true,
            reviewedAt: true,
            createdAt: true,
          },
        });

  const latestByTask = new Map<string, (typeof taskSubmissions)[number]>();
  for (const sub of taskSubmissions) {
    if (!sub.planTaskId || latestByTask.has(sub.planTaskId)) continue;
    latestByTask.set(sub.planTaskId, sub);
  }

  const currentDay = resolveUnlockedDay(plan.days, latestByTask, calendarDay);

  const today = plan.days.find((day) => day.day === currentDay) ?? null;

  const decorateTask = (task: (typeof plan.days)[number]["tasks"][number]) => {
    const latestSubmission = latestByTask.get(task.id) ?? null;
    return {
      ...task,
      submissionStatus: latestSubmission?.status ?? "NOT_SUBMITTED",
      latestSubmission,
    };
  };

  return {
    ...plan,
    currentDay,
    totalDays,
    today,
    todaysTasks: today ? today.tasks.map(decorateTask) : [],
    days: plan.days.map((day) => ({
      ...day,
      tasks: day.tasks.map(decorateTask),
    })),
  };
}

export async function createSubmission(studentId: string, input: { planTaskId: string; studentNote?: string }) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
  if (!profile?.currentPlanId) {
    throw HttpError.badRequest("No active plan found for student");
  }

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

  if (!task) {
    throw HttpError.notFound("Plan task not found");
  }

  if (!profile.trainerId) {
    throw HttpError.badRequest("No trainer assigned. Please contact admin.");
  }

  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId: profile.trainerId },
  });

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
  const latestSubmissions =
    allTaskIds.length === 0
      ? []
      : await prisma.submission.findMany({
          where: { studentId, planTaskId: { in: allTaskIds } },
          orderBy: { createdAt: "desc" },
          select: { planTaskId: true, status: true },
        });

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

  const studentUser = await prisma.user.findUnique({
    where: { id: studentId },
    select: { name: true },
  });

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
  return prisma.$transaction(async (tx) => {
    const sub = await tx.submission.findUnique({
      where: { id: submissionId },
      include: { student: { include: { studentProfile: true } } },
    });
    if (!sub) throw HttpError.notFound("Submission not found");
    if (sub.status !== "PENDING") throw HttpError.badRequest("Already reviewed");
    if (reviewerRole === "TRAINER" && sub.student.studentProfile?.trainerId !== reviewerId) {
      throw HttpError.forbidden("You can only review submissions from your assigned students");
    }

    const updated = await tx.submission.update({
      where: { id: submissionId },
      data: {
        status: "APPROVED",
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        trainerNote: composeReviewNote(sub.trainerNote, note),
      },
    });

    // Award points
    if (sub.planTaskId) {
      const task = await tx.planTask.findUnique({ where: { id: sub.planTaskId } });
      if (task) {
        await tx.studentProfile.update({
          where: { userId: sub.studentId },
          data: { totalPoints: { increment: task.points } },
        });
      }
    }

    // Create notification for student
    const createdNotification = await tx.notification.create({
      data: {
        userId: sub.studentId,
        type: "trainer",
        title: "Submission Approved",
        message: note ? `Your submission was approved: "${note}"` : "Your submission was approved!",
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

    return updated;
  });
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

  return updated;
}

export async function createPlan(trainerId: string, input: { 
  name: string; 
  duration: number; 
  goalType: string; 
  difficulty: string; 
  studentIds: string[];
}) {
  return prisma.$transaction(async (tx) => {
    const plan = await tx.plan.create({
      data: {
        name: input.name,
        trainerId,
        difficulty: input.difficulty,
        goalType: input.goalType,
        status: "ACTIVE",
      },
    });

    const daysData = Array.from({ length: input.duration }, (_, i) => ({
      planId: plan.id,
      day: i + 1,
    }));
    
    await tx.planDay.createMany({ data: daysData });

    if (input.studentIds.length > 0) {
      await tx.studentProfile.updateMany({
        where: { userId: { in: input.studentIds } },
        data: { 
          currentPlanId: plan.id,
          onboardingCompleted: true
        }
      });

      // Notify assigned students
      for (const studentId of input.studentIds) {
        const createdNotification = await tx.notification.create({
          data: {
            userId: studentId,
            type: "plan",
            title: "New Plan Assigned",
            message: `You've been assigned a new plan: "${input.name}"`,
          },
        });

        publishUserEvent(studentId, "notification.created", {
          notificationId: createdNotification.id,
          type: createdNotification.type,
          title: createdNotification.title,
          createdAt: createdNotification.createdAt.toISOString(),
        });
      }
    }

    return plan;
  });
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
