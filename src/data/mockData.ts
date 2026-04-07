import { Student, Trainer, DailyTask, Post, LeaderboardEntry, NotificationItem, Badge, WeeklyData, Submission } from "@/types";

export const currentStudent: Student = {
  id: "s1",
  name: "Arjun Mehta",
  email: "arjun@college.edu",
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
  badges: [
    { id: "b1", name: "7-Day Warrior", description: "Complete 7 consecutive days", icon: "flame", earned: true, earnedDate: "2024-03-10" },
    { id: "b2", name: "Step Master", description: "Hit 10K steps in a day", icon: "footprints", earned: true, earnedDate: "2024-03-08" },
    { id: "b3", name: "Iron Will", description: "Complete 28-day plan", icon: "trophy", earned: false },
    { id: "b4", name: "Social Star", description: "Get 50 likes on a post", icon: "star", earned: true, earnedDate: "2024-03-05" },
    { id: "b5", name: "Early Bird", description: "Log workout before 7 AM", icon: "sunrise", earned: false },
    { id: "b6", name: "Diet Disciplined", description: "Follow diet plan 14 days straight", icon: "salad", earned: true, earnedDate: "2024-03-12" },
  ],
};

export const currentTrainer: Trainer = {
  id: "t1",
  name: "Coach Vikram",
  email: "vikram@college.edu",
  avatar: "",
  role: "trainer",
  specialization: "Strength & Conditioning",
  experience: 8,
  certifications: ["NSCA-CSCS", "ACE-CPT", "Precision Nutrition L1"],
  totalStudents: 24,
  activePlans: 18,
};

export const todayTask: DailyTask = {
  id: "dt7",
  dayNumber: 7,
  workout: [
    { id: "w1", name: "Barbell Bench Press", sets: 4, reps: "8-10", rest: "90s", completed: true },
    { id: "w2", name: "Incline Dumbbell Press", sets: 3, reps: "10-12", rest: "60s", completed: true },
    { id: "w3", name: "Cable Flyes", sets: 3, reps: "12-15", rest: "45s", completed: false },
    { id: "w4", name: "Overhead Tricep Extension", sets: 3, reps: "10-12", rest: "60s", completed: false },
    { id: "w5", name: "Dips", sets: 3, reps: "To failure", rest: "60s", completed: false },
  ],
  diet: [
    { id: "d1", meal: "Breakfast", description: "Oats + banana + whey protein shake", calories: 450, time: "7:30 AM", completed: true },
    { id: "d2", meal: "Mid-Morning", description: "Almonds + apple", calories: 200, time: "10:00 AM", completed: true },
    { id: "d3", meal: "Lunch", description: "Chicken breast + brown rice + vegetables", calories: 600, time: "1:00 PM", completed: false },
    { id: "d4", meal: "Pre-Workout", description: "Banana + black coffee", calories: 150, time: "4:30 PM", completed: false },
    { id: "d5", meal: "Post-Workout", description: "Whey protein + peanut butter toast", calories: 400, time: "6:30 PM", completed: false },
    { id: "d6", meal: "Dinner", description: "Paneer tikka + roti + salad", calories: 550, time: "8:30 PM", completed: false },
  ],
  activityGoal: "45 min push workout + 20 min walk",
  stepTarget: 10000,
  hydrationGoal: "3.5 liters",
  trainerNotes: "Focus on mind-muscle connection during flyes. Keep chest up on dips. Great progress this week — stay consistent.",
  completed: false,
};

export const weeklyData: WeeklyData[] = [
  { day: "Mon", completed: 5, total: 5 },
  { day: "Tue", completed: 4, total: 5 },
  { day: "Wed", completed: 5, total: 5 },
  { day: "Thu", completed: 3, total: 5 },
  { day: "Fri", completed: 5, total: 5 },
  { day: "Sat", completed: 4, total: 5 },
  { day: "Sun", completed: 2, total: 5 },
];

export const mockPosts: Post[] = [
  { id: "p1", userId: "s2", userName: "Priya Sharma", userAvatar: "", userRole: "student", type: "image", mediaUrl: "", caption: "Chest day done. No excuses. 💪 Day 14 of 28 complete.", likes: 47, comments: 8, location: "College Gym", timestamp: "2h ago", liked: true },
  { id: "p2", userId: "t1", userName: "Coach Vikram", userAvatar: "", userRole: "trainer", type: "image", mediaUrl: "", caption: "Proud of my students crushing their plans this week. Consistency > motivation.", likes: 124, comments: 22, location: "Training Center", timestamp: "4h ago", liked: false },
  { id: "p3", userId: "s3", userName: "Aman Gupta", userAvatar: "", userRole: "student", type: "reel", mediaUrl: "", caption: "100kg deadlift PR! Started at 60kg three months ago. THE AFTER HOURS changed everything.", likes: 89, comments: 15, location: "Iron Paradise", timestamp: "6h ago", liked: true },
  { id: "p4", userId: "s4", userName: "Neha Reddy", userAvatar: "", userRole: "student", type: "image", mediaUrl: "", caption: "Meal prep Sunday. Fuel > feelings.", likes: 35, comments: 6, location: "Home Kitchen", timestamp: "8h ago", liked: false },
  { id: "p5", userId: "s5", userName: "Rohit Patel", userAvatar: "", userRole: "student", type: "image", mediaUrl: "", caption: "21-day streak unlocked 🔥 Discipline compounds.", likes: 62, comments: 11, location: "Campus Track", timestamp: "12h ago", liked: false },
  { id: "p6", userId: "t2", userName: "Coach Maya", userAvatar: "", userRole: "trainer", type: "reel", mediaUrl: "", caption: "Quick mobility routine for rest days. Save this for later.", likes: 203, comments: 34, location: "Yoga Studio", timestamp: "1d ago", liked: true },
];

export const leaderboardData: LeaderboardEntry[] = [
  { rank: 1, userId: "s6", name: "Karan Singh", avatar: "", score: 2840, streak: 21, steps: 156000, uploads: 42, completionPercentage: 98 },
  { rank: 2, userId: "s2", name: "Priya Sharma", avatar: "", score: 2650, streak: 18, steps: 142000, uploads: 38, completionPercentage: 95 },
  { rank: 3, userId: "s3", name: "Aman Gupta", avatar: "", score: 2490, streak: 15, steps: 128000, uploads: 35, completionPercentage: 92 },
  { rank: 4, userId: "s1", name: "Arjun Mehta", avatar: "", score: 2320, streak: 12, steps: 118000, uploads: 30, completionPercentage: 88 },
  { rank: 5, userId: "s5", name: "Rohit Patel", avatar: "", score: 2180, streak: 21, steps: 165000, uploads: 28, completionPercentage: 85 },
  { rank: 6, userId: "s7", name: "Ananya Das", avatar: "", score: 2050, streak: 10, steps: 98000, uploads: 25, completionPercentage: 82 },
  { rank: 7, userId: "s8", name: "Dev Kapoor", avatar: "", score: 1920, streak: 8, steps: 88000, uploads: 22, completionPercentage: 79 },
  { rank: 8, userId: "s4", name: "Neha Reddy", avatar: "", score: 1800, streak: 14, steps: 105000, uploads: 20, completionPercentage: 76 },
  { rank: 9, userId: "s9", name: "Ishaan Verma", avatar: "", score: 1650, streak: 6, steps: 76000, uploads: 18, completionPercentage: 72 },
  { rank: 10, userId: "s10", name: "Simran Kaur", avatar: "", score: 1500, streak: 9, steps: 92000, uploads: 15, completionPercentage: 68 },
];

export const notifications: NotificationItem[] = [
  { id: "n1", type: "plan", message: "Your trainer updated Day 8 plan", timestamp: "10 min ago", read: false, icon: "clipboard" },
  { id: "n2", type: "rank", message: "You moved to Rank #4 on the leaderboard", timestamp: "1h ago", read: false, icon: "trending-up" },
  { id: "n3", type: "streak", message: "Your streak reached 12 days! 🔥", timestamp: "2h ago", read: false, icon: "flame" },
  { id: "n4", type: "social", message: "Aman liked your progress upload", timestamp: "3h ago", read: true, icon: "heart" },
  { id: "n5", type: "trainer", message: "Coach Vikram approved your Day 6 workout", timestamp: "5h ago", read: true, icon: "check-circle" },
  { id: "n6", type: "social", message: "Priya commented on your post: 'Beast mode! 🔥'", timestamp: "6h ago", read: true, icon: "message-circle" },
  { id: "n7", type: "streak", message: "You're 1 day away from the 14-Day Warrior badge!", timestamp: "8h ago", read: true, icon: "award" },
  { id: "n8", type: "plan", message: "New plan available: Advanced Hypertrophy 2.0", timestamp: "1d ago", read: true, icon: "file-plus" },
];

export const suggestedUsers = [
  { id: "s11", name: "Aditya Nair", avatar: "", role: "student" as const, streak: 15, mutualFriends: 8 },
  { id: "s12", name: "Meera Joshi", avatar: "", role: "student" as const, streak: 22, mutualFriends: 12 },
  { id: "t3", name: "Coach Raj", avatar: "", role: "trainer" as const, streak: 0, mutualFriends: 5 },
  { id: "s13", name: "Varun Malhotra", avatar: "", role: "student" as const, streak: 9, mutualFriends: 3 },
  { id: "t4", name: "Coach Sneha", avatar: "", role: "trainer" as const, streak: 0, mutualFriends: 7 },
  { id: "s14", name: "Kavya Iyer", avatar: "", role: "student" as const, streak: 18, mutualFriends: 11 },
];

export const recentUploads: Submission[] = [
  { id: "u1", studentId: "s1", studentName: "Arjun Mehta", taskName: "Chest & Triceps Workout", mediaUrl: "", type: "video", status: "pending", timestamp: "20 min ago" },
  { id: "u2", studentId: "s2", studentName: "Priya Sharma", taskName: "Morning 5K Walk", mediaUrl: "", type: "image", status: "approved", timestamp: "1h ago" },
  { id: "u3", studentId: "s3", studentName: "Aman Gupta", taskName: "High Protein Diet Logging", mediaUrl: "", type: "image", status: "pending", timestamp: "3h ago" },
  { id: "u4", studentId: "s4", studentName: "Neha Reddy", taskName: "Leg Day Squats", mediaUrl: "", type: "video", status: "rejected", timestamp: "5h ago" },
];
