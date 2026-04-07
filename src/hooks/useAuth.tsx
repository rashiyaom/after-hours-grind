import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "student" | "trainer";
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: "student" | "trainer") => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: "student" | "trainer";
  collegeId?: string;
  height?: number;
  weight?: number;
  fitnessGoal?: string;
  specialization?: string;
  experience?: number;
  certifications?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: Record<string, AuthUser> = {
  "student@college.edu": { id: "s1", name: "Arjun Mehta", email: "student@college.edu", role: "student" },
  "trainer@college.edu": { id: "t1", name: "Coach Vikram", email: "trainer@college.edu", role: "trainer" },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem("ah_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const persist = (u: AuthUser | null) => {
    if (u) sessionStorage.setItem("ah_user", JSON.stringify(u));
    else sessionStorage.removeItem("ah_user");
    setUser(u);
  };

  const login = useCallback(async (email: string, _password: string, role: "student" | "trainer") => {
    await new Promise(r => setTimeout(r, 800));
    const known = MOCK_USERS[email];
    const mockUser: AuthUser = known ?? {
      id: role === "student" ? "s1" : "t1",
      name: role === "student" ? "Arjun Mehta" : "Coach Vikram",
      email,
      role,
    };
    persist(mockUser);
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    await new Promise(r => setTimeout(r, 1000));
    const newUser: AuthUser = {
      id: data.role === "student" ? `s${Date.now()}` : `t${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
    };
    persist(newUser);
  }, []);

  const logout = useCallback(() => {
    persist(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
