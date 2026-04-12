import type { PrismaClient, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

type Goal = "fat_loss" | "muscle_gain" | "maintenance" | "endurance";
type Experience = "beginner" | "intermediate" | "advanced";
type WorkoutType = "home" | "gym";
type Equipment = "none" | "basic" | "full_gym";
type DietType = "veg" | "non_veg";
type HydrationHabit = "poor" | "moderate" | "good";
type SportFamily = "none" | "football" | "badminton" | "combat";

type Draft = {
  basic: { age: number; weightKg: number; heightCm: number };
  fitnessStatus: { experience: Experience; activityLevel: "sedentary" | "lightly_active" | "active" };
  goals: { primaryGoal: Goal; targetWeightKg?: number };
  commitment: { daysPerWeek: number; timePerDayMinutes: number };
  environment: { workoutType: WorkoutType; equipment: Equipment };
  lifestyle: { dietType: DietType; hydrationHabit: HydrationHabit; sleepHours: number };
  constraints: { hasInjuries: boolean; injuryTypes: string[]; restrictions: string };
  sportFocus: SportFamily;
};

type SessionTemplate = {
  title: string;
  description: string;
  duration: number;
  intensity: "low" | "moderate" | "high";
};

export type SmartPlanExerciseTemplateSeed = {
  name: string;
  description: string;
  category: string;
  durationMinutes: number;
  difficulty: "low" | "moderate" | "high";
  equipment: string;
  sets: number;
  reps: number;
  restSeconds: number;
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const asBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => asString(item)).filter(Boolean) : [];

const choose = <T>(items: T[], seed: number): T => items[Math.abs(seed) % items.length];

const workoutLibrary: Record<Goal, Record<WorkoutType, SessionTemplate[]>> = {
  fat_loss: {
    home: [
      { title: "Metabolic Bodyweight Circuit", description: "EMOM with squats, pushups, mountain climbers, and plank holds.", duration: 34, intensity: "moderate" },
      { title: "HIIT Core + Cardio Blast", description: "30/15 intervals using jumping jacks, high knees, deadbugs, and bear crawl.", duration: 30, intensity: "high" },
      { title: "Fat-Burn Mobility Flow", description: "Low-impact flow with step-ups, glute bridge march, and tempo lunges.", duration: 32, intensity: "low" },
      { title: "Conditioning Ladder", description: "Rep ladder of burpees (or walkouts), pushups, squat pulses, and hollow holds.", duration: 36, intensity: "high" },
    ],
    gym: [
      { title: "Treadmill + Full-body Circuit", description: "Alternating incline walk and machine circuit for high caloric burn.", duration: 42, intensity: "moderate" },
      { title: "Rower Intervals + Strength", description: "Rower sprints paired with goblet squats, cable rows, and DB presses.", duration: 44, intensity: "high" },
      { title: "Bike Tempo + Core", description: "Bike tempo blocks plus anti-rotation core and loaded carries.", duration: 40, intensity: "moderate" },
      { title: "Fat-loss Density Session", description: "Supersets with short rest to keep heart rate elevated throughout.", duration: 46, intensity: "high" },
    ],
  },
  muscle_gain: {
    home: [
      { title: "Push Hypertrophy Session", description: "Tempo pushups, pike presses, chair dips, and triceps burnout.", duration: 40, intensity: "moderate" },
      { title: "Lower-body Volume Session", description: "Split squats, hip thrusts, single-leg RDLs, and calf ladder.", duration: 42, intensity: "moderate" },
      { title: "Pull + Posterior Chain Session", description: "Band rows, reverse snow angels, hinge patterns, and core bracing.", duration: 38, intensity: "moderate" },
      { title: "Full-body Progressive Overload", description: "Structured rep progression with reduced rest each week.", duration: 43, intensity: "high" },
    ],
    gym: [
      { title: "Upper-body Strength Block", description: "Bench/row pairing, incline DB press, pulldown, and shoulder accessory.", duration: 55, intensity: "high" },
      { title: "Lower-body Strength Block", description: "Squat pattern, RDL, leg press, and hamstring isolation.", duration: 58, intensity: "high" },
      { title: "Hypertrophy Pump Session", description: "Moderate-load supersets to increase weekly volume and tension.", duration: 52, intensity: "moderate" },
      { title: "Power + Accessory Mix", description: "Compound lifts followed by targeted arm/core finishers.", duration: 56, intensity: "high" },
    ],
  },
  maintenance: {
    home: [
      { title: "Balanced Full-body Routine", description: "Strength-endurance blend with mobility and trunk stability.", duration: 34, intensity: "moderate" },
      { title: "Mobility + Light Strength", description: "Joint-friendly movement quality day with controlled tempo.", duration: 30, intensity: "low" },
      { title: "Core and Stability Circuit", description: "Plank series, anti-rotation drills, and unilateral patterns.", duration: 32, intensity: "moderate" },
      { title: "Cardio Conditioning Base", description: "Steady-state conditioning with low impact alternatives.", duration: 36, intensity: "moderate" },
    ],
    gym: [
      { title: "General Fitness Strength Day", description: "Machine + free-weight mix across push, pull, and legs.", duration: 44, intensity: "moderate" },
      { title: "Cardio + Mobility Blend", description: "Zone-2 cardio then guided mobility and posture work.", duration: 40, intensity: "low" },
      { title: "Whole-body Tension Session", description: "Moderate load, strict form, and full-range movement focus.", duration: 46, intensity: "moderate" },
      { title: "Engine Builder", description: "Light intervals and core endurance for sustainable conditioning.", duration: 42, intensity: "moderate" },
    ],
  },
  endurance: {
    home: [
      { title: "Tempo Endurance Circuit", description: "Long work intervals with short rest and breathing control.", duration: 42, intensity: "moderate" },
      { title: "Aerobic Capacity Builder", description: "Mixed modality circuit targeting sustained effort.", duration: 45, intensity: "moderate" },
      { title: "Threshold Intervals", description: "Progressive intervals to improve tolerance at higher output.", duration: 40, intensity: "high" },
      { title: "Recovery Aerobic Session", description: "Low-impact steady work with mobility cooldown.", duration: 36, intensity: "low" },
    ],
    gym: [
      { title: "Zone-2 Base Session", description: "Continuous row/bike/treadmill effort for aerobic development.", duration: 50, intensity: "moderate" },
      { title: "Mixed Cardio Intervals", description: "Rower-bike-treadmill rotation with heart-rate control.", duration: 48, intensity: "high" },
      { title: "Lactate Threshold Session", description: "Sustained hard intervals with strict pacing.", duration: 46, intensity: "high" },
      { title: "Engine + Core Session", description: "Cardio endurance with anti-fatigue trunk work.", duration: 44, intensity: "moderate" },
    ],
  },
};

const sportWorkoutLibrary: Record<Exclude<SportFamily, "none">, Record<WorkoutType, SessionTemplate[]>> = {
  football: {
    home: [
      { title: "Football Agility Footwork", description: "Cone-free ladder patterns, lateral shuffles, and first-step acceleration drills.", duration: 34, intensity: "high" },
      { title: "Football Conditioning Repeats", description: "Short sprint intervals with controlled recovery and deceleration mechanics.", duration: 36, intensity: "high" },
      { title: "Ball Control + Core", description: "Touch drills, single-leg balance, trunk rotation and anti-rotation core work.", duration: 32, intensity: "moderate" },
    ],
    gym: [
      { title: "Football Power Lower Body", description: "Trap-bar or squat pattern, split stance strength, and plyometric contrast.", duration: 50, intensity: "high" },
      { title: "Football Sprint Engine", description: "Bike/rower intervals paired with acceleration mechanics and hamstring prep.", duration: 46, intensity: "high" },
      { title: "Match-readiness Mobility", description: "Adductor, hip, and ankle resilience block with low-impact conditioning.", duration: 40, intensity: "moderate" },
    ],
  },
  badminton: {
    home: [
      { title: "Badminton Court Movement", description: "Multi-direction split-step, chasse patterns, and rear-court recovery drills.", duration: 33, intensity: "moderate" },
      { title: "Badminton Reaction Session", description: "Fast-feet intervals, shadow rallies, and shoulder-scap stability.", duration: 35, intensity: "high" },
      { title: "Wrist + Forearm Endurance", description: "Grip endurance, forearm control, and rotational core sequencing.", duration: 30, intensity: "moderate" },
    ],
    gym: [
      { title: "Badminton Speed Endurance", description: "Assault bike repeats, lateral bounds, and split-step reactivity blocks.", duration: 44, intensity: "high" },
      { title: "Badminton Elastic Strength", description: "Single-leg strength, deceleration drills, and shoulder integrity series.", duration: 47, intensity: "moderate" },
      { title: "Rally Capacity Builder", description: "Interval conditioning to sustain high rally tempo and quick recoveries.", duration: 42, intensity: "high" },
    ],
  },
  combat: {
    home: [
      { title: "Combat Shadow Rounds", description: "Timed rounds of shadow boxing/kickboxing with footwork and guard discipline.", duration: 36, intensity: "high" },
      { title: "Combat Core + Conditioning", description: "Rotational core, sprawls, and anaerobic interval clusters.", duration: 34, intensity: "high" },
      { title: "Defense and Mobility Flow", description: "Slips, pivots, stance transitions, and mobility cooldown sequencing.", duration: 31, intensity: "moderate" },
    ],
    gym: [
      { title: "Combat Power Circuit", description: "Heavy bag rounds, explosive lower-body strength, and grip conditioning.", duration: 50, intensity: "high" },
      { title: "Fight Pace Intervals", description: "Work-rest rounds mimicking fight cadence with active recovery blocks.", duration: 46, intensity: "high" },
      { title: "Combat Durability Session", description: "Neck/trunk stability, posterior chain strength, and mobility recovery.", duration: 43, intensity: "moderate" },
    ],
  },
};

const nutritionTemplates: Record<Goal, Record<DietType, { training: string[]; recovery: string[] }>> = {
  fat_loss: {
    veg: {
      training: [
        "High-protein vegetarian plate: tofu/paneer, mixed vegetables, moderate carbs, and salad.",
        "Calorie-controlled bowl: dal + millet + curd + sauteed greens.",
        "Protein-distributed day: 4 meals with legumes, Greek yogurt, and fiber-rich sides.",
      ],
      recovery: [
        "Lower-carb recovery day: lentil soup, paneer stir-fry, vegetables, hydration focus.",
        "Fiber-forward day: sprouts, curd, nuts in measured quantity, and early dinner.",
      ],
    },
    non_veg: {
      training: [
        "Lean-protein day: eggs/chicken/fish + controlled carbs around workout window.",
        "Fat-loss plate: grilled protein, rice portion control, salad, and yogurt.",
        "3+1 pattern: 3 core meals + 1 protein snack, avoid late-night heavy carbs.",
      ],
      recovery: [
        "Recovery meal pattern: fish/chicken + veggies + low glycemic carbs.",
        "Light digestion day: egg whites/lean meat, soups, high hydration.",
      ],
    },
  },
  muscle_gain: {
    veg: {
      training: [
        "Muscle gain fueling: paneer/tofu + rice + lentils + fruit pre/post workout.",
        "Caloric surplus with quality carbs and high protein spaced across 4-5 feedings.",
        "Strength day macros: protein target with oats, dairy, legumes, and nuts.",
      ],
      recovery: [
        "Recovery surplus day: moderate carbs, high protein, anti-inflammatory foods.",
        "Steady surplus meal plan: balanced calories with digestive-friendly food choices.",
      ],
    },
    non_veg: {
      training: [
        "Performance nutrition: chicken/fish/eggs, rice/potato, fruits, and hydration.",
        "High protein + high carb training day to support progressive overload.",
        "Strength support day: protein target met in each meal with carb timing.",
      ],
      recovery: [
        "Recovery muscle day: protein-dense meals with moderate carbs and omega-3 source.",
        "Calorie-support day: maintain surplus without digestive overload.",
      ],
    },
  },
  maintenance: {
    veg: {
      training: ["Balanced vegetarian plate with protein, complex carbs, and healthy fats."],
      recovery: ["Maintenance day: moderate calories, high micronutrients, consistent hydration."],
    },
    non_veg: {
      training: ["Balanced non-veg plate with lean protein, whole grains, and vegetables."],
      recovery: ["Maintenance recovery day with controlled portions and sleep support foods."],
    },
  },
  endurance: {
    veg: {
      training: ["Endurance fueling: higher carbs pre-session, protein + carbs post-session."],
      recovery: ["Electrolyte and glycogen restoration with balanced vegetarian meals."],
    },
    non_veg: {
      training: ["Endurance performance nutrition with carb timing and lean protein support."],
      recovery: ["Recovery day with hydration salts, moderate carbs, and anti-inflammatory foods."],
    },
  },
};

const habitPool = [
  "Hydration checkpoint and sodium balance review.",
  "Sleep hygiene protocol: wind-down + fixed bedtime.",
  "10-minute mobility reset and posture alignment.",
  "Daily step consistency target completion.",
  "Stress down-regulation: breathing + short walk.",
  "Meal timing adherence and late-night snacking control.",
  "Recovery quality check-in with soreness and energy tracking.",
];

const parseDraft = (value: unknown, sportHint: unknown): Draft => {
  const raw = asRecord(value) ?? {};
  const basic = asRecord(raw.basic) ?? {};
  const fitnessStatus = asRecord(raw.fitnessStatus) ?? {};
  const goals = asRecord(raw.goals) ?? {};
  const commitment = asRecord(raw.commitment) ?? {};
  const environment = asRecord(raw.environment) ?? {};
  const lifestyle = asRecord(raw.lifestyle) ?? {};
  const constraints = asRecord(raw.constraints) ?? {};

  const primaryGoal = asString(goals.primaryGoal, "maintenance");
  const safeGoal: Goal =
    primaryGoal === "fat_loss" || primaryGoal === "muscle_gain" || primaryGoal === "endurance"
      ? primaryGoal
      : "maintenance";

  const experience = asString(fitnessStatus.experience, "beginner");
  const safeExperience: Experience =
    experience === "intermediate" || experience === "advanced" ? experience : "beginner";

  const workoutType = asString(environment.workoutType, "home");
  const safeWorkoutType: WorkoutType = workoutType === "gym" ? "gym" : "home";

  const equipment = asString(environment.equipment, "basic");
  const safeEquipment: Equipment =
    equipment === "none" || equipment === "full_gym" ? equipment : "basic";

  const dietType = asString(lifestyle.dietType, "non_veg");
  const safeDietType: DietType = dietType === "veg" ? "veg" : "non_veg";

  const hydration = asString(lifestyle.hydrationHabit, "moderate");
  const safeHydration: HydrationHabit = hydration === "poor" || hydration === "good" ? hydration : "moderate";

  const sportSignal = `${asString(sportHint)} ${asString(constraints.restrictions)} ${asStringArray(constraints.injuryTypes).join(" ")}`.toLowerCase();
  let sportFocus: SportFamily = "none";
  if (/football|soccer/.test(sportSignal)) sportFocus = "football";
  else if (/badminton|shuttle/.test(sportSignal)) sportFocus = "badminton";
  else if (/combat|mma|boxing|kickboxing|martial|karate|judo|taekwondo|wrestling/.test(sportSignal)) sportFocus = "combat";

  return {
    basic: {
      age: asNumber(basic.age, 21),
      weightKg: asNumber(basic.weightKg, 70),
      heightCm: asNumber(basic.heightCm, 170),
    },
    fitnessStatus: {
      experience: safeExperience,
      activityLevel: asString(fitnessStatus.activityLevel, "lightly_active") as
        | "sedentary"
        | "lightly_active"
        | "active",
    },
    goals: {
      primaryGoal: safeGoal,
      targetWeightKg: asNumber(goals.targetWeightKg, 0) || undefined,
    },
    commitment: {
      daysPerWeek: clamp(Math.round(asNumber(commitment.daysPerWeek, 5)), 3, 7),
      timePerDayMinutes: clamp(Math.round(asNumber(commitment.timePerDayMinutes, 45)), 20, 75),
    },
    environment: {
      workoutType: safeWorkoutType,
      equipment: safeEquipment,
    },
    lifestyle: {
      dietType: safeDietType,
      hydrationHabit: safeHydration,
      sleepHours: clamp(asNumber(lifestyle.sleepHours, 7), 4, 10),
    },
    constraints: {
      hasInjuries: asBoolean(constraints.hasInjuries, false),
      injuryTypes: asStringArray(constraints.injuryTypes),
      restrictions: asString(constraints.restrictions),
    },
    sportFocus,
  };
};

const buildWorkoutTask = (draft: Draft, day: number, isTrainingDay: boolean): Prisma.PlanTaskCreateWithoutPlanDayInput => {
  if (!isTrainingDay) {
    const recoveryDuration = clamp(Math.round(draft.commitment.timePerDayMinutes * 0.45), 15, 35);
    return {
      type: "workout",
      title: "Active Recovery + Mobility",
      description:
        "Low-intensity recovery session: brisk walk, mobility sequence, and breathing reset to improve readiness.",
      durationMin: recoveryDuration,
      intensity: "low",
      points: 20,
    };
  }

  const shouldUseSportSession = isTrainingDay && draft.sportFocus !== "none" && day % 3 === 0;
  const goalLibrary = workoutLibrary[draft.goals.primaryGoal][draft.environment.workoutType];
  const selected: SessionTemplate = shouldUseSportSession && draft.sportFocus !== "none"
    ? choose(sportWorkoutLibrary[draft.sportFocus][draft.environment.workoutType], day + 11)
    : choose(goalLibrary, day);

  const experienceFactor = draft.fitnessStatus.experience === "beginner" ? 0.9 : draft.fitnessStatus.experience === "advanced" ? 1.15 : 1;
  const activityFactor = draft.fitnessStatus.activityLevel === "sedentary" ? 0.9 : draft.fitnessStatus.activityLevel === "active" ? 1.1 : 1;
  const targetDuration = clamp(
    Math.round(Math.min(draft.commitment.timePerDayMinutes, selected.duration) * experienceFactor * activityFactor),
    20,
    75
  );

  const injuryText = `${draft.constraints.injuryTypes.join(" ")} ${draft.constraints.restrictions}`.toLowerCase();
  const avoidImpact = draft.constraints.hasInjuries && /knee|ankle|achilles|shin/.test(injuryText);
  const avoidOverhead = draft.constraints.hasInjuries && /shoulder|rotator|neck/.test(injuryText);

  let title = selected.title;
  let description = selected.description;
  if (shouldUseSportSession) {
    title = `${title} (Sport-specific)`;
  }
  if (avoidImpact && /hiit|jump|sprint|blast|ladder/i.test(title)) {
    title = `${title} (Low-impact variation)`;
    description = `${description} Impact-heavy movements replaced with bike/walk/tempo alternatives.`;
  }
  if (avoidOverhead && /press|overhead/i.test(title)) {
    title = `${title} (Shoulder-safe variation)`;
    description = `${description} Overhead loading adjusted to joint-safe movement options.`;
  }

  if (draft.environment.workoutType === "home" && draft.environment.equipment === "none") {
    description = `${description} Equipment-free substitutions applied.`;
  }

  return {
    type: "workout",
    title,
    description,
    durationMin: targetDuration,
    intensity: selected.intensity,
    points: selected.intensity === "high" ? 55 : selected.intensity === "moderate" ? 45 : 35,
  };
};

const buildNutritionTasks = (
  draft: Draft,
  day: number,
  isTrainingDay: boolean
): Prisma.PlanTaskCreateWithoutPlanDayInput[] => {
  const pool = nutritionTemplates[draft.goals.primaryGoal][draft.lifestyle.dietType];
  const baseDescription = choose(isTrainingDay ? pool.training : pool.recovery, day);
  const weight = draft.basic.weightKg;
  const baseProtein = draft.goals.primaryGoal === "muscle_gain" ? 2.0 : draft.goals.primaryGoal === "fat_loss" ? 1.8 : 1.6;
  const proteinTarget = Math.round(weight * baseProtein);

  const breakfastCarbHint = draft.goals.primaryGoal === "fat_loss" ? "controlled carbs" : "moderate carbs";
  const lunchCarbHint = draft.goals.primaryGoal === "endurance" ? "higher carbs" : "balanced carbs";
  const dinnerHint = draft.goals.primaryGoal === "muscle_gain" ? "protein-focused with steady carbs" : "protein + vegetables focus";

  return [
    {
      type: "nutrition",
      title: "Breakfast",
      description: `${baseDescription} Breakfast focus: high-protein start with ${breakfastCarbHint}.`,
      durationMin: 10,
      intensity: "low",
      points: 10,
    },
    {
      type: "nutrition",
      title: "Lunch",
      description: `Lunch target: ${lunchCarbHint} + lean protein. Daily protein target: ~${proteinTarget}g.`,
      durationMin: 10,
      intensity: "low",
      points: 10,
    },
    {
      type: "nutrition",
      title: "Dinner",
      description: `Dinner focus: ${dinnerHint}. Keep meal timing consistent for recovery.`,
      durationMin: 10,
      intensity: "low",
      points: 10,
    },
  ];
};

const buildHabitTask = (draft: Draft, day: number): Prisma.PlanTaskCreateWithoutPlanDayInput => {
  const hydrationTarget = draft.lifestyle.hydrationHabit === "poor" ? 3.5 : draft.lifestyle.hydrationHabit === "good" ? 2.8 : 3.2;
  const sleepTarget = Math.max(7, Math.round(draft.lifestyle.sleepHours));
  const habitDescription = choose(habitPool, day + 17);

  return {
    type: "habit",
    title: "Recovery Habit Protocol",
    description: `${habitDescription} Hydration target: ${hydrationTarget}L. Sleep target: ${sleepTarget}h.`,
    durationMin: 8,
    intensity: "low",
    points: 25,
  };
};

export const getSmartPlanExerciseTemplateSeeds = (): SmartPlanExerciseTemplateSeed[] => {
  const seeds: SmartPlanExerciseTemplateSeed[] = [];

  const pushSession = (
    session: SessionTemplate,
    category: string,
    equipment: string,
  ) => {
    const isHigh = session.intensity === "high";
    const isLow = session.intensity === "low";

    seeds.push({
      name: session.title,
      description: session.description,
      category,
      durationMinutes: session.duration,
      difficulty: session.intensity,
      equipment,
      sets: isHigh ? 4 : isLow ? 2 : 3,
      reps: isHigh ? 8 : isLow ? 15 : 12,
      restSeconds: isHigh ? 75 : isLow ? 45 : 60,
    });
  };

  (Object.entries(workoutLibrary) as Array<[Goal, Record<WorkoutType, SessionTemplate[]>]>).forEach(
    ([goal, byWorkoutType]) => {
      (Object.entries(byWorkoutType) as Array<[WorkoutType, SessionTemplate[]]>).forEach(
        ([workoutType, sessions]) => {
          sessions.forEach((session) => {
            pushSession(session, `smart-${goal}-${workoutType}`, workoutType === "gym" ? "full_gym" : "basic");
          });
        }
      );
    }
  );

  (Object.entries(sportWorkoutLibrary) as Array<
    [Exclude<SportFamily, "none">, Record<WorkoutType, SessionTemplate[]>]
  >).forEach(([sport, byWorkoutType]) => {
    (Object.entries(byWorkoutType) as Array<[WorkoutType, SessionTemplate[]]>).forEach(
      ([workoutType, sessions]) => {
        sessions.forEach((session) => {
          pushSession(session, `sport-${sport}-${workoutType}`, workoutType === "gym" ? "full_gym" : "basic");
        });
      }
    );
  });

  return seeds;
};

export const createPersonalized25DayPlan = async (prisma: PrismaClient, studentId: string) => {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: studentId },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!profile) {
    throw new Error("Student profile not found");
  }

  const draft = parseDraft(profile.onboardingDraft, profile.sport);
  const durationDays = 25;
  const planName = `Personalized ${durationDays}-Day ${draft.goals.primaryGoal.replace("_", " ")} Plan`;
  const planId = randomUUID();
  const dayRows: Prisma.PlanDayCreateManyInput[] = [];
  const taskRows: Prisma.PlanTaskCreateManyInput[] = [];

  for (let day = 1; day <= durationDays; day += 1) {
    const weekdayIndex = (day - 1) % 7;
    const isTrainingDay = weekdayIndex < draft.commitment.daysPerWeek;
    const planDayId = randomUUID();

    dayRows.push({
      id: planDayId,
      planId,
      day,
    });

    const dayTasks = [
      buildWorkoutTask(draft, day, isTrainingDay),
      ...buildNutritionTasks(draft, day, isTrainingDay),
    ];

    if (day % 5 === 0) {
      dayTasks.push(
        {
          type: "habit",
          title: "Upload weighing scale image",
          description: "Upload a clear weighing scale photo for day-wise progress verification.",
          durationMin: 5,
          intensity: "low",
          points: 20,
        },
        {
          type: "habit",
          title: "Upload body photo",
          description: "Upload front/side body progress photo for review and acceptance.",
          durationMin: 5,
          intensity: "low",
          points: 20,
        }
      );
    }

    dayTasks.forEach((task) => {
      taskRows.push({
        id: randomUUID(),
        planDayId,
        type: task.type,
        title: task.title,
        description: task.description,
        durationMin: task.durationMin,
        intensity: task.intensity,
        points: task.points,
      });
    });
  }

  await prisma.$transaction([
    prisma.plan.create({
      data: {
        id: planId,
        name: planName,
        trainerId: profile.trainerId ?? undefined,
        studentId,
        difficulty: draft.fitnessStatus.experience,
        goalType: draft.goals.primaryGoal,
        status: "ACTIVE",
      },
    }),
    prisma.planDay.createMany({ data: dayRows }),
    prisma.planTask.createMany({ data: taskRows }),
    prisma.studentProfile.update({
      where: { userId: studentId },
      data: {
        currentPlanId: planId,
        onboardingCompleted: true,
      },
    }),
  ]);

  const withDays = await prisma.plan.findUnique({
    where: { id: planId },
    include: { days: { include: { tasks: true }, orderBy: { day: "asc" } } },
  });

  if (withDays) {
    return withDays;
  }

  return prisma.plan.findUniqueOrThrow({ where: { id: planId } });
};
