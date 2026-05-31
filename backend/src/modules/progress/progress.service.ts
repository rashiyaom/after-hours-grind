import { prisma, prismaRead } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import { logger } from "../../lib/logger.js";
import { invalidateLeaderboardCache } from "../leaderboard/leaderboard.service.js";

export type ProgressInput = {
  date?: string;
  weightKg?: number;
  bodyFatPct?: number;
  stepCount?: number;
  workoutMinutes?: number;
  caloriesBurned?: number;
  sleepHours?: number;
  waterLiters?: number;
  mood?: string;
  notes?: string;
};

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
      const totalMs = Number((performance.now() - startedAt).toFixed(2));
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
        throw new HttpError(503, "Progress data is temporarily unavailable. Please retry.");
      }

      throw error;
    }
  }

  throw new HttpError(503, "Progress data is temporarily unavailable. Please retry.");
};

export async function upsertProgress(userId: string, input: ProgressInput) {
  const date = input.date ? new Date(input.date) : new Date();
  // Normalize to date only
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const result = await prisma.progressEntry.upsert({
    where: { userId_date: { userId, date: dateOnly } },
    create: {
      userId,
      date: dateOnly,
      weightKg: input.weightKg,
      bodyFatPct: input.bodyFatPct,
      stepCount: input.stepCount,
      workoutMinutes: input.workoutMinutes,
      caloriesBurned: input.caloriesBurned,
      sleepHours: input.sleepHours,
      waterLiters: input.waterLiters,
      mood: input.mood,
      notes: input.notes,
    },
    update: {
      ...(input.weightKg !== undefined ? { weightKg: input.weightKg } : {}),
      ...(input.bodyFatPct !== undefined ? { bodyFatPct: input.bodyFatPct } : {}),
      ...(input.stepCount !== undefined ? { stepCount: input.stepCount } : {}),
      ...(input.workoutMinutes !== undefined ? { workoutMinutes: input.workoutMinutes } : {}),
      ...(input.caloriesBurned !== undefined ? { caloriesBurned: input.caloriesBurned } : {}),
      ...(input.sleepHours !== undefined ? { sleepHours: input.sleepHours } : {}),
      ...(input.waterLiters !== undefined ? { waterLiters: input.waterLiters } : {}),
      ...(input.mood !== undefined ? { mood: input.mood } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });

  await invalidateLeaderboardCache();
  return result;
}

export async function getProgressHistory(userId: string, days = 30) {
  return withReadRetry("progress.history", userId, async () => {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return prismaRead.progressEntry.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: "asc" },
    });
  });
}

export async function getProgressSummary(userId: string) {
  return withReadRetry("progress.summary", userId, async () => {
    const [latest, weekEntries, profile] = await Promise.all([
      prismaRead.progressEntry.findFirst({ where: { userId }, orderBy: { date: "desc" } }),
      prismaRead.progressEntry.findMany({
        where: {
          userId,
          date: { gte: new Date(Date.now() - 7 * 86400000) },
        },
        orderBy: { date: "asc" },
      }),
      prismaRead.studentProfile.findUnique({ where: { userId } }),
    ]);

    const avgWorkoutMin = weekEntries.length
      ? weekEntries.reduce((s, e) => s + (e.workoutMinutes ?? 0), 0) / weekEntries.length
      : 0;

    return {
      latest,
      weeklyAvgWorkoutMinutes: Math.round(avgWorkoutMin),
      weeklyEntries: weekEntries.length,
      streak: profile?.streak ?? 0,
      totalPoints: profile?.totalPoints ?? 0,
      totalCaloriesBurnedLast30Days: weekEntries.reduce((sum, entry) => sum + (entry.caloriesBurned ?? 0), 0),
    };
  });
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
};

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

export async function getOverallProgress(userId: string) {
  return withReadRetry("progress.overall", userId, async () => {
    const [profile, recentEntries, approvedSubmissions] = await Promise.all([
      prismaRead.studentProfile.findUnique({ where: { userId } }),
      prismaRead.progressEntry.findMany({
        where: { userId, date: { gte: daysAgo(30) } },
        orderBy: { date: "asc" },
      }),
      prismaRead.submission.count({
        where: { studentId: userId, status: "APPROVED", createdAt: { gte: daysAgo(30) } },
      }),
    ]);

    const totalWorkoutMinutes = recentEntries.reduce((sum, entry) => sum + (entry.workoutMinutes ?? 0), 0);
    const totalSteps = recentEntries.reduce((sum, entry) => sum + (entry.stepCount ?? 0), 0);
    const totalCaloriesBurned = recentEntries.reduce((sum, entry) => sum + (entry.caloriesBurned ?? 0), 0);
    const adherence = recentEntries.length === 0 ? 0 : Math.round((approvedSubmissions / recentEntries.length) * 100);

    return {
      streak: profile?.streak ?? 0,
      totalPoints: profile?.totalPoints ?? 0,
      totalCaloriesBurnedLast30Days: totalCaloriesBurned,
      weeklyAvgWorkoutMinutes:
        recentEntries.length === 0 ? 0 : Math.round(totalWorkoutMinutes / Math.min(7, recentEntries.length)),
      totalStepsLast30Days: totalSteps,
      checkInsLast30Days: recentEntries.length,
      completionPercentage: Math.max(0, Math.min(100, adherence)),
    };
  });
}

export async function getWeeklyBreakdown(userId: string) {
  return withReadRetry("progress.weekly", userId, async () => {
    const since = daysAgo(6);
    const [entries, approvedByDay] = await Promise.all([
      prismaRead.progressEntry.findMany({
        where: { userId, date: { gte: since } },
        orderBy: { date: "asc" },
      }),
      prismaRead.submission.groupBy({
        by: ["createdAt"],
        where: { studentId: userId, status: "APPROVED", createdAt: { gte: since } },
        _count: { id: true },
      }),
    ]);

    const entriesMap = new Map(entries.map((entry) => [toIsoDate(entry.date), entry]));
    const submissionsMap = approvedByDay.reduce<Map<string, number>>((acc, row) => {
      const key = toIsoDate(row.createdAt);
      acc.set(key, (acc.get(key) ?? 0) + row._count.id);
      return acc;
    }, new Map());

    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const data = Array.from({ length: 7 }, (_, index) => {
      const d = daysAgo(6 - index);
      const key = toIsoDate(d);
      const entry = entriesMap.get(key);
      const completedTasks = submissionsMap.get(key) ?? 0;
      const completion = Math.max(0, Math.min(100, completedTasks * 25));
      return {
        date: key,
        day: labels[d.getDay()],
        completion,
        workoutMinutes: entry?.workoutMinutes ?? 0,
        steps: entry?.stepCount ?? 0,
        points: completedTasks * 10,
      };
    });

    return { data };
  });
}

export async function getMonthlyAdherence(userId: string, planId: string) {
  return withReadRetry("progress.monthly", userId, async () => {
    const plan = await prismaRead.plan.findUnique({
      where: { id: planId },
      include: { days: { include: { tasks: true }, orderBy: { day: "asc" } } },
    });

    if (!plan) {
      return { data: [] };
    }

    const taskIds = plan.days.flatMap((day) => day.tasks.map((task) => task.id));
    if (taskIds.length === 0) {
      return { data: [] };
    }

    const approved = await prismaRead.submission.findMany({
      where: {
        studentId: userId,
        status: "APPROVED",
        planTaskId: { in: taskIds },
      },
      select: { planTaskId: true },
    });

    const approvedSet = new Set(approved.map((row) => row.planTaskId).filter((id): id is string => Boolean(id)));

    const weekly = Array.from({ length: 4 }, (_, idx) => {
      const minDay = idx * 7 + 1;
      const maxDay = (idx + 1) * 7;
      const weekTasks = plan.days
        .filter((day) => day.day >= minDay && day.day <= maxDay)
        .flatMap((day) => day.tasks);

      const totalTasks = weekTasks.length;
      const completedTasks = weekTasks.reduce((sum, task) => sum + (approvedSet.has(task.id) ? 1 : 0), 0);
      const completion = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

      return {
        week: `Week ${idx + 1}`,
        completion,
        completedTasks,
        totalTasks,
      };
    });

    return { data: weekly };
  });
}

export async function getActivityHeatmap(userId: string) {
  return withReadRetry("progress.heatmap", userId, async () => {
    const since = daysAgo(27);
    const entries = await prismaRead.progressEntry.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: "asc" },
    });

    const entriesMap = new Map(entries.map((entry) => [toIsoDate(entry.date), entry]));

    const data = Array.from({ length: 28 }, (_, index) => {
      const d = daysAgo(27 - index);
      const key = toIsoDate(d);
      const entry = entriesMap.get(key);
      const raw = (entry?.workoutMinutes ?? 0) + Math.round((entry?.stepCount ?? 0) / 250);
      const level = raw >= 80 ? 4 : raw >= 55 ? 3 : raw >= 30 ? 2 : raw > 0 ? 1 : 0;
      return {
        date: key,
        value: raw,
        level,
      };
    });

    return { data };
  });
}

/**
 * getProgressDashboard — aggregated dashboard endpoint.
 *
 * Runs overall, weekly, and heatmap queries in a single parallel call so the
 * frontend only needs ONE request instead of three separate reads.
 * Optional planId param enables monthly adherence to be included in the same
 * round-trip when the student has an active plan.
 */
export async function getProgressDashboard(userId: string, planId?: string) {
  return withReadRetry("progress.dashboard", userId, async () => {
    const since30 = daysAgo(30);
    const since6 = daysAgo(6);
    const since27 = daysAgo(27);

    // Fire reduced independent reads in parallel to avoid connection starvation.
    const [profile, recentEntries30, recentSubmissions30, planData] =
      await Promise.all([
        prismaRead.studentProfile.findUnique({ where: { userId } }),
        prismaRead.progressEntry.findMany({
          where: { userId, date: { gte: since30 } },
          orderBy: { date: "asc" },
        }),
        prismaRead.submission.findMany({
          where: { studentId: userId, status: "APPROVED", createdAt: { gte: since30 } },
          select: { createdAt: true },
        }),
        planId
          ? prismaRead.plan.findUnique({
              where: { id: planId },
              include: { days: { include: { tasks: true }, orderBy: { day: "asc" } } },
            })
          : Promise.resolve(null),
      ]);

    const recentEntries6 = recentEntries30.filter((e) => e.date >= since6);
    const heatmapEntries = recentEntries30.filter((e) => e.date >= since27);

    const approvedCount30 = recentSubmissions30.length;
    const recentSubmissions6 = recentSubmissions30.filter((s) => s.createdAt >= since6);
    const approvedByDay6 = recentSubmissions6.reduce<Map<string, number>>((acc, row) => {
      const key = toIsoDate(row.createdAt);
      acc.set(key, (acc.get(key) ?? 0) + 1);
      return acc;
    }, new Map());

    // ── Overall ──────────────────────────────────────────────────────────────
    const totalWorkoutMinutes = recentEntries30.reduce((sum, e) => sum + (e.workoutMinutes ?? 0), 0);
    const totalSteps = recentEntries30.reduce((sum, e) => sum + (e.stepCount ?? 0), 0);
    const adherence =
      recentEntries30.length === 0 ? 0 : Math.round((approvedCount30 / recentEntries30.length) * 100);

    const overall = {
      streak: profile?.streak ?? 0,
      totalPoints: profile?.totalPoints ?? 0,
      weeklyAvgWorkoutMinutes:
        recentEntries30.length === 0 ? 0 : Math.round(totalWorkoutMinutes / Math.min(7, recentEntries30.length)),
      totalStepsLast30Days: totalSteps,
      checkInsLast30Days: recentEntries30.length,
      completionPercentage: Math.max(0, Math.min(100, adherence)),
    };

    // ── Weekly breakdown ─────────────────────────────────────────────────────
    const entriesMap6 = new Map(recentEntries6.map((e) => [toIsoDate(e.date), e]));
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyData = Array.from({ length: 7 }, (_, index) => {
      const d = daysAgo(6 - index);
      const key = toIsoDate(d);
      const entry = entriesMap6.get(key);
      const completedTasks = approvedByDay6.get(key) ?? 0;
      return {
        date: key,
        day: labels[d.getDay()],
        completion: Math.max(0, Math.min(100, completedTasks * 25)),
        workoutMinutes: entry?.workoutMinutes ?? 0,
        steps: entry?.stepCount ?? 0,
        points: completedTasks * 10,
      };
    });

    // ── Heatmap ──────────────────────────────────────────────────────────────
    const heatmapMap = new Map(heatmapEntries.map((e) => [toIsoDate(e.date), e]));
    const heatmapData = Array.from({ length: 28 }, (_, index) => {
      const d = daysAgo(27 - index);
      const key = toIsoDate(d);
      const entry = heatmapMap.get(key);
      const raw = (entry?.workoutMinutes ?? 0) + Math.round((entry?.stepCount ?? 0) / 250);
      return {
        date: key,
        value: raw,
        level: raw >= 80 ? 4 : raw >= 55 ? 3 : raw >= 30 ? 2 : raw > 0 ? 1 : 0,
      };
    });

    // ── Monthly adherence (only when planId provided) ─────────────────────────
    let monthly: { data: Array<{ week: string; completion: number; completedTasks: number; totalTasks: number }> } = {
      data: [],
    };
    if (planData) {
      const taskIds = planData.days.flatMap((day) => day.tasks.map((task) => task.id));
      if (taskIds.length > 0) {
        const approved = await prismaRead.submission.findMany({
          where: { studentId: userId, status: "APPROVED", planTaskId: { in: taskIds } },
          select: { planTaskId: true },
        });
        const approvedSet = new Set(
          approved.map((row) => row.planTaskId).filter((id): id is string => Boolean(id))
        );
        monthly = {
          data: Array.from({ length: 4 }, (_, idx) => {
            const minDay = idx * 7 + 1;
            const maxDay = (idx + 1) * 7;
            const weekTasks = planData.days
              .filter((day) => day.day >= minDay && day.day <= maxDay)
              .flatMap((day) => day.tasks);
            const totalTasks = weekTasks.length;
            const completedTasks = weekTasks.filter((t) => approvedSet.has(t.id)).length;
            return {
              week: `Week ${idx + 1}`,
              completion: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
              completedTasks,
              totalTasks,
            };
          }),
        };
      }
    }

    return {
      overall,
      weekly: { data: weeklyData },
      heatmap: { data: heatmapData },
      monthly,
    };
  });
}
