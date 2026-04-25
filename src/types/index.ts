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
  passwordHash: string;
  avatar: string;
  role: UserRole;
  streak?: number;
  rank?: number;
  completionPercentage?: number;
  followers?: number;
  following?: number;
  collegeId?: string;
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
  onboardingStatus?: "not_started" | "in_progress" | "completed";
  onboardingStep?: number;
  onboardingDraft?: FitnessQuestionnaire;
  taskCompletions?: Record<string, string[]>;
  totalPoints?: number;
}

export interface Trainer extends User {
  role: "trainer";
  specialization: string;
  whatsappNumber?: string;
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

export type ActivityLevel = "sedentary" | "lightly_active" | "active";
export type FitnessExperience = "beginner" | "intermediate" | "advanced";
export type PrimaryGoal = "fat_loss" | "muscle_gain" | "maintenance" | "endurance";
export type BodyTypeTarget = "lean" | "bulky" | "toned";
export type DaysAvailable = 3 | 5 | 6 | 7;
export type TimePerDay = 15 | 30 | 45 | 60;
export type WorkoutEnvironment = "home" | "gym";
export type EquipmentLevel = "none" | "basic" | "full_gym";
export type DietType = "veg" | "non_veg";
export type AwarenessLevel = "low" | "medium" | "high";
export type HydrationHabit = "poor" | "moderate" | "good";
export type PlanStatus = "draft" | "pending_trainer_approval" | "active" | "rejected";
export type PlanTemplateKey =
  | "fat_loss"
  | "muscle_gain"
  | "general_fitness"
  | "endurance"
  | "home_workout"
  | "gym_workout";

export interface FitnessQuestionnaire {
  basic: {
    age: number;
    gender: "male" | "female" | "other";
    heightCm: number;
    weightKg: number;
    bmi?: number;
  };
  fitnessStatus: {
    activityLevel: ActivityLevel;
    experience: FitnessExperience;
  };
  goals: {
    primaryGoal: PrimaryGoal;
    targetMode: "weight" | "body_type";
    targetWeightKg?: number;
    targetBodyType?: BodyTypeTarget;
    weightDifferenceKg?: number;
  };
  commitment: {
    daysPerWeek: DaysAvailable;
    timePerDayMinutes: TimePerDay;
  };
  environment: {
    workoutType: WorkoutEnvironment;
    equipment: EquipmentLevel;
  };
  lifestyle: {
    dietType: DietType;
    proteinAwareness: AwarenessLevel;
    hydrationHabit: HydrationHabit;
    sleepHours: number;
  };
  constraints: {
    hasInjuries: boolean;
    injuryTypes: string[];
    restrictions: string;
  };
}

export interface PlanTaskItem {
  type: "workout" | "nutrition" | "habit";
  title: string;
  description?: string;
  durationMinutes?: number;
  intensity?: "low" | "moderate" | "high";
  points: number;
  meta?: Record<string, string | number | boolean>;
}

export interface PlanDay {
  day: number;
  tasks: PlanTaskItem[];
}

export interface PlanWeek {
  week: number;
  days: PlanDay[];
}

export interface PlanBasedOn {
  goal: PrimaryGoal;
  weightKg: number;
  level: FitnessExperience;
  bmi: number;
  activityLevel: ActivityLevel;
  daysPerWeek: DaysAvailable;
  environment: WorkoutEnvironment;
  equipment: EquipmentLevel;
}

export interface PlanGenerationIssue {
  code: "missing_inputs" | "unrealistic_goal" | "injury_conflict" | "low_time";
  message: string;
  severity: "info" | "warning";
}

export interface PlanTemplateMeta {
  key: PlanTemplateKey;
  name: string;
  durationDays: 30;
  weeks: 4;
  daysPerWeek: 7;
  baseIntensity: "low" | "moderate" | "high";
  focus: string;
}

interface WorkoutItem {
  id: string;
  description: string;
  completed: boolean;
}

interface DietItem {
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
  type?: "manual" | "auto_generated";
  status?: PlanStatus;
  templateKey?: PlanTemplateKey;
  basedOn?: PlanBasedOn;
  weeks?: PlanWeek[];
  generationIssues?: PlanGenerationIssue[];
  reviewFeedback?: string;
  reviewNote?: string;
  generatedAt?: string;
  reviewedAt?: string;
  reviewedByTrainerId?: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRole: UserRole;
  source?: "general" | "task-proof" | "strava";
  type: "image" | "video" | "reel";
  mediaUrl: string;
  caption: string;
  relatedTaskId?: string;
  relatedTaskType?: "workout" | "diet";
  relatedDayNumber?: number;
  likes: number;
  comments: number;
  location: string;
  timestamp: string;
  liked: boolean;
  status: "visible" | "hidden" | "under-review";
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  type: "text" | "reel-share" | "voice-note";
  seenBy: string[];
  voiceSeconds?: number;
  voiceAudioUrl?: string;
  reelPostId?: string;
  reelPreviewUrl?: string;
  reelCaption?: string;
}

export interface ChatThread {
  id: string;
  participantIds: string[];
  messages: ChatMessage[];
  updatedAt: string;
  unreadBy: string[];
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

interface Submission {
  id: string;
  studentId?: string;
  trainerId?: string;
  studentName: string;
  studentAvatar?: string;
  planName?: string;
  taskName?: string;
  taskType?: 'workout' | 'diet' | 'checkin';
  taskId?: string;
  dayNumber?: number;
  postId?: string;
  requiresApproval?: boolean;
  points?: number;
  timestamp: string;
  status: "pending" | "approved" | "rejected";
  mediaUrl: string;
  trainerNote?: string;
}

export interface WeeklyData {
  name: string;
  uv: number;
}

// ─── EVENTS SYSTEM ───────────────────────────────────────
export type EventFormFieldType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "date";

export interface EventFormField {
  id: string;
  type: EventFormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select / radio / checkbox
}

export interface EventEntry {
  id: string;
  eventId: string;
  submittedAt: string;
  responses: Record<string, string | string[]>;
}

export interface AHGEvent {
  id: string;
  title: string;
  description: string;
  date: string;           // ISO string
  location: string;
  category: string;       // e.g. "Competition", "Workshop", "Seminar"
  status: "upcoming" | "live" | "completed";
  mediaType: "image" | "video";
  mediaUrl: string;       // poster image or video URL
  registrationOpen: boolean;
  formFields: EventFormField[];
  entries: EventEntry[];
  createdAt: string;
  createdBy: string;      // admin userId
}
interface Athlete {
  id: string;
  name: string;
  sport: "Football" | "Basketball" | "Karate" | "Judo" | "Tennis" | "Badminton" | "Kabaddi" | "Chess" | "Martial Arts" | "Cricket";
  team: string;
  gender: "Male" | "Female";
  photo: string;
  achievements: string[];
  description: string;
  role: string;
}

interface SportsTeam {
  name: string;
  sport: string;
  members: Athlete[];
  achievements: string[];
  photo: string;
}

