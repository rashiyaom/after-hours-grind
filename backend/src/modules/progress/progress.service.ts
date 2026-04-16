import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import { logger } from "../../lib/logger.js";

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

const isRetryableReadPrismaError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const maybeCode = (error as { code?: string }).code;
  const maybeMessage = String((error as { message?: string }).message ?? "").toLowerCase();
  return maybeCode === "P2024" || maybeMessage.includes("timed out fetching a new connection from the connection pool");
};

const withReadRetry = async <T>(operation: string, userId: string, work: () => Promise<T>): Promise<T> => {
  const maxAttempts = 3;
  const startedAt = performance.now();

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await work();
    } catch (error) {
      if (isRetryableReadPrismaError(error) && attempt < maxAttempts) {
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
          totalMs: Number((performance.now() - startedAt).toFixed(2)),
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

  return prisma.progressEntry.upsert({
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
}

export async function getProgressHistory(userId: string, days = 30) {
  return withReadRetry("progress.history", userId, async () => {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return prisma.progressEntry.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: "asc" },
    });
  });
}

export async function getProgressSummary(userId: string) {
  return withReadRetry("progress.summary", userId, async () => {
    const [latest, weekEntries, profile] = await Promise.all([
      prisma.progressEntry.findFirst({ where: { userId }, orderBy: { date: "desc" } }),
      prisma.progressEntry.findMany({
        where: {
          userId,
          date: { gte: new Date(Date.now() - 7 * 86400000) },
        },
        orderBy: { date: "asc" },
      }),
      prisma.studentProfile.findUnique({ where: { userId } }),
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
      prisma.studentProfile.findUnique({ where: { userId } }),
      prisma.progressEntry.findMany({
        where: { userId, date: { gte: daysAgo(30) } },
        orderBy: { date: "asc" },
      }),
      prisma.submission.count({
        where: { studentId: userId, status: "APPROVED", createdAt: { gte: daysAgo(30) } },
      }),
    ]);

    const totalWorkoutMinutes = recentEntries.reduce((sum, entry) => sum + (entry.workoutMinutes ?? 0), 0);
    const totalSteps = recentEntries.reduce((sum, entry) => sum + (entry.stepCount ?? 0), 0);
    const adherence = recentEntries.length === 0 ? 0 : Math.round((approvedSubmissions / recentEntries.length) * 100);

    return {
      streak: profile?.streak ?? 0,
      totalPoints: profile?.totalPoints ?? 0,
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
      prisma.progressEntry.findMany({
        where: { userId, date: { gte: since } },
        orderBy: { date: "asc" },
      }),
      prisma.submission.groupBy({
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
    const plan = await prisma.plan.findUnique({
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

    const approved = await prisma.submission.findMany({
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
    const entries = await prisma.progressEntry.findMany({
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
