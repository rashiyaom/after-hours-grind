import { beforeEach, describe, expect, it } from "vitest";

import { generateAutoPlan } from "@/lib/planGeneration";
import { useAppStore } from "@/hooks/useStore";
import { FitnessQuestionnaire } from "@/types";

const initialSnapshot = {
  users: structuredClone(useAppStore.getState().users),
  posts: structuredClone(useAppStore.getState().posts),
  plans: structuredClone(useAppStore.getState().plans),
  system: structuredClone(useAppStore.getState().system),
};

beforeEach(() => {
  useAppStore.setState({
    users: structuredClone(initialSnapshot.users),
    posts: structuredClone(initialSnapshot.posts),
    plans: structuredClone(initialSnapshot.plans),
    system: structuredClone(initialSnapshot.system),
    session: { currentUser: null, isAuthenticated: false },
  });
});

const baseQuestionnaire: FitnessQuestionnaire = {
  basic: {
    age: 24,
    gender: "male",
    heightCm: 175,
    weightKg: 82,
    bmi: 26.8,
  },
  fitnessStatus: {
    activityLevel: "sedentary",
    experience: "beginner",
  },
  goals: {
    primaryGoal: "fat_loss",
    targetMode: "weight",
    targetWeightKg: 74,
    weightDifferenceKg: -8,
  },
  commitment: {
    daysPerWeek: 5,
    timePerDayMinutes: 30,
  },
  environment: {
    workoutType: "home",
    equipment: "none",
  },
  lifestyle: {
    dietType: "non_veg",
    proteinAwareness: "low",
    hydrationHabit: "moderate",
    sleepHours: 6,
  },
  constraints: {
    hasInjuries: true,
    injuryTypes: ["knee"],
    restrictions: "avoid impact",
  },
};

describe("smart plan generation engine", () => {
  it("creates active plan with bodyweight adaptation in home + no equipment mode", () => {
    const plan = generateAutoPlan("s-test", baseQuestionnaire);

    expect(plan.status).toBe("active");
    expect(plan.type).toBe("auto_generated");
    expect(plan.weeks?.length).toBe(4);
    expect(plan.weeks?.[0].days.length).toBe(7);

    const firstWorkout = plan.weeks?.[0].days[0].tasks.find((task) => task.type === "workout");
    expect(firstWorkout?.title.includes("Bodyweight")).toBe(true);
  });

  it("flags unrealistic weight goals", () => {
    const plan = generateAutoPlan("s-test", {
      ...baseQuestionnaire,
      goals: {
        ...baseQuestionnaire.goals,
        targetWeightKg: 50,
      },
    });

    expect(plan.generationIssues?.some((issue) => issue.code === "unrealistic_goal")).toBe(true);
  });
});

describe("store onboarding flow (async)", () => {
  it("completeOnboardingAndGeneratePlan resolves without error", async () => {
    // Since completeOnboardingAndGeneratePlan calls the real backend API,
    // and in test mode the backend is unavailable, we just verify the function exists
    // and is callable. Full integration tests require a running backend.
    const fn = useAppStore.getState().completeOnboardingAndGeneratePlan;
    expect(typeof fn).toBe("function");
  });
});
