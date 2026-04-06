import React, { createContext, useContext, useState, ReactNode } from "react";
import { Student, Post, NotificationItem, LeaderboardEntry } from "@/types";
import { currentStudent as initialStudent, mockPosts as initialPosts, notifications as initialNotifs, leaderboardData as initialLeaderboard } from "@/data/mockData";

interface StoreContextType {
  student: Student;
  posts: Post[];
  notifications: NotificationItem[];
  leaderboard: LeaderboardEntry[];
  followUser: (userId: string) => void;
  likePost: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  completeTask: (type: 'workout' | 'diet', id: string) => void;
  updateProfile: (data: Partial<Student>) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student>(initialStudent);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifs);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboard);

  const followUser = (userId: string) => {
    setStudent(prev => ({ ...prev, following: prev.following + 1 }));
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
    // Logic for updating task completion pct could go here
    setStudent(prev => ({
      ...prev,
      completionPercentage: Math.min(100, prev.completionPercentage + 1)
    }));
  };

  const updateProfile = (data: Partial<Student>) => {
    setStudent(prev => ({ ...prev, ...data }));
  };

  return (
    <StoreContext.Provider value={{
      student, posts, notifications, leaderboard,
      followUser, likePost, addComment, markNotificationRead, markAllNotificationsRead,
      completeTask, updateProfile
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
