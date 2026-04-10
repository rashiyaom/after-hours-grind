import type { Student, Trainer, Admin, Post, Plan } from "@/types";
import { hashPassword } from "@/lib/auth";

// ─── Demo Users ──────────────────────────────────────────
export const SEED_STUDENTS: Record<string, Student> = {
  s1: {
    id: "s1", name: "Arjun Mehta", email: "s@g.com", passwordHash: hashPassword("student1234"),
    avatar: "", role: "student", collegeId: "COL2024001", height: 175, weight: 72,
    fitnessGoal: "Build lean muscle", streak: 12, totalPlansCompleted: 3,
    followers: 48, following: 32, trainerId: "t1", currentPlanId: "plan-1",
    currentDay: 4, totalDays: 28, completionPercentage: 64, todaySteps: 7200,
    rank: 1, badges: [
      { id: "b1", name: "Week Warrior", icon: "flame", date: "2026-03-15", earned: true, earnedDate: "2026-03-15" },
      { id: "b2", name: "Iron Will", icon: "dumbbell", date: "2026-04-01", earned: true, earnedDate: "2026-04-01" },
    ],
    isBanned: false, warnings: 0, onboardingStatus: "completed", onboardingStep: 6,
    taskCompletions: {}, totalPoints: 580,
  },
  s2: {
    id: "s2", name: "Priya Sharma", email: "priya@g.com", passwordHash: hashPassword("student1234"),
    avatar: "", role: "student", collegeId: "COL2024002", height: 162, weight: 58,
    fitnessGoal: "Fat loss & toning", streak: 8, totalPlansCompleted: 2,
    followers: 36, following: 28, trainerId: "t1", currentPlanId: "plan-1",
    currentDay: 4, totalDays: 28, completionPercentage: 52, todaySteps: 5800,
    rank: 2, badges: [
      { id: "b3", name: "Consistency Queen", icon: "crown", date: "2026-03-20", earned: true, earnedDate: "2026-03-20" },
    ],
    isBanned: false, warnings: 0, onboardingStatus: "completed", onboardingStep: 6,
    taskCompletions: {}, totalPoints: 420,
  },
  s3: {
    id: "s3", name: "Rahul Verma", email: "rahul@g.com", passwordHash: hashPassword("student1234"),
    avatar: "", role: "student", collegeId: "COL2024003", height: 180, weight: 85,
    fitnessGoal: "Strength training", streak: 5, totalPlansCompleted: 1,
    followers: 22, following: 18, trainerId: "t1", currentPlanId: null,
    currentDay: 1, totalDays: 28, completionPercentage: 30, todaySteps: 4200,
    rank: 3, badges: [],
    isBanned: false, warnings: 0, onboardingStatus: "completed", onboardingStep: 6,
    taskCompletions: {}, totalPoints: 210,
  },
};

export const SEED_TRAINERS: Record<string, Trainer> = {
  t1: {
    id: "t1", name: "Coach Vikram", email: "t@g.com", passwordHash: hashPassword("trainer1234"),
    avatar: "", role: "trainer", specialization: "Strength & Conditioning",
    experience: 8, certifications: ["NSCA-CSCS", "ACE-CPT"],
    totalStudents: 3, activePlans: 2, isVerified: true,
  },
};

export const SEED_ADMINS: Record<string, Admin> = {
  a1: {
    id: "a1", name: "Admin User", email: "a@g.com", passwordHash: hashPassword("admin1234"),
    avatar: "", role: "admin", permissions: ["manage_users", "moderate_content", "view_analytics"],
  },
};

export const SEED_USERS = { ...SEED_STUDENTS, ...SEED_TRAINERS, ...SEED_ADMINS };

// ─── Demo Posts ──────────────────────────────────────────
export const SEED_POSTS: Record<string, Post> = {
  "post1": {
    id: "post1", userId: "s1", userName: "Arjun Mehta", userAvatar: "", userRole: "student",
    source: "task-proof", type: "image", mediaUrl: "", caption: "Morning push session done 💪 4x12 incline press",
    likes: 24, comments: 3, location: "Campus Gym", timestamp: new Date(Date.now() - 3600000).toISOString(),
    liked: false, status: "visible",
  },
  "post2": {
    id: "post2", userId: "s2", userName: "Priya Sharma", userAvatar: "", userRole: "student",
    source: "general", type: "image", mediaUrl: "", caption: "Meal prep Sunday 🥗 High protein, low carb week ahead",
    likes: 18, comments: 5, location: "Home Kitchen", timestamp: new Date(Date.now() - 7200000).toISOString(),
    liked: false, status: "visible",
  },
  "post3": {
    id: "post3", userId: "t1", userName: "Coach Vikram", userAvatar: "", userRole: "trainer",
    source: "general", type: "video", mediaUrl: "", caption: "Quick tip: Perfect your deadlift form before adding weight",
    likes: 42, comments: 8, location: "Training Center", timestamp: new Date(Date.now() - 14400000).toISOString(),
    liked: false, status: "visible",
  },
};

// ─── Demo Plan ───────────────────────────────────────────
export const SEED_PLANS: Record<string, Plan> = {
  "plan-1": {
    id: "plan-1", name: "Lean Muscle Protocol", title: "Lean Muscle Protocol",
    trainerId: "t1", duration: 28, goalType: "muscle_gain",
    difficulty: "intermediate", type: "manual", status: "active",
    dailyTasks: [],
    weeks: [
      {
        week: 1,
        days: Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          tasks: [
            { type: "workout" as const, title: "Upper Body Push", description: "Chest, shoulders, triceps focus", durationMinutes: 45, intensity: "moderate" as const, points: 50 },
            { type: "nutrition" as const, title: "High Protein Day", description: "Hit 140g protein target", points: 30 },
            { type: "habit" as const, title: "Hydration + Steps", description: "3L water, 8000 steps", points: 20, meta: { stepsGoal: 8000, waterLiters: 3 } },
          ],
        })),
      },
      {
        week: 2,
        days: Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          tasks: [
            { type: "workout" as const, title: "Lower Body Power", description: "Squats, lunges, deadlifts", durationMinutes: 50, intensity: "high" as const, points: 60 },
            { type: "nutrition" as const, title: "Recovery Nutrition", description: "Focus on post-workout carbs", points: 30 },
            { type: "habit" as const, title: "Sleep & Recovery", description: "7+ hours sleep, stretching", points: 20, meta: { stepsGoal: 9000, waterLiters: 3.5 } },
          ],
        })),
      },
      {
        week: 3,
        days: Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          tasks: [
            { type: "workout" as const, title: "Full Body Circuit", description: "Compound movements, minimal rest", durationMinutes: 40, intensity: "high" as const, points: 55 },
            { type: "nutrition" as const, title: "Caloric Surplus Day", description: "Eat 300 above maintenance", points: 25 },
            { type: "habit" as const, title: "Active Recovery", description: "Walk 10k steps, foam roll", points: 20, meta: { stepsGoal: 10000, waterLiters: 3 } },
          ],
        })),
      },
      {
        week: 4,
        days: Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          tasks: [
            { type: "workout" as const, title: "Deload Week", description: "50% volume, technique focus", durationMinutes: 30, intensity: "low" as const, points: 40 },
            { type: "nutrition" as const, title: "Maintenance Eating", description: "Balanced macros", points: 25 },
            { type: "habit" as const, title: "Mindfulness", description: "Meditation + journaling", points: 15, meta: { stepsGoal: 7000, waterLiters: 3 } },
          ],
        })),
      },
    ],
  },
};
