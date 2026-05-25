import { create } from 'zustand';
import * as Sentry from "@sentry/react";
import {
  Admin,
  AHGEvent,
  ChatMessage,
  ChatThread,
  EventEntry,
  FitnessQuestionnaire,
  PlanDay,
  Student,
  Trainer,
  Post,
  Plan,
  PlanStatus,
  SystemNotification,
  ActivityLog,
  AppVersion,
  User,
  UserRole,
  PermissionKey,
  PermissionMatrix,
  NotificationItem,
  LeaderboardEntry,
} from '@/types';
import { toast } from 'sonner';
import { generateAutoPlan } from '@/lib/planGeneration';
import { 
  loginBackend, 
  signupBackend, 
  logoutBackend,
  clearBackendAccessToken,
  fetchCurrentUser, 
  fetchFeedFromBackend, 
  fetchChatThreads, 
  createChatThreadAPI,
  sendChatMessageAPI, 
  fetchTodayPlanAPI,
  fetchTodayPlanLiteAPI,
  submitTaskAPI,
  resendTaskProofAPI,
  approveSubmissionAPI,
  rejectSubmissionAPI,
  markSubmissionWhatsAppReceivedAPI,
  fetchEventsAPI,
  fetchLeaderboardAPI,
  fetchTrainerStudentsAPI,
  fetchAdminUsersAPI,
  registerForEventAPI,
  fetchSubmissionsAPI,
  updateProfileAPI,
  likePostAPI,
  unlikePostAPI,
  toggleUserBanAPI,
  verifyTrainerAPI,
  assignStudentTrainerAdminAPI,
  createPlanAPI,
  generatePersonalizedPlanAPI,
  createEventAPI,
  updateEventAPI,
  deleteEventAPI,
  fetchNotificationsAPI,
  markNotificationReadAPI,
  fetchProgressDashboardAPI,
  createPostAPI,
  addCommentAPI,
  followUserAPI,
  unfollowUserAPI,
  updatePostModerationAPI,
  fetchAdminPermissionsAPI,
  setAdminPermissionAPI,
  resetAdminPermissionsAPI,
  bulkDeleteUsersAPI,
  createAdminAccountAPI,
} from '@/lib/api';

type LegacyTodayTask = {
  stepTarget: number;
  hydrationGoal: string;
  workout: Array<{
    id: string;
    name: string;
    sets: number;
    reps: number;
    rest: string;
    completed: boolean;
    focus: string;
    equipmentMode: 'bodyweight_only' | 'basic' | 'full_gym';
    alternatives: string[];
  }>;
  diet: Array<{
    id: string;
    meal: string;
    description: string;
    time: string;
    calories: number;
    completed: boolean;
    foods: Array<{ item: string; grams: number }>;
    macros: { protein: number; carbs: number; fats: number };
  }>;
};

export type LegacySubmission = {
  id: string;
  studentId: string;
  studentName: string;
  trainerId?: string;
  taskName: string;
  taskType?: 'workout' | 'diet' | 'checkin';
  taskId?: string;
  dayNumber?: number;
  postId?: string;
  requiresApproval?: boolean;
  proofRefId?: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  mediaUrl: string;
  trainerNote: string;
  points?: number;
  pendingCheckinLabel?: 'latest' | 'old';
  whatsappReceivedAt?: string;
  whatsappReceived?: boolean;
  pendingAgeHours?: number;
};

type PlanUpdateNotification = {
  id: string;
  studentId: string;
  trainerId: string;
  trainerName: string;
  planId: string;
  message: string;
  timestamp: string;
  read: boolean;
};

type ProgressOverview = {
  streak: number;
  totalPoints: number;
  weeklyAvgWorkoutMinutes: number;
  totalStepsLast30Days: number;
  checkInsLast30Days: number;
  completionPercentage: number;
};

type ProgressWeeklyPoint = {
  date: string;
  day: string;
  completion: number;
  workoutMinutes: number;
  steps: number;
  points: number;
};

type ProgressMonthlyPoint = {
  week: string;
  completion: number;
  completedTasks: number;
  totalTasks: number;
};

type ProgressHeatmapPoint = {
  date: string;
  value: number;
  level: number;
};

const BACKGROUND_REFRESH_MIN_INTERVAL_MS = 15_000;
const BACKGROUND_NOTIFICATIONS_MIN_INTERVAL_MS = 25_000;
let isBackgroundRefreshInFlight = false;
let lastBackgroundRefreshAt = 0;
let lastNotificationsFetchAt = 0;

const defaultTodayTask: LegacyTodayTask = {
  stepTarget: 0,
  hydrationGoal: '',
  workout: [],
  diet: [],
};

const cloneTodayTask = (): LegacyTodayTask => ({
  ...defaultTodayTask,
  workout: defaultTodayTask.workout.map((item) => ({ ...item, alternatives: [...item.alternatives] })),
  diet: defaultTodayTask.diet.map((item) => ({
    ...item,
    foods: item.foods.map((food) => ({ ...food })),
    macros: { ...item.macros },
  })),
});

const adaptTodayTaskForProfile = (baseTask: LegacyTodayTask, student: Student): LegacyTodayTask => {
  const draft = student.onboardingDraft;
  if (!draft) return cloneTodayTask();

  const equipment = draft.environment.equipment;
  const workoutType = draft.environment.workoutType;
  const isVeg = draft.lifestyle.dietType === 'veg';
  const primaryGoal = draft.goals.primaryGoal;

  let workout = baseTask.workout.map((item) => ({ ...item, alternatives: [...item.alternatives] }));

  if (workoutType === 'home' && equipment === 'none') {
    workout = workout.map((item) => {
      const fallback = item.alternatives[0] ?? item.name;
      return {
        ...item,
        name: `Bodyweight - ${fallback}`,
        focus: `${item.focus} (home adaptation)`,
        equipmentMode: 'bodyweight_only',
      };
    });
  } else if (equipment === 'basic') {
    workout = workout.map((item) => ({
      ...item,
      name: item.equipmentMode === 'full_gym' ? item.alternatives[0] ?? item.name : item.name,
      equipmentMode: item.equipmentMode === 'full_gym' ? 'basic' : item.equipmentMode,
    }));
  } else if (workoutType === 'gym' && equipment === 'full_gym') {
    workout = workout.map((item) => ({
      ...item,
      focus: `${item.focus} (machine-enabled progression)`,
      equipmentMode: 'full_gym',
    }));
  }

  let diet = baseTask.diet.map((item) => ({
    ...item,
    foods: item.foods.map((food) => ({ ...food })),
    macros: { ...item.macros },
  }));

  if (isVeg) {
    diet = diet.map((meal) => {
      const mappedFoods = meal.foods.map((food) => {
        if (/chicken|egg/i.test(food.item)) {
          return { item: 'Paneer/Tofu', grams: Math.max(120, Math.round(food.grams * 0.9)) };
        }
        return food;
      });
      return {
        ...meal,
        description: meal.description.replace(/eggs?/gi, 'tofu').replace(/chicken/gi, 'paneer/tofu'),
        foods: mappedFoods,
      };
    });
  }

  if (primaryGoal === 'fat_loss') {
    diet = diet.map((meal) => ({
      ...meal,
      calories: Math.max(220, Math.round(meal.calories * 0.9)),
      macros: {
        protein: meal.macros.protein,
        carbs: Math.max(20, Math.round(meal.macros.carbs * 0.85)),
        fats: Math.max(8, Math.round(meal.macros.fats * 0.9)),
      },
    }));
  }

  if (primaryGoal === 'muscle_gain') {
    diet = diet.map((meal) => ({
      ...meal,
      calories: Math.round(meal.calories * 1.12),
      macros: {
        protein: Math.round(meal.macros.protein * 1.15),
        carbs: Math.round(meal.macros.carbs * 1.12),
        fats: meal.macros.fats,
      },
    }));
  }

  return {
    ...baseTask,
    workout,
    diet,
    hydrationGoal: draft.lifestyle.hydrationHabit === 'poor' ? '3.8L' : baseTask.hydrationGoal,
    stepTarget: primaryGoal === 'fat_loss' ? 11000 : primaryGoal === 'muscle_gain' ? 9000 : baseTask.stepTarget,
  };
};

const getRecordKey = (planId: string, dayNumber: number) => `${planId}:day:${dayNumber}`;

const getPlanDay = (plan: Plan, dayNumber: number): PlanDay | null => {
  if (!plan.weeks || dayNumber < 1) return null;
  const zeroBased = dayNumber - 1;
  const weekNumber = Math.floor(zeroBased / 7) + 1;
  const dayOfWeek = (zeroBased % 7) + 1;
  const week = plan.weeks.find((w) => w.week === weekNumber);
  if (!week) return null;
  return week.days.find((d) => d.day === dayOfWeek) ?? null;
};

const deriveDietFromTask = (
  student: Student,
  dayNumber: number,
  nutritionTask: { description?: string; meta?: Record<string, string | number | boolean> },
  completedKeys: Set<string>
): LegacyTodayTask['diet'] => {
  const draft = student.onboardingDraft;
  const isVeg = draft?.lifestyle.dietType === 'veg';
  const goal = draft?.goals.primaryGoal ?? 'maintenance';
  const proteinGoal = Number(nutritionTask.meta?.proteinGoalGrams ?? 110);
  const caloriesByGoal = goal === 'fat_loss' ? [430, 560, 260, 520] : goal === 'muscle_gain' ? [620, 780, 420, 760] : [520, 680, 320, 610];

  const templates = isVeg
    ? [
        {
          meal: 'Breakfast',
          description: nutritionTask.description ?? 'Oats + tofu scramble + fruit',
          foods: [
            { item: 'Rolled oats', grams: 70 },
            { item: 'Tofu', grams: 140 },
            { item: 'Banana', grams: 120 },
          ],
        },
        {
          meal: 'Lunch',
          description: 'Paneer/tofu bowl + rice + salad',
          foods: [
            { item: 'Paneer/Tofu', grams: 180 },
            { item: 'Cooked rice', grams: 220 },
            { item: 'Salad mix', grams: 120 },
          ],
        },
        {
          meal: 'Snack',
          description: 'Greek yogurt + nuts',
          foods: [
            { item: 'Greek yogurt', grams: 200 },
            { item: 'Mixed nuts', grams: 25 },
          ],
        },
        {
          meal: 'Dinner',
          description: 'Dal + roti + sauteed vegetables',
          foods: [
            { item: 'Dal', grams: 220 },
            { item: 'Roti', grams: 110 },
            { item: 'Vegetables', grams: 200 },
          ],
        },
      ]
    : [
        {
          meal: 'Breakfast',
          description: nutritionTask.description ?? 'Oats + eggs + fruit',
          foods: [
            { item: 'Rolled oats', grams: 70 },
            { item: 'Whole eggs', grams: 100 },
            { item: 'Banana', grams: 120 },
          ],
        },
        {
          meal: 'Lunch',
          description: 'Chicken + rice + salad',
          foods: [
            { item: 'Chicken breast', grams: 180 },
            { item: 'Cooked rice', grams: 220 },
            { item: 'Salad mix', grams: 120 },
          ],
        },
        {
          meal: 'Snack',
          description: 'Greek yogurt + nuts',
          foods: [
            { item: 'Greek yogurt', grams: 200 },
            { item: 'Mixed nuts', grams: 25 },
          ],
        },
        {
          meal: 'Dinner',
          description: 'Fish/paneer + vegetables + roti',
          foods: [
            { item: 'Fish/Paneer', grams: 170 },
            { item: 'Mixed vegetables', grams: 200 },
            { item: 'Roti', grams: 100 },
          ],
        },
      ];

  const times = ['08:00', '13:30', '17:00', '20:30'];
  return templates.map((entry, idx) => {
    const id = `d-${dayNumber}-${idx + 1}`;
    const protein = Math.max(18, Math.round((proteinGoal / 4) * (idx === 2 ? 0.8 : 1)));
    const carbs = goal === 'fat_loss' ? [45, 55, 18, 42][idx] : goal === 'muscle_gain' ? [72, 84, 34, 78][idx] : [57, 64, 18, 48][idx];
    const fats = goal === 'fat_loss' ? [12, 13, 11, 14][idx] : goal === 'muscle_gain' ? [18, 20, 14, 22][idx] : [16, 14, 15, 24][idx];
    return {
      id,
      meal: entry.meal,
      description: entry.description,
      time: times[idx],
      calories: caloriesByGoal[idx],
      completed: completedKeys.has(id),
      foods: entry.foods,
      macros: { protein, carbs, fats },
    };
  });
};

const buildTodayTaskFromPlan = (student: Student, plan: Plan | null, dayNumber: number): LegacyTodayTask => {
  if (!plan || !plan.id) {
    return adaptTodayTaskForProfile(cloneTodayTask(), student);
  }

  const dayData = getPlanDay(plan, dayNumber);
  if (!dayData) {
    return adaptTodayTaskForProfile(cloneTodayTask(), student);
  }

  const completedSet = new Set(student.taskCompletions?.[getRecordKey(plan.id, dayNumber)] ?? []);
  const workoutTasks = dayData.tasks.filter((task) => task.type === 'workout' || task.type === 'habit');
  const nutritionTask = dayData.tasks.find((task) => task.type === 'nutrition');

  const workout = workoutTasks.map((task, idx) => {
    const id = `w-${dayNumber}-${idx + 1}`;
    const setCount = task.intensity === 'high' ? 4 : task.intensity === 'low' ? 2 : 3;
    const repCount = task.intensity === 'high' ? 8 : task.intensity === 'low' ? 16 : 12;
    const equipmentMode = String(task.meta?.equipmentMode ?? (student.onboardingDraft?.environment.equipment ?? 'basic'));
    return {
      id,
      name: task.title,
      sets: setCount,
      reps: repCount,
      rest: task.intensity === 'high' ? '75s' : '45s',
      completed: completedSet.has(id),
      focus: task.description ?? 'Execute with strict form and controlled tempo.',
      equipmentMode:
        equipmentMode === 'bodyweight_only' ? 'bodyweight_only' : equipmentMode === 'full_gym' ? 'full_gym' : 'basic',
      alternatives: ['Tempo variation', 'Range-of-motion regression'],
    } as LegacyTodayTask['workout'][number];
  });

  const diet = nutritionTask
    ? deriveDietFromTask(student, dayNumber, nutritionTask, completedSet)
    : adaptTodayTaskForProfile(cloneTodayTask(), student).diet;

  const stepTarget = Number(dayData.tasks.find((task) => task.type === 'habit')?.meta?.stepsGoal ?? 9000);
  const hydrationGoal = `${Number(dayData.tasks.find((task) => task.type === 'habit')?.meta?.waterLiters ?? 3)}L`;

  return {
    stepTarget,
    hydrationGoal,
    workout,
    diet,
  };
};

const completeStudentTaskByApproval = (
  student: Student,
  plans: Record<string, Plan>,
  payload: { taskId?: string; dayNumber?: number }
): Student => {
  if (!payload.taskId || !payload.dayNumber) {
    return student;
  }

  const plan = student.currentPlanId ? plans[student.currentPlanId] : null;
  const targetDay = payload.dayNumber;
  const key = plan?.id ? getRecordKey(plan.id, targetDay) : `legacy:day:${targetDay}`;
  const existingKeys = student.taskCompletions?.[key] ?? [];
  const hadAnyCompletionForDay = existingKeys.length > 0;

  if (existingKeys.includes(payload.taskId)) {
    return student;
  }

  const updatedTaskCompletions: Record<string, string[]> = {
    ...(student.taskCompletions ?? {}),
    [key]: [...existingKeys, payload.taskId],
  };

  let completionPercentage = student.completionPercentage;
  if (plan?.id) {
    let totalTasks = 0;
    let completedTasks = 0;
    const maxDays = plan.duration ?? student.totalDays;

    for (let day = 1; day <= maxDays; day += 1) {
      const taskForDay = buildTodayTaskFromPlan({ ...student, taskCompletions: updatedTaskCompletions }, plan, day);
      totalTasks += taskForDay.workout.length + taskForDay.diet.length;
      completedTasks +=
        taskForDay.workout.filter((task) => task.completed).length +
        taskForDay.diet.filter((task) => task.completed).length;
    }

    completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }

  return {
    ...student,
    taskCompletions: updatedTaskCompletions,
    completionPercentage,
    streak: hadAnyCompletionForDay ? student.streak : student.streak + 1,
  };
};

// ========= STORE STATE =========
interface AppState {
  // Core Data - Normalized
  users: Record<string, User>;
  posts: Record<string, Post>;
  plans: Record<string, Plan>;

  // System State
  system: {
    notifications: SystemNotification[];
    activityLogs: ActivityLog[];
    appVersion: AppVersion;
    isLoading: boolean;
    permissions: PermissionMatrix;
    legacyTodayTask: LegacyTodayTask;
    legacySubmissions: LegacySubmission[];
    legacyNotifications: NotificationItem[];
    planUpdateNotifications: PlanUpdateNotification[];
    events: AHGEvent[];
    chatThreads: ChatThread[];
    progressOverview: ProgressOverview | null;
    progressWeekly: ProgressWeeklyPoint[];
    progressMonthly: ProgressMonthlyPoint[];
    progressHeatmap: ProgressHeatmapPoint[];
    leaderboardEntries: LeaderboardEntry[];
    progressLoading: boolean;
    studentTodayPlan: Record<string, unknown> | null;
    planLoading: boolean;
  };

  // Session State
  session: {
    currentUser: User | Student | Trainer | Admin | null;
    isAuthenticated: boolean;
  };
}

// ========= STORE ACTIONS =========
interface AppActions {
  // Session Actions
  initializeSession: () => Promise<void>;
  login: (email: string, password: string, role?: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (userData: {
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
    role: Exclude<UserRole, 'admin'>;
    collegeId?: string;
    height?: number;
    weight?: number;
    fitnessGoal?: string;
    specialization?: string;
    whatsappNumber?: string;
    experience?: number;
    certifications?: string;
  }) => Promise<void>;

  // Data Loading
  setLoading: (isLoading: boolean) => void;
  refreshData: (options?: {
    background?: boolean;
    scope?:
      | "common"
      | "student"
      | "student-dashboard"
      | "student-leaderboard"
      | "trainer"
      | "admin"
      | "all";
  }) => Promise<void>;

  // Post Actions
  toggleLike: (postId: string) => Promise<void>;
  updatePostStatus: (postId: string, status: Post['status']) => Promise<void>;

  // User Actions
  updateUser: (userId: string, data: Partial<User>) => void;
  banUser: (userId: string) => void;
  bulkDeleteUsers: (userIds: string[]) => Promise<void>;
  verifyTrainer: (trainerId: string) => Promise<void>;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  createPlan: (payload: {
    title: string;
    duration: number;
    goalType: string;
    difficulty: Plan['difficulty'];
    studentIds: string[];
  }) => Promise<void>;
  updateProfile: (payload: Record<string, unknown>) => Promise<void>;
  saveOnboardingDraft: (studentId: string, payload: FitnessQuestionnaire, step: number) => Promise<void>;
  completeOnboardingAndGeneratePlan: (studentId: string, payload: FitnessQuestionnaire) => Promise<void>;
  fetchSubmissions: () => Promise<void>;
  reviewAutoGeneratedPlan: (planId: string, decision: 'approve' | 'reject', feedback?: string) => void;
  editAutoGeneratedPlanDay: (planId: string, week: number, day: number, updates: Partial<PlanDay>) => void;
  assignTrainer: (studentId: string, trainerId: string | null) => Promise<void>;
  createAccount: (payload: {
    name: string;
    email: string;
    password: string;
    role: "STUDENT" | "TRAINER";
    phoneNumber: string;
    collegeId?: string;
    height?: number;
    weight?: number;
    fitnessGoal?: string;
    specialization?: string;
    whatsappNumber?: string;
    experience?: number;
    certifications?: string;
  }) => Promise<void>;
  // Task approval flow
  approveTaskSubmission: (submissionId: string, note?: string, awardedPoints?: number) => Promise<void>;
  rejectTaskSubmission: (submissionId: string, note: string) => Promise<void>;
  submitTaskProof: (payload: {
    taskId: string;
    taskType: 'workout' | 'diet';
    dayNumber: number;
    taskName: string;
    studentNote?: string;
  }) => Promise<{
    whatsappUrl?: string;
    proofRefId?: string;
    isRepeatCheckin?: boolean;
    supersededPendingCount?: number;
  }>;
  resendTaskProof: (payload: {
    taskId: string;
    taskType: 'workout' | 'diet';
    dayNumber: number;
    taskName: string;
  }) => Promise<{ whatsappUrl?: string; proofRefId?: string }>;
  markSubmissionWhatsAppReceived: (submissionId: string) => Promise<void>;
  notifyStudentPlanUpdated: (studentId: string, planId: string, message: string) => void;
  markPlanNotificationRead: (notificationId: string) => void;
  createOrGetChatThread: (targetUserId: string) => string | null;
  sendChatMessage: (payload: {
    threadId?: string;
    recipientId?: string;
    text?: string;
    type?: 'text' | 'reel-share' | 'voice-note';
    reelPostId?: string;
    voiceSeconds?: number;
    voiceAudioUrl?: string;
  }) => Promise<void>;
  markChatThreadRead: (threadId: string) => Promise<void>;

  // Events CRUD
  createEvent: (event: Omit<AHGEvent, 'id' | 'createdAt' | 'entries'>) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<AHGEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  submitEventEntry: (eventId: string, responses: Record<string, string | string[]>) => Promise<void>;

  // System Actions
  dismissNotification: (notificationId: string) => void;
  setRolePermission: (role: UserRole, permission: PermissionKey, allowed: boolean) => Promise<void>;
  resetPermissions: () => Promise<void>;
}

const defaultPermissions: PermissionMatrix = {
  student: {
    view_dashboard: true,
    manage_users: false,
    moderate_content: false,
    build_plans: false,
    post_feed: true,
    view_analytics: true,
  },
  trainer: {
    view_dashboard: true,
    manage_users: false,
    moderate_content: false,
    build_plans: true,
    post_feed: true,
    view_analytics: true,
  },
  admin: {
    view_dashboard: true,
    manage_users: true,
    moderate_content: true,
    build_plans: true,
    post_feed: true,
    view_analytics: true,
  },
};

const getRefreshScopeForRole = (role?: UserRole): "student" | "trainer" | "admin" | "common" => {
  if (role === 'student') return 'student';
  if (role === 'trainer') return 'trainer';
  if (role === 'admin') return 'admin';
  return 'common';
};

const fullAdminPermissions: Record<PermissionKey, boolean> = {
  view_dashboard: true,
  manage_users: true,
  moderate_content: true,
  build_plans: true,
  post_feed: true,
  view_analytics: true,
};

const PERMISSIONS_STORAGE_KEY = 'ah_permissions_v1';
const USERS_STORAGE_KEY = 'ah_users_v1';
const SESSION_STORAGE_KEY = 'ah_session_v1';
const CHAT_STORAGE_KEY = 'ah_chats_v1';
const DASHBOARD_STORAGE_KEY = 'ah_dashboard_v1';
const MAX_CHAT_THREADS = 120;
const MAX_MESSAGES_PER_THREAD = 80;
const MAX_VOICE_DATA_URL_LENGTH = 1_200_000;
const storageWarningTracker = new Set<string>();

const createId = (prefix: string): string => {
  const hasCrypto =
    typeof globalThis !== 'undefined' &&
    'crypto' in globalThis &&
    Boolean((globalThis as { crypto?: { randomUUID?: () => string } }).crypto?.randomUUID);

  if (hasCrypto) {
    return `${prefix}-${(globalThis as { crypto: { randomUUID: () => string } }).crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const reportStorageIssue = (scope: string, error?: unknown) => {
  if (storageWarningTracker.has(scope)) return;
  storageWarningTracker.add(scope);
  Sentry.captureMessage(`Storage issue in ${scope} - using in-memory fallback`, "warning");
};

const getLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  const candidate = (window as { localStorage?: Storage }).localStorage;
  if (!candidate) return null;
  if (typeof candidate.getItem !== 'function') return null;
  if (typeof candidate.setItem !== 'function') return null;
  if (typeof candidate.removeItem !== 'function') return null;
  return candidate;
};

const isLegacyTaskType = (value: unknown): value is 'workout' | 'diet' | 'checkin' =>
  value === 'workout' || value === 'diet' || value === 'checkin';

const isLegacySubmissionStatus = (value: unknown): value is 'pending' | 'approved' | 'rejected' =>
  value === 'pending' || value === 'approved' || value === 'rejected';

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : null;

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const asBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback;

const asStringArray = (value: unknown, fallback: string[] = []): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : fallback;

const mapBackendRoleToFrontendRole = (role: unknown): UserRole => {
  if (typeof role !== 'string') return 'student';
  switch (role.toUpperCase()) {
    case 'TRAINER':
      return 'trainer';
    case 'ADMIN':
      return 'admin';
    case 'STUDENT':
    default:
      return 'student';
  }
};

const mapBackendLeaderboardEntries = (input: unknown): LeaderboardEntry[] => {
  if (!Array.isArray(input)) return [];

  return input
    .map((candidate) => asRecord(candidate))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item, index) => ({
      rank: asNumber(item.rank, index + 1),
      userId: asString(item.userId),
      name: asString(item.name, 'Unknown'),
      avatar: asString(item.avatar),
      score: asNumber(item.score),
      streak: asNumber(item.streak),
      steps: asNumber(item.steps),
      uploads: asNumber(item.uploads),
      completionPercentage: asNumber(item.completionPercentage),
    }))
    .filter((entry) => Boolean(entry.userId));
};

const permissionRoles = ['student', 'trainer', 'admin'] as const;
const permissionKeys = [
  'view_dashboard',
  'manage_users',
  'moderate_content',
  'build_plans',
  'post_feed',
  'view_analytics',
] as const;

const mapBackendPermissions = (candidate: unknown, fallback: PermissionMatrix): PermissionMatrix => {
  const matrix = asRecord(candidate);
  if (!matrix) return enforceAdminFullAccess(clonePermissions(fallback));

  const next = clonePermissions(fallback);

  for (const role of permissionRoles) {
    if (role === 'admin') continue;
    const roleRecord = asRecord(matrix[role]);
    if (!roleRecord) continue;
    for (const permission of permissionKeys) {
      if (permission in roleRecord) {
        next[role][permission] = asBoolean(roleRecord[permission], next[role][permission]);
      }
    }
  }

  return enforceAdminFullAccess(next);
};

const normalizeBackendUser = (input: unknown, existingUser?: User): User | null => {
  const raw = asRecord(input);
  if (!raw) return null;

  const id = asString(raw.id);
  if (!id) return null;

  const role = mapBackendRoleToFrontendRole(raw.role ?? existingUser?.role);
  const baseUser = {
    id,
    name: asString(raw.name, existingUser?.name ?? ''),
    email: asString(raw.email, existingUser?.email ?? ''),
    passwordHash: existingUser?.passwordHash ?? '',
    avatar: asString(raw.avatar, existingUser?.avatar ?? ''),
    role,
  } as const;

  if (role === 'student') {
    const existingStudent = existingUser?.role === 'student' ? (existingUser as Student) : undefined;
    const profile = asRecord(raw.studentProfile) ?? raw;
    const trainerIdValue = profile.trainerId;
    const currentPlanIdValue = profile.currentPlanId;
    const onboardingStep = asNumber(profile.onboardingStep, existingStudent?.onboardingStep ?? 0);
    const onboardingCompleted = asBoolean(
      profile.onboardingCompleted,
      existingStudent?.onboardingStatus === 'completed'
    );

    return {
      ...baseUser,
      role: 'student',
      collegeId: asString(profile.collegeId, existingStudent?.collegeId ?? ''),
      height: asNumber(profile.heightCm ?? profile.height, existingStudent?.height ?? 0),
      weight: asNumber(profile.weightKg ?? profile.weight, existingStudent?.weight ?? 0),
      fitnessGoal: asString(profile.fitnessGoal, existingStudent?.fitnessGoal ?? ''),
      streak: asNumber(profile.streak, existingStudent?.streak ?? 0),
      totalPlansCompleted: asNumber(profile.totalPlansCompleted, existingStudent?.totalPlansCompleted ?? 0),
      followers: asNumber(asRecord(raw._count)?.followers, existingStudent?.followers ?? 0),
      following: asNumber(asRecord(raw._count)?.following, existingStudent?.following ?? 0),
      trainerId:
        trainerIdValue === null
          ? null
          : asString(trainerIdValue, existingStudent?.trainerId ?? '') || null,
      currentPlanId:
        currentPlanIdValue === null
          ? null
          : asString(currentPlanIdValue, existingStudent?.currentPlanId ?? '') || null,
      currentDay: asNumber((raw as Record<string, unknown>).currentDay, existingStudent?.currentDay ?? 1),
      totalDays: asNumber((raw as Record<string, unknown>).totalDays, existingStudent?.totalDays ?? 28),
      completionPercentage: asNumber(
        (raw as Record<string, unknown>).completionPercentage,
        existingStudent?.completionPercentage ?? 0
      ),
      todaySteps: asNumber((raw as Record<string, unknown>).todaySteps, existingStudent?.todaySteps ?? 0),
      rank: asNumber((raw as Record<string, unknown>).rank, existingStudent?.rank ?? 0),
      badges: existingStudent?.badges ?? [],
      isBanned: asBoolean(profile.isBanned ?? raw.isBanned, existingStudent?.isBanned ?? false),
      warnings: asNumber((raw as Record<string, unknown>).warnings, existingStudent?.warnings ?? 0),
      onboardingStatus: onboardingCompleted
        ? 'completed'
        : onboardingStep > 0
          ? 'in_progress'
          : 'not_started',
      onboardingStep,
      onboardingDraft:
        asRecord(profile.onboardingDraft) && existingStudent?.onboardingDraft
          ? existingStudent.onboardingDraft
          : existingStudent?.onboardingDraft,
      taskCompletions: existingStudent?.taskCompletions ?? {},
      totalPoints: asNumber(profile.totalPoints, existingStudent?.totalPoints ?? 0),
    } as Student;
  }

  if (role === 'trainer') {
    const existingTrainer = existingUser?.role === 'trainer' ? (existingUser as Trainer) : undefined;
    const profile = asRecord(raw.trainerProfile) ?? raw;

    return {
      ...baseUser,
      role: 'trainer',
      specialization: asString(profile.specialization, existingTrainer?.specialization ?? ''),
      whatsappNumber: asString(profile.whatsappNumber, existingTrainer?.whatsappNumber ?? ''),
      experience: asNumber(profile.experience, existingTrainer?.experience ?? 0),
      certifications: asStringArray(profile.certifications, existingTrainer?.certifications ?? []),
      totalStudents: asNumber(raw.totalStudents, existingTrainer?.totalStudents ?? 0),
      activePlans: asNumber(raw.activePlans, existingTrainer?.activePlans ?? 0),
      isVerified: asBoolean(profile.isVerified, existingTrainer?.isVerified ?? false),
    } as Trainer;
  }

  const existingAdmin = existingUser?.role === 'admin' ? (existingUser as Admin) : undefined;
  return {
    ...baseUser,
    role: 'admin',
    permissions: existingAdmin?.permissions ?? [],
  } as Admin;
};

const normalizeTrainerStudentRecord = (input: unknown, existingUser?: User): Student | null => {
  const raw = asRecord(input);
  if (!raw) return null;

  const nestedUser = asRecord(raw.user);
  if (!nestedUser) return null;

  const normalized = normalizeBackendUser(
    {
      ...nestedUser,
      studentProfile: {
        collegeId: raw.collegeId,
        heightCm: raw.heightCm,
        weightKg: raw.weightKg,
        fitnessGoal: raw.fitnessGoal,
        streak: raw.streak,
        totalPlansCompleted: raw.totalPlansCompleted,
        totalPoints: raw.totalPoints,
        trainerId: raw.trainerId,
        currentPlanId: raw.currentPlanId,
        onboardingCompleted: raw.onboardingCompleted,
        onboardingStep: raw.onboardingStep,
        sport: raw.sport,
        team: raw.team,
      },
    },
    existingUser
  );

  return normalized?.role === 'student' ? (normalized as Student) : null;
};

const formatRelativeTime = (value: string): string => {
  const ms = new Date(value).getTime();
  if (!Number.isFinite(ms)) return value;
  const diffMinutes = Math.max(1, Math.floor((Date.now() - ms) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

const extractWhatsAppProofRef = (mediaUrl: string): string | undefined => {
  if (!mediaUrl.startsWith('whatsapp://proof/')) return undefined;
  const value = mediaUrl.replace('whatsapp://proof/', '').trim();
  return value || undefined;
};

const mapBackendNotificationType = (value: unknown): NotificationItem['type'] => {
  const normalized = asString(value).toLowerCase();
  if (normalized === 'streak') return 'streak';
  if (normalized === 'rank') return 'rank';
  if (normalized === 'trainer') return 'trainer';
  if (normalized === 'plan') return 'plan';
  return 'social';
};

const mapBackendNotificationIcon = (type: NotificationItem['type']): string => {
  if (type === 'streak') return 'flame';
  if (type === 'rank') return 'trending-up';
  if (type === 'trainer') return 'check-circle';
  if (type === 'plan') return 'clipboard';
  return 'message-circle';
};

const mapBackendNotificationToLegacy = (input: unknown): NotificationItem | null => {
  const raw = asRecord(input);
  if (!raw) return null;

  const id = asString(raw.id);
  const message = asString(raw.message);
  const createdAt = asString(raw.createdAt);
  if (!id || !message || !createdAt) return null;

  const type = mapBackendNotificationType(raw.type);
  return {
    id,
    message,
    icon: mapBackendNotificationIcon(type),
    type,
    timestamp: formatRelativeTime(createdAt),
    read: asBoolean(raw.read, false),
    userName: asString(raw.title, 'THE afterhour socials'),
    action: message,
  };
};

const mapBackendNotificationToSystem = (input: unknown): SystemNotification | null => {
  const raw = asRecord(input);
  if (!raw) return null;

  const id = asString(raw.id);
  const title = asString(raw.title, 'Notification');
  const message = asString(raw.message);
  const createdAt = asString(raw.createdAt);
  if (!id || !message || !createdAt) return null;

  const notificationType = mapBackendNotificationType(raw.type);
  const severity: SystemNotification['type'] =
    notificationType === 'trainer' || notificationType === 'plan'
      ? 'info'
      : notificationType === 'streak'
        ? 'warning'
        : 'info';

  return {
    id,
    title,
    message,
    type: severity,
    timestamp: createdAt,
    read: asBoolean(raw.read, false),
  };
};

const normalizeChatThreads = (input: unknown): ChatThread[] => {
  if (!Array.isArray(input)) return [];

  const normalized = input.flatMap((candidate): ChatThread[] => {
    if (!candidate || typeof candidate !== 'object') return [];
    const raw = candidate as Record<string, unknown>;
    if (typeof raw.id !== 'string') return [];

    const participantIdsFromLegacy = Array.isArray(raw.participantIds)
      ? raw.participantIds.filter((id): id is string => typeof id === 'string')
      : [];
    const participantIdsFromBackend = Array.isArray(raw.participants)
      ? raw.participants
          .map((participant) => asRecord(participant))
          .filter((participant): participant is Record<string, unknown> => Boolean(participant))
          .map((participant) => asString(asRecord(participant.user)?.id || participant.userId))
          .filter((id): id is string => Boolean(id))
      : [];
    const participantIds = participantIdsFromLegacy.length > 0 ? participantIdsFromLegacy : participantIdsFromBackend;
    if (participantIds.length < 2) return [];

    const messages = Array.isArray(raw.messages)
      ? raw.messages.flatMap((message): ChatMessage[] => {
          if (!message || typeof message !== 'object') return [];
          const m = message as Record<string, unknown>;
          const senderId = asString(m.senderId || asRecord(m.sender)?.id);
          if (typeof m.id !== 'string' || !senderId || typeof m.text !== 'string' || typeof m.createdAt !== 'string') {
            return [];
          }

          const seenByFromPayload = Array.isArray(m.seenBy)
            ? m.seenBy.filter((id): id is string => typeof id === 'string')
            : [];
          const seenBy = seenByFromPayload.length > 0 ? seenByFromPayload : [senderId];
          const messageType = m.type === 'voice-note' || m.type === 'reel-share' ? m.type : 'text';

          return [
            {
              id: m.id,
              senderId,
              text: m.text,
              createdAt: m.createdAt,
              type: messageType,
              seenBy,
              voiceSeconds: typeof m.voiceSeconds === 'number' ? m.voiceSeconds : undefined,
              voiceAudioUrl: typeof m.voiceAudioUrl === 'string' ? m.voiceAudioUrl : undefined,
              reelPostId: typeof m.reelPostId === 'string' ? m.reelPostId : undefined,
              reelPreviewUrl: typeof m.reelPreviewUrl === 'string' ? m.reelPreviewUrl : undefined,
              reelCaption: typeof m.reelCaption === 'string' ? m.reelCaption : undefined,
            },
          ];
        })
      : [];

    const unreadByFromLegacy = Array.isArray(raw.unreadBy)
      ? raw.unreadBy.filter((id): id is string => typeof id === 'string')
      : [];
    const unreadByFromBackend = Array.isArray(raw.participants)
      ? raw.participants
          .map((participant) => asRecord(participant))
          .filter((participant): participant is Record<string, unknown> => Boolean(participant))
          .flatMap((participant) => {
            const participantUserId = asString(participant.userId || asRecord(participant.user)?.id);
            const lastRead = asString(participant.lastRead);
            const lastMessageCreatedAt = Array.isArray(raw.messages) && raw.messages.length > 0
              ? asString(asRecord(raw.messages[raw.messages.length - 1])?.createdAt)
              : "";
            if (!participantUserId || !lastRead || !lastMessageCreatedAt) return [];
            return new Date(lastMessageCreatedAt).getTime() > new Date(lastRead).getTime() ? [participantUserId] : [];
          })
      : [];
    const unreadBy = unreadByFromLegacy.length > 0 ? unreadByFromLegacy : unreadByFromBackend;

    return [
      {
        id: raw.id,
        participantIds,
        messages,
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
        unreadBy,
      },
    ];
  });

  return sanitizeChatThreads(normalized);
};

const sanitizeChatThreads = (threads: ChatThread[]): ChatThread[] => {
  return [...threads]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, MAX_CHAT_THREADS)
    .map((thread) => ({
      ...thread,
      messages: thread.messages
        .slice(-MAX_MESSAGES_PER_THREAD)
        .map((message) => {
          if (
            message.type === 'voice-note' &&
            message.voiceAudioUrl &&
            message.voiceAudioUrl.length > MAX_VOICE_DATA_URL_LENGTH
          ) {
            return {
              ...message,
              type: 'text' as const,
              text: '[Voice note omitted: size limit exceeded]',
              voiceAudioUrl: undefined,
              voiceSeconds: undefined,
            };
          }

          return message;
        }),
    }));
};

const readPersistedChats = (
  _users: Record<string, User>,
  fallback: ChatThread[]
): ChatThread[] => {
  return sanitizeChatThreads(fallback);
};

const persistChats = (_threads: ChatThread[]) => {};

const clonePermissions = (source: PermissionMatrix): PermissionMatrix => ({
  student: { ...source.student },
  trainer: { ...source.trainer },
  admin: { ...fullAdminPermissions },
});

const enforceAdminFullAccess = (permissions: PermissionMatrix): PermissionMatrix => ({
  student: { ...permissions.student },
  trainer: { ...permissions.trainer },
  admin: { ...fullAdminPermissions },
});

const readPersistedPermissions = (): PermissionMatrix => {
  return clonePermissions(defaultPermissions);
};

const persistPermissions = (permissions: PermissionMatrix) => {
  // Disabled intentionally: permissions should not be treated as client-persisted trust state.
  void permissions;
};

const readPersistedUsers = (baseUsers: Record<string, User>): Record<string, User> => {
  return baseUsers;
};

const persistUsers = (_users: Record<string, User>) => {};

const readPersistedSession = (_users: Record<string, User>): AppState['session'] => {
  try {
    const storage = getLocalStorage();
    if (storage) {
      const stored = storage.getItem(SESSION_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    }
  } catch (e) {
    // Silently fail - storage unavailable, will use in-memory state
  }
  return { currentUser: null, isAuthenticated: false };
};

const persistSession = (session: AppState['session']) => {
  try {
    const storage = getLocalStorage();
    if (storage) storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    // Silently fail - storage unavailable
  }
};

const readPersistedDashboardData = (): Partial<AppState['system']> => {
  try {
    const storage = getLocalStorage();
    if (storage) {
      const stored = storage.getItem(DASHBOARD_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    }
  } catch (e) {
    // Silently fail - storage unavailable
  }
  return {};
};

const persistDashboardData = (system: AppState['system']) => {
  try {
    const storage = getLocalStorage();
    if (storage) {
      storage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify({
        progressOverview: system.progressOverview,
        progressWeekly: system.progressWeekly,
        progressMonthly: system.progressMonthly,
        progressHeatmap: system.progressHeatmap,
        leaderboardEntries: system.leaderboardEntries,
        studentTodayPlan: system.studentTodayPlan,
      }));
    }
  } catch (e) {
    // Silently fail - storage unavailable
  }
};

const clearPersistedSecurityState = () => {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(SESSION_STORAGE_KEY);
    storage.removeItem(USERS_STORAGE_KEY);
    storage.removeItem(CHAT_STORAGE_KEY);
    storage.removeItem(PERMISSIONS_STORAGE_KEY);
    storage.removeItem(DASHBOARD_STORAGE_KEY);
  } catch (error) {
    reportStorageIssue('clearPersistedSecurityState', error);
  }
};

const initialUsers = readPersistedUsers({});

const initialSession = readPersistedSession(initialUsers);
const initialDashboardData = readPersistedDashboardData();

// ========= INITIAL STATE =========
const initialState: AppState = {
  users: initialUsers,
  posts: {},
  plans: {},
  system: {
    notifications: [],
    activityLogs: [],
    appVersion: {
      version: '1.0.0',
      releaseDate: '2026-04-07',
      notes: 'Initial release of the new architecture.',
    },
    isLoading: false,
    permissions: readPersistedPermissions(),
    legacyTodayTask: cloneTodayTask(),
    legacySubmissions: [],
    legacyNotifications: [],
    planUpdateNotifications: [],
    chatThreads: readPersistedChats(initialUsers, []),
    events: [],
    progressOverview: initialDashboardData.progressOverview ?? null,
    progressWeekly: initialDashboardData.progressWeekly ?? [],
    progressMonthly: initialDashboardData.progressMonthly ?? [],
    progressHeatmap: initialDashboardData.progressHeatmap ?? [],
    leaderboardEntries: initialDashboardData.leaderboardEntries ?? [],
    progressLoading: false,
    studentTodayPlan: initialDashboardData.studentTodayPlan ?? null,
    planLoading: false,
  },
  session: initialSession,
};

// ========= ZUSTAND STORE CREATION =========
export const useAppStore = create<AppState & AppActions>((set, get) => ({
  ...initialState,

  // --- ACTIONS ---

  // Session
  login: async (email, password, role) => {
    try {
      set((state) => ({ system: { ...state.system, isLoading: true } }));

      await loginBackend(email, password);
      const userProfile = await fetchCurrentUser();
      const userRecord = asRecord(userProfile);
      const userId = asString(userRecord?.id);
      const normalizedUser = normalizeBackendUser(userProfile, userId ? get().users[userId] : undefined);
      if (!normalizedUser) {
        set((state) => ({ system: { ...state.system, isLoading: false } }));
        return false;
      }

      if (role && normalizedUser.role !== role) {
        try {
          await logoutBackend();
        } catch {
          // noop
        }
        clearBackendAccessToken();
        set((state) => ({
          ...state,
          system: { ...state.system, isLoading: false },
          session: { currentUser: null, isAuthenticated: false },
        }));
        return false;
      }

      set((state) => ({
        ...state,
        system: { ...state.system, isLoading: false },
        session: { currentUser: normalizedUser, isAuthenticated: true },
        users: { ...state.users, [normalizedUser.id]: normalizedUser },
      }));

      void get().refreshData({
        background: true,
        scope: getRefreshScopeForRole(normalizedUser.role),
      });
      return true;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { feature: "auth-login" },
        extra: { email },
      });
      set((state) => ({ system: { ...state.system, isLoading: false } }));
      return false;
    }
  },
  logout: async () => {
    try {
      await logoutBackend();
    } catch (error) {
      Sentry.captureMessage('Backend logout failed - clearing local session anyway', "warning");
    } finally {
      clearBackendAccessToken();
      set((state) => {
        clearPersistedSecurityState();
        return {
          ...state,
          session: { currentUser: null, isAuthenticated: false },
        };
      });
    }
  },
  initializeSession: async () => {
    try {
      set((state) => ({ system: { ...state.system, isLoading: true } }));
      const userProfile = await fetchCurrentUser();
      const userRecord = asRecord(userProfile);
      const userId = asString(userRecord?.id);
      const normalizedUser = normalizeBackendUser(userProfile, userId ? get().users[userId] : undefined);

      if (!normalizedUser) {
        clearBackendAccessToken();
        set((state) => ({
          ...state,
          system: { ...state.system, isLoading: false },
          session: { currentUser: null, isAuthenticated: false },
        }));
        return;
      }

      set((state) => ({
        ...state,
        system: {
          ...state.system,
          isLoading: false,
        },
        session: { currentUser: normalizedUser, isAuthenticated: true },
        users: { ...state.users, [normalizedUser.id]: normalizedUser },
      }));
      void get().refreshData({ background: true });
    } catch {
      clearBackendAccessToken();
      set((state) => ({
        ...state,
        system: { ...state.system, isLoading: false },
        session: { currentUser: null, isAuthenticated: false },
      }));
    }
  },
  signup: async (userData) => {
    try {
      set((state) => ({ system: { ...state.system, isLoading: true } }));

      await signupBackend({
        name: userData.name,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        password: userData.password,
        role: userData.role.toUpperCase(),
        collegeId: userData.collegeId,
        height: userData.height,
        weight: userData.weight,
        fitnessGoal: userData.fitnessGoal,
        specialization: userData.specialization,
        whatsappNumber: userData.whatsappNumber,
        experience: userData.experience,
        certifications: userData.certifications,
      });

      const userProfile = await fetchCurrentUser();
      const userRecord = asRecord(userProfile);
      const userId = asString(userRecord?.id);
      const normalizedUser = normalizeBackendUser(userProfile, userId ? get().users[userId] : undefined);
      if (!normalizedUser) {
        throw new Error('Could not hydrate newly created user');
      }

      set((state) => ({
        ...state,
        system: { ...state.system, isLoading: false },
        session: { currentUser: normalizedUser, isAuthenticated: true },
        users: { ...state.users, [normalizedUser.id]: normalizedUser },
      }));

      void get().refreshData({
        background: true,
        scope: getRefreshScopeForRole(normalizedUser.role),
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { feature: "auth-signup" },
        extra: { email: userData.email },
      });
      set((state) => ({ system: { ...state.system, isLoading: false } }));
      throw error;
    }
  },

  // Data Loading
  setLoading: (isLoading) =>
    set((state) => ({
      ...state,
      system: { ...state.system, isLoading },
    })),

  // Posts
  toggleLike: async (postId: string) => {
    const state = get();
    const post = state.posts[postId];
    if (!post) return;
    
    const liked = !post.liked;
    set((state) => ({
      posts: {
        ...state.posts,
        [postId]: { ...post, liked, likes: liked ? post.likes + 1 : post.likes - 1 }
      }
    }));

    try {
      if (liked) {
        await likePostAPI(postId);
      } else {
        await unlikePostAPI(postId);
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "like_post" } });
      if (import.meta.env.MODE !== "test") {
        toast.error("Failed to like post");
      }
      set((state) => ({
        posts: {
          ...state.posts,
          [postId]: post
        }
      }));
    }
  },

  updatePostStatus: async (postId, status) => {
    const previous = get().posts[postId]?.status;
    if (!previous) return;
    try {
      set((state) => ({
        posts: {
          ...state.posts,
          [postId]: { ...state.posts[postId], status }
        }
      }));
      await updatePostModerationAPI(postId, status);
      await get().refreshData();
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "update_post_status" } });
      toast.error("Failed to update status");
      set((state) => ({
        posts: {
          ...state.posts,
          [postId]: { ...state.posts[postId], status: previous }
        }
      }));
    }
  },


  // Users
  updateProfile: async (payload) => {
    try {
      await updateProfileAPI(payload);
      await get().refreshData();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { feature: "profile-update" },
      });
    }
  },

  updateUser: (userId, data) =>
    set((state) => {
      const user = state.users[userId];
      if (!user) return state;
      const updatedUser = { ...user, ...data };
      const newUsers = { ...state.users, [userId]: updatedUser };
      
      let nextSessionUser = state.session.currentUser;
      if (nextSessionUser?.id === userId) {
        nextSessionUser = updatedUser as User;
      }
      
      return { ...state, users: newUsers, session: { ...state.session, currentUser: nextSessionUser } };
    }),

  banUser: async (userId) => {
    try {
      await toggleUserBanAPI(userId);
      await get().refreshData();
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "ban_user" }, extra: { userId } });
      toast.error("Failed to toggle user ban");
    }
  },

  bulkDeleteUsers: async (userIds) => {
    try {
      await bulkDeleteUsersAPI(userIds);
      
      // Eagerly purge deleted users, posts, and leaderboard entries from local state
      set((state) => {
        const nextUsers = { ...state.users };
        const nextPosts = { ...state.posts };
        
        userIds.forEach((id) => { delete nextUsers[id]; });
        Object.keys(nextPosts).forEach((postId) => {
          if (userIds.includes(nextPosts[postId].userId)) {
            delete nextPosts[postId];
          }
        });
        const nextLeaderboard = state.system.leaderboardEntries.filter(
          (entry) => !userIds.includes(entry.userId)
        );

        return {
          ...state,
          users: nextUsers,
          posts: nextPosts,
          system: {
            ...state.system,
            leaderboardEntries: nextLeaderboard,
          }
        };
      });

      await get().refreshData();
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "bulk_delete_users" }, extra: { count: userIds.length } });
      toast.error("Failed to delete users");
      throw error;
    }
  },


  verifyTrainer: async (trainerId) => {
    try {
      await verifyTrainerAPI(trainerId);
      await get().refreshData();
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "verify_trainer" }, extra: { userId } });
      toast.error("Failed to verify trainer");
    }
  },
  
  followUser: async (userId) => {
    try {
      await followUserAPI(userId);
      set((state) => {
        const actor = state.session.currentUser;
        if (!actor) return state;
        const actorId = actor.id;
        const target = state.users[userId];
        
        const nextUsers = { ...state.users };
        if (target) {
          nextUsers[userId] = { ...target, followers: (target.followers || 0) + 1 };
        }
        
        let nextSession = state.session;
        if (actor.role === 'student') {
           const studentActor = actor as Student;
           const updatedActor: Student = { ...studentActor, following: (studentActor.following || 0) + 1 };
           nextUsers[actorId] = updatedActor;
           nextSession = { ...state.session, currentUser: updatedActor };
        }

        return { ...state, users: nextUsers, session: nextSession };
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { feature: "follow" },
        extra: { targetUserId },
      });
    }
  },

  unfollowUser: async (userId) => {
    try {
      await unfollowUserAPI(userId);
      set((state) => {
        const actor = state.session.currentUser;
        if (!actor) return state;
        const actorId = actor.id;
        const target = state.users[userId];
        
        const nextUsers = { ...state.users };
        if (target) {
          nextUsers[userId] = { ...target, followers: Math.max(0, (target.followers || 0) - 1) };
        }
        
        let nextSession = state.session;
        if (actor.role === 'student') {
           const studentActor = actor as Student;
           const updatedActor: Student = { ...studentActor, following: Math.max(0, (studentActor.following || 0) - 1) };
           nextUsers[actorId] = updatedActor;
           nextSession = { ...state.session, currentUser: updatedActor };
        }

        return { ...state, users: nextUsers, session: nextSession };
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { feature: "unfollow" },
        extra: { targetUserId },
      });
    }
  },

  createPlan: async ({ title, duration, goalType, difficulty, studentIds }) => {
    try {
      set((state) => ({ system: { ...state.system, isLoading: true } }));
      await createPlanAPI({ name: title, duration, goalType, difficulty, studentIds });
      await get().refreshData({ background: true });
      set((state) => ({ system: { ...state.system, isLoading: false } }));
    } catch (error) {
      Sentry.captureException(error, {
        tags: { feature: "plan-creation" },
      });
      set((state) => ({ system: { ...state.system, isLoading: false } }));
      throw error;
    }
  },


  saveOnboardingDraft: async (studentId, payload, step) => {
    try {
      await updateProfileAPI({ onboardingDraft: payload, onboardingStep: step });
      // update local immediately for UI responsiveness
      set((state) => {
        const user = state.users[studentId];
        if (!user || user.role !== 'student') return state;
        const student = user as Student;
        const updatedStudent: Student = {
          ...student,
          onboardingDraft: payload,
          onboardingStep: step,
          onboardingStatus: 'in_progress',
        };
        return {
           ...state,
           users: { ...state.users, [studentId]: updatedStudent },
           session: state.session.currentUser?.id === studentId ? { ...state.session, currentUser: updatedStudent } : state.session
        };
      });
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "save_draft" } });
      toast.error("Failed to save draft");
    }
  },

  completeOnboardingAndGeneratePlan: async (studentId, payload) => {
    try {
      set((state) => ({ system: { ...state.system, isLoading: true } }));
      
      // 1. Mark onboarding as completed
      await updateProfileAPI({ 
        onboardingCompleted: true, 
        onboardingDraft: payload, 
        onboardingStep: 6,
      });

      // Keep local session consistent immediately so route guards do not bounce back.
      set((state) => {
        const user = state.users[studentId];
        if (!user || user.role !== 'student') return state;
        const student = user as Student;
        const updatedStudent: Student = {
          ...student,
          onboardingDraft: payload,
          onboardingStep: 6,
          onboardingStatus: 'completed',
        };
        return {
          ...state,
          users: { ...state.users, [studentId]: updatedStudent },
          session: state.session.currentUser?.id === studentId
            ? { ...state.session, currentUser: updatedStudent }
            : state.session,
        };
      });

      await generatePersonalizedPlanAPI();

      await get().refreshData();
      set((state) => ({ system: { ...state.system, isLoading: false } }));
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "complete_onboarding" } });
      toast.error("Failed to complete onboarding");
      set((state) => ({ system: { ...state.system, isLoading: false } }));
      throw error;
    }
  },

  reviewAutoGeneratedPlan: (planId, decision, feedback) =>
    set((state) => {
      const plan = state.plans[planId];
      if (!plan || plan.type !== 'auto_generated') return state;

      const nextStatus: PlanStatus = decision === 'approve' ? 'active' : 'rejected';
      const updatedPlan: Plan = {
        ...plan,
        status: nextStatus,
        reviewFeedback: feedback,
        reviewedAt: new Date().toISOString(),
        reviewedByTrainerId: state.session.currentUser?.role === 'trainer' ? state.session.currentUser.id : undefined,
      };

      const log: ActivityLog = {
        id: createId('log-plan-review'),
        userId: state.session.currentUser?.id ?? 'system',
        action: decision === 'approve' ? 'auto-plan-approved' : 'auto-plan-rejected',
        timestamp: new Date().toISOString(),
        details: {
          planId,
          feedback: feedback ?? '',
        },
      };

      let nextUsers = state.users;
      let nextSessionUser = state.session.currentUser;
      let newNotif: NotificationItem | undefined;

      // Find the student whose currentPlanId is planId
      const student = Object.values(nextUsers).find((u) => u.role === 'student' && (u as Student).currentPlanId === planId) as Student | undefined;

      if (decision === 'approve' && nextSessionUser?.role === 'trainer' && student) {
        const trainer = nextSessionUser as Trainer;
          
        const updatedStudent: Student = {
          ...student,
          onboardingStatus: 'completed',
        };
          
        const updatedTrainer: Trainer = {
          ...trainer,
          activePlans: trainer.activePlans + 1,
        };

        nextUsers = {
          ...nextUsers,
          [student.id]: updatedStudent,
          [trainer.id]: updatedTrainer,
        };
        nextSessionUser = updatedTrainer;
      }

      if (student) {
        newNotif = {
          id: createId('notif-plan'),
          message: decision === 'approve' ? `Your plan was approved and is now active!` : `Your plan was rejected. Feedback: ${feedback}`,
          icon: decision === 'approve' ? 'check-circle' : 'x-circle',
          type: 'plan',
          userName: 'Trainer',
          action: decision === 'approve' ? 'approved your plan' : 'rejected your plan',
          timestamp: 'Just now',
          read: false,
        };
      }

      const systemPlanNotif: SystemNotification | null = student
        ? {
            id: createId('sys-plan-review'),
            title: decision === 'approve' ? 'Plan Approved' : 'Plan Rejected',
            message:
              decision === 'approve'
                ? `Your trainer approved your plan and it is now active.`
                : `Your trainer rejected your plan. ${feedback ? `Feedback: ${feedback}` : 'Review feedback is available.'}`,
            type: decision === 'approve' ? 'info' : 'warning',
            timestamp: new Date().toISOString(),
            read: false,
          }
        : null;

      return {
        ...state,
        users: nextUsers,
        session: { ...state.session, currentUser: nextSessionUser },
        plans: {
          ...state.plans,
          [planId]: updatedPlan,
        },
        system: {
          ...state.system,
          activityLogs: [log, ...state.system.activityLogs],
          notifications: systemPlanNotif
            ? [systemPlanNotif, ...state.system.notifications]
            : state.system.notifications,
          legacyNotifications: newNotif ? [newNotif, ...state.system.legacyNotifications] : state.system.legacyNotifications,
        },
      };
    }),

  editAutoGeneratedPlanDay: (planId, week, day, updates) =>
    set((state) => {
      const plan = state.plans[planId];
      if (!plan || !plan.weeks) return state;

      const updatedPlan: Plan = {
        ...plan,
        weeks: plan.weeks.map((weekItem) => {
          if (weekItem.week !== week) return weekItem;
          return {
            ...weekItem,
            days: weekItem.days.map((dayItem) => {
              if (dayItem.day !== day) return dayItem;
              return {
                ...dayItem,
                ...updates,
              };
            }),
          };
        }),
      };

      return {
        ...state,
        plans: {
          ...state.plans,
          [planId]: updatedPlan,
        },
      };
    }),

  assignTrainer: async (studentId, trainerId) => {
    const previousUser = get().users[studentId];
    try {
      // Optimistic update so the admin table feels instant.
      set((state) => {
        const user = state.users[studentId];
        if (!user || user.role !== 'student') return state;
        return {
          ...state,
          users: {
            ...state.users,
            [studentId]: {
              ...user,
              trainerId,
            } as Student,
          },
        };
      });

      await assignStudentTrainerAdminAPI(studentId, trainerId);

      const adminUsers = await fetchAdminUsersAPI();
      set((state) => {
        const nextUsers = { ...state.users };
        adminUsers.forEach((u) => {
          nextUsers[u.id] = u;
        });
        return {
          ...state,
          users: nextUsers,
        };
      });
    } catch (err) {
      // Revert on failure.
      if (previousUser) {
        set((state) => ({
          ...state,
          users: { ...state.users, [studentId]: previousUser },
        }));
      }
      toast.error('Failed to assign trainer');
      Sentry.captureException(err, { tags: { action: "assign_trainer" } });
      toast.error("Failed to assign trainer");
    }
  },

  createAccount: async (payload) => {
    set((state) => ({ ...state, system: { ...state.system, isLoading: true } }));
    try {
      await createAdminAccountAPI(payload);
      const adminUsers = await fetchAdminUsersAPI();
      set((state) => {
        const nextUsers = { ...state.users };
        adminUsers.forEach((u) => {
          nextUsers[u.id] = u;
        });
        return {
          ...state,
          users: nextUsers,
          system: { ...state.system, isLoading: false },
        };
      });
      toast.success('Account created successfully');
    } catch (err) {
      set((state) => ({ ...state, system: { ...state.system, isLoading: false } }));
      toast.error('Failed to create account');
      Sentry.captureException(err, { tags: { action: "create_account" } });
      toast.error("Failed to create account");
      throw err;
    }
  },

  // Task submission approval flow
  approveTaskSubmission: async (submissionId, note, awardedPoints) => {
    const previousSubmissions = get().system.legacySubmissions;
    set((state) => ({
      ...state,
      system: {
        ...state.system,
        legacySubmissions: state.system.legacySubmissions.map((submission) =>
          submission.id === submissionId
            ? {
                ...submission,
                status: 'approved',
                trainerNote: note ?? submission.trainerNote,
              }
            : submission
        ),
      },
    }));

    try {
      await approveSubmissionAPI(submissionId, note || "", awardedPoints);
      await get().fetchSubmissions();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/already reviewed/i.test(message)) {
        await get().fetchSubmissions();
        return;
      }
      Sentry.captureException(error, { tags: { action: "approve_submission" } });
      toast.error("Failed to approve submission");
      set((state) => ({
        ...state,
        system: {
          ...state.system,
          legacySubmissions: previousSubmissions,
        },
      }));
      throw error;
    }
  },

  rejectTaskSubmission: async (submissionId, note) => {
    const previousSubmissions = get().system.legacySubmissions;
    set((state) => ({
      ...state,
      system: {
        ...state.system,
        legacySubmissions: state.system.legacySubmissions.map((submission) =>
          submission.id === submissionId
            ? {
                ...submission,
                status: 'rejected',
                trainerNote: note,
              }
            : submission
        ),
      },
    }));

    try {
      await rejectSubmissionAPI(submissionId, note);
      await get().fetchSubmissions();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/already reviewed/i.test(message)) {
        await get().fetchSubmissions();
        return;
      }
      Sentry.captureException(error, { tags: { action: "reject_submission" } });
      toast.error("Failed to reject submission");
      set((state) => ({
        ...state,
        system: {
          ...state.system,
          legacySubmissions: previousSubmissions,
        },
      }));
      throw error;
    }
  },


  submitTaskProof: async ({ taskId, taskType, dayNumber, taskName, studentNote }) => {
    const actor = get().session.currentUser;
    const optimisticId = createId('sub-local');
    const previousSubmissions = get().system.legacySubmissions;

    if (actor?.role === 'student') {
      set((state) => ({
        ...state,
        system: {
          ...state.system,
          legacySubmissions: [
            {
              id: optimisticId,
              studentId: actor.id,
              studentName: actor.name,
              taskName,
              taskType,
              taskId,
              dayNumber,
              proofRefId: `PENDING-${optimisticId}`,
              timestamp: new Date().toLocaleString(),
              status: 'pending',
              mediaUrl: 'whatsapp://proof/pending',
              trainerNote: '',
              points: 10,
              requiresApproval: true,
            },
            ...state.system.legacySubmissions,
          ],
        },
      }));
    }

    try {
      const created = await submitTaskAPI({
        planTaskId: taskId,
        studentNote: studentNote?.trim() || undefined,
      });
      await get().refreshData({ background: true, scope: getRefreshScopeForRole(get().session.currentUser?.role) });
      return {
        whatsappUrl: typeof created.whatsappUrl === 'string' ? created.whatsappUrl : undefined,
        proofRefId: typeof created.proofRefId === 'string' ? created.proofRefId : undefined,
        isRepeatCheckin: Boolean(created.isRepeatCheckin),
        supersededPendingCount:
          typeof created.supersededPendingCount === 'number' ? created.supersededPendingCount : undefined,
      };
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "submit_task" } });
      toast.error("Failed to submit task");
      set((state) => ({
        ...state,
        system: {
          ...state.system,
          legacySubmissions: previousSubmissions,
        },
      }));
      throw error;
    }
  },

  resendTaskProof: async ({ taskId }) => {
    const resent = await resendTaskProofAPI({ planTaskId: taskId });
    return {
      whatsappUrl: typeof resent.whatsappUrl === 'string' ? resent.whatsappUrl : undefined,
      proofRefId: typeof resent.proofRefId === 'string' ? resent.proofRefId : undefined,
    };
  },

  markSubmissionWhatsAppReceived: async (submissionId) => {
    const previous = get().system.legacySubmissions;

    set((state) => ({
      ...state,
      system: {
        ...state.system,
        legacySubmissions: state.system.legacySubmissions.map((submission) =>
          submission.id === submissionId
            ? {
                ...submission,
                whatsappReceived: true,
                whatsappReceivedAt: new Date().toISOString(),
              }
            : submission
        ),
      },
    }));

    try {
      await markSubmissionWhatsAppReceivedAPI(submissionId);
      await get().fetchSubmissions();
    } catch (error) {
      set((state) => ({
        ...state,
        system: {
          ...state.system,
          legacySubmissions: previous,
        },
      }));
      throw error;
    }
  },

  fetchSubmissions: async () => {
    try {
      const remoteSubmissions = await fetchSubmissionsAPI();
      
      const mapped: LegacySubmission[] = remoteSubmissions.map((s) => {
        const normalizedTaskType = isLegacyTaskType(s.planTask?.type)
          ? s.planTask.type
          : 'workout';
        const normalizedStatusRaw = s.status.toLowerCase();
        const normalizedStatus = isLegacySubmissionStatus(normalizedStatusRaw)
          ? normalizedStatusRaw
          : 'pending';
        const receivedMatch = typeof s.trainerNote === 'string'
          ? s.trainerNote.match(/WhatsApp received at:\s*([^\n]+)/i)
          : null;
        const receivedAt = receivedMatch?.[1]?.trim();
        const pendingAgeMs = Date.now() - new Date(s.createdAt).getTime();

        return {
          id: s.id,
          studentId: s.studentId,
          studentName: s.student?.name || 'Unknown',
          taskName: s.planTask?.title || s.planTask?.name || 'Custom Task',
          taskType: normalizedTaskType,
          taskId: typeof s.planTaskId === 'string' ? s.planTaskId : undefined,
          status: normalizedStatus,
          mediaUrl: s.mediaUrl,
          proofRefId: extractWhatsAppProofRef(s.mediaUrl),
          timestamp: new Date(s.createdAt).toLocaleString(),
          points: s.planTask?.points || 10,
          trainerNote: s.trainerNote ?? '',
          requiresApproval: true,
          whatsappReceivedAt: receivedAt,
          whatsappReceived: Boolean(receivedAt),
          pendingAgeHours: normalizedStatus === 'pending' && Number.isFinite(pendingAgeMs)
            ? Math.max(0, Math.floor(pendingAgeMs / (1000 * 60 * 60)))
            : undefined,
        };
      });

      const pendingCounters = new Map<string, number>();
      const pendingSeen = new Map<string, number>();

      mapped.forEach((submission) => {
        if (submission.status !== 'pending') return;
        const key = `${submission.studentId}:${submission.taskId ?? submission.taskName}:${submission.taskType ?? 'workout'}`;
        pendingCounters.set(key, (pendingCounters.get(key) ?? 0) + 1);
      });

      const withPendingLabels: LegacySubmission[] = mapped.map((submission) => {
        if (submission.status !== 'pending') return submission;
        const key = `${submission.studentId}:${submission.taskId ?? submission.taskName}:${submission.taskType ?? 'workout'}`;
        const count = pendingCounters.get(key) ?? 0;
        if (count <= 1) return submission;

        const seen = pendingSeen.get(key) ?? 0;
        pendingSeen.set(key, seen + 1);
        const isLatest = seen === 0;

        const labelValue = isLatest ? 'latest' : 'old';

        return {
          ...submission,
          pendingCheckinLabel: labelValue as 'latest' | 'old',
        };
      });

      set((state) => ({
        system: {
          ...state.system,
          legacySubmissions: withPendingLabels
        }
      }));
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "fetch_submissions" } });
      toast.error("Failed to load submissions");
    }
  },


  notifyStudentPlanUpdated: (studentId, planId, message) =>
    set((state) => {
      const trainerUser = state.session.currentUser;
      const trainerName = trainerUser?.name ?? 'Your Trainer';
      const notif: PlanUpdateNotification = {
        id: createId('plan-notif'),
        studentId,
        trainerId: trainerUser?.id ?? '',
        trainerName,
        planId,
        message,
        timestamp: new Date().toISOString(),
        read: false,
      };
      // Also add to legacyNotifications for student
      const legacyNotif: NotificationItem = {
        id: notif.id,
        message: `${trainerName} updated your plan: ${message}`,
        icon: 'clipboard',
        type: 'plan',
        userName: trainerName,
        action: `updated your plan`,
        timestamp: 'Just now',
        read: false,
      };

      const systemNotif: SystemNotification = {
        id: createId('sys-plan-update'),
        title: 'Plan Updated',
        message: `${trainerName} updated your plan. ${message}`,
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false,
      };
      return {
        ...state,
        system: {
          ...state.system,
          notifications: [systemNotif, ...state.system.notifications],
          planUpdateNotifications: [notif, ...state.system.planUpdateNotifications],
          legacyNotifications: [legacyNotif, ...state.system.legacyNotifications],
        },
      };
    }),

  createOrGetChatThread: (targetUserId) => {
    const state = get();
    const actor = state.session.currentUser;
    if (!actor) return null;
    if (!state.users[targetUserId] || targetUserId === actor.id) return null;

    const participants = [actor.id, targetUserId].sort();
    const existing = state.system.chatThreads.find(
      (thread) =>
        thread.participantIds.length === 2 &&
        thread.participantIds[0] === participants[0] &&
        thread.participantIds[1] === participants[1]
    );

    if (existing) {
      return existing.id;
    }

    void createChatThreadAPI(targetUserId)
      .then((created) => {
        const normalized = normalizeChatThreads([created]);
        if (normalized.length === 0) {
          void get().refreshData({ background: true, scope: getRefreshScopeForRole(get().session.currentUser?.role) });
          return;
        }

        set((state) => ({
          ...state,
          system: {
            ...state.system,
            chatThreads: sanitizeChatThreads([...normalized, ...state.system.chatThreads]),
          },
        }));
      })
      .catch((error) => {
        Sentry.captureException(error, { tags: { action: "create_chat_thread" } });
        toast.error("Failed to create chat thread");
      });

    return null;
  },

  sendChatMessage: async ({ threadId, recipientId, text, type, reelPostId, voiceSeconds, voiceAudioUrl }) => {
    try {
      const actor = get().session.currentUser;
      if (!actor) return;
      const normalizedType: 'text' | 'reel-share' | 'voice-note' =
        voiceAudioUrl
          ? 'voice-note'
          : reelPostId
            ? 'reel-share'
            : type === 'voice-note' || type === 'reel-share'
              ? type
              : 'text';
      const trimmedText = (text ?? '').trim();

      if (normalizedType === 'text' && !trimmedText) return;

      let activeThreadId = threadId;
      if (!activeThreadId && recipientId) {
        const created = await createChatThreadAPI(recipientId);
        activeThreadId = typeof created.id === 'string' ? created.id : undefined;
        const normalizedThread = normalizeChatThreads([created]);
        if (normalizedThread.length > 0) {
          set((state) => ({
            ...state,
            system: {
              ...state.system,
              chatThreads: sanitizeChatThreads([...normalizedThread, ...state.system.chatThreads]),
            },
          }));
        }
      }
      if (!activeThreadId) return;

      const reelPost = reelPostId ? get().posts[reelPostId] : undefined;
      const payloadText =
        trimmedText ||
        (normalizedType === 'voice-note'
          ? 'Voice note'
          : normalizedType === 'reel-share'
            ? 'Shared a reel'
            : '');

      const optimisticMessageId = createId('msg-local');
      const nowIso = new Date().toISOString();
      set((state) => {
        const existingThread = state.system.chatThreads.find((thread) => thread.id === activeThreadId);
        const optimisticMessage: ChatMessage = {
          id: optimisticMessageId,
          senderId: actor.id,
          text: payloadText,
          createdAt: nowIso,
          type: normalizedType,
          seenBy: [actor.id],
          voiceSeconds,
          voiceAudioUrl,
          reelPostId,
          reelPreviewUrl: reelPostId ? state.posts[reelPostId]?.mediaUrl : undefined,
          reelCaption: reelPostId ? state.posts[reelPostId]?.caption : undefined,
        };

        const nextThread: ChatThread = existingThread
          ? {
              ...existingThread,
              updatedAt: nowIso,
              unreadBy: existingThread.participantIds.filter((id) => id !== actor.id),
              messages: [...existingThread.messages, optimisticMessage],
            }
          : {
              id: activeThreadId,
              participantIds: recipientId ? [actor.id, recipientId].sort() : [actor.id],
              messages: [optimisticMessage],
              updatedAt: nowIso,
              unreadBy: recipientId ? [recipientId] : [],
            };

        return {
          ...state,
          system: {
            ...state.system,
            chatThreads: sanitizeChatThreads([
              nextThread,
              ...state.system.chatThreads.filter((thread) => thread.id !== nextThread.id),
            ]),
          },
        };
      });
      
      await sendChatMessageAPI(activeThreadId, {
        text: payloadText,
        type: normalizedType,
        voiceSeconds,
        voiceAudioUrl,
        reelPostId,
        reelPreviewUrl: reelPost?.mediaUrl,
        reelCaption: reelPost?.caption,
      });

      void get().refreshData({ background: true, scope: getRefreshScopeForRole(get().session.currentUser?.role) });
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "send_chat_message" } });
      toast.error("Failed to send message");
      void get().refreshData({ background: true, scope: getRefreshScopeForRole(get().session.currentUser?.role) });
    }
  },

  markChatThreadRead: async (threadId) => {
    const actorId = get().session.currentUser?.id;
    if (!actorId) return;

    set((state) => ({
      ...state,
      system: {
        ...state.system,
        chatThreads: state.system.chatThreads.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                unreadBy: thread.unreadBy.filter((id) => id !== actorId),
                messages: thread.messages.map((message) =>
                  message.seenBy.includes(actorId)
                    ? message
                    : { ...message, seenBy: [...message.seenBy, actorId] }
                ),
              }
            : thread
        ),
      },
    }));

    // Current backend doesn't have a markRead endpoint for chat yet.
    try {
      await get().refreshData({ background: true, scope: getRefreshScopeForRole(get().session.currentUser?.role) });
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "mark_message_read" } });
      toast.error("Failed to mark message as read");
    }
  },


  markPlanNotificationRead: (notificationId) =>
    set((state) => ({
      ...state,
      system: {
        ...state.system,
        planUpdateNotifications: state.system.planUpdateNotifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        legacyNotifications: state.system.legacyNotifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
      },
    })),

  // System
  dismissNotification: (notificationId) =>
    set((state) => ({
      ...state,
      system: {
        ...state.system,
        notifications: state.system.notifications.filter(
          (n) => n.id !== notificationId
        ),
      },
    })),

  setRolePermission: async (role, permission, allowed) => {
    if (role === 'admin') {
      return;
    }

    const roleApi = role.toUpperCase() as 'STUDENT' | 'TRAINER' | 'ADMIN';
    const response = await setAdminPermissionAPI(roleApi, permission, allowed);

    set((state) => {
      const previous = state.system.permissions[role][permission];
      const nextPermissions = mapBackendPermissions(response, state.system.permissions);

      const log: ActivityLog = {
        id: createId('log-permission-change'),
        userId: state.session.currentUser?.id ?? 'system',
        action: 'permission-change',
        timestamp: new Date().toISOString(),
        details: { role, permission, from: previous, to: allowed },
      };

      return {
        ...state,
        system: {
          ...state.system,
          permissions: nextPermissions,
          activityLogs: [log, ...state.system.activityLogs],
        },
      };
    });
  },

  resetPermissions: async () => {
    const response = await resetAdminPermissionsAPI();

    set((state) => {
      const nextPermissions = mapBackendPermissions(response, state.system.permissions);

      const log: ActivityLog = {
        id: createId('log-permissions-reset'),
        userId: state.session.currentUser?.id ?? 'system',
        action: 'permissions-reset',
        timestamp: new Date().toISOString(),
        details: { reason: 'manual-reset' },
      };

      return {
        ...state,
        system: {
          ...state.system,
          permissions: nextPermissions,
          activityLogs: [log, ...state.system.activityLogs],
        },
      };
    });
  },

  // Events CRUD
  createEvent: async (eventData: Omit<AHGEvent, 'id' | 'createdAt' | 'entries'>) => {
    try {
      await createEventAPI(eventData);
      await get().refreshData();
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "create_event" } });
      toast.error("Failed to create event");
    }
  },

  updateEvent: async (eventId: string, updates: Partial<AHGEvent>) => {
    try {
      await updateEventAPI(eventId, updates);
      await get().refreshData();
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "update_event" } });
      toast.error("Failed to update event");
    }
  },

  deleteEvent: async (eventId: string) => {
    try {
      await deleteEventAPI(eventId);
      await get().refreshData();
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "delete_event" } });
      toast.error("Failed to delete event");
    }
  },


  registerForEvent: async (eventId: string) => {
    try {
      await registerForEventAPI(eventId);
      await get().refreshData();
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "register_event" } });
      toast.error("Failed to register for event");
    }
  },


  submitEventEntry: async (eventId: string, responses: Record<string, string | string[]>) => {
    try {
      await registerForEventAPI(eventId, responses);
      await get().refreshData();
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "submit_event_entry" } });
      toast.error("Failed to submit event entry");
    }
  },


  refreshData: async (options) => {
    const background = Boolean(options?.background);
    const nowTs = Date.now();
    if (background) {
      if (isBackgroundRefreshInFlight) {
        return;
      }
      if (nowTs - lastBackgroundRefreshAt < BACKGROUND_REFRESH_MIN_INTERVAL_MS) {
        return;
      }
      isBackgroundRefreshInFlight = true;
    }

    const role = get().session.currentUser?.role;
    const requestedScope = options?.scope;
    const effectiveScope = requestedScope && requestedScope !== 'all'
      ? requestedScope
      : getRefreshScopeForRole(role);

    const fetchFeed = effectiveScope === 'student' || effectiveScope === 'trainer';
    const fetchChats = effectiveScope === 'trainer' || effectiveScope === 'student' || effectiveScope === 'student-dashboard';
    const fetchEvents = effectiveScope === 'admin';
    const fetchStudentBundle =
      effectiveScope === 'student' ||
      effectiveScope === 'student-dashboard' ||
      effectiveScope === 'student-leaderboard';
    const fetchStudentTodayAndProgress = effectiveScope === 'student' || effectiveScope === 'student-dashboard';
    const fetchStudentLeaderboardOnly = effectiveScope === 'student-leaderboard';
    const fetchTrainerBundle = effectiveScope === 'trainer';
    const fetchAdminBundle = effectiveScope === 'admin';

    try {
      if (!background) {
        set((state) => ({
          system: {
            ...state.system,
            isLoading: true,
            progressLoading: true,
            planLoading: true,
          },
        }));
      }

      const shouldFetchNotifications =
        !background || nowTs - lastNotificationsFetchAt >= BACKGROUND_NOTIFICATIONS_MIN_INTERVAL_MS;

      // Pull only route-relevant bundles to avoid blocking UI on non-essential APIs.
      const results = await Promise.allSettled([
        fetchFeed ? fetchFeedFromBackend() : Promise.resolve([]),
        fetchChats ? fetchChatThreads() : Promise.resolve([]),
        fetchEvents ? fetchEventsAPI() : Promise.resolve(null),
        shouldFetchNotifications
          ? fetchNotificationsAPI(undefined, 40)
          : Promise.resolve({ data: [], nextCursor: null }),
      ]);

      const feedPosts = fetchFeed && results[0].status === "fulfilled" ? results[0].value : [];
      const chatThreads =
        fetchChats && results[1].status === 'fulfilled'
          ? normalizeChatThreads(results[1].value)
          : null;
      const events = fetchEvents && results[2].status === "fulfilled" ? results[2].value : null;
      const backendNotifications =
        shouldFetchNotifications && results[3].status === 'fulfilled'
          ? results[3].value.data
          : null;
      if (backendNotifications) {
        lastNotificationsFetchAt = nowTs;
      }

      const legacyNotifications = backendNotifications
        ? backendNotifications
            .map(mapBackendNotificationToLegacy)
            .filter((item): item is NotificationItem => Boolean(item))
        : null;
      const systemNotifications = backendNotifications
        ? backendNotifications
            .map(mapBackendNotificationToSystem)
            .filter((item): item is SystemNotification => Boolean(item))
        : null;

      let trainersStudents: Record<string, unknown>[] = [];
      let adminUsers: unknown[] = [];
      let studentTodayPlan: Record<string, unknown> | null = null;
      let progressOverview: ProgressOverview | null = null;
      let progressWeekly: ProgressWeeklyPoint[] = [];
      let progressMonthly: ProgressMonthlyPoint[] = [];
      let progressHeatmap: ProgressHeatmapPoint[] = [];
      let leaderboardEntries: LeaderboardEntry[] = [];
      let adminPermissions: PermissionMatrix | null = null;

      if (fetchStudentBundle) {
        const useLiteTodayPlan = effectiveScope === 'student-dashboard';
        const currentUser = get().session.currentUser;
        const currentPlanId = currentUser && 'currentPlanId' in currentUser ? asString((currentUser as Student).currentPlanId) : undefined;

        const [todayPlanRes, dashboardRes, leaderboardRes] = await Promise.allSettled([
          fetchStudentTodayAndProgress
            ? useLiteTodayPlan
              ? fetchTodayPlanLiteAPI()
              : fetchTodayPlanAPI()
            : Promise.resolve(null),
          fetchStudentTodayAndProgress ? fetchProgressDashboardAPI(currentPlanId || undefined) : Promise.resolve(null),
          fetchStudentTodayAndProgress || fetchStudentLeaderboardOnly ? fetchLeaderboardAPI() : Promise.resolve([]),
        ]);

        if (fetchStudentTodayAndProgress && todayPlanRes.status === 'fulfilled') {
          studentTodayPlan = asRecord(todayPlanRes.value);
        }

        if (fetchStudentTodayAndProgress && dashboardRes.status === 'fulfilled') {
          const dashData = asRecord(dashboardRes.value);
          if (dashData) {
            // Overall
            const overallRecord = asRecord(dashData.overall);
            if (overallRecord) {
              progressOverview = {
                streak: asNumber(overallRecord.streak),
                totalPoints: asNumber(overallRecord.totalPoints),
                weeklyAvgWorkoutMinutes: asNumber(overallRecord.weeklyAvgWorkoutMinutes),
                totalStepsLast30Days: asNumber(overallRecord.totalStepsLast30Days),
                checkInsLast30Days: asNumber(overallRecord.checkInsLast30Days),
                completionPercentage: asNumber(overallRecord.completionPercentage),
              };
            }

            // Weekly
            const wData = (asRecord(dashData.weekly)?.data ?? []) as unknown[];
            progressWeekly = wData
              .map((item) => asRecord(item))
              .filter((item): item is Record<string, unknown> => Boolean(item))
              .map((item) => ({
                date: asString(item.date),
                day: asString(item.day),
                completion: asNumber(item.completion),
                workoutMinutes: asNumber(item.workoutMinutes),
                steps: asNumber(item.steps),
                points: asNumber(item.points),
              }));

            // Heatmap
            const hData = (asRecord(dashData.heatmap)?.data ?? []) as unknown[];
            progressHeatmap = hData
              .map((item) => asRecord(item))
              .filter((item): item is Record<string, unknown> => Boolean(item))
              .map((item) => ({
                date: asString(item.date),
                value: asNumber(item.value),
                level: asNumber(item.level),
              }));

            // Monthly
            const mData = (asRecord(dashData.monthly)?.data ?? []) as unknown[];
            progressMonthly = mData
              .map((item) => asRecord(item))
              .filter((item): item is Record<string, unknown> => Boolean(item))
              .map((item) => ({
                week: asString(item.week),
                completion: asNumber(item.completion),
                completedTasks: asNumber(item.completedTasks),
                totalTasks: asNumber(item.totalTasks),
              }));
          }
        }

        if ((fetchStudentTodayAndProgress || fetchStudentLeaderboardOnly) && leaderboardRes.status === 'fulfilled') {
          leaderboardEntries = mapBackendLeaderboardEntries(leaderboardRes.value);
        }
      }

      if (fetchTrainerBundle) {
        const [tsRes] = await Promise.allSettled([fetchTrainerStudentsAPI()]);
        trainersStudents = tsRes.status === "fulfilled" ? tsRes.value : [];
        if (!background) {
          await get().fetchSubmissions().catch(() => {});
        }
      } else if (fetchAdminBundle) {
        const [auRes, permsRes] = await Promise.allSettled([fetchAdminUsersAPI(), fetchAdminPermissionsAPI()]);
        adminUsers = auRes.status === "fulfilled" ? auRes.value : [];
        if (permsRes.status === 'fulfilled') {
          adminPermissions = mapBackendPermissions(permsRes.value, get().system.permissions);
        }
        if (!background) {
          await get().fetchSubmissions().catch(() => {});
        }
      }

      set((state) => {
        const nextUsers = fetchAdminBundle ? {} : { ...state.users };
        const nextPosts = { ...state.posts };

        // 1. Reconcile Users
        if (fetchAdminBundle) {
          adminUsers.forEach((adminUserCandidate) => {
            const record = asRecord(adminUserCandidate);
            if (!record) return;
            const id = asString(record.id);
            const normalized = normalizeBackendUser(record, state.users[id]);
            if (normalized) nextUsers[normalized.id] = normalized;
          });
        } else {
          trainersStudents.forEach((studentRecord) => {
            const normalized = normalizeTrainerStudentRecord(
              studentRecord,
              nextUsers[asString(asRecord(studentRecord)?.userId)]
            );
            if (normalized) nextUsers[normalized.id] = normalized;
          });
        }

        // 2. Reconcile Posts (Merge new ones, but PURGE posts from users not in store if we're in admin mode)
        const mergedPosts = { ...nextPosts };
        if (feedPosts.length > 0) {
          feedPosts.forEach(post => {
            mergedPosts[post.id] = post;
          });
        }

        // 3. Security/Integrity check: remove any posts or data from users who are no longer in our authoritative lists
        const activeUserIds = new Set(Object.keys(nextUsers));
        // Add current session user to active set just in case
        if (state.session.currentUser) activeUserIds.add(state.session.currentUser.id);
        
        Object.keys(mergedPosts).forEach(pid => {
          if (!activeUserIds.has(mergedPosts[pid].userId)) {
            delete mergedPosts[pid];
          }
        });

        // Purge leaderboard entries too
        const nextLeaderboard = leaderboardEntries.filter(e => activeUserIds.has(e.userId));

        return {
          posts: mergedPosts,
          users: nextUsers,
          system: {
            ...state.system,
            chatThreads: chatThreads ?? state.system.chatThreads,
            events: events ?? state.system.events,
            notifications: systemNotifications ?? state.system.notifications,
            legacyNotifications: legacyNotifications ?? state.system.legacyNotifications,
            progressOverview: progressOverview ?? state.system.progressOverview,
            progressWeekly: progressWeekly.length > 0 ? progressWeekly : state.system.progressWeekly,
            progressMonthly: progressMonthly.length > 0 ? progressMonthly : state.system.progressMonthly,
            progressHeatmap: progressHeatmap.length > 0 ? progressHeatmap : state.system.progressHeatmap,
            leaderboardEntries: nextLeaderboard,
            studentTodayPlan: studentTodayPlan ?? state.system.studentTodayPlan,
            permissions: adminPermissions ?? state.system.permissions,
            progressLoading: false,
            planLoading: false,
            isLoading: false,
          },
        };
      });
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "refresh_data" } });
      if (import.meta.env.MODE !== "test") {
        toast.error("Failed to refresh data");
      }
      set((state) => ({
        system: {
          ...state.system,
          isLoading: false,
          progressLoading: false,
          planLoading: false,
        },
      }));
    } finally {
      if (background) {
        lastBackgroundRefreshAt = Date.now();
        isBackgroundRefreshInFlight = false;
      }
    }
  },
}));

useAppStore.subscribe((state) => {
  persistUsers(state.users);
  persistSession(state.session);
  persistChats(state.system.chatThreads);
  persistDashboardData(state.system);
});

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== CHAT_STORAGE_KEY || !event.newValue) return;

    try {
      const parsed = JSON.parse(event.newValue) as ChatThread[];
      if (!Array.isArray(parsed)) return;

      useAppStore.setState((state) => {
        const cleaned = parsed
          .map((thread) => {
            const participants = (thread.participantIds ?? []).filter((id) => Boolean(state.users[id]));
            if (participants.length < 2) return null;
            return {
              ...thread,
              participantIds: Array.from(new Set(participants)).sort(),
              messages: Array.isArray(thread.messages)
                ? thread.messages.map((message) => ({
                    ...message,
                    seenBy: Array.isArray(message.seenBy)
                      ? message.seenBy.filter((id) => participants.includes(id))
                      : [message.senderId].filter((id) => participants.includes(id)),
                  }))
                : [],
              unreadBy: Array.isArray(thread.unreadBy)
                ? thread.unreadBy.filter((id) => participants.includes(id))
                : [],
              updatedAt: thread.updatedAt ?? new Date().toISOString(),
            } as ChatThread;
          })
          .filter((thread): thread is ChatThread => Boolean(thread));

        const sanitized = sanitizeChatThreads(cleaned);
        if (!sanitized.length) return state;

        return {
          ...state,
          system: {
            ...state.system,
            chatThreads: sanitized,
          },
        };
      });
    } catch {
      // Ignore malformed chat sync payloads.
    }
  });
}

// ========= SELECTORS (for convenience) =========
export const useCurrentUser = () => useAppStore((state) => state.session.currentUser);
export const useIsAuthenticated = () => useAppStore((state) => state.session.isAuthenticated);

export const useUsers = () => useAppStore((state) => state.users);
export const usePosts = () => useAppStore((state) => state.posts);

export const useSystem = () => useAppStore((state) => state.system);
export const usePermissions = () => useAppStore((state) => state.system.permissions);

// ========= LEGACY COMPAT LAYER =========
// Keeps existing student/trainer pages working while the app is migrated to normalized state.

const normalizeStudent = (candidate: Partial<Student> & Pick<User, 'id' | 'name' | 'email' | 'passwordHash' | 'avatar'>): Student => ({
  id: candidate.id,
  name: candidate.name,
  email: candidate.email,
  passwordHash: candidate.passwordHash ?? '',
  avatar: candidate.avatar ?? '',
  role: 'student',
  collegeId: candidate.collegeId ?? '',
  height: candidate.height ?? 0,
  weight: candidate.weight ?? 0,
  fitnessGoal: candidate.fitnessGoal ?? '',
  streak: candidate.streak ?? 0,
  totalPlansCompleted: candidate.totalPlansCompleted ?? 0,
  followers: candidate.followers ?? 0,
  following: candidate.following ?? 0,
  trainerId: candidate.trainerId ?? null,
  currentPlanId: candidate.currentPlanId ?? null,
  currentDay: candidate.currentDay ?? 1,
  totalDays: candidate.totalDays ?? 28,
  completionPercentage: candidate.completionPercentage ?? 0,
  todaySteps: candidate.todaySteps ?? 0,
  rank: candidate.rank ?? 0,
  badges: candidate.badges ?? [],
  isBanned: candidate.isBanned ?? false,
  warnings: candidate.warnings ?? 0,
  onboardingStatus: candidate.onboardingStatus ?? 'not_started',
  onboardingStep: candidate.onboardingStep ?? 0,
  onboardingDraft: candidate.onboardingDraft,
  taskCompletions: candidate.taskCompletions ?? {},
});

const normalizeTrainer = (candidate: Partial<Trainer> & Pick<User, 'id' | 'name' | 'email' | 'passwordHash' | 'avatar'>): Trainer => ({
  id: candidate.id,
  name: candidate.name,
  email: candidate.email,
  passwordHash: candidate.passwordHash ?? '',
  avatar: candidate.avatar ?? '',
  role: 'trainer',
  specialization: candidate.specialization ?? '',
  experience: candidate.experience ?? 0,
  certifications: candidate.certifications ?? [],
  totalStudents: candidate.totalStudents ?? 0,
  activePlans: candidate.activePlans ?? 0,
  isVerified: candidate.isVerified ?? false,
});

const MARKETING_DEMO_MODE = import.meta.env.VITE_MARKETING_DEMO_MODE === 'true';
const MARKETING_TOTAL_DAYS = 35;

const buildMarketingTodayTask = (dayNumber: number): LegacyTodayTask => {
  const cycle = dayNumber % 7;
  const stepTarget = 10500 + (cycle % 3) * 400;
  const hydrationGoal = `${3 + (cycle % 2) * 0.5}L`;

  const workout = [
    {
      id: `w-${dayNumber}-1`,
      name: 'Strength Block',
      sets: 4,
      reps: 10,
      rest: '60s',
      completed: cycle !== 0,
      focus: 'Compound strength with controlled tempo and full range.',
      equipmentMode: 'basic' as const,
      alternatives: ['Bodyweight circuit', 'Resistance band circuit'],
    },
    {
      id: `w-${dayNumber}-2`,
      name: 'Conditioning Finisher',
      sets: 3,
      reps: 14,
      rest: '45s',
      completed: cycle === 1 || cycle === 2 || cycle === 4 || cycle === 5,
      focus: 'Heart-rate push with short recovery and strong posture.',
      equipmentMode: 'basic' as const,
      alternatives: ['Bike intervals', 'Incline walk + carries'],
    },
  ];

  const diet = [
    {
      id: `d-${dayNumber}-1`,
      meal: 'Breakfast',
      description: 'Protein-led plate with controlled carbs.',
      time: '08:00',
      calories: 480,
      completed: cycle !== 6,
      foods: [
        { item: 'Eggs', grams: 120 },
        { item: 'Oats', grams: 75 },
        { item: 'Fruit', grams: 100 },
      ],
      macros: { protein: 34, carbs: 48, fats: 14 },
    },
    {
      id: `d-${dayNumber}-2`,
      meal: 'Lunch',
      description: 'Lean protein, rice, and fiber-rich vegetables.',
      time: '13:30',
      calories: 620,
      completed: cycle === 1 || cycle === 2 || cycle === 3 || cycle === 5,
      foods: [
        { item: 'Chicken breast', grams: 170 },
        { item: 'Rice', grams: 200 },
        { item: 'Salad', grams: 120 },
      ],
      macros: { protein: 46, carbs: 62, fats: 16 },
    },
    {
      id: `d-${dayNumber}-3`,
      meal: 'Dinner',
      description: 'Recovery dinner with protein and micronutrient density.',
      time: '20:00',
      calories: 540,
      completed: cycle !== 0,
      foods: [
        { item: 'Paneer/Fish', grams: 160 },
        { item: 'Vegetables', grams: 220 },
        { item: 'Roti', grams: 90 },
      ],
      macros: { protein: 38, carbs: 44, fats: 18 },
    },
  ];

  return { stepTarget, hydrationGoal, workout, diet };
};

const buildMarketingBackendTodayPlan = (currentDay: number) => ({
  currentDay,
  totalDays: MARKETING_TOTAL_DAYS,
  todaysTasks: [
    {
      id: `m-day-${currentDay}-t1`,
      type: 'workout',
      title: 'Fat-Burn Mobility Flow',
      description: 'Low-impact flow with step-ups, glute bridge march, and tempo lunges.',
      submissionStatus: 'PENDING',
    },
    {
      id: `m-day-${currentDay}-t2`,
      type: 'nutrition',
      title: 'Breakfast',
      description: 'Fat-loss plate: grilled protein, rice portion control, salad, and yogurt.',
      submissionStatus: 'PENDING',
    },
    {
      id: `m-day-${currentDay}-t3`,
      type: 'nutrition',
      title: 'Lunch',
      description: 'Balanced carbs + lean protein. Daily protein target ~144g.',
      submissionStatus: 'PENDING',
    },
    {
      id: `m-day-${currentDay}-t4`,
      type: 'nutrition',
      title: 'Dinner',
      description: 'Protein + vegetables focus with consistent meal timing.',
      submissionStatus: 'PENDING',
    },
    {
      id: `m-day-${currentDay}-t5`,
      type: 'workout',
      title: 'Upload weighing scale image',
      description: 'Upload a clear scale photo for day-wise verification.',
      submissionStatus: 'PENDING',
    },
    {
      id: `m-day-${currentDay}-t6`,
      type: 'workout',
      title: 'Upload body photo',
      description: 'Upload front/side body progress photo for review.',
      submissionStatus: 'PENDING',
    },
  ],
  days: Array.from({ length: MARKETING_TOTAL_DAYS }, (_, idx) => {
    const day = idx + 1;
    const base = buildMarketingTodayTask(day);
    return {
      day,
      tasks: [
        {
          id: `m-day-${day}-w1`,
          type: 'workout',
          title: base.workout[0].name,
          description: base.workout[0].focus,
          intensity: 'moderate',
          submissionStatus: base.workout[0].completed ? 'APPROVED' : 'PENDING',
        },
        {
          id: `m-day-${day}-w2`,
          type: 'workout',
          title: base.workout[1].name,
          description: base.workout[1].focus,
          intensity: 'high',
          submissionStatus: base.workout[1].completed ? 'APPROVED' : 'PENDING',
        },
        ...base.diet.map((meal, mealIndex) => ({
          id: `m-day-${day}-n${mealIndex + 1}`,
          type: 'nutrition',
          title: meal.meal,
          description: meal.description,
          intensity: 'moderate',
          submissionStatus: meal.completed ? 'APPROVED' : 'PENDING',
        })),
      ],
    };
  }),
});

export const useStore = () => {
  const state = useAppStore();
  const marketingEnabled = MARKETING_DEMO_MODE && state.session.currentUser?.role === 'student';
  const users = Object.values(state.users);
  const allPosts = Object.values(state.posts);
  const studentsList = users.filter((u): u is Student => u.role === 'student');
  const trainersList = users.filter((u): u is Trainer => u.role === 'trainer');
  const normalizedStudents = studentsList.map((student) => normalizeStudent(student));
  const normalizedTrainers = trainersList.map((trainer) => normalizeTrainer(trainer));

  const student =
    (state.session.currentUser?.role === 'student'
      ? normalizeStudent(state.session.currentUser as Student)
      : normalizedStudents[0]) ??
    normalizeStudent({
      id: state.session.currentUser?.id ?? '',
      name: state.session.currentUser?.name ?? '',
      email: state.session.currentUser?.email ?? '',
      passwordHash: state.session.currentUser?.passwordHash ?? '',
      avatar: state.session.currentUser?.avatar ?? '',
    });

  const backendPlanRecord = asRecord(state.system.studentTodayPlan);
  const resolvedStudent: Student = {
    ...student,
    currentDay: asNumber(backendPlanRecord?.currentDay, student.currentDay),
    totalDays: asNumber(backendPlanRecord?.totalDays, student.totalDays),
    completionPercentage: state.system.progressOverview?.completionPercentage ?? student.completionPercentage,
    todaySteps:
      state.system.progressWeekly.length > 0
        ? state.system.progressWeekly[state.system.progressWeekly.length - 1]?.steps ?? student.todaySteps
        : student.todaySteps,
    streak: state.system.progressOverview?.streak ?? student.streak,
  };

  const marketingStudent: Student = {
    ...resolvedStudent,
    id: resolvedStudent.id || 'student-vinit-marketing',
    name: 'Vinit Sharma',
    email: resolvedStudent.email || 'vinit@ahg.com',
    collegeId: resolvedStudent.collegeId || 'AHG-CSE-2026',
    fitnessGoal: resolvedStudent.fitnessGoal || 'Lean muscle with visible conditioning',
    streak: 19,
    totalPlansCompleted: 7,
    followers: 426,
    following: 193,
    currentPlanId: 'marketing-plan-2026',
    currentDay: 18,
    totalDays: MARKETING_TOTAL_DAYS,
    completionPercentage: 87,
    todaySteps: 12460,
    rank: 1,
    onboardingStatus: 'completed',
    onboardingStep: 6,
    badges: [
      { id: 'm-b1', name: 'Consistency Machine', icon: 'flame', date: '2026-04-10', description: '14-day streak', earned: true },
      { id: 'm-b2', name: 'Proof Master', icon: 'trophy', date: '2026-04-11', description: '50 verified uploads', earned: true },
      { id: 'm-b3', name: '10K Club', icon: 'footprints', date: '2026-04-12', description: '10k+ steps for 10 days', earned: true },
      { id: 'm-b4', name: 'Sleep Discipline', icon: 'star', date: '', description: 'Hit sleep goal for 21 days', earned: false },
    ],
  };

  const trainer =
    (state.session.currentUser?.role === 'trainer'
      ? normalizeTrainer(state.session.currentUser as Trainer)
      : normalizedTrainers[0]) ??
    normalizeTrainer({
      id: state.session.currentUser?.id ?? '',
      name: state.session.currentUser?.name ?? '',
      email: state.session.currentUser?.email ?? '',
      passwordHash: state.session.currentUser?.passwordHash ?? '',
      avatar: state.session.currentUser?.avatar ?? '',
      totalStudents: normalizedStudents.length,
      isVerified: false,
    });

  const fallbackLeaderboard =
    state.system.leaderboardEntries.length > 0
      ? state.system.leaderboardEntries
      : normalizedStudents
          .map((candidate) => ({
            userId: candidate.id,
            name: candidate.name,
            avatar: candidate.avatar,
            score: candidate.completionPercentage * 100 + candidate.streak * 10,
            streak: candidate.streak,
            steps: candidate.todaySteps,
            uploads: Math.max(1, Math.floor(candidate.totalPlansCompleted * 3)),
            completionPercentage: candidate.completionPercentage,
          }))
          .sort((a, b) => b.score - a.score)
          .map((entry, idx) => ({
            ...entry,
            rank: idx + 1,
          }));

  const marketingLeaderboard: LeaderboardEntry[] = [
    { rank: 1, userId: marketingStudent.id, name: marketingStudent.name, avatar: marketingStudent.avatar, score: 4890, streak: 19, steps: 12460, uploads: 77, completionPercentage: 87 },
    { rank: 2, userId: 'student-aarav', name: 'Aarav Patel', avatar: '', score: 4635, streak: 16, steps: 11820, uploads: 69, completionPercentage: 84 },
    { rank: 3, userId: 'student-mira', name: 'Mira Kapoor', avatar: '', score: 4520, streak: 15, steps: 10940, uploads: 65, completionPercentage: 82 },
    { rank: 4, userId: 'student-raghav', name: 'Raghav Iyer', avatar: '', score: 4410, streak: 14, steps: 10320, uploads: 62, completionPercentage: 81 },
    { rank: 5, userId: 'student-iqra', name: 'Iqra Khan', avatar: '', score: 4325, streak: 13, steps: 9860, uploads: 58, completionPercentage: 79 },
    { rank: 6, userId: 'student-neel', name: 'Neel Trivedi', avatar: '', score: 4250, streak: 12, steps: 9510, uploads: 55, completionPercentage: 78 },
  ];

  const leaderboard = marketingEnabled ? marketingLeaderboard : fallbackLeaderboard;

  const students = (marketingEnabled ? marketingLeaderboard : normalizedStudents.map((s) => ({
    userId: s.id,
    name: s.name,
    streak: s.streak,
    rank: s.rank,
    completionPercentage: s.completionPercentage,
  }))).map((candidate) => ({
    userId: candidate.userId,
    name: candidate.name,
    streak: candidate.streak,
    rank: candidate.rank,
    completionPercentage: candidate.completionPercentage,
  }));

  const suggestedUsers = (marketingEnabled
    ? [
        marketingStudent,
        { ...marketingStudent, id: 'student-aarav', name: 'Aarav Patel', rank: 2, streak: 16, completionPercentage: 84 },
        { ...marketingStudent, id: 'student-mira', name: 'Mira Kapoor', rank: 3, streak: 15, completionPercentage: 82 },
      ]
    : normalizedStudents
  ).map((s) => ({
    ...s,
    mutualFriends: Math.max(2, Math.floor((s.followers + s.following) / 25)),
  }));

  const notifications = marketingEnabled
    ? [
        {
          id: 'marketing-notif-1',
          message: 'Coach Arjun approved your last workout proof.',
          icon: 'check-circle',
          type: 'trainer',
          userName: 'Coach Arjun',
          action: 'approved your submission',
          timestamp: new Date(Date.now() - 15 * 60_000).toISOString(),
          read: false,
        },
        {
          id: 'marketing-notif-2',
          message: 'You moved up to #1 on the leaderboard.',
          icon: 'trophy',
          type: 'rank',
          timestamp: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
          read: false,
        },
      ]
    : state.system.legacyNotifications;

  const marketingPlan: Plan = {
    id: 'marketing-plan-2026',
    name: 'Apex Transformation Sprint',
    title: 'Apex Transformation Sprint',
    difficulty: 'intermediate',
    duration: MARKETING_TOTAL_DAYS,
    status: 'active',
    type: 'auto_generated',
    dailyTasks: [],
  };

  const baseCurrentStudentPlan = resolvedStudent.currentPlanId ? state.plans[resolvedStudent.currentPlanId] : null;
  const currentStudentPlan = marketingEnabled ? marketingPlan : baseCurrentStudentPlan;
  const autoGeneratedPlansQueue = Object.values(state.plans).filter((plan) => plan.type === 'auto_generated');
  const getDayTask = (dayNumber: number) =>
    marketingEnabled ? buildMarketingTodayTask(dayNumber) : buildTodayTaskFromPlan(resolvedStudent, currentStudentPlan, dayNumber);
  const todayTask = getDayTask(marketingEnabled ? marketingStudent.currentDay : resolvedStudent.currentDay);

  const marketingProgressOverview: ProgressOverview = {
    streak: 19,
    totalPoints: 14250,
    weeklyAvgWorkoutMinutes: 47,
    totalStepsLast30Days: 356400,
    checkInsLast30Days: 58,
    completionPercentage: 87,
  };

  const marketingProgressWeekly: ProgressWeeklyPoint[] = [
    { date: '2026-04-15', day: 'Mon', completion: 86, workoutMinutes: 44, steps: 10220, points: 310 },
    { date: '2026-04-16', day: 'Tue', completion: 92, workoutMinutes: 51, steps: 12460, points: 360 },
    { date: '2026-04-17', day: 'Wed', completion: 78, workoutMinutes: 39, steps: 9480, points: 280 },
    { date: '2026-04-18', day: 'Thu', completion: 95, workoutMinutes: 54, steps: 13120, points: 375 },
    { date: '2026-04-19', day: 'Fri', completion: 88, workoutMinutes: 47, steps: 11690, points: 332 },
    { date: '2026-04-20', day: 'Sat', completion: 83, workoutMinutes: 42, steps: 10980, points: 301 },
    { date: '2026-04-21', day: 'Sun', completion: 90, workoutMinutes: 49, steps: 12460, points: 348 },
  ];

  const marketingProgressMonthly: ProgressMonthlyPoint[] = [
    { week: 'Week 1', completion: 76, completedTasks: 32, totalTasks: 42 },
    { week: 'Week 2', completion: 82, completedTasks: 34, totalTasks: 41 },
    { week: 'Week 3', completion: 87, completedTasks: 36, totalTasks: 41 },
    { week: 'Week 4', completion: 91, completedTasks: 38, totalTasks: 42 },
  ];

  const marketingProgressHeatmap: ProgressHeatmapPoint[] = Array.from({ length: MARKETING_TOTAL_DAYS }, (_, idx) => {
    const level = idx % 5;
    return {
      date: new Date(Date.now() - (MARKETING_TOTAL_DAYS - idx) * 86_400_000).toISOString().slice(0, 10),
      value: level * 25,
      level,
    };
  });

  const progressOverview = marketingEnabled ? marketingProgressOverview : state.system.progressOverview;
  const progressWeekly = marketingEnabled ? marketingProgressWeekly : state.system.progressWeekly;
  const progressMonthly = marketingEnabled ? marketingProgressMonthly : state.system.progressMonthly;
  const progressHeatmap = marketingEnabled ? marketingProgressHeatmap : state.system.progressHeatmap;

  const backendTodayPlan = marketingEnabled
    ? buildMarketingBackendTodayPlan(marketingStudent.currentDay)
    : state.system.studentTodayPlan;

  const marketingPosts: Post[] = [
    {
      id: 'marketing-post-1', userId: marketingStudent.id, userName: marketingStudent.name, userAvatar: '', userRole: 'student',
      source: 'general', type: 'image', mediaUrl: 'https://placehold.co/1080x1350/111111/C9F85A?text=Transformation+Update',
      caption: 'Week 3 check-in. Conditioning up, recovery better, form cleaner. #afterhours #discipline', likes: 289, comments: 34, location: 'Main Gym', timestamp: new Date(Date.now() - 3 * 60 * 60_000).toISOString(), liked: true, status: 'visible',
    },
    {
      id: 'marketing-post-2', userId: 'student-mira', userName: 'Mira Kapoor', userAvatar: '', userRole: 'student',
      source: 'general', type: 'image', mediaUrl: 'https://placehold.co/1080x1350/121212/4DD2FF?text=Leg+Day+Proof',
      caption: 'Hit all reps and uploaded proof before 9pm. #grind', likes: 214, comments: 19, location: 'Athlete Lab', timestamp: new Date(Date.now() - 7 * 60 * 60_000).toISOString(), liked: false, status: 'visible',
    },
    {
      id: 'marketing-post-3', userId: 'student-aarav', userName: 'Aarav Patel', userAvatar: '', userRole: 'student',
      source: 'general', type: 'image', mediaUrl: 'https://placehold.co/1080x1350/151515/FFD36E?text=Nutrition+Compliance',
      caption: 'Clean nutrition streak: 12/14 compliant meals this week.', likes: 176, comments: 12, location: 'Hostel Block C', timestamp: new Date(Date.now() - 11 * 60 * 60_000).toISOString(), liked: false, status: 'visible',
    },
  ];

  const weeklyData =
    progressWeekly.length > 0
      ? progressWeekly.map((item) => ({ name: item.day, uv: item.completion }))
      : Array.from({ length: 7 }, (_, index) => {
          const absoluteDay = Math.min(resolvedStudent.totalDays, Math.max(1, resolvedStudent.currentDay - ((resolvedStudent.currentDay - 1) % 7) + index));
          const dayTask = getDayTask(absoluteDay);
          const total = dayTask.workout.length + dayTask.diet.length;
          const done = dayTask.workout.filter((item) => item.completed).length + dayTask.diet.filter((item) => item.completed).length;
          const percent = total > 0 ? Math.round((done / total) * 100) : 0;
          return {
            name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
            uv: percent,
          };
        });
  const onboardingRequired = marketingEnabled ? false : resolvedStudent.onboardingStatus !== 'completed';
  const canStartCurrentPlan = marketingEnabled ? true : Boolean(!currentStudentPlan || currentStudentPlan.status === 'active');

  return {
    student: marketingEnabled ? marketingStudent : resolvedStudent,
    trainer,
    students,
    leaderboard,
    todayTask,
    getDayTask,
    weeklyData,
    posts: marketingEnabled ? marketingPosts : allPosts,
    loading: marketingEnabled ? false : state.system.isLoading,
    notifications,
    submissions: state.system.legacySubmissions,
    currentStudentPlan,
    backendTodayPlan,
    progressOverview,
    progressWeekly,
    progressMonthly,
    progressHeatmap,
    progressLoading: marketingEnabled ? false : state.system.progressLoading,
    planLoading: marketingEnabled ? false : state.system.planLoading,
    autoGeneratedPlansQueue,
    onboardingRequired,
    canStartCurrentPlan,
    suggestedUsers,
    setLoading: state.setLoading,
    likePost: state.toggleLike,
    submitTaskProof: state.submitTaskProof,
    resendTaskProof: state.resendTaskProof,
    updateProfile: (data: Partial<Student>) => state.updateUser(student.id, data),
    followUser: async (targetUserId: string) => {
      const snapshot = useAppStore.getState();
      useAppStore.setState((prev) => {
        const actor = prev.session.currentUser;
        if (!actor || actor.role !== 'student' || actor.id === targetUserId) return prev;

        const target = prev.users[targetUserId];
        if (!target || target.role !== 'student') return prev;

        const actorStudent = prev.users[actor.id] as Student;
        const targetStudent = target as Student;
        const updatedActor: Student = {
          ...actorStudent,
          following: actorStudent.following + 1,
        };
        const updatedTarget: Student = {
          ...targetStudent,
          followers: targetStudent.followers + 1,
        };

        return {
          ...prev,
          users: {
            ...prev.users,
            [updatedActor.id]: updatedActor,
            [updatedTarget.id]: updatedTarget,
          },
          session: {
            ...prev.session,
            currentUser: updatedActor,
          },
        };
      });

      try {
        await followUserAPI(targetUserId);
        void useAppStore.getState().refreshData({ background: true, scope: getRefreshScopeForRole(useAppStore.getState().session.currentUser?.role) });
      } catch (error) {
        useAppStore.setState(snapshot);
        throw error;
      }
    },
    unfollowUser: async (targetUserId: string) => {
      const snapshot = useAppStore.getState();
      useAppStore.setState((prev) => {
        const actor = prev.session.currentUser;
        if (!actor || actor.role !== 'student' || actor.id === targetUserId) return prev;

        const target = prev.users[targetUserId];
        if (!target || target.role !== 'student') return prev;

        const actorStudent = prev.users[actor.id] as Student;
        const targetStudent = target as Student;
        const updatedActor: Student = {
          ...actorStudent,
          following: Math.max(0, actorStudent.following - 1),
        };
        const updatedTarget: Student = {
          ...targetStudent,
          followers: Math.max(0, targetStudent.followers - 1),
        };

        return {
          ...prev,
          users: {
            ...prev.users,
            [updatedActor.id]: updatedActor,
            [updatedTarget.id]: updatedTarget,
          },
          session: {
            ...prev.session,
            currentUser: updatedActor,
          },
        };
      });

      try {
        await unfollowUserAPI(targetUserId);
        void useAppStore.getState().refreshData({ background: true, scope: getRefreshScopeForRole(useAppStore.getState().session.currentUser?.role) });
      } catch (error) {
        useAppStore.setState(snapshot);
        throw error;
      }
    },
    completeTask: (type: 'workout' | 'diet', itemId: string, dayNumber?: number) => {
      useAppStore.setState((prev) => {
        const actor = prev.session.currentUser;
        if (!actor || actor.role !== 'student') return prev;

        const studentUser = prev.users[actor.id];
        if (!studentUser || studentUser.role !== 'student') return prev;

        const studentRecord = studentUser as Student;
        const plan = studentRecord.currentPlanId ? prev.plans[studentRecord.currentPlanId] : null;
        const targetDay = dayNumber ?? studentRecord.currentDay;
        const key = plan?.id ? getRecordKey(plan.id, targetDay) : `legacy:day:${targetDay}`;

        const existingKeys = studentRecord.taskCompletions?.[key] ?? [];
        if (existingKeys.includes(itemId)) return prev;

        const updatedTaskCompletions: Record<string, string[]> = {
          ...(studentRecord.taskCompletions ?? {}),
          [key]: [...existingKeys, itemId],
        };

        let completionPercentage = studentRecord.completionPercentage;
        if (plan?.id) {
          let totalTasks = 0;
          let completedTasks = 0;
          const maxDays = plan.duration ?? studentRecord.totalDays;

          for (let day = 1; day <= maxDays; day += 1) {
            const taskForDay = buildTodayTaskFromPlan({ ...studentRecord, taskCompletions: updatedTaskCompletions }, plan, day);
            totalTasks += taskForDay.workout.length + taskForDay.diet.length;
            completedTasks +=
              taskForDay.workout.filter((task) => task.completed).length +
              taskForDay.diet.filter((task) => task.completed).length;
          }

          completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        }

        const updatedStudent: Student = {
          ...studentRecord,
          taskCompletions: updatedTaskCompletions,
          completionPercentage,
        };

        return {
          ...prev,
          users: {
            ...prev.users,
            [updatedStudent.id]: updatedStudent,
          },
          session: {
            ...prev.session,
            currentUser: updatedStudent,
          },
          system: { ...prev.system },
        };
      });
    },
    addComment: async (postId: string, comment: string) => {
      if (!comment.trim()) return;

      const previous = useAppStore.getState().posts[postId];
      useAppStore.setState((prev) => {
        const post = prev.posts[postId];
        if (!post) return prev;
        return {
          ...prev,
          posts: {
            ...prev.posts,
            [postId]: {
              ...post,
              comments: post.comments + 1,
            },
          },
        };
      });

      try {
        await addCommentAPI(postId, comment.trim());
      } catch (error) {
        if (previous) {
          useAppStore.setState((prev) => ({
            ...prev,
            posts: {
              ...prev.posts,
              [postId]: previous,
            },
          }));
        }
        throw error;
      }
    },
    addSubmission: (submission: {
      studentId?: string;
      studentName?: string;
      taskName?: string;
      taskType?: 'workout' | 'diet' | 'checkin';
      mediaUrl?: string;
      trainerNote?: string;
      points?: number;
    }) => {
      useAppStore.setState((prev) => {
        const actingStudent = prev.users[submission.studentId ?? student.id] as Student | undefined;
        const trainerId = actingStudent?.trainerId ?? student.trainerId ?? undefined;
        return {
          ...prev,
          system: {
            ...prev.system,
            legacySubmissions: [
              {
                id: createId('sub'),
                studentId: submission.studentId ?? student.id,
                studentName: submission.studentName ?? student.name,
                trainerId,
                taskName: submission.taskName ?? 'Check-in',
                taskType: submission.taskType ?? 'checkin',
                timestamp: new Date().toLocaleString(),
                status: 'pending' as const,
                mediaUrl: submission.mediaUrl ?? '',
                trainerNote: submission.trainerNote ?? '',
                points: submission.points ?? 50,
              },
              ...prev.system.legacySubmissions,
            ],
          },
        };
      });
    },
    addPost: async (post: Partial<Post>) => {
      const id = createId('post-local');
      const optimisticPost: Post = {
        id,
        userId: post.userId ?? student.id,
        userName: post.userName ?? student.name,
        userAvatar: post.userAvatar ?? student.avatar,
        userRole: post.userRole ?? 'student',
        source: post.source ?? 'general',
        type: (post.type as Post['type']) ?? 'image',
        mediaUrl: post.mediaUrl ?? '',
        caption: post.caption ?? '',
        relatedTaskId: post.relatedTaskId,
        relatedTaskType: post.relatedTaskType,
        relatedDayNumber: post.relatedDayNumber,
        likes: 0,
        comments: 0,
        location: post.location ?? 'Campus',
        steps: typeof post.steps === 'number' ? (post.steps as number) : undefined,
        timestamp: new Date().toISOString(),
        liked: false,
        status: 'visible',
      };

      useAppStore.setState((prev) => ({
        ...prev,
        posts: {
          ...prev.posts,
          [id]: optimisticPost,
        },
      }));

      try {
        await createPostAPI({
          type: optimisticPost.type,
          mediaUrl: optimisticPost.mediaUrl,
          caption: optimisticPost.caption,
          source: optimisticPost.source,
          location: optimisticPost.location,
          steps: optimisticPost.steps ?? null,
        });
        void useAppStore.getState().refreshData({ background: true, scope: getRefreshScopeForRole(useAppStore.getState().session.currentUser?.role) });
      } catch (error) {
        useAppStore.setState((prev) => {
          const nextPosts = { ...prev.posts };
          delete nextPosts[id];
          return {
            ...prev,
            posts: nextPosts,
          };
        });
        throw error;
      }
    },
    reviewSubmission: (submissionId: string, status: 'approved' | 'rejected', note?: string) => {
      useAppStore.setState((prev) => ({
        ...prev,
        system: {
          ...prev.system,
          legacySubmissions: prev.system.legacySubmissions.map((submission) =>
            submission.id === submissionId
              ? submission.status === 'pending'
                ? {
                    ...submission,
                    status,
                    trainerNote: note ?? submission.trainerNote,
                  }
                : submission
              : submission
          ),
        },
      }));
    },
    markNotificationRead: (notificationId: string) => {
      void markNotificationReadAPI(notificationId).catch((error) => {
        Sentry.captureException(error, { tags: { action: "mark_notification_read" } });
        toast.error("Failed to mark notification as read");
      });

      useAppStore.setState((prev) => ({
        ...prev,
        system: {
          ...prev.system,
          legacyNotifications: prev.system.legacyNotifications.map((notification) =>
            notification.id === notificationId ? { ...notification, read: true } : notification
          ),
          notifications: prev.system.notifications.map((notification) =>
            notification.id === notificationId ? { ...notification, read: true } : notification
          ),
        },
      }));
    },
    markAllNotificationsRead: () => {
      const unreadIds = useAppStore
        .getState()
        .system.legacyNotifications.filter((notification) => !notification.read)
        .map((notification) => notification.id);

      if (unreadIds.length > 0) {
        void Promise.allSettled(unreadIds.map((id) => markNotificationReadAPI(id))).catch((error) => {
          Sentry.captureException(error, { tags: { action: "mark_all_notifications_read" } });
          toast.error("Failed to mark notifications as read");
        });
      }

      useAppStore.setState((prev) => ({
        ...prev,
        system: {
          ...prev.system,
          legacyNotifications: prev.system.legacyNotifications.map((notification) => ({
            ...notification,
            read: true,
          })),
          notifications: prev.system.notifications.map((notification) => ({
            ...notification,
            read: true,
          })),
        },
      }));
    },
    createPlan: (payload: {
      title: string;
      duration: number;
      goalType: string;
      difficulty: Plan['difficulty'];
      studentIds: string[];
    }) => state.createPlan(payload),
    saveOnboardingDraft: (studentId: string, payload: FitnessQuestionnaire, step: number) =>
      state.saveOnboardingDraft(studentId, payload, step),
    completeOnboardingAndGeneratePlan: (studentId: string, payload: FitnessQuestionnaire) =>
      state.completeOnboardingAndGeneratePlan(studentId, payload),
    reviewAutoGeneratedPlan: (planId: string, decision: 'approve' | 'reject', feedback?: string) =>
      state.reviewAutoGeneratedPlan(planId, decision, feedback),
    editAutoGeneratedPlanDay: (planId: string, week: number, day: number, updates: Partial<PlanDay>) =>
      state.editAutoGeneratedPlanDay(planId, week, day, updates),
    approveTaskSubmission: (submissionId: string, note?: string) =>
      state.approveTaskSubmission(submissionId, note),
    rejectTaskSubmission: (submissionId: string, note: string) =>
      state.rejectTaskSubmission(submissionId, note),
    notifyStudentPlanUpdated: (studentId: string, planId: string, message: string) =>
      state.notifyStudentPlanUpdated(studentId, planId, message),
    planUpdateNotifications: state.system.planUpdateNotifications,
  };
};

