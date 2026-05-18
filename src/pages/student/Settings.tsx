import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Bell, Shield, Smartphone, Footprints, LogOut,
  ChevronRight, Moon, Vibrate, Save, ArrowLeft,
  Activity, Zap, ShieldCheck, Cpu, Unlock, Ruler, Weight
} from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { fetchSettingsAPI, updateSettingsAPI } from "@/lib/api";

type PersistedSettings = {
  notifications: {
    push: boolean;
    email: boolean;
    streakReminders: boolean;
    planUpdates: boolean;
  };
  privacy: {
    publicProfile: boolean;
    showStreak: boolean;
  };
};


function Toggle({ enabled, onToggle, accent = "bg-neon-orange" }: { enabled: boolean; onToggle: () => void; accent?: string }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-all duration-500 border-2 ${enabled ? `${accent}/20 border-${accent}/50` : "bg-zinc-950 border-white/5"}`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${enabled ? `translate-x-6 ${accent} shadow-[0_0_15px_rgba(255,165,0,0.5)]` : "bg-muted-foreground/30"}`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { student: s, updateProfile } = useStore();
  const [view, setView] = useState<"menu" | "edit-profile">("menu");

  const [formData, setFormData] = useState({
    name: s.name,
    fitnessGoal: s.fitnessGoal,
    weight: s.weight.toString(),
    height: s.height.toString(),
  });

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

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await fetchSettingsAPI();
        setNotifications((prev) => ({
          ...prev,
          push: Boolean(settings.pushNotifications ?? prev.push),
          email: Boolean(settings.emailNotifications ?? prev.email),
          streakReminders: Boolean(settings.showStreak ?? prev.streakReminders),
          planUpdates: true,
        }));
        setPrivacy((prev) => ({
          ...prev,
          publicProfile: String(settings.profileVisibility ?? "public") !== "private",
          showStreak: Boolean(settings.showStreak ?? prev.showStreak),
        }));
      } catch (error) {
        import("@sentry/react").then(({ default: Sentry }) => {
          Sentry.captureException(error, { tags: { action: "load_settings" } });
        });
      }
    };

    void loadSettings();
  }, []);

  const persistSettings = async (
    nextNotifications: typeof notifications,
    nextPrivacy: typeof privacy,
  ) => {
    await updateSettingsAPI({
      pushNotifications: nextNotifications.push,
      emailNotifications: nextNotifications.email,
      showStreak: nextPrivacy.showStreak,
      showLeaderboard: true,
      profileVisibility: nextPrivacy.publicProfile ? "public" : "private",
    });
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: formData.name,
        fitnessGoal: formData.fitnessGoal,
        weight: parseFloat(formData.weight) || s.weight,
        height: parseFloat(formData.height) || s.height,
      });
      toast.success("BIOMETRIC_DATA_UPDATED: PROFILE_SYNCED");
      setView("menu");
    } catch (error) {
      toast.error("PROFILE_SYNC_FAILURE: RETRY_REQUIRED");
    }
  };

  const toggle = (group: "notifications" | "privacy", key: string) => {
    if (group === "notifications") {
      setNotifications((prev) => {
        const next = { ...prev, [key]: !prev[key as keyof typeof prev] };
        void persistSettings(next, privacy).catch(() => {
          toast.error("SETTINGS_SYNC_FAILURE");
        });
        return next;
      });
    } else {
      setPrivacy((prev) => {
        const next = { ...prev, [key]: !prev[key as keyof typeof prev] };
        void persistSettings(notifications, next).catch(() => {
          toast.error("SETTINGS_SYNC_FAILURE");
        });
        return next;
      });
    }
    toast.success("SYSTEM_FLAG_UPDATED");
  };

  const profileInitials = s.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-10 pb-28 relative">
       <div className="absolute top-0 right-0 w-64 h-64 bg-neon-orange/5 blur-3xl pointer-events-none" />
       
      <AnimatePresence mode="wait">
        {view === "menu" ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                  <Cpu className="h-4 w-4 text-neon-blue" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-neon-blue">Settings Hub</p>
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-black uppercase italic tracking-tight text-foreground">Control Center</h1>
              <p className="text-sm text-muted-foreground/80">Manage profile, notifications, and privacy from one unified panel.</p>
            </div>

            <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#101214] p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
              <div className="pointer-events-none absolute -top-20 -left-16 h-48 w-48 rounded-full bg-neon-blue/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -right-16 h-48 w-48 rounded-full bg-neon-orange/10 blur-3xl" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-neon-blue/35 to-neon-orange/35 p-[2px]">
                  <div className="flex h-full w-full items-center justify-center rounded-3xl bg-[#111] text-xl font-black text-foreground">
                    {profileInitials}
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-2xl font-display font-black uppercase italic tracking-tight text-foreground">{s.name}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">{s.email}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-neon-blue/30 bg-neon-blue/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-neon-blue">
                      ID {s.collegeId}
                    </span>
                    <span className="rounded-full border border-neon-orange/30 bg-neon-orange/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-neon-orange">
                      Rank #{s.rank}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setView("edit-profile")}
                  className="h-12 rounded-2xl bg-gradient-to-r from-neon-blue to-neon-orange px-6 text-xs font-black uppercase tracking-[0.2em] text-black transition-all hover:brightness-110 active:scale-[0.99]"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-white/10 bg-[#111315] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.28)]">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl border border-neon-blue/30 bg-neon-blue/10 p-2.5">
                    <Bell className="h-4 w-4 text-neon-blue" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-blue">Signals</p>
                    <h3 className="text-xl font-display font-black uppercase italic tracking-tight text-foreground">Notifications</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { key: "push", label: "Push Alerts", desc: "Receive real-time updates", icon: Bell },
                    { key: "email", label: "Email Digest", desc: "Weekly summary emails", icon: Shield },
                    { key: "streakReminders", label: "Streak Reminders", desc: "Keep your consistency streak alive", icon: Vibrate },
                    { key: "planUpdates", label: "Plan Updates", desc: "Get notified about training changes", icon: Zap },
                  ].map((item, index) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.12 + index * 0.06 }}
                      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition-all hover:bg-black/30"
                    >
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                        <item.icon className="h-4 w-4 text-neon-blue" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground/70">{item.desc}</p>
                      </div>
                      <Toggle
                        enabled={notifications[item.key as keyof typeof notifications]}
                        onToggle={() => toggle("notifications", item.key)}
                        accent="bg-neon-blue"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-[#111315] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.28)]">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl border border-neon-orange/30 bg-neon-orange/10 p-2.5">
                    <ShieldCheck className="h-4 w-4 text-neon-orange" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-orange">Privacy</p>
                    <h3 className="text-xl font-display font-black uppercase italic tracking-tight text-foreground">Visibility</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { key: "publicProfile", label: "Public Profile", desc: "Allow others to discover your profile", icon: Unlock },
                    { key: "showStreak", label: "Show Streak", desc: "Display your streak on your profile", icon: Activity },
                  ].map((item, index) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.28 + index * 0.06 }}
                      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition-all hover:bg-black/30"
                    >
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                        <item.icon className="h-4 w-4 text-neon-orange" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground/70">{item.desc}</p>
                      </div>
                      <Toggle
                        enabled={privacy[item.key as keyof typeof privacy]}
                        onToggle={() => toggle("privacy", item.key)}
                        accent="bg-neon-orange"
                      />
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                  <button
                    onClick={() => navigate("/")}
                    className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs font-black uppercase tracking-[0.2em] text-red-400 transition-all hover:bg-red-500/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="edit-profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-10"
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView("menu")} 
                className="p-3.5 rounded-2xl bg-zinc-950/60 hover:bg-zinc-900 border border-white/10 transition-all active:scale-90"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </button>
              <div>
                <p className="text-[10px] font-black tracking-[0.35em] text-neon-blue uppercase">Profile Studio</p>
                <h1 className="text-3xl sm:text-4xl font-display font-black text-foreground uppercase italic tracking-tight">Edit Profile</h1>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#101214] p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
              <div className="pointer-events-none absolute -top-24 -left-20 h-56 w-56 rounded-full bg-neon-blue/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-neon-orange/10 blur-3xl" />

              <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1.7fr]">
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                  <p className="text-[10px] font-black tracking-[0.3em] uppercase text-muted-foreground/70">Live Preview</p>
                  <div className="mt-5 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-blue/40 to-neon-orange/40 p-[2px]">
                      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#111] text-lg font-black text-foreground">
                        {profileInitials}
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-display font-black text-foreground tracking-tight uppercase italic">{formData.name || "Your Name"}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">{s.email}</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Goal</p>
                      <p className="mt-1 text-sm font-semibold text-foreground/90">{formData.fitnessGoal || "Set your training focus"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Weight</p>
                        <p className="mt-1 text-sm font-semibold text-foreground/90">{formData.weight || "-"} kg</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Height</p>
                        <p className="mt-1 text-sm font-semibold text-foreground/90">{formData.height || "-"} cm</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="px-1 text-[10px] font-black uppercase tracking-[0.32em] text-muted-foreground/80">Display Name</label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                        <input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your full name"
                          className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground/40 focus:border-neon-blue/50 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="px-1 text-[10px] font-black uppercase tracking-[0.32em] text-muted-foreground/80">Fitness Goal</label>
                      <div className="relative">
                        <Footprints className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                        <input
                          value={formData.fitnessGoal}
                          onChange={(e) => setFormData({ ...formData, fitnessGoal: e.target.value })}
                          placeholder="Strength, endurance, consistency..."
                          className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground/40 focus:border-neon-blue/50 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="px-1 text-[10px] font-black uppercase tracking-[0.32em] text-muted-foreground/80">Weight (kg)</label>
                      <div className="relative">
                        <Weight className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                        <input
                          type="number"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                          className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm font-semibold tabular-nums text-foreground placeholder:text-muted-foreground/40 focus:border-neon-orange/50 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="px-1 text-[10px] font-black uppercase tracking-[0.32em] text-muted-foreground/80">Height (cm)</label>
                      <div className="relative">
                        <Ruler className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                        <input
                          type="number"
                          value={formData.height}
                          onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                          className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm font-semibold tabular-nums text-foreground placeholder:text-muted-foreground/40 focus:border-neon-orange/50 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                    <button
                      onClick={() => setView("menu")}
                      className="h-12 rounded-2xl border border-white/10 bg-transparent px-6 text-xs font-black uppercase tracking-[0.2em] text-foreground/80 transition-all hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="h-12 rounded-2xl bg-gradient-to-r from-neon-blue to-neon-orange px-6 text-xs font-black uppercase tracking-[0.2em] text-black transition-all hover:brightness-110 active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

