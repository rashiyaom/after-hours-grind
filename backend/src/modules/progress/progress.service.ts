import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";

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
  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.progressEntry.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "asc" },
  });
}

export async function getProgressSummary(userId: string) {
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
}
