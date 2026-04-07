import { PlanTaskItem, PlanTemplateKey, PlanTemplateMeta, PlanWeek } from "@/types";

type TemplateDefinition = {
  meta: PlanTemplateMeta;
  weeks: PlanWeek[];
};

type WorkoutProfile = {
  type: "cardio" | "strength" | "mobility" | "conditioning";
  name: string;
  durationMinutes: number;
  intensity: "low" | "moderate" | "high";
};

const workoutPools: Record<PlanTemplateKey, WorkoutProfile[]> = {
  fat_loss: [
    { type: "cardio", name: "Interval Run", durationMinutes: 35, intensity: "high" },
    { type: "strength", name: "Metabolic Circuit", durationMinutes: 30, intensity: "moderate" },
    { type: "conditioning", name: "Bike Sprint Blocks", durationMinutes: 30, intensity: "high" },
    { type: "mobility", name: "Recovery Mobility", durationMinutes: 20, intensity: "low" },
  ],
  muscle_gain: [
    { type: "strength", name: "Upper Body Hypertrophy", durationMinutes: 50, intensity: "high" },
    { type: "strength", name: "Lower Body Strength", durationMinutes: 55, intensity: "high" },
    { type: "conditioning", name: "Core Stability", durationMinutes: 25, intensity: "moderate" },
    { type: "mobility", name: "Joint Prep", durationMinutes: 20, intensity: "low" },
  ],
  general_fitness: [
    { type: "strength", name: "Functional Full Body", durationMinutes: 40, intensity: "moderate" },
    { type: "cardio", name: "Steady Cardio", durationMinutes: 30, intensity: "moderate" },
    { type: "mobility", name: "Mobility + Stretch", durationMinutes: 20, intensity: "low" },
    { type: "conditioning", name: "Mixed Conditioning", durationMinutes: 30, intensity: "moderate" },
  ],
  endurance: [
    { type: "cardio", name: "Tempo Run", durationMinutes: 45, intensity: "moderate" },
    { type: "cardio", name: "Long Zone-2", durationMinutes: 60, intensity: "moderate" },
    { type: "conditioning", name: "Threshold Intervals", durationMinutes: 35, intensity: "high" },
    { type: "mobility", name: "Runner Recovery", durationMinutes: 20, intensity: "low" },
  ],
  home_workout: [
    { type: "strength", name: "Bodyweight Strength", durationMinutes: 35, intensity: "moderate" },
    { type: "conditioning", name: "Home HIIT", durationMinutes: 25, intensity: "high" },
    { type: "mobility", name: "Home Mobility Flow", durationMinutes: 20, intensity: "low" },
    { type: "cardio", name: "Brisk Walk/Jog", durationMinutes: 30, intensity: "moderate" },
  ],
  gym_workout: [
    { type: "strength", name: "Barbell Compound Day", durationMinutes: 55, intensity: "high" },
    { type: "strength", name: "Machine Volume Day", durationMinutes: 50, intensity: "moderate" },
    { type: "conditioning", name: "Sled + Row Circuit", durationMinutes: 30, intensity: "high" },
    { type: "mobility", name: "Prehab Mobility", durationMinutes: 20, intensity: "low" },
  ],
};

const templateMeta: Record<PlanTemplateKey, PlanTemplateMeta> = {
  fat_loss: {
    key: "fat_loss",
    name: "Fat Loss",
    durationDays: 30,
    weeks: 4,
    daysPerWeek: 7,
    baseIntensity: "moderate",
    focus: "Cardio frequency with lean-mass retention",
  },
  muscle_gain: {
    key: "muscle_gain",
    name: "Muscle Gain",
    durationDays: 30,
    weeks: 4,
    daysPerWeek: 7,
    baseIntensity: "high",
    focus: "Progressive overload and protein-centered nutrition",
  },
  general_fitness: {
    key: "general_fitness",
    name: "General Fitness",
    durationDays: 30,
    weeks: 4,
    daysPerWeek: 7,
    baseIntensity: "moderate",
    focus: "Balanced movement, consistency, and recovery",
  },
  endurance: {
    key: "endurance",
    name: "Endurance",
    durationDays: 30,
    weeks: 4,
    daysPerWeek: 7,
    baseIntensity: "moderate",
    focus: "Aerobic capacity and pacing discipline",
  },
  home_workout: {
    key: "home_workout",
    name: "Home Workout",
    durationDays: 30,
    weeks: 4,
    daysPerWeek: 7,
    baseIntensity: "moderate",
    focus: "Minimal-equipment consistency",
  },
  gym_workout: {
    key: "gym_workout",
    name: "Gym Workout",
    durationDays: 30,
    weeks: 4,
    daysPerWeek: 7,
    baseIntensity: "high",
    focus: "Equipment-based strength progression",
  },
};

function buildTaskBundle(poolKey: PlanTemplateKey, daySeed: number): PlanTaskItem[] {
  const pool = workoutPools[poolKey];
  const workout = pool[daySeed % pool.length];

  return [
    {
      type: "workout",
      title: workout.name,
      durationMinutes: workout.durationMinutes,
      intensity: workout.intensity,
      points: 40,
      meta: {
        workoutType: workout.type,
      },
    },
    {
      type: "nutrition",
      title: "Follow meal template and hit protein target",
      description: "Use balanced plate model with a lean protein source each meal.",
      points: 30,
      meta: {
        proteinGoalGrams: 110,
        mealGuidance: "Protein + complex carbs + fiber",
      },
    },
    {
      type: "habit",
      title: "Hydration, steps, and sleep target",
      description: "Complete 8k-10k steps, water goal, and 7h+ sleep.",
      points: 30,
      meta: {
        waterLiters: 3,
        stepsGoal: 9000,
        sleepHours: 7,
      },
    },
  ];
}

function buildWeeks(poolKey: PlanTemplateKey): PlanWeek[] {
  const weeks: PlanWeek[] = [];

  for (let week = 1; week <= 4; week += 1) {
    const days = Array.from({ length: 7 }, (_, index) => {
      const day = index + 1;
      return {
        day,
        tasks: buildTaskBundle(poolKey, week * day),
      };
    });

    weeks.push({ week, days });
  }

  return weeks;
}

export const PLAN_TEMPLATES: Record<PlanTemplateKey, TemplateDefinition> = {
  fat_loss: {
    meta: templateMeta.fat_loss,
    weeks: buildWeeks("fat_loss"),
  },
  muscle_gain: {
    meta: templateMeta.muscle_gain,
    weeks: buildWeeks("muscle_gain"),
  },
  general_fitness: {
    meta: templateMeta.general_fitness,
    weeks: buildWeeks("general_fitness"),
  },
  endurance: {
    meta: templateMeta.endurance,
    weeks: buildWeeks("endurance"),
  },
  home_workout: {
    meta: templateMeta.home_workout,
    weeks: buildWeeks("home_workout"),
  },
  gym_workout: {
    meta: templateMeta.gym_workout,
    weeks: buildWeeks("gym_workout"),
  },
};
