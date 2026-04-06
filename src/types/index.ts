export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "student" | "trainer";
}

export interface Student extends User {
  role: "student";
  collegeId: string;
  height: number;
  weight: number;
  fitnessGoal: string;
  streak: number;
  totalPlansCompleted: number;
  followers: number;
  following: number;
  trainerId: string;
  currentPlanId: string;
  currentDay: number;
  totalDays: number;
  completionPercentage: number;
  todaySteps: number;
  rank: number;
  badges: Badge[];
}

export interface Trainer extends User {
  role: "trainer";
  specialization: string;
  experience: number;
  certifications: string[];
  totalStudents: number;
  activePlans: number;
}

export interface DailyTask {
  id: string;
  dayNumber: number;
  workout: WorkoutItem[];
  diet: DietItem[];
  activityGoal: string;
  stepTarget: number;
  hydrationGoal: string;
  trainerNotes: string;
  completed: boolean;
}

export interface WorkoutItem {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  completed: boolean;
}

export interface DietItem {
  id: string;
  meal: string;
  description: string;
  calories: number;
  time: string;
  completed: boolean;
}

export interface Plan {
  id: string;
  title: string;
  trainerId: string;
  duration: number;
  goalType: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  dailyTasks: DailyTask[];
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRole: "student" | "trainer";
  type: "image" | "video" | "reel";
  mediaUrl: string;
  caption: string;
  likes: number;
  comments: number;
  location: string;
  timestamp: string;
  liked: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  score: number;
  streak: number;
  steps: number;
  uploads: number;
  completionPercentage: number;
}

export interface NotificationItem {
  id: string;
  type: "plan" | "rank" | "streak" | "social" | "trainer";
  message: string;
  timestamp: string;
  read: boolean;
  icon: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
}

export interface WeeklyData {
  day: string;
  completed: number;
  total: number;
}
