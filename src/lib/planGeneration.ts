import { PLAN_TEMPLATES } from "@/data/planTemplates";
import {
  ActivityLevel,
  FitnessQuestionnaire,
  Plan,
  PlanGenerationIssue,
  PlanTaskItem,
  PlanTemplateKey,
  PlanWeek,
  PrimaryGoal,
} from "@/types";

const cardioKeywords = ["Run", "Bike", "Cardio", "Intervals", "Zone-2"];

const goalTemplateMap: Record<PrimaryGoal, PlanTemplateKey> = {
  fat_loss: "fat_loss",
  muscle_gain: "muscle_gain",
  maintenance: "general_fitness",
  endurance: "endurance",
};

export function calculateBMI(heightCm: number, weightKg: number): number {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function deriveWeightDifference(questionnaire: FitnessQuestionnaire): number {
  if (questionnaire.goals.targetMode !== "weight" || !questionnaire.goals.targetWeightKg) return 0;
  return Number((questionnaire.goals.targetWeightKg - questionnaire.basic.weightKg).toFixed(1));
}

function cloneWeeks(weeks: PlanWeek[]): PlanWeek[] {
  return weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      tasks: day.tasks.map((task) => ({ ...task, meta: { ...(task.meta ?? {}) } })),
    })),
  }));
}

function pickBaseTemplate(questionnaire: FitnessQuestionnaire): PlanTemplateKey {
  const byGoal = goalTemplateMap[questionnaire.goals.primaryGoal];

  if (questionnaire.environment.workoutType === "home") return "home_workout";
  if (questionnaire.environment.workoutType === "gym") return questionnaire.environment.equipment === "full_gym" ? "gym_workout" : byGoal;

  return byGoal;
}

function activityIntensityFactor(activityLevel: ActivityLevel): number {
  if (activityLevel === "sedentary") return 0.8;
  if (activityLevel === "lightly_active") return 1;
  return 1.15;
}

function applyIntensityRules(
  tasks: PlanTaskItem[],
  questionnaire: FitnessQuestionnaire,
  bmi: number,
  issues: PlanGenerationIssue[]
): PlanTaskItem[] {
  const experienceFactor = questionnaire.fitnessStatus.experience === "beginner" ? 0.8 : questionnaire.fitnessStatus.experience === "advanced" ? 1.15 : 1;
  const bmiFactor = bmi >= 30 ? 0.85 : bmi < 19 ? 0.9 : 1;
  const activityFactor = activityIntensityFactor(questionnaire.fitnessStatus.activityLevel);
  const compositeFactor = experienceFactor * bmiFactor * activityFactor;

  if (questionnaire.fitnessStatus.experience === "beginner") {
    issues.push({
      code: "low_time",
      message: "Beginner profile detected. Initial intensity reduced for safety and adherence.",
      severity: "info",
    });
  }

  return tasks.map((task) => {
    if (task.type !== "workout") return task;

    const nextDuration = Math.max(12, Math.round((task.durationMinutes ?? 30) * compositeFactor));
    const nextIntensity = compositeFactor > 1.05 ? "high" : compositeFactor < 0.9 ? "low" : "moderate";

    return {
      ...task,
      durationMinutes: nextDuration,
      intensity: nextIntensity,
      points: Math.min(60, Math.max(30, Math.round(task.points * compositeFactor))),
    };
  });
}

function applyScheduleRules(weeks: PlanWeek[], daysPerWeek: number): PlanWeek[] {
  return weeks.map((week) => ({
    ...week,
    days: week.days.map((day, index) => {
      if (index >= daysPerWeek) {
        return {
          day: day.day,
          tasks: [
            {
              type: "habit",
              title: "Active recovery day",
              description: "Light walk + mobility + hydration and sleep consistency.",
              points: 35,
              meta: { recovery: true, stepsGoal: 6000, sleepHours: 8, waterLiters: 3 },
            },
          ],
        };
      }
      return day;
    }),
  }));
}

function applyGoalGapRules(weeks: PlanWeek[], questionnaire: FitnessQuestionnaire, gap: number): PlanWeek[] {
  const highFatLossGap = questionnaire.goals.primaryGoal === "fat_loss" && Math.abs(gap) >= 8;
  const highGainGap = questionnaire.goals.primaryGoal === "muscle_gain" && Math.abs(gap) >= 6;

  return weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => {
      if (!highFatLossGap && !highGainGap) return day;

      const tasks = day.tasks.map((task) => {
        if (task.type !== "workout") return task;

        const isCardio = cardioKeywords.some((token) => (task.title ?? "").includes(token));
        if (highFatLossGap && isCardio) {
          return {
            ...task,
            durationMinutes: Math.min(60, (task.durationMinutes ?? 25) + 10),
            points: task.points + 5,
            description: `${task.description ?? ""} Extended cardio block added due to aggressive but realistic fat-loss target.`.trim(),
          };
        }

        if (highGainGap && !isCardio) {
          return {
            ...task,
            durationMinutes: Math.min(75, (task.durationMinutes ?? 35) + 8),
            points: task.points + 5,
            description: `${task.description ?? ""} Added progressive volume for higher muscle-gain target.`.trim(),
          };
        }

        return task;
      });

      return { ...day, tasks };
    }),
  }));
}

function applyEnvironmentRules(weeks: PlanWeek[], questionnaire: FitnessQuestionnaire): PlanWeek[] {
  const isHomeNoEquipment = questionnaire.environment.workoutType === "home" && questionnaire.environment.equipment === "none";
  const isGym = questionnaire.environment.workoutType === "gym";

  return weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      tasks: day.tasks.map((task) => {
        if (task.type !== "workout") return task;

        if (isHomeNoEquipment) {
          return {
            ...task,
            title: `Bodyweight: ${task.title}`,
            description: "No-equipment adaptation applied (pushups, squats, lunges, planks, jump rope alternatives).",
            meta: { ...(task.meta ?? {}), equipmentMode: "bodyweight_only" },
          };
        }

        if (isGym) {
          return {
            ...task,
            description: `${task.description ?? ""} Gym equipment variation enabled.`.trim(),
            meta: { ...(task.meta ?? {}), equipmentMode: "gym_equipment" },
          };
        }

        return task;
      }),
    })),
  }));
}

function applyConstraintRules(
  weeks: PlanWeek[],
  questionnaire: FitnessQuestionnaire,
  issues: PlanGenerationIssue[]
): PlanWeek[] {
  if (!questionnaire.constraints.hasInjuries) return weeks;

  const injuryText = `${questionnaire.constraints.injuryTypes.join(" ")} ${questionnaire.constraints.restrictions}`.toLowerCase();
  const avoidHighImpact = /knee|ankle|achilles/.test(injuryText);
  const avoidOverhead = /shoulder|rotator/.test(injuryText);

  issues.push({
    code: "injury_conflict",
    message: "Injury constraints detected. High-risk movement patterns were automatically replaced.",
    severity: "warning",
  });

  return weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      tasks: day.tasks.map((task) => {
        if (task.type !== "workout") return task;

        let title = task.title;
        let description = task.description ?? "";

        if (avoidHighImpact && /Run|Sprint|Jump/.test(title)) {
          title = "Low-impact cardio (bike/walk)";
          description = `${description} Replaced impact-heavy drill.`.trim();
        }

        if (avoidOverhead && /Overhead|Press/.test(title)) {
          title = "Shoulder-safe strength circuit";
          description = `${description} Overhead loading removed.`.trim();
        }

        return { ...task, title, description };
      }),
    })),
  }));
}

export function validateQuestionnaire(questionnaire: FitnessQuestionnaire): PlanGenerationIssue[] {
  const issues: PlanGenerationIssue[] = [];

  if (!questionnaire.basic.age || !questionnaire.basic.heightCm || !questionnaire.basic.weightKg) {
    issues.push({ code: "missing_inputs", message: "Basic body metrics are incomplete.", severity: "warning" });
  }

  const diff = deriveWeightDifference(questionnaire);
  if (questionnaire.goals.targetMode === "weight" && Math.abs(diff) >= 20) {
    issues.push({
      code: "unrealistic_goal",
      message: "Target weight change appears unrealistic for a 30-day cycle. Plan tuned for safe progression.",
      severity: "warning",
    });
  }

  if (questionnaire.commitment.timePerDayMinutes <= 15 && questionnaire.commitment.daysPerWeek <= 3) {
    issues.push({
      code: "low_time",
      message: "Very low time availability detected. Plan prioritizes high-impact essentials.",
      severity: "warning",
    });
  }

  return issues;
}

export function generateAutoPlan(studentId: string, questionnaire: FitnessQuestionnaire): Plan {
  const bmi = calculateBMI(questionnaire.basic.heightCm, questionnaire.basic.weightKg);
  const weightGap = deriveWeightDifference(questionnaire);
  const issues = validateQuestionnaire(questionnaire);

  const templateKey = pickBaseTemplate(questionnaire);
  const template = PLAN_TEMPLATES[templateKey];

  let weeks = cloneWeeks(template.weeks);

  weeks = weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      tasks: applyIntensityRules(day.tasks, questionnaire, bmi, issues),
    })),
  }));

  weeks = applyScheduleRules(weeks, questionnaire.commitment.daysPerWeek);
  weeks = applyGoalGapRules(weeks, questionnaire, weightGap);
  weeks = applyEnvironmentRules(weeks, questionnaire);
  weeks = applyConstraintRules(weeks, questionnaire, issues);

  const planId = `auto-plan-${studentId}-${Date.now()}`;

  return {
    id: planId,
    title: `Auto Plan - ${template.meta.name}`,
    name: `Auto Plan - ${template.meta.name}`,
    difficulty: questionnaire.fitnessStatus.experience,
    duration: template.meta.durationDays,
    goalType: questionnaire.goals.primaryGoal,
    dailyTasks: [],
    type: "auto_generated",
    templateKey,
    status: "pending_trainer_approval",
    generatedAt: new Date().toISOString(),
    basedOn: {
      goal: questionnaire.goals.primaryGoal,
      weightKg: questionnaire.basic.weightKg,
      level: questionnaire.fitnessStatus.experience,
      bmi,
      activityLevel: questionnaire.fitnessStatus.activityLevel,
      daysPerWeek: questionnaire.commitment.daysPerWeek,
      environment: questionnaire.environment.workoutType,
      equipment: questionnaire.environment.equipment,
    },
    weeks,
    generationIssues: issues,
  };
}
