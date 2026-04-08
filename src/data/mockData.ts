import {
  Student,
  Trainer,
  Admin,
  User,
  Plan,
  Post,
  SystemNotification,
  ActivityLog,
} from "@/types";
import { hashPassword } from "@/lib/auth";

// ============================================================================
// MOCK USERS (STUDENTS, TRAINERS, ADMINS)
// ============================================================================

const students: Student[] = [
  {
    id: "s1",
    name: "Arjun Mehta",
    email: "arjun@test.com",
    passwordHash: hashPassword("student123"),
    avatar: "",
    role: "student",
    collegeId: "COL2024051",
    height: 178,
    weight: 74,
    fitnessGoal: "Build lean muscle",
    streak: 12,
    totalPlansCompleted: 3,
    followers: 248,
    following: 156,
    trainerId: "t1",
    currentPlanId: "p1",
    currentDay: 7,
    totalDays: 28,
    completionPercentage: 78,
    todaySteps: 8432,
    rank: 4,
    badges: [],
    isBanned: false,
    warnings: 0,
    onboardingStatus: "completed",
    onboardingStep: 6,
  },
  {
    id: "s2",
    name: "Priya Sharma",
    email: "priya@test.com",
    passwordHash: hashPassword("student123"),
    avatar: "",
    role: "student",
    collegeId: "COL2024052",
    height: 165,
    weight: 58,
    fitnessGoal: "Improve endurance",
    streak: 25,
    totalPlansCompleted: 5,
    followers: 450,
    following: 200,
    trainerId: "t2",
    currentPlanId: "p2",
    currentDay: 15,
    totalDays: 30,
    completionPercentage: 90,
    todaySteps: 12000,
    rank: 1,
    badges: [],
    isBanned: false,
    warnings: 1,
    onboardingStatus: "completed",
    onboardingStep: 6,
  },
];

const trainers: Trainer[] = [
  {
    id: "t1",
    name: "Coach Vikram",
    email: "vikram@test.com",
    passwordHash: hashPassword("trainer123"),
    avatar: "",
    role: "trainer",
    specialization: "Strength & Conditioning",
    experience: 8,
    certifications: ["NSCA-CSCS", "ACE-CPT"],
    totalStudents: 24,
    activePlans: 18,
    isVerified: true,
  },
  {
    id: "t2",
    name: "Coach Maya",
    email: "maya@test.com",
    passwordHash: hashPassword("trainer123"),
    avatar: "",
    role: "trainer",
    specialization: "Yoga & Mobility",
    experience: 5,
    certifications: ["RYT-500", "FMS"],
    totalStudents: 15,
    activePlans: 10,
    isVerified: false,
  },
];

const admins: Admin[] = [
  {
    id: "a1",
    name: "Admin User",
    email: "admin@test.com",
    passwordHash: hashPassword("admin123"),
    avatar: "",
    role: "admin",
    permissions: ["manage-users", "view-reports", "moderate-content"],
  },
];

export const mockUsers: User[] = [...students, ...trainers, ...admins];

// ============================================================================
// MOCK POSTS
// ============================================================================

export const mockPosts: Post[] = [
  {
    id: "post1",
    userId: "s1",
    userName: "Arjun Mehta",
    userAvatar: "",
    userRole: "student",
    type: "image",
    mediaUrl: "",
    caption: "Crushed my workout today! #fitness #gym",
    likes: 15,
    comments: 4,
    location: "University Gym",
    timestamp: "2026-04-07T10:00:00Z",
    liked: false,
    status: "visible",
  },
  {
    id: "post2",
    userId: "s2",
    userName: "Priya Sharma",
    userAvatar: "",
    userRole: "student",
    type: "video",
    mediaUrl: "",
    caption: "New PR on my run! Feeling amazing.",
    likes: 32,
    comments: 8,
    location: "City Park",
    timestamp: "2026-04-06T18:30:00Z",
    liked: true,
    status: "under-review",
  },
  {
    id: "post3",
    userId: "t1",
    userName: "Coach Vikram",
    userAvatar: "",
    userRole: "trainer",
    type: "image",
    mediaUrl: "",
    caption: "Client spotlight! Arjun is making incredible progress.",
    likes: 50,
    comments: 12,
    location: "Training Center",
    timestamp: "2026-04-05T12:00:00Z",
    liked: false,
    status: "visible",
  },
];

// ============================================================================
// MOCK PLANS
// ============================================================================

export const mockPlans: Plan[] = [
  {
    id: "p1",
    title: "Beginner Strength",
    trainerId: "t1",
    duration: 28,
    goalType: "Strength",
    difficulty: "beginner",
    dailyTasks: [],
  },
  {
    id: "p2",
    title: "Endurance Builder",
    trainerId: "t2",
    duration: 30,
    goalType: "Endurance",
    difficulty: "intermediate",
    dailyTasks: [],
  },
];

// ============================================================================
// MOCK SYSTEM NOTIFICATIONS & ACTIVITY LOGS
// ============================================================================

export const mockNotifications: SystemNotification[] = [
  {
    id: "sys-notif-1",
    title: "New Feature Unlocked",
    message: "You can now track your water intake directly from the dashboard.",
    type: "info",
    timestamp: "2026-04-07T08:00:00Z",
    read: false,
  },
  {
    id: "sys-notif-2",
    title: "Content Policy Violation",
    message: "Your recent post has been flagged for review. Please ensure your content adheres to community guidelines.",
    type: "warning",
    timestamp: "2026-04-06T20:00:00Z",
    read: true,
  },
];

export const mockActivityLogs: ActivityLog[] = [
  {
    id: "log1",
    userId: "s1",
    action: "user-login",
    timestamp: "2026-04-07T09:00:00Z",
    details: { ip: "192.168.1.1", device: "iPhone 15" },
  },
  {
    id: "log2",
    userId: "a1",
    action: "content-moderation",
    timestamp: "2026-04-06T20:05:00Z",
    details: { postId: "post2", decision: "set-under-review" },
  },
  {
    id: "log3",
    userId: "t1",
    action: "plan-assignment",
    timestamp: "2026-04-01T11:00:00Z",
    details: { studentId: "s1", planId: "p1" },
  },
];

