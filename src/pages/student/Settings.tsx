import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Bell, Shield, Palette, Smartphone, Footprints, LogOut,
  ChevronRight, Moon, Sun, Vibrate, Lock,
} from "lucide-react";
import { currentStudent } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-9 h-5 rounded-full transition-all duration-300 ${enabled ? "bg-foreground" : "bg-muted"}`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background shadow-sm transition-all duration-300 ${enabled ? "translate-x-4" : ""}`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const s = currentStudent;

  const [notifications, setNotifications] = useState({
    push: true,
    email: false,
    streakReminders: true,
    planUpdates: true,
  });

  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showStreak: true,
  });

  const toggle = (group: "notifications" | "privacy", key: string) => {
    if (group === "notifications") {
      setNotifications((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    } else {
      setPrivacy((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    }
    toast.success("Settings updated successfully");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
      </motion.div>

      {/* Profile Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-5 flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-lg font-display font-bold text-foreground flex-shrink-0">
          {s.name.split(" ").map((n) => n[0]).join("")}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{s.name}</p>
          <p className="text-xs text-muted-foreground">{s.email}</p>
          <p className="text-[11px] text-muted-foreground">{s.collegeId}</p>
        </div>
        <button
          onClick={() => navigate("/student/profile")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          Edit <ChevronRight className="h-3 w-3" />
        </button>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-1">Notifications</p>
        <div className="glass-card divide-y divide-border/50">
          {[
            { key: "push", label: "Push Notifications", desc: "Alerts on your device", icon: Bell },
            { key: "email", label: "Email Alerts", desc: "Weekly summary emails", icon: Bell },
            { key: "streakReminders", label: "Streak Reminders", desc: "Daily nudge to stay on track", icon: Vibrate },
            { key: "planUpdates", label: "Plan Updates", desc: "When trainer modifies your plan", icon: Bell },
          ].map((item) => (
            <div key={item.key} className="flex items-center gap-4 p-4">
              <div className="p-2 rounded-xl bg-accent">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
              <Toggle
                enabled={notifications[item.key as keyof typeof notifications]}
                onToggle={() => toggle("notifications", item.key)}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Privacy */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-1">Privacy</p>
        <div className="glass-card divide-y divide-border/50">
          {[
            { key: "publicProfile", label: "Public Profile", desc: "Anyone can see your profile", icon: Shield },
            { key: "showStreak", label: "Show Streak", desc: "Display streak on leaderboard", icon: Lock },
          ].map((item) => (
            <div key={item.key} className="flex items-center gap-4 p-4">
              <div className="p-2 rounded-xl bg-accent">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
              <Toggle
                enabled={privacy[item.key as keyof typeof privacy]}
                onToggle={() => toggle("privacy", item.key)}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-1">Appearance</p>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-2 rounded-xl bg-accent">
            <Moon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Dark Mode</p>
            <p className="text-[11px] text-muted-foreground">Monochromatic dark theme active</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/10 text-foreground border border-border/50">Active</span>
        </div>
      </motion.div>

      {/* Integrations */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-1">Integrations</p>
        <div className="glass-card divide-y divide-border/50">
          {[
            { label: "Connected Devices", desc: "Coming soon", icon: Smartphone },
            { label: "Step Sync", desc: "Sync with health apps — coming soon", icon: Footprints },
          ].map((item) => (
            <button key={item.label} onClick={() => toast("Integration coming soon...")} className="w-full flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors first:rounded-t-2xl last:rounded-b-2xl opacity-60">
              <div className="p-2 rounded-xl bg-accent">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  {item.label}
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Soon</span>
                </p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Account */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-1">Account</p>
        <div className="glass-card divide-y divide-border/50">
          <button onClick={() => toast("Account settings coming soon.")} className="w-full flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors rounded-t-2xl">
            <div className="p-2 rounded-xl bg-accent">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">Account Info</p>
              <p className="text-[11px] text-muted-foreground">Name, email, college ID</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
          </button>
          <button onClick={() => toast("Change password flow coming soon.")} className="w-full flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors rounded-b-2xl">
            <div className="p-2 rounded-xl bg-accent">
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">Change Password</p>
              <p className="text-[11px] text-muted-foreground">Update your password</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
          </button>
        </div>
      </motion.div>

      {/* Log Out */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Log Out</span>
        </button>
        <p className="text-[11px] text-muted-foreground/40 text-center mt-4">THE AFTER HOURS · v1.0.0</p>
      </motion.div>
    </div>
  );
}
