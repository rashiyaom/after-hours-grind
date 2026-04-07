export type UserRole = "student" | "trainer" | "admin";

export type PermissionKey =
  | "view_dashboard"
  | "manage_users"
  | "moderate_content"
  | "build_plans"
  | "post_feed"
  | "view_analytics";

export type PermissionMatrix = Record<UserRole, Record<PermissionKey, boolean>>;

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar: string;
  role: UserRole;
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
  trainerId: string | null;
  currentPlanId: string | null;
  currentDay: number;
  totalDays: number;
  completionPercentage: number;
  todaySteps: number;
  rank: number;
  badges: Badge[];
  isBanned: boolean;
  warnings: number;
}

export interface Trainer extends User {
  role: "trainer";
  specialization: string;
  experience: number;
  certifications: string[];
  totalStudents: number;
  activePlans: number;
  isVerified: boolean;
}

export interface Admin extends User {
  role: "admin";
  permissions: string[];
}

export interface DailyTask {
  id: string;
  description: string;
  completed: boolean;
}

export interface WorkoutItem {
  id: string;
  description: string;
  completed: boolean;
}

export interface DietItem {
  id: string;
  description: string;
  completed: boolean;
}

export interface Plan {
  id: string;
  name?: string;
  title?: string;
  trainerId?: string;
  duration?: number;
  goalType?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  dailyTasks: DailyTask[];
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRole: UserRole;
  type: "image" | "video" | "reel";
  mediaUrl: string;
  caption: string;
  likes: number;
  comments: number;
  location: string;
  timestamp: string;
  liked: boolean;
  status: "visible" | "hidden" | "under-review";
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

export interface Badge {
  id: string;
  name: string;
  icon: string;
  date: string;
  description?: string;
  earned?: boolean;
  earnedDate?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "critical";
  timestamp: string;
  read: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details: Record<string, unknown>;
}

export interface AppVersion {
  version: string;
  releaseDate: string;
  notes: string;
}

export interface NotificationItem {
  id: string;
  message: string;
  icon: string;
  type: "streak" | "rank" | "social" | "trainer" | "plan";
  timestamp: string;
  read: boolean;
  userAvatar?: string;
  userName?: string;
  action?: string;
  postImage?: string;
}

export interface Submission {
  id: string;
  studentName: string;
  studentAvatar: string;
  planName: string;
  timestamp: string;
  status: "pending" | "approved" | "rejected";
  mediaUrl: string;
  trainerNote?: string;
}

export interface WeeklyData {
  name: string;
  uv: number;
}
