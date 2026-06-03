import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Bell, Shield, Smartphone, Footprints, LogOut,
  Moon, Vibrate, Save, ArrowLeft,
  Activity, Zap, ShieldCheck, Cpu, Unlock, Ruler, Weight,
  ChevronRight, Lock, Eye, EyeOff,
} from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { changePasswordAPI, fetchSettingsAPI, updateSettingsAPI } from "@/lib/api";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";

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

function Toggle({ enabled, onToggle, color = "#C9F85A" }: { enabled: boolean; onToggle: () => void; color?: string }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-12 h-6 rounded-full transition-all duration-300 border"
      style={
        enabled
          ? { background: `${color}25`, borderColor: `${color}50` }
          : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }
      }
    >
      <motion.div
        animate={{ x: enabled ? 24 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className="absolute top-1 w-4 h-4 rounded-full shadow-lg"
        style={{ background: enabled ? color : "rgba(255,255,255,0.3)" }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { student: s, updateProfile } = useStore();
  const [view, setView] = useState<"menu" | "edit-profile" | "change-password">("menu");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

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

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
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

  const persistSettings = async (nextNotifications: typeof notifications, nextPrivacy: typeof privacy) => {
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
      toast.success("Profile updated!");
      setView("menu");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  const toggle = (group: "notifications" | "privacy", key: string) => {
    if (group === "notifications") {
      setNotifications((prev) => {
        const next = { ...prev, [key]: !prev[key as keyof typeof prev] };
        void persistSettings(next, privacy).catch(() => toast.error("Could not sync settings."));
        return next;
      });
    } else {
      setPrivacy((prev) => {
        const next = { ...prev, [key]: !prev[key as keyof typeof prev] };
        void persistSettings(notifications, next).catch(() => toast.error("Could not sync settings."));
        return next;
      });
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setIsSavingPassword(true);
    try {
      await changePasswordAPI({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password updated successfully!");
      setView("menu");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const profileInitials = s.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#080808] pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:pb-10 relative overflow-hidden">
      {/* Background orbs */}
      <div className="fixed top-0 right-0 w-72 h-72 rounded-full bg-[#4DD2FF]/5 blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/3 left-0 w-56 h-56 rounded-full bg-[#C9F85A]/4 blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <AnimatePresence mode="wait">

          {/* ───────────────── MAIN MENU ───────────────── */}
          {view === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={LUXURY_TWEEN_MEDIUM}
              className="space-y-0"
            >
              {/* Header */}
              <div className="px-5 pt-6 pb-5 sm:px-8">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#C9F85A] mb-1">Account</p>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Settings</h1>
                <p className="text-sm text-white/40 mt-1">Manage your profile and preferences</p>
              </div>

              {/* Profile card */}
              <div className="px-4 sm:px-8 mb-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.05 }}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111] p-5"
                >
                  {/* Subtle gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#C9F85A]/5 via-transparent to-[#4DD2FF]/5 pointer-events-none" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C9F85A]/30 to-[#4DD2FF]/30 p-[2px] flex-shrink-0">
                      <div className="w-full h-full rounded-[14px] bg-[#111] flex items-center justify-center text-xl font-black text-white">
                        {profileInitials}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-black text-white tracking-tight truncate">{s.name}</p>
                      <p className="text-xs text-white/40 mt-0.5 truncate">{s.email}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="rounded-full border border-[#4DD2FF]/30 bg-[#4DD2FF]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#4DD2FF]">
                          ID {s.collegeId}
                        </span>
                        <span className="rounded-full border border-[#C9F85A]/30 bg-[#C9F85A]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#C9F85A]">
                          Rank #{s.rank}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setView("edit-profile")}
                      className="w-10 h-10 rounded-2xl bg-[#C9F85A]/10 border border-[#C9F85A]/20 flex items-center justify-center text-[#C9F85A] active:scale-90 transition-transform flex-shrink-0"
                    >
                      <User className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Settings sections */}
              <div className="px-4 sm:px-8 space-y-3">

                {/* Notifications */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.1 }}
                  className="rounded-3xl border border-white/8 bg-[#0F0F0F] overflow-hidden"
                >
                  <div className="px-5 pt-4 pb-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#4DD2FF]/10 border border-[#4DD2FF]/20 flex items-center justify-center">
                      <Bell className="h-4 w-4 text-[#4DD2FF]" />
                    </div>
                    <p className="text-sm font-bold text-white">Notifications</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    {[
                      { key: "push", label: "Push Alerts", desc: "Real-time updates", icon: Bell, color: "#4DD2FF" },
                      { key: "email", label: "Email Digest", desc: "Weekly summary", icon: Moon, color: "#A78BFA" },
                      { key: "streakReminders", label: "Streak Reminders", desc: "Keep your streak alive", icon: Vibrate, color: "#FF4D00" },
                      { key: "planUpdates", label: "Plan Updates", desc: "Training changes", icon: Zap, color: "#FFD36E" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center gap-3.5 px-5 py-3.5">
                        <item.icon className="h-4 w-4 flex-shrink-0" style={{ color: item.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{item.label}</p>
                          <p className="text-[11px] text-white/35">{item.desc}</p>
                        </div>
                        <Toggle
                          enabled={notifications[item.key as keyof typeof notifications]}
                          onToggle={() => toggle("notifications", item.key)}
                          color={item.color}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Privacy */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.15 }}
                  className="rounded-3xl border border-white/8 bg-[#0F0F0F] overflow-hidden"
                >
                  <div className="px-5 pt-4 pb-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#C9F85A]/10 border border-[#C9F85A]/20 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-[#C9F85A]" />
                    </div>
                    <p className="text-sm font-bold text-white">Privacy</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    {[
                      { key: "publicProfile", label: "Public Profile", desc: "Others can find you", icon: Unlock, color: "#C9F85A" },
                      { key: "showStreak", label: "Show Streak", desc: "Display on your profile", icon: Activity, color: "#FF4D00" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center gap-3.5 px-5 py-3.5">
                        <item.icon className="h-4 w-4 flex-shrink-0" style={{ color: item.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{item.label}</p>
                          <p className="text-[11px] text-white/35">{item.desc}</p>
                        </div>
                        <Toggle
                          enabled={privacy[item.key as keyof typeof privacy]}
                          onToggle={() => toggle("privacy", item.key)}
                          color={item.color}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Account Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.2 }}
                  className="rounded-3xl border border-white/8 bg-[#0F0F0F] overflow-hidden"
                >
                  <div className="px-5 pt-4 pb-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-white/50" />
                    </div>
                    <p className="text-sm font-bold text-white">Account</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    <button
                      onClick={() => setView("change-password")}
                      className="w-full flex items-center gap-3.5 px-5 py-3.5 active:bg-white/5 transition-colors"
                    >
                      <Lock className="h-4 w-4 text-white/40 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-white">Change Password</p>
                        <p className="text-[11px] text-white/35">Update your security credentials</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/20 flex-shrink-0" />
                    </button>
                    <button
                      onClick={() => navigate("/")}
                      className="w-full flex items-center gap-3.5 px-5 py-3.5 active:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4 text-red-400 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-red-400">Log Out</p>
                        <p className="text-[11px] text-white/35">Sign out of your account</p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ───────────────── EDIT PROFILE ───────────────── */}
          {view === "edit-profile" && (
            <motion.div
              key="edit-profile"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={LUXURY_TWEEN_MEDIUM}
              className="space-y-0"
            >
              {/* Header */}
              <div className="px-5 pt-6 pb-5 sm:px-8 flex items-center gap-4">
                <button
                  onClick={() => setView("menu")}
                  className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/60 active:scale-90 transition-transform"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#C9F85A] mb-0.5">Profile Studio</p>
                  <h1 className="text-2xl font-black text-white tracking-tight">Edit Profile</h1>
                </div>
              </div>

              {/* Live Preview card */}
              <div className="px-4 sm:px-8 mb-4">
                <div className="rounded-3xl border border-white/8 bg-[#0F0F0F] p-5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4DD2FF]/5 to-[#FF4D00]/5 pointer-events-none" />
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-4 font-bold">Live Preview</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4DD2FF]/40 to-[#FF4D00]/40 p-[2px] flex-shrink-0">
                      <div className="w-full h-full rounded-[13px] bg-[#111] flex items-center justify-center text-lg font-black text-white">
                        {profileInitials}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-black text-white truncate">{formData.name || "Your Name"}</p>
                      <p className="text-xs text-white/40 mt-0.5">{s.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 mt-4">
                    <div className="rounded-xl border border-white/8 bg-black/30 px-3 py-2.5">
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Goal</p>
                      <p className="text-xs font-semibold text-white mt-0.5 truncate">{formData.fitnessGoal || "—"}</p>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-black/30 px-3 py-2.5">
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Build</p>
                      <p className="text-xs font-semibold text-white mt-0.5">{formData.weight || "—"}kg · {formData.height || "—"}cm</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form fields */}
              <div className="px-4 sm:px-8 space-y-3">
                <div className="rounded-3xl border border-white/8 bg-[#0F0F0F] overflow-hidden">
                  <div className="divide-y divide-white/5">
                    {/* Name */}
                    <div className="px-5 py-4 space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
                        <User className="h-3 w-3" /> Display Name
                      </label>
                      <input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full bg-transparent text-base font-semibold text-white placeholder:text-white/20 focus:outline-none"
                      />
                    </div>
                    {/* Fitness Goal */}
                    <div className="px-5 py-4 space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
                        <Footprints className="h-3 w-3" /> Fitness Goal
                      </label>
                      <input
                        value={formData.fitnessGoal}
                        onChange={(e) => setFormData({ ...formData, fitnessGoal: e.target.value })}
                        placeholder="Strength, endurance, consistency..."
                        className="w-full bg-transparent text-base font-semibold text-white placeholder:text-white/20 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Weight */}
                  <div className="rounded-3xl border border-white/8 bg-[#0F0F0F] px-5 py-4 space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-1.5">
                      <Weight className="h-3 w-3" /> Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full bg-transparent text-xl font-black text-white placeholder:text-white/20 focus:outline-none tabular-nums"
                    />
                  </div>
                  {/* Height */}
                  <div className="rounded-3xl border border-white/8 bg-[#0F0F0F] px-5 py-4 space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-1.5">
                      <Ruler className="h-3 w-3" /> Height (cm)
                    </label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="w-full bg-transparent text-xl font-black text-white placeholder:text-white/20 focus:outline-none tabular-nums"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setView("menu")}
                    className="flex-1 h-13 rounded-2xl border border-white/10 text-sm font-bold text-white/50 hover:text-white transition-colors active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 h-13 rounded-2xl bg-gradient-to-r from-[#C9F85A] to-[#4DD2FF] text-sm font-black text-black flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-[0_8px_24px_rgba(201,248,90,0.2)]"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ───────────────── CHANGE PASSWORD ───────────────── */}
          {view === "change-password" && (
            <motion.div
              key="change-password"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={LUXURY_TWEEN_MEDIUM}
              className="space-y-0"
            >
              {/* Header */}
              <div className="px-5 pt-6 pb-5 sm:px-8 flex items-center gap-4">
                <button
                  onClick={() => setView("menu")}
                  className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/60 active:scale-90 transition-transform"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#4DD2FF] mb-0.5">Security</p>
                  <h1 className="text-2xl font-black text-white tracking-tight">Change Password</h1>
                </div>
              </div>

              <div className="px-4 sm:px-8 space-y-3">
                <div className="rounded-3xl border border-white/8 bg-[#0F0F0F] overflow-hidden">
                  <div className="divide-y divide-white/5">
                    {/* Current password */}
                    <div className="px-5 py-4 space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
                        <Lock className="h-3 w-3" /> Current Password
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type={showCurrentPw ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Enter current password"
                          className="flex-1 bg-transparent text-base font-semibold text-white placeholder:text-white/20 focus:outline-none"
                        />
                        <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="text-white/30 hover:text-white/60 transition-colors">
                          {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {/* New password */}
                    <div className="px-5 py-4 space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
                        <Shield className="h-3 w-3" /> New Password
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type={showNewPw ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Min 8 characters"
                          className="flex-1 bg-transparent text-base font-semibold text-white placeholder:text-white/20 focus:outline-none"
                        />
                        <button onClick={() => setShowNewPw(!showNewPw)} className="text-white/30 hover:text-white/60 transition-colors">
                          {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {/* Strength indicator */}
                      {passwordForm.newPassword.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {[3, 6, 10].map((threshold, i) => (
                            <div
                              key={i}
                              className="h-1 flex-1 rounded-full transition-all"
                              style={{
                                background: passwordForm.newPassword.length >= threshold
                                  ? i === 0 ? "#FF4D00" : i === 1 ? "#FFD36E" : "#C9F85A"
                                  : "rgba(255,255,255,0.08)",
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Confirm password */}
                    <div className="px-5 py-4 space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
                        <ShieldCheck className="h-3 w-3" /> Confirm Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Re-enter new password"
                        className="w-full bg-transparent text-base font-semibold text-white placeholder:text-white/20 focus:outline-none"
                      />
                      {passwordForm.confirmPassword.length > 0 && passwordForm.newPassword !== passwordForm.confirmPassword && (
                        <p className="text-[11px] text-red-400 mt-1">Passwords don't match</p>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-white/30 px-1">
                  Password updates are logged in the admin panel with an updated timestamp.
                </p>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setView("menu")}
                    className="flex-1 h-13 rounded-2xl border border-white/10 text-sm font-bold text-white/50 hover:text-white transition-colors active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={isSavingPassword}
                    className="flex-1 h-13 rounded-2xl bg-gradient-to-r from-[#C9F85A] to-[#4DD2FF] text-sm font-black text-black flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 shadow-[0_8px_24px_rgba(201,248,90,0.2)]"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingPassword ? "Saving..." : "Update Password"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
