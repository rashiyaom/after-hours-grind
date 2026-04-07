import { create } from 'zustand';
import {
  Admin,
  Student,
  Trainer,
  Post,
  Plan,
  SystemNotification,
  ActivityLog,
  AppVersion,
  User,
  UserRole,
  PermissionKey,
  PermissionMatrix,
  NotificationItem,
} from '@/types';
import {
  mockUsers,
  mockPosts,
  mockPlans,
  mockNotifications,
  mockActivityLogs,
} from '@/data/mockData';

type LegacyTodayTask = {
  stepTarget: number;
  hydrationGoal: string;
  workout: Array<{ id: string; name: string; sets: number; reps: number; rest: string; completed: boolean }>;
  diet: Array<{ id: string; meal: string; description: string; time: string; calories: number; completed: boolean }>;
};

type LegacySubmission = {
  id: string;
  studentId: string;
  studentName: string;
  taskName: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  mediaUrl: string;
  trainerNote: string;
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
    { id: 'w1', name: 'Incline Dumbbell Press', sets: 4, reps: 12, rest: '60s', completed: true },
    { id: 'w2', name: 'Cable Fly', sets: 3, reps: 15, rest: '45s', completed: false },
    { id: 'w3', name: 'Overhead Triceps Extension', sets: 3, reps: 12, rest: '45s', completed: false },
    { id: 'w4', name: 'Push-ups', sets: 3, reps: 20, rest: '30s', completed: false },
  ],
  diet: [
    { id: 'd1', meal: 'Breakfast', description: 'Oats + eggs + fruit', time: '08:00', calories: 520, completed: true },
    { id: 'd2', meal: 'Lunch', description: 'Chicken + rice + salad', time: '13:30', calories: 680, completed: false },
    { id: 'd3', meal: 'Snack', description: 'Greek yogurt + nuts', time: '17:00', calories: 320, completed: false },
    { id: 'd4', meal: 'Dinner', description: 'Paneer + veggies + roti', time: '20:30', calories: 610, completed: false },
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
  workout: defaultTodayTask.workout.map((item) => ({ ...item })),
  diet: defaultTodayTask.diet.map((item) => ({ ...item })),
});

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
  };

  // Session State
  session: {
    currentUser: User | null;
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

const PERMISSIONS_STORAGE_KEY = 'ah_permissions_v1';

const clonePermissions = (source: PermissionMatrix): PermissionMatrix => ({
  student: { ...source.student },
  trainer: { ...source.trainer },
  admin: { ...source.admin },
});

const readPersistedPermissions = (): PermissionMatrix => {
  if (typeof window === 'undefined') return clonePermissions(defaultPermissions);
  try {
    const raw = window.localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (!raw) return clonePermissions(defaultPermissions);
    const parsed = JSON.parse(raw) as Partial<PermissionMatrix>;
    return {
      student: { ...defaultPermissions.student, ...(parsed.student ?? {}) },
      trainer: { ...defaultPermissions.trainer, ...(parsed.trainer ?? {}) },
      admin: { ...defaultPermissions.admin, ...(parsed.admin ?? {}) },
    };
  } catch {
    return clonePermissions(defaultPermissions);
  }
};

const persistPermissions = (permissions: PermissionMatrix) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(permissions));
  } catch {
    // Ignore localStorage write failures in restricted environments.
  }
};

// ========= INITIAL STATE =========
const initialState: AppState = {
  users: mockUsers.reduce((acc, user) => ({ ...acc, [user.id]: user }), {}),
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
  },
  session: {
    currentUser: null,
    isAuthenticated: false,
  },
};

// ========= ZUSTAND STORE CREATION =========
export const useAppStore = create<AppState & AppActions>((set, get) => ({
  ...initialState,

  // --- ACTIONS ---

  // Session
  login: (email, password, role) => {
    const user = Object.values(get().users).find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password &&
        u.role === role
    );
    if (user) {
      set((state) => ({
        ...state,
        session: { ...state.session, currentUser: user, isAuthenticated: true },
      }));
      return true;
    }
    return false;
  },
  logout: () =>
    set({
      session: { currentUser: null, isAuthenticated: false },
    }),
  signup: async (userData) => {
    const baseUser = {
      id: `u${Date.now()}`,
      name: userData.name,
      email: userData.email,
      password: userData.password,
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
      const newUsers = { ...state.users, [userId]: { ...user, ...data } };
      return { ...state, users: newUsers };
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
          currentDay: 1,
          totalDays: duration,
          completionPercentage: 0,
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
      const previous = state.system.permissions[role][permission];
      const nextPermissions: PermissionMatrix = {
        ...state.system.permissions,
        [role]: {
          ...state.system.permissions[role],
          [permission]: allowed,
        },
      };
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
      const nextPermissions = clonePermissions(defaultPermissions);
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
}));

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

const normalizeStudent = (candidate: Partial<Student> & Pick<User, 'id' | 'name' | 'email' | 'password' | 'avatar'>): Student => ({
  id: candidate.id,
  name: candidate.name,
  email: candidate.email,
  password: candidate.password ?? '',
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
});

const normalizeTrainer = (candidate: Partial<Trainer> & Pick<User, 'id' | 'name' | 'email' | 'password' | 'avatar'>): Trainer => ({
  id: candidate.id,
  name: candidate.name,
  email: candidate.email,
  password: candidate.password ?? '',
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
      password: 'student123',
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
      password: 'trainer123',
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

  return {
    student,
    trainer,
    students,
    leaderboard,
    todayTask: state.system.legacyTodayTask,
    weeklyData: defaultWeeklyData,
    posts: allPosts,
    loading: state.system.isLoading,
    notifications,
    submissions: state.system.legacySubmissions,
    suggestedUsers,
    setLoading: state.setLoading,
    likePost: state.likePost,
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
    completeTask: (type: 'workout' | 'diet', itemId: string) => {
      useAppStore.setState((prev) => {
        const actor = prev.session.currentUser;
        let changed = false;
        const nextTodayTask: LegacyTodayTask = {
          ...prev.system.legacyTodayTask,
          [type]: prev.system.legacyTodayTask[type].map((item) => {
            if (item.id !== itemId || item.completed) return item;
            changed = true;
            return { ...item, completed: true };
          }),
        };
        if (!changed) return prev;

        if (!actor || actor.role !== 'student') {
          return {
            ...prev,
            system: {
              ...prev.system,
              legacyTodayTask: nextTodayTask,
            },
          };
        }

        const totalTasks = nextTodayTask.workout.length + nextTodayTask.diet.length;
        const completedTasks =
          nextTodayTask.workout.filter((item) => item.completed).length +
          nextTodayTask.diet.filter((item) => item.completed).length;
        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const studentUser = prev.users[actor.id];
        if (!studentUser || studentUser.role !== 'student') {
          return {
            ...prev,
            system: { ...prev.system },
          };
        }

        const updatedStudent: Student = {
          ...(studentUser as Student),
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
          system: {
            ...prev.system,
            legacyTodayTask: nextTodayTask,
          },
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
      mediaUrl?: string;
      trainerNote?: string;
    }) => {
      useAppStore.setState((prev) => ({
        ...prev,
        system: {
          ...prev.system,
          legacySubmissions: [
        {
          id: `sub-${Date.now()}`,
          studentId: submission.studentId ?? student.id,
          studentName: submission.studentName ?? student.name,
          taskName: submission.taskName ?? 'Check-in',
          timestamp: new Date().toLocaleString(),
          status: 'pending' as const,
          mediaUrl: submission.mediaUrl ?? '',
          trainerNote: submission.trainerNote ?? '',
        },
            ...prev.system.legacySubmissions,
          ],
        },
      }));
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
            type: (post.type as Post['type']) ?? 'image',
            mediaUrl: post.mediaUrl ?? '',
            caption: post.caption ?? '',
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
  };
};

export default useStore;
