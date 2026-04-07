import React, { createContext, useContext, useState, ReactNode } from "react";
import { Student, Post, NotificationItem, LeaderboardEntry, Submission, Trainer, DailyTask, WeeklyData, User } from "@/types";
import { currentStudent as initialStudent, currentTrainer as initialTrainer, mockPosts as initialPosts, notifications as initialNotifs, leaderboardData as initialLeaderboard, recentUploads as initialSubmissions, todayTask as initialTask, weeklyData as initialWeeklyData, suggestedUsers as initialSuggestedUsers } from "@/data/mockData";

interface StoreContextType {
  student: Student;
  trainer: Trainer;
  students: LeaderboardEntry[];
  posts: Post[];
  notifications: NotificationItem[];
  leaderboard: LeaderboardEntry[];
  submissions: Submission[];
  todayTask: DailyTask;
  weeklyData: WeeklyData[];
  suggestedUsers: typeof initialSuggestedUsers;
  loading: boolean;
  followUser: (userId: string) => void;
  likePost: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  completeTask: (type: 'workout' | 'diet', id: string) => void;
  updateProfile: (data: Partial<Student>) => void;
  reviewSubmission: (id: string, status: "approved" | "rejected", note: string) => void;
  addSubmission: (submission: Omit<Submission, 'id' | 'status' | 'timestamp'>) => void;
  addPost: (post: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments' | 'liked'>) => void;
  setLoading: (loading: boolean) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student>(initialStudent);
  const [trainer] = useState<Trainer>(initialTrainer);
  const [students] = useState<LeaderboardEntry[]>(initialLeaderboard);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifs);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboard);
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [todayTask, setTodayTask] = useState<DailyTask>(initialTask);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>(initialWeeklyData);
  const [suggestedUsers, setSuggestedUsers] = useState(initialSuggestedUsers);
  const [loading, setLoading] = useState(false);

  const followUser = (userId: string) => {
    setStudent(prev => ({ ...prev, following: prev.following + 1 }));
    setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const likePost = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const liked = !p.liked;
        return { ...p, liked, likes: liked ? p.likes + 1 : p.likes - 1 };
      }
      return p;
    }));
  };

  const addComment = (postId: string, text: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, comments: p.comments + 1 } : p
    ));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const completeTask = (type: 'workout' | 'diet', id: string) => {
    setTodayTask(prev => {
      const updated = { ...prev };
      if (type === 'workout') {
        updated.workout = updated.workout.map(item => item.id === id ? { ...item, completed: true } : item);
      } else if (type === 'diet') {
        updated.diet = updated.diet.map(item => item.id === id ? { ...item, completed: true } : item);
      }
      return updated;
    });

    setStudent(prev => ({
      ...prev,
      completionPercentage: Math.min(100, prev.completionPercentage + 2)
    }));
  };

  const updateProfile = (data: Partial<Student>) => {
    setStudent(prev => ({ ...prev, ...data }));
  };

  const reviewSubmission = (id: string, status: "approved" | "rejected", note: string) => {
    setSubmissions(prev => prev.map(s => 
      s.id === id ? { ...s, status, trainerNote: note } : s
    ));
  };

  const addSubmission = (data: Omit<Submission, 'id' | 'status' | 'timestamp'>) => {
    const newSub: Submission = {
      ...data,
      id: `u${Date.now()}`,
      status: "pending",
      timestamp: "Just now",
    };
    setSubmissions(prev => [newSub, ...prev]);
    // Optionally update student completion when they submit proof
    setStudent(prev => ({
      ...prev,
      completionPercentage: Math.min(100, prev.completionPercentage + 2)
    }));
  };

  const addPost = (data: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments' | 'liked'>) => {
    const newPost: Post = {
      ...data,
      id: `p${Date.now()}`,
      timestamp: "Just now",
      likes: 0,
      comments: 0,
      liked: false
    };
    setPosts(prev => [newPost, ...prev]);
  };

  return (
    <StoreContext.Provider value={{
      student, trainer, students, posts, notifications, leaderboard, submissions, todayTask, weeklyData, suggestedUsers, loading,
      followUser, likePost, addComment, markNotificationRead, markAllNotificationsRead,
      completeTask, updateProfile, reviewSubmission, addSubmission, addPost, setLoading
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
