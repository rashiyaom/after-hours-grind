import { create } from 'zustand';
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
} from '@/types';
import { generateAutoPlan } from '@/lib/planGeneration';
import {
  mockUsers,
  mockPosts,
  mockPlans,
  mockNotifications,
  mockActivityLogs,
} from '@/data/mockData';
import { hashPassword, looksHashedPassword } from '@/lib/auth';

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

type LegacySubmission = {
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
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  mediaUrl: string;
  trainerNote: string;
  points?: number;
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

const defaultWeeklyData = [
  { name: 'Mon', uv: 72 },
  { name: 'Tue', uv: 80 },
  { name: 'Wed', uv: 76 },
  { name: 'Thu', uv: 84 },
  { name: 'Fri', uv: 88 },
  { name: 'Sat', uv: 74 },
  { name: 'Sun', uv: 82 },
];

const defaultTodayTask: LegacyTodayTask = {
  stepTarget: 10000,
  hydrationGoal: '3.5L',
  workout: [
    {
      id: 'w1',
      name: 'Incline Dumbbell Press',
      sets: 4,
      reps: 12,
      rest: '60s',
      completed: true,
      focus: 'Upper chest and front delts',
      equipmentMode: 'basic',
      alternatives: ['Elevated push-ups', 'Resistance-band press'],
    },
    {
      id: 'w2',
      name: 'Cable Fly',
      sets: 3,
      reps: 15,
      rest: '45s',
      completed: false,
      focus: 'Chest isolation and contraction quality',
      equipmentMode: 'full_gym',
      alternatives: ['Dumbbell fly on floor', 'Band fly'],
    },
    {
      id: 'w3',
      name: 'Overhead Triceps Extension',
      sets: 3,
      reps: 12,
      rest: '45s',
      completed: false,
      focus: 'Long-head triceps loading',
      equipmentMode: 'basic',
      alternatives: ['Chair dips', 'Close-grip push-ups'],
    },
    {
      id: 'w4',
      name: 'Push-ups',
      sets: 3,
      reps: 20,
      rest: '30s',
      completed: false,
      focus: 'Volume finisher',
      equipmentMode: 'bodyweight_only',
      alternatives: ['Knee push-ups', 'Tempo push-ups'],
    },
  ],
  diet: [
    {
      id: 'd1',
      meal: 'Breakfast',
      description: 'Oats + eggs + fruit',
      time: '08:00',
      calories: 520,
      completed: true,
      foods: [
        { item: 'Rolled oats', grams: 70 },
        { item: 'Whole eggs', grams: 100 },
        { item: 'Banana', grams: 120 },
      ],
      macros: { protein: 31, carbs: 57, fats: 16 },
    },
    {
      id: 'd2',
      meal: 'Lunch',
      description: 'Chicken + rice + salad',
      time: '13:30',
      calories: 680,
      completed: false,
      foods: [
        { item: 'Chicken breast', grams: 180 },
        { item: 'Cooked rice', grams: 220 },
        { item: 'Salad mix', grams: 120 },
      ],
      macros: { protein: 52, carbs: 64, fats: 14 },
    },
    {
      id: 'd3',
      meal: 'Snack',
      description: 'Greek yogurt + nuts',
      time: '17:00',
      calories: 320,
      completed: false,
      foods: [
        { item: 'Greek yogurt', grams: 200 },
        { item: 'Mixed nuts', grams: 25 },
      ],
      macros: { protein: 24, carbs: 18, fats: 15 },
    },
    {
      id: 'd4',
      meal: 'Dinner',
      description: 'Paneer + veggies + roti',
      time: '20:30',
      calories: 610,
      completed: false,
      foods: [
        { item: 'Paneer', grams: 160 },
        { item: 'Mixed vegetables', grams: 200 },
        { item: 'Roti', grams: 100 },
      ],
      macros: { protein: 36, carbs: 48, fats: 24 },
    },
  ],
};

const defaultSubmissions: LegacySubmission[] = [
  {
    id: 'sub-1',
    studentId: 's1',
    studentName: 'Arjun Mehta',
    taskName: 'Workout Check-in',
    timestamp: 'Today, 8:35 AM',
    status: 'pending' as const,
    mediaUrl: '',
    trainerNote: '',
  },
  {
    id: 'sub-2',
    studentId: 's2',
    studentName: 'Priya Sharma',
    taskName: 'Nutrition Check-in',
    timestamp: 'Today, 7:10 AM',
    status: 'approved' as const,
    mediaUrl: '',
    trainerNote: 'Nice consistency',
  },
];

const defaultAppNotifications: NotificationItem[] = [
  {
    id: 'sys-notif-1',
    message: 'Coach Vikram approved your latest check-in',
    icon: 'check-circle',
    type: 'trainer',
    userAvatar: '',
    userName: 'Coach Vikram',
    action: 'approved your latest check-in',
    timestamp: '2h ago',
    read: false,
  },
  {
    id: 'sys-notif-2',
    message: 'After Hours sent a reminder for your daily plan',
    icon: 'clipboard',
    type: 'plan',
    userAvatar: '',
    userName: 'After Hours',
    action: 'sent a reminder for your daily plan',
    timestamp: '1d ago',
    read: true,
  },
];

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
  login: (email: string, password: string, role: UserRole) => boolean;
  logout: () => void;
  signup: (userData: {
    name: string;
    email: string;
    password: string;
    role: Exclude<UserRole, 'admin'>;
    collegeId?: string;
    height?: number;
    weight?: number;
    fitnessGoal?: string;
    specialization?: string;
    experience?: number;
    certifications?: string;
  }) => Promise<void>;

  // Data Loading
  setLoading: (isLoading: boolean) => void;

  // Post Actions
  likePost: (postId: string) => void;
  updatePostStatus: (postId: string, status: Post['status']) => void;

  // User Actions
  updateUser: (userId: string, data: Partial<User>) => void;
  banUser: (userId: string) => void;
  verifyTrainer: (trainerId: string) => void;
  createPlan: (payload: {
    title: string;
    duration: number;
    goalType: string;
    difficulty: Plan['difficulty'];
    studentIds: string[];
  }) => void;
  saveOnboardingDraft: (studentId: string, payload: FitnessQuestionnaire, step: number) => void;
  completeOnboardingAndGeneratePlan: (studentId: string, payload: FitnessQuestionnaire) => Plan;
  reviewAutoGeneratedPlan: (planId: string, decision: 'approve' | 'reject', feedback?: string) => void;
  editAutoGeneratedPlanDay: (planId: string, week: number, day: number, updates: Partial<PlanDay>) => void;
  assignTrainer: (studentId: string, trainerId: string | null) => void;
  // Task approval flow
  approveTaskSubmission: (submissionId: string, note?: string) => void;
  rejectTaskSubmission: (submissionId: string, note: string) => void;
  submitTaskProof: (payload: {
    taskId: string;
    taskType: 'workout' | 'diet';
    dayNumber: number;
    taskName: string;
    mediaUrl: string;
    caption?: string;
    location?: string;
  }) => void;
  notifyStudentPlanUpdated: (studentId: string, planId: string, message: string) => void;
  markPlanNotificationRead: (notificationId: string) => void;
  createOrGetChatThread: (targetUserId: string) => string | null;
  sendChatMessage: (payload: {
    threadId?: string;
    recipientId?: string;
    text?: string;
    reelPostId?: string;
    voiceSeconds?: number;
    voiceAudioUrl?: string;
  }) => void;
  markChatThreadRead: (threadId: string) => void;

  // Events CRUD
  createEvent: (event: Omit<AHGEvent, 'id' | 'createdAt' | 'entries'>) => void;
  updateEvent: (eventId: string, updates: Partial<AHGEvent>) => void;
  deleteEvent: (eventId: string) => void;
  submitEventEntry: (eventId: string, responses: Record<string, string | string[]>) => void;

  // System Actions
  dismissNotification: (notificationId: string) => void;
  setRolePermission: (role: UserRole, permission: PermissionKey, allowed: boolean) => void;
  resetPermissions: () => void;
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
const MAX_CHAT_THREADS = 120;
const MAX_MESSAGES_PER_THREAD = 80;
const MAX_VOICE_DATA_URL_LENGTH = 1_200_000;

type PersistedSession = {
  currentUserId: string | null;
  isAuthenticated: boolean;
};

const migrateUserPasswordShape = (users: Record<string, User>): Record<string, User> => {
  return Object.fromEntries(
    Object.entries(users).map(([id, user]) => {
      const candidate = user as User & { password?: string };
      const legacyPassword = candidate.password;
      const migratedHash = looksHashedPassword(candidate.passwordHash)
        ? candidate.passwordHash
        : hashPassword(candidate.passwordHash || legacyPassword || 'changeme');

      const { password: _legacyPassword, ...safeUser } = candidate;
      return [id, { ...safeUser, passwordHash: migratedHash } as User];
    })
  );
};

const buildDirectThreadId = (a: string, b: string) =>
  `thread-${[a, b].sort().join('--')}`;

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

const createDefaultChatThreads = (users: Record<string, User>): ChatThread[] => {
  const now = new Date().toISOString();
  const threads: ChatThread[] = [];

  Object.values(users).forEach((user) => {
    if (user.role !== 'student') return;
    const student = user as Student;
    if (!student.trainerId) return;

    const trainer = users[student.trainerId];
    if (!trainer || trainer.role !== 'trainer') return;

    const id = buildDirectThreadId(student.id, trainer.id);
    const message: ChatMessage = {
      id: `msg-init-${student.id}`,
      senderId: trainer.id,
      text: `Daily metrics check: send bodyweight, sleep hours, and energy score (1-10) before 9 PM.`,
      createdAt: now,
      type: 'text',
      seenBy: [trainer.id],
    };

    threads.push({
      id,
      participantIds: [student.id, trainer.id],
      messages: [message],
      updatedAt: now,
      unreadBy: [student.id],
    });
  });

  return threads;
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
  users: Record<string, User>,
  fallback: ChatThread[]
): ChatThread[] => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as ChatThread[];
    if (!Array.isArray(parsed)) return fallback;

    const cleaned = parsed
      .map((thread) => {
        const participants = (thread.participantIds ?? []).filter((id) => Boolean(users[id]));
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
    return sanitized.length > 0 ? sanitized : sanitizeChatThreads(fallback);
  } catch {
    return sanitizeChatThreads(fallback);
  }
};

const persistChats = (threads: ChatThread[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sanitizeChatThreads(threads)));
  } catch {
    // Ignore localStorage write failures in restricted environments.
  }
};

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
  if (typeof window === 'undefined') return baseUsers;
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return baseUsers;
    const parsed = JSON.parse(raw) as Record<string, User>;
    const mergedUsers = {
      ...baseUsers,
      ...(parsed ?? {}),
    };
    return migrateUserPasswordShape(mergedUsers);
  } catch {
    return migrateUserPasswordShape(baseUsers);
  }
};

const persistUsers = (users: Record<string, User>) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      USERS_STORAGE_KEY,
      JSON.stringify(migrateUserPasswordShape(users))
    );
  } catch {
    // Ignore localStorage write failures in restricted environments.
  }
};

const readPersistedSession = (users: Record<string, User>): AppState['session'] => {
  if (typeof window === 'undefined') {
    return { currentUser: null, isAuthenticated: false };
  }

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return { currentUser: null, isAuthenticated: false };

    const parsed = JSON.parse(raw) as PersistedSession;
    if (!parsed.isAuthenticated || !parsed.currentUserId) {
      return { currentUser: null, isAuthenticated: false };
    }

    const user = users[parsed.currentUserId] ?? null;
    if (!user) return { currentUser: null, isAuthenticated: false };

    return {
      currentUser: user,
      isAuthenticated: true,
    };
  } catch {
    return { currentUser: null, isAuthenticated: false };
  }
};

const persistSession = (session: AppState['session']) => {
  if (typeof window === 'undefined') return;
  try {
    const payload: PersistedSession = {
      currentUserId: session.currentUser?.id ?? null,
      isAuthenticated: session.isAuthenticated && Boolean(session.currentUser),
    };
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore localStorage write failures in restricted environments.
  }
};

const clearPersistedSecurityState = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
  } catch {
    // Ignore cleanup failures in restricted environments.
  }
};

const initialUsers = readPersistedUsers(
  migrateUserPasswordShape(mockUsers.reduce((acc, user) => ({ ...acc, [user.id]: user }), {}))
);

const initialSession = readPersistedSession(initialUsers);

// ========= INITIAL STATE =========
const initialState: AppState = {
  users: initialUsers,
  posts: mockPosts.reduce((acc, post) => ({ ...acc, [post.id]: post }), {}),
  plans: mockPlans.reduce((acc, plan) => ({ ...acc, [plan.id]: plan }), {}),
  system: {
    notifications: mockNotifications,
    activityLogs: mockActivityLogs,
    appVersion: {
      version: '1.0.0',
      releaseDate: '2026-04-07',
      notes: 'Initial release of the new architecture.',
    },
    isLoading: false,
    permissions: readPersistedPermissions(),
    legacyTodayTask: cloneTodayTask(),
    legacySubmissions: defaultSubmissions.map((submission) => ({ ...submission })),
    legacyNotifications: defaultAppNotifications.map((notification) => ({ ...notification })),
    planUpdateNotifications: [],
    chatThreads: readPersistedChats(initialUsers, createDefaultChatThreads(initialUsers)),
    events: [
      {
        id: 'evt-1',
        title: 'AHG Summer Shred Challenge',
        description: 'Six weeks of structured intensity. Compete against the best in your city. Weekly check-ins, verified leaderboard, and real prizes for the top three finishers.',
        date: '2026-06-01T06:00:00.000Z',
        location: 'Mumbai, India',
        category: 'Competition',
        status: 'upcoming',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80',
        registrationOpen: true,
        formFields: [
          { id: 'ff-1', type: 'text', label: 'Full Name', placeholder: 'Your full name', required: true },
          { id: 'ff-2', type: 'email', label: 'Email Address', placeholder: 'you@example.com', required: true },
          { id: 'ff-3', type: 'phone', label: 'Phone Number', placeholder: '+91 XXXXX XXXXX', required: true },
          { id: 'ff-4', type: 'select', label: 'Experience Level', required: true, options: ['Beginner', 'Intermediate', 'Advanced'] },
          { id: 'ff-5', type: 'textarea', label: 'Why do you want to join?', placeholder: 'Tell us your motivation...', required: false },
        ],
        entries: [],
        createdAt: new Date().toISOString(),
        createdBy: 'hc-admin',
      },
      {
        id: 'evt-2',
        title: 'Nutrition Masterclass with Coach Aryan',
        description: 'A deep-dive workshop on performance nutrition, meal timing, and supplement science. Limited seats — only serious athletes.',
        date: '2026-05-15T09:00:00.000Z',
        location: 'Online (Zoom)',
        category: 'Workshop',
        status: 'upcoming',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80',
        registrationOpen: true,
        formFields: [
          { id: 'ff-1', type: 'text', label: 'Full Name', required: true },
          { id: 'ff-2', type: 'email', label: 'Email Address', required: true },
          { id: 'ff-3', type: 'radio', label: 'Diet Type', required: true, options: ['Vegetarian', 'Non-Vegetarian', 'Vegan'] },
        ],
        entries: [],
        createdAt: new Date().toISOString(),
        createdBy: 'hc-admin',
      },
    ],
  },
  session: initialSession,
};

// ========= ZUSTAND STORE CREATION =========
export const useAppStore = create<AppState & AppActions>((set, get) => ({
  ...initialState,

  // --- ACTIONS ---

  // Session
  login: (email, password, role) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPasswordHash = hashPassword(password);

    let isAuthenticated = false;
    set((state) => {
      const matchedUser = Object.values(state.users).find(
        (candidate) =>
          candidate.role === role &&
          candidate.email.trim().toLowerCase() === normalizedEmail &&
          candidate.passwordHash === normalizedPasswordHash
      ) as Student | Trainer | Admin | undefined;

      if (!matchedUser) {
        return state;
      }

      const user = matchedUser;
      let nextPlans = state.plans;

      if (role === 'student') {
        const studentUser = user as Student;
        if (studentUser.currentPlanId) {
          const existingPlan = state.plans[studentUser.currentPlanId];
          if (existingPlan && existingPlan.status !== 'active') {
            nextPlans = {
              ...state.plans,
              [existingPlan.id]: {
                ...existingPlan,
                status: 'active',
                reviewedAt: existingPlan.reviewedAt ?? new Date().toISOString(),
                reviewFeedback:
                  existingPlan.reviewFeedback ?? 'Automatically activated for direct student access.',
              },
            };
          }
        }
      }

      isAuthenticated = true;

      return {
        ...state,
        users: state.users[user.id]
          ? state.users
          : {
              ...state.users,
              [user.id]: user,
            },
        plans: nextPlans,
        session: { ...state.session, currentUser: user, isAuthenticated: true },
      };
    });

    return isAuthenticated;
  },
  logout: () =>
    set((state) => {
      clearPersistedSecurityState();
      return {
        ...state,
        session: { currentUser: null, isAuthenticated: false },
      };
    }),
  signup: async (userData) => {
    const baseUser = {
      id: createId('u'),
      name: userData.name,
      email: userData.email,
      passwordHash: hashPassword(userData.password),
      avatar: '',
    };

    const newUser: Student | Trainer =
      userData.role === 'student'
        ? {
            ...baseUser,
            role: 'student',
            collegeId: userData.collegeId ?? 'COL000',
            height: userData.height ?? 170,
            weight: userData.weight ?? 70,
            fitnessGoal: userData.fitnessGoal ?? 'General fitness',
            streak: 0,
            totalPlansCompleted: 0,
            followers: 0,
            following: 0,
            trainerId: null,
            currentPlanId: null,
            currentDay: 1,
            totalDays: 28,
            completionPercentage: 0,
            todaySteps: 0,
            rank: 999,
            badges: [],
            isBanned: false,
            warnings: 0,
            onboardingStatus: 'in_progress',
            onboardingStep: 1,
            taskCompletions: {},
          }
        : {
            ...baseUser,
            role: 'trainer',
            specialization: userData.specialization ?? 'General Fitness',
            experience: userData.experience ?? 0,
            certifications: userData.certifications ? [userData.certifications] : [],
            totalStudents: 0,
            activePlans: 0,
            isVerified: false,
          };

    set((state) => ({
      users: { ...state.users, [newUser.id]: newUser },
      session: { currentUser: newUser, isAuthenticated: true },
    }));
  },

  // Data Loading
  setLoading: (isLoading) =>
    set((state) => ({
      ...state,
      system: { ...state.system, isLoading },
    })),

  // Posts
  likePost: (postId) =>
    set((state) => {
      const post = state.posts[postId];
      if (!post) return state;
      const liked = !post.liked;
      const newPosts = {
        ...state.posts,
        [postId]: {
          ...post,
          liked,
          likes: liked ? post.likes + 1 : post.likes - 1,
        },
      };
      return { ...state, posts: newPosts };
    }),

  updatePostStatus: (postId, status) =>
    set((state) => {
      const post = state.posts[postId];
      if (!post) return state;
      const newPosts = { ...state.posts, [postId]: { ...post, status } };
      const log: ActivityLog = {
        id: `log-${Date.now()}-${postId}`,
        userId: state.session.currentUser?.id ?? 'system',
        action: 'content-moderation',
        timestamp: new Date().toISOString(),
        details: {
          postId,
          from: post.status,
          to: status,
        },
      };
      return {
        ...state,
        posts: newPosts,
        system: {
          ...state.system,
          activityLogs: [log, ...state.system.activityLogs],
        },
      };
    }),

  // Users
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

  banUser: (userId) =>
    set((state) => {
      const user = state.users[userId];
      if (!user || user.role !== 'student') return state;
      const student = user as Student;
      const nextBanned = !student.isBanned;
      const newUsers = {
        ...state.users,
        [userId]: { ...student, isBanned: nextBanned },
      };
      const log: ActivityLog = {
        id: `log-${Date.now()}-${userId}`,
        userId: state.session.currentUser?.id ?? 'system',
        action: nextBanned ? 'user-ban' : 'user-unban',
        timestamp: new Date().toISOString(),
        details: { userId, role: 'student' },
      };
      return {
        ...state,
        users: newUsers,
        system: {
          ...state.system,
          activityLogs: [log, ...state.system.activityLogs],
        },
      };
    }),

  verifyTrainer: (trainerId) =>
    set((state) => {
      const user = state.users[trainerId];
      if (!user || user.role !== 'trainer') return state;
      const trainer = user as Trainer;
      if (trainer.isVerified) return state;
      const newUsers = {
        ...state.users,
        [trainerId]: { ...trainer, isVerified: true },
      };
      const log: ActivityLog = {
        id: `log-${Date.now()}-${trainerId}`,
        userId: state.session.currentUser?.id ?? 'system',
        action: 'trainer-verified',
        timestamp: new Date().toISOString(),
        details: { trainerId },
      };
      return {
        ...state,
        users: newUsers,
        system: {
          ...state.system,
          activityLogs: [log, ...state.system.activityLogs],
        },
      };
    }),

  createPlan: ({ title, duration, goalType, difficulty, studentIds }) =>
    set((state) => {
      const trainer = state.session.currentUser?.role === 'trainer' ? (state.session.currentUser as Trainer) : null;
      const planId = `plan-${Date.now()}`;

      const plan: Plan = {
        id: planId,
        title,
        name: title,
        trainerId: trainer?.id,
        duration,
        goalType,
        difficulty,
        dailyTasks: [],
      };

      let nextUsers = state.users;
      for (const studentId of studentIds) {
        const user = nextUsers[studentId];
        if (!user || user.role !== 'student') continue;
        const student = user as Student;
        const updatedStudent: Student = {
          ...student,
          currentPlanId: planId,
          onboardingStatus: 'completed',
          currentDay: 1,
          totalDays: duration,
          completionPercentage: 0,
          taskCompletions: {},
          trainerId: student.trainerId,
        };
        nextUsers = {
          ...nextUsers,
          [studentId]: updatedStudent,
        };
      }

      let nextSessionUser = state.session.currentUser;
      if (trainer) {
        const updatedTrainer: Trainer = {
          ...trainer,
          activePlans: trainer.activePlans + 1,
        };
        nextUsers = {
          ...nextUsers,
          [updatedTrainer.id]: updatedTrainer,
        };
        nextSessionUser = updatedTrainer;
      }

      const log: ActivityLog = {
        id: `log-${Date.now()}-${planId}`,
        userId: trainer?.id ?? state.session.currentUser?.id ?? 'system',
        action: 'plan-created',
        timestamp: new Date().toISOString(),
        details: {
          planId,
          title,
          duration,
          goalType,
          difficulty,
          assignedStudents: studentIds,
        },
      };

      return {
        ...state,
        users: nextUsers,
        plans: {
          ...state.plans,
          [planId]: plan,
        },
        session: {
          ...state.session,
          currentUser: nextSessionUser,
        },
        system: {
          ...state.system,
          activityLogs: [log, ...state.system.activityLogs],
        },
      };
    }),

  saveOnboardingDraft: (studentId, payload, step) =>
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
        users: {
          ...state.users,
          [studentId]: updatedStudent,
        },
        session: {
          ...state.session,
          currentUser:
            state.session.currentUser?.id === studentId ? updatedStudent : state.session.currentUser,
        },
      };
    }),

  completeOnboardingAndGeneratePlan: (studentId, payload) => {
    const generatedPlan: Plan = {
      ...generateAutoPlan(studentId, payload),
      status: 'pending_trainer_approval',
    };

    set((state) => {
      const user = state.users[studentId];
      if (!user || user.role !== 'student') return state;

      const student = user as Student;
      const updatedStudent: Student = {
        ...student,
        onboardingDraft: payload,
        onboardingStep: 6,
        onboardingStatus: 'completed',
        currentPlanId: generatedPlan.id,
        currentDay: 1,
        totalDays: generatedPlan.duration ?? 30,
        completionPercentage: 0,
        taskCompletions: {},
      };

      const log: ActivityLog = {
        id: `log-${Date.now()}-${generatedPlan.id}`,
        userId: studentId,
        action: 'auto-plan-generated',
        timestamp: new Date().toISOString(),
        details: {
          planId: generatedPlan.id,
          status: generatedPlan.status,
          template: generatedPlan.templateKey,
        },
      };

      return {
        ...state,
        users: {
          ...state.users,
          [studentId]: updatedStudent,
        },
        plans: {
          ...state.plans,
          [generatedPlan.id]: generatedPlan,
        },
        session: {
          ...state.session,
          currentUser:
            state.session.currentUser?.id === studentId ? updatedStudent : state.session.currentUser,
        },
        system: {
          ...state.system,
          activityLogs: [log, ...state.system.activityLogs],
        },
      };
    });

    return generatedPlan;
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
        id: `log-${Date.now()}-${planId}-${decision}`,
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

  assignTrainer: (studentId, trainerId) =>
    set((state) => {
      const actor = state.session.currentUser;
      if (actor?.role !== 'admin') return state;

      const user = state.users[studentId];
      if (!user || user.role !== 'student') return state;
      const student = user as Student;

      const updatedStudent: Student = {
        ...student,
        trainerId,
      };

      const log: ActivityLog = {
        id: `log-${Date.now()}-assign-trainer-${studentId}`,
        userId: actor.id,
        action: 'trainer-assigned',
        timestamp: new Date().toISOString(),
        details: { studentId, trainerId },
      };

      return {
        ...state,
        users: {
          ...state.users,
          [studentId]: updatedStudent,
        },
        system: {
          ...state.system,
          activityLogs: [log, ...state.system.activityLogs],
        },
      };
    }),

  // Task submission approval flow
  approveTaskSubmission: (submissionId, note) =>
    set((state) => {
      const actor = state.session.currentUser;
      const actorRole = actor?.role;
      if (actorRole !== 'trainer' && actorRole !== 'admin') return state;
      const actorName = actor?.name ?? (actorRole === 'admin' ? 'Admin' : 'Trainer');

      const submission = state.system.legacySubmissions.find((s) => s.id === submissionId);
      if (!submission) return state;
      if (submission.status !== 'pending') return state;

      if (actorRole === 'trainer') {
        const studentRecord = submission.studentId ? state.users[submission.studentId] : null;
        const isStudentOwnedByTrainer =
          Boolean(studentRecord) &&
          studentRecord?.role === 'student' &&
          (studentRecord as Student).trainerId === actor?.id;
        const isTrainerExplicitlyAssigned = !submission.trainerId || submission.trainerId === actor?.id;

        if (!isStudentOwnedByTrainer || !isTrainerExplicitlyAssigned) {
          return state;
        }
      }

      const pointsAwarded = submission.points ?? 50;

      // Award points to student
      let nextUsers = state.users;
      const studentUser = state.users[submission.studentId];
      if (studentUser && studentUser.role === 'student') {
        const student = studentUser as Student;
        const completionUpdatedStudent = completeStudentTaskByApproval(student, state.plans, {
          taskId: submission.taskId,
          dayNumber: submission.dayNumber,
        });
        const updatedStudent: Student = {
          ...completionUpdatedStudent,
          totalPoints: (completionUpdatedStudent.totalPoints ?? 0) + pointsAwarded,
        };
        nextUsers = { ...nextUsers, [student.id]: updatedStudent };
      }

      let nextPosts = state.posts;
      if (submission.postId && state.posts[submission.postId]) {
        nextPosts = {
          ...state.posts,
          [submission.postId]: {
            ...state.posts[submission.postId],
            status: 'visible',
          },
        };
      }

      // Add approval notification to student
      const newNotif: NotificationItem = {
        id: createId('notif-approval'),
        message: `${actorName} approved your proof for "${submission.taskName}". +${pointsAwarded} pts awarded.`,
        icon: 'check-circle',
        type: 'trainer',
        userName: actorName,
        action: `approved your task proof for "${submission.taskName}"`,
        timestamp: 'Just now',
        read: false,
      };

      const systemNotif: SystemNotification = {
        id: createId('sys-approval'),
        title: 'Task Proof Approved',
        message: `${actorName} accepted your ${submission.taskType ?? 'task'} proof for ${submission.taskName}.`,
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false,
      };
      return {
        ...state,
        users: nextUsers,
        posts: nextPosts,
        system: {
          ...state.system,
          legacySubmissions: state.system.legacySubmissions.map((s) =>
            s.id === submissionId
              ? { ...s, status: 'approved' as const, trainerNote: note ?? s.trainerNote }
              : s
          ),
          notifications: [systemNotif, ...state.system.notifications],
          legacyNotifications: [newNotif, ...state.system.legacyNotifications],
        },
      };
    }),

  rejectTaskSubmission: (submissionId, note) =>
    set((state) => {
      const actor = state.session.currentUser;
      const actorRole = actor?.role;
      if (actorRole !== 'trainer' && actorRole !== 'admin') return state;
      const actorName = actor?.name ?? (actorRole === 'admin' ? 'Admin' : 'Trainer');

      const submission = state.system.legacySubmissions.find((s) => s.id === submissionId);
      if (!submission) return state;
      if (submission.status !== 'pending') return state;

      if (actorRole === 'trainer') {
        const studentRecord = submission.studentId ? state.users[submission.studentId] : null;
        const isStudentOwnedByTrainer =
          Boolean(studentRecord) &&
          studentRecord?.role === 'student' &&
          (studentRecord as Student).trainerId === actor?.id;
        const isTrainerExplicitlyAssigned = !submission.trainerId || submission.trainerId === actor?.id;

        if (!isStudentOwnedByTrainer || !isTrainerExplicitlyAssigned) {
          return state;
        }
      }

      const newNotif: NotificationItem = {
        id: createId('notif-reject'),
        message: `${actorName} requested changes for "${submission.taskName}": ${note}`,
        icon: 'x-circle',
        type: 'trainer',
        userName: actorName,
        action: `requested changes on "${submission.taskName}"`,
        timestamp: 'Just now',
        read: false,
      };

      const systemNotif: SystemNotification = {
        id: createId('sys-reject'),
        title: 'Task Proof Needs Changes',
        message: `${actorName} asked for changes on your proof for ${submission.taskName}.`,
        type: 'warning',
        timestamp: new Date().toISOString(),
        read: false,
      };
      return {
        ...state,
        posts:
          submission.postId && state.posts[submission.postId]
            ? {
                ...state.posts,
                [submission.postId]: {
                  ...state.posts[submission.postId],
                  status: 'under-review',
                },
              }
            : state.posts,
        system: {
          ...state.system,
          legacySubmissions: state.system.legacySubmissions.map((s) =>
            s.id === submissionId
              ? { ...s, status: 'rejected' as const, trainerNote: note }
              : s
          ),
          notifications: [systemNotif, ...state.system.notifications],
          legacyNotifications: [newNotif, ...state.system.legacyNotifications],
        },
      };
    }),

  submitTaskProof: ({ taskId, taskType, dayNumber, taskName, mediaUrl, caption, location }) =>
    set((state) => {
      const actor = state.session.currentUser;
      if (!actor || actor.role !== 'student') return state;

      const actorUser = state.users[actor.id];
      if (!actorUser || actorUser.role !== 'student') return state;
      const student = actorUser as Student;

      const postId = createId('post-proof');
      const submissionId = createId('sub-proof');
      const timeStamp = new Date().toISOString();

      const postCaption =
        caption?.trim() ||
        `Proof submission: ${taskType === 'workout' ? 'Workout' : 'Nutrition'} task · Day ${dayNumber}`;

      const proofPost: Post = {
        id: postId,
        userId: student.id,
        userName: student.name,
        userAvatar: student.avatar,
        userRole: 'student',
        type: 'image',
        mediaUrl,
        caption: postCaption,
        likes: 0,
        comments: 0,
        location: location?.trim() || 'Campus',
        timestamp: timeStamp,
        liked: false,
        status: 'under-review',
      };

      const proofSubmission: LegacySubmission = {
        id: submissionId,
        studentId: student.id,
        studentName: student.name,
        trainerId: student.trainerId ?? undefined,
        taskName,
        taskType,
        taskId,
        dayNumber,
        postId,
        requiresApproval: true,
        timestamp: new Date().toLocaleString(),
        status: 'pending',
        mediaUrl,
        trainerNote: '',
        points: taskType === 'workout' ? 60 : 45,
      };

      return {
        ...state,
        posts: {
          ...state.posts,
          [postId]: proofPost,
        },
        system: {
          ...state.system,
          legacySubmissions: [proofSubmission, ...state.system.legacySubmissions],
        },
      };
    }),

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
    let threadId: string | null = null;
    set((state) => {
      const actor = state.session.currentUser;
      if (!actor) return state;
      if (!state.users[targetUserId] || targetUserId === actor.id) return state;

      const participants = [actor.id, targetUserId].sort();
      const existing = state.system.chatThreads.find(
        (thread) =>
          thread.participantIds.length === 2 &&
          thread.participantIds[0] === participants[0] &&
          thread.participantIds[1] === participants[1]
      );

      if (existing) {
        threadId = existing.id;
        return state;
      }

      const now = new Date().toISOString();
      threadId = buildDirectThreadId(participants[0], participants[1]);
      const newThread: ChatThread = {
        id: threadId,
        participantIds: participants,
        messages: [],
        updatedAt: now,
        unreadBy: [],
      };

      return {
        ...state,
        system: {
          ...state.system,
          chatThreads: [newThread, ...state.system.chatThreads],
        },
      };
    });

    return threadId;
  },

  sendChatMessage: ({ threadId, recipientId, text, reelPostId, voiceSeconds, voiceAudioUrl }) =>
    set((state) => {
      const actor = state.session.currentUser;
      if (!actor) return state;

      let targetThread = threadId
        ? state.system.chatThreads.find((thread) => thread.id === threadId)
        : undefined;

      if (!targetThread && recipientId) {
        const participants = [actor.id, recipientId].sort();
        targetThread = state.system.chatThreads.find(
          (thread) =>
            thread.participantIds.length === 2 &&
            thread.participantIds[0] === participants[0] &&
            thread.participantIds[1] === participants[1]
        );
      }

      if (!targetThread && recipientId && state.users[recipientId]) {
        targetThread = {
          id: buildDirectThreadId(actor.id, recipientId),
          participantIds: [actor.id, recipientId].sort(),
          messages: [],
          updatedAt: new Date().toISOString(),
          unreadBy: [],
        };
      }

      if (!targetThread || !targetThread.participantIds.includes(actor.id)) {
        return state;
      }

      const normalizedText = text?.trim() ?? '';
      const reel = reelPostId ? state.posts[reelPostId] : null;
      const hasValidReel = Boolean(reel && reel.type === 'reel');
      const normalizedVoiceSeconds = Math.max(0, Math.floor(voiceSeconds ?? 0));
      const normalizedVoiceAudioUrl = voiceAudioUrl?.trim();
      const hasVoiceNote =
        normalizedVoiceSeconds > 0 &&
        Boolean(normalizedVoiceAudioUrl) &&
        normalizedVoiceAudioUrl.length <= MAX_VOICE_DATA_URL_LENGTH;

      if (!normalizedText && !hasValidReel && !hasVoiceNote) {
        return state;
      }

      const now = new Date().toISOString();
      const message: ChatMessage = {
        id: createId('chat-msg'),
        senderId: actor.id,
        text: hasVoiceNote ? normalizedText || 'Voice note' : normalizedText || 'Shared a reel',
        createdAt: now,
        type: hasVoiceNote ? 'voice-note' : hasValidReel ? 'reel-share' : 'text',
        seenBy: [actor.id],
        voiceSeconds: hasVoiceNote ? normalizedVoiceSeconds : undefined,
        voiceAudioUrl: hasVoiceNote ? normalizedVoiceAudioUrl : undefined,
        reelPostId: hasValidReel ? reelPostId : undefined,
        reelPreviewUrl: hasValidReel ? reel?.mediaUrl : undefined,
        reelCaption: hasValidReel ? reel?.caption : undefined,
      };

      const nextThread: ChatThread = {
        ...targetThread,
        messages: [...targetThread.messages, message],
        updatedAt: now,
        unreadBy: targetThread.participantIds.filter((id) => id !== actor.id),
      };

      const existingIndex = state.system.chatThreads.findIndex((thread) => thread.id === targetThread.id);
      const nextThreads = [...state.system.chatThreads];
      if (existingIndex >= 0) {
        nextThreads.splice(existingIndex, 1);
      }
      nextThreads.unshift(nextThread);

      const sanitizedThreads = sanitizeChatThreads(nextThreads);

      return {
        ...state,
        system: {
          ...state.system,
          chatThreads: sanitizedThreads,
        },
      };
    }),

  markChatThreadRead: (threadId) =>
    set((state) => {
      const actorId = state.session.currentUser?.id;
      if (!actorId) return state;

      const targetIndex = state.system.chatThreads.findIndex((thread) => thread.id === threadId);
      if (targetIndex < 0) return state;

      const targetThread = state.system.chatThreads[targetIndex];
      const hasUnread = targetThread.unreadBy.includes(actorId);
      const hasUnseenMessages = targetThread.messages.some(
        (message) => !message.seenBy.includes(actorId)
      );

      // No-op if this thread is already fully marked read for the active user.
      if (!hasUnread && !hasUnseenMessages) {
        return state;
      }

      const updatedThread: ChatThread = {
        ...targetThread,
        unreadBy: targetThread.unreadBy.filter((id) => id !== actorId),
        messages: targetThread.messages.map((message) =>
          message.seenBy.includes(actorId)
            ? message
            : { ...message, seenBy: [...message.seenBy, actorId] }
        ),
      };

      const nextThreads = [...state.system.chatThreads];
      nextThreads[targetIndex] = updatedThread;

      return {
        ...state,
        system: {
          ...state.system,
          chatThreads: nextThreads,
        },
      };
    }),

  markPlanNotificationRead: (notificationId) =>
    set((state) => ({
      ...state,
      system: {
        ...state.system,
        planUpdateNotifications: state.system.planUpdateNotifications.map((n) =>
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

  setRolePermission: (role, permission, allowed) =>
    set((state) => {
      if (role === 'admin') {
        return state;
      }

      const previous = state.system.permissions[role][permission];
      const nextPermissions = enforceAdminFullAccess({
        ...state.system.permissions,
        [role]: {
          ...state.system.permissions[role],
          [permission]: allowed,
        },
      });
      persistPermissions(nextPermissions);

      const log: ActivityLog = {
        id: `log-${Date.now()}-${role}-${permission}`,
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
    }),

  resetPermissions: () =>
    set((state) => {
      const nextPermissions = enforceAdminFullAccess(clonePermissions(defaultPermissions));
      persistPermissions(nextPermissions);

      const log: ActivityLog = {
        id: `log-${Date.now()}-permissions-reset`,
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
    }),

  // Events CRUD
  createEvent: (eventData) =>
    set((state) => ({
      ...state,
      system: {
        ...state.system,
        events: [
          ...state.system.events,
          {
            ...eventData,
            id: `evt-${Date.now()}`,
            entries: [],
            createdAt: new Date().toISOString(),
          },
        ],
      },
    })),

  updateEvent: (eventId, updates) =>
    set((state) => ({
      ...state,
      system: {
        ...state.system,
        events: state.system.events.map((e) =>
          e.id === eventId ? { ...e, ...updates } : e
        ),
      },
    })),

  deleteEvent: (eventId) =>
    set((state) => ({
      ...state,
      system: {
        ...state.system,
        events: state.system.events.filter((e) => e.id !== eventId),
      },
    })),

  submitEventEntry: (eventId, responses) =>
    set((state) => {
      const entry: EventEntry = {
        id: `entry-${Date.now()}`,
        eventId,
        submittedAt: new Date().toISOString(),
        responses,
      };
      return {
        ...state,
        system: {
          ...state.system,
          events: state.system.events.map((e) =>
            e.id === eventId ? { ...e, entries: [...e.entries, entry] } : e
          ),
        },
      };
    }),
}));

useAppStore.subscribe((state) => {
  persistUsers(state.users);
  persistSession(state.session);
  persistChats(state.system.chatThreads);
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
export const useIsLoading = () => useAppStore((state) => state.system.isLoading);

export const useUsers = () => useAppStore((state) => state.users);
export const usePosts = () => useAppStore((state) => state.posts);
export const usePlans = () => useAppStore((state) => state.plans);

export const useSystem = () => useAppStore((state) => state.system);
export const usePermissions = () => useAppStore((state) => state.system.permissions);

// ========= LEGACY COMPAT LAYER =========
// Keeps existing student/trainer pages working while the app is migrated to normalized state.

const normalizeStudent = (candidate: Partial<Student> & Pick<User, 'id' | 'name' | 'email' | 'passwordHash' | 'avatar'>): Student => ({
  id: candidate.id,
  name: candidate.name,
  email: candidate.email,
  passwordHash: candidate.passwordHash ?? hashPassword('changeme'),
  avatar: candidate.avatar ?? '',
  role: 'student',
  collegeId: candidate.collegeId ?? 'COL000',
  height: candidate.height ?? 170,
  weight: candidate.weight ?? 70,
  fitnessGoal: candidate.fitnessGoal ?? 'General fitness',
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
  rank: candidate.rank ?? 999,
  badges: candidate.badges ?? [],
  isBanned: candidate.isBanned ?? false,
  warnings: candidate.warnings ?? 0,
  onboardingStatus: candidate.onboardingStatus ?? 'not_started',
  onboardingStep: candidate.onboardingStep ?? 1,
  onboardingDraft: candidate.onboardingDraft,
  taskCompletions: candidate.taskCompletions ?? {},
});

const normalizeTrainer = (candidate: Partial<Trainer> & Pick<User, 'id' | 'name' | 'email' | 'passwordHash' | 'avatar'>): Trainer => ({
  id: candidate.id,
  name: candidate.name,
  email: candidate.email,
  passwordHash: candidate.passwordHash ?? hashPassword('changeme'),
  avatar: candidate.avatar ?? '',
  role: 'trainer',
  specialization: candidate.specialization ?? 'General',
  experience: candidate.experience ?? 0,
  certifications: candidate.certifications ?? [],
  totalStudents: candidate.totalStudents ?? 0,
  activePlans: candidate.activePlans ?? 0,
  isVerified: candidate.isVerified ?? false,
});

export const useStore = () => {
  const state = useAppStore();
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
      id: 's-fallback',
      name: 'Student',
      email: 'student@test.com',
      passwordHash: hashPassword('student123'),
      avatar: '',
    });

  const trainer =
    (state.session.currentUser?.role === 'trainer'
      ? normalizeTrainer(state.session.currentUser as Trainer)
      : normalizedTrainers[0]) ??
    normalizeTrainer({
      id: 't-fallback',
      name: 'Coach',
      email: 'trainer@test.com',
      passwordHash: hashPassword('trainer123'),
      avatar: '',
      totalStudents: normalizedStudents.length,
      isVerified: true,
    });

  const leaderboard = normalizedStudents
    .map((s) => ({
      userId: s.id,
      name: s.name,
      avatar: s.avatar,
      score: s.completionPercentage * 100 + s.streak * 10,
      streak: s.streak,
      steps: s.todaySteps,
      uploads: Math.max(1, Math.floor(s.totalPlansCompleted * 3)),
      completionPercentage: s.completionPercentage,
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));

  const students = normalizedStudents.map((s) => ({
    userId: s.id,
    name: s.name,
    streak: s.streak,
    rank: s.rank,
    completionPercentage: s.completionPercentage,
  }));

  const suggestedUsers = normalizedStudents.map((s) => ({
    ...s,
    mutualFriends: Math.max(2, Math.floor((s.followers + s.following) / 25)),
  }));

  const notifications = state.system.legacyNotifications;
  const currentStudentPlan = student.currentPlanId ? state.plans[student.currentPlanId] : null;
  const autoGeneratedPlansQueue = Object.values(state.plans).filter((plan) => plan.type === 'auto_generated');
  const getDayTask = (dayNumber: number) => buildTodayTaskFromPlan(student, currentStudentPlan, dayNumber);
  const todayTask = getDayTask(student.currentDay);
  const weeklyData = Array.from({ length: 7 }, (_, index) => {
    const day = index + 1;
    const absoluteDay = Math.min(student.totalDays, Math.max(1, student.currentDay - ((student.currentDay - 1) % 7) + index));
    const dayTask = getDayTask(absoluteDay);
    const total = dayTask.workout.length + dayTask.diet.length;
    const done = dayTask.workout.filter((item) => item.completed).length + dayTask.diet.filter((item) => item.completed).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return {
      name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
      uv: percent,
    };
  });
  const onboardingRequired = student.onboardingStatus !== 'completed';
  const canStartCurrentPlan = Boolean(!currentStudentPlan || currentStudentPlan.status === 'active');

  return {
    student,
    trainer,
    students,
    leaderboard,
    todayTask,
    getDayTask,
    weeklyData,
    posts: allPosts,
    loading: state.system.isLoading,
    notifications,
    submissions: state.system.legacySubmissions,
    currentStudentPlan,
    autoGeneratedPlansQueue,
    onboardingRequired,
    canStartCurrentPlan,
    suggestedUsers,
    setLoading: state.setLoading,
    likePost: state.likePost,
    submitTaskProof: state.submitTaskProof,
    updateProfile: (data: Partial<Student>) => state.updateUser(student.id, data),
    followUser: (targetUserId: string) => {
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
    addComment: (postId: string, comment: string) => {
      if (!comment.trim()) return;
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
                id: `sub-${Date.now()}`,
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
    addPost: (post: Partial<Post>) => {
      const id = `post-${Date.now()}`;
      useAppStore.setState((prev) => ({
        posts: {
          ...prev.posts,
          [id]: {
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
            timestamp: new Date().toISOString(),
            liked: false,
            status: 'visible',
          },
        },
      }));
    },
    reviewSubmission: (submissionId: string, status: 'approved' | 'rejected', note?: string) => {
      useAppStore.setState((prev) => ({
        ...prev,
        system: {
          ...prev.system,
          legacySubmissions: prev.system.legacySubmissions.map((submission) =>
            submission.id === submissionId
              ? {
                  ...submission,
                  status,
                  trainerNote: note ?? submission.trainerNote,
                }
              : submission
          ),
        },
      }));
    },
    markNotificationRead: (notificationId: string) => {
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

export default useStore;
