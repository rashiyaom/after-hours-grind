import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Bell, Shield, Smartphone, Footprints, LogOut,
  ChevronRight, Moon, Vibrate, Lock, Save, ArrowLeft,
  Activity, Zap, ShieldCheck, Cpu, Unlock
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
        console.error("Failed to load settings", error);
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
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neon-orange/10 border border-neon-orange/20">
                     <Cpu className="h-4 w-4 text-neon-orange" />
                  </div>
                  <p className="text-[10px] font-black text-neon-orange uppercase tracking-[0.4em]">_System_Configuration</p>
               </div>
               <h1 className="text-4xl font-display font-black text-foreground tracking-tighter uppercase italic">Control Center</h1>
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-2">
                  <Activity className="h-3 w-3" /> CONFIGURING_NODE_v1.0.4
               </p>
            </div>

            {/* Profile Summary Card */}
            <div className="glass-card-hover p-10 bg-zinc-950/20 border-white/5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                  <ShieldCheck className="h-24 w-24 text-neon-orange" />
               </div>
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="w-24 h-24 rounded-[2rem] bg-zinc-900 border-2 border-neon-orange/40 flex items-center justify-center text-2xl font-display font-black text-foreground flex-shrink-0 shadow-[0_0_30px_rgba(255,165,0,0.1)] group-hover:scale-105 transition-transform italic">
                  {s.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-2xl font-display font-black text-foreground leading-none uppercase italic tracking-tight">{s.name}</p>
                  <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mt-3 tabular-nums">{s.email}</p>
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mt-5">
                    <span className="text-[9px] px-4 py-1.5 rounded-full bg-neon-orange/10 text-neon-orange border border-neon-orange/20 font-black tracking-widest uppercase italic">
                      UID_{s.collegeId}
                    </span>
                    <span className="text-[9px] px-4 py-1.5 rounded-full bg-neon-blue/10 text-neon-blue border border-neon-blue/20 font-black tracking-widest uppercase italic">
                      RANK_#0{s.rank}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setView("edit-profile")}
                  className="px-8 py-4 rounded-2xl bg-foreground text-background text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  Edit_Identity
                </button>
              </div>
            </div>

            {/* Standard Settings Groups */}
            <div className="grid md:grid-cols-2 gap-10">
               {/* Notifications */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-l-2 border-neon-blue pl-6">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neon-blue mb-1">Signals</p>
                      <h3 className="text-xl font-display font-black text-foreground uppercase italic tracking-widest">Protocol Alerts</h3>
                   </div>
                </div>
                <div className="glass-card-hover divide-y divide-white/5 bg-zinc-950/20 border-white/5 overflow-hidden rounded-[2.5rem]">
                  {[
                    { key: "push", label: "Signal_Burst", desc: "REALTIME_NODE_ALERTS", icon: Bell },
                    { key: "email", label: "Intel_Digest", desc: "WEEKLY_OPS_SUMMARY", icon: Shield },
                    { key: "streakReminders", label: "Focus_Pings", desc: "PERSISTENCE_VERIFICATION", icon: Vibrate },
                    { key: "planUpdates", label: "Directives", desc: "AUTHORIZED_PLAN_SYNC", icon: Zap },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-6 p-8 hover:bg-white/[0.02] transition-colors group">
                      <div className="p-3 rounded-xl bg-zinc-900 border border-white/5 group-hover:border-neon-blue/30 transition-colors">
                        <item.icon className="h-4 w-4 text-muted-foreground/40 group-hover:text-neon-blue transition-colors" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-black text-foreground uppercase tracking-widest">{item.label}</p>
                        <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-tighter mt-1">{item.desc}</p>
                      </div>
                      <Toggle
                        enabled={notifications[item.key as keyof typeof notifications]}
                        onToggle={() => toggle("notifications", item.key)}
                        accent="bg-neon-blue"
                      />
                    </div>
                  ))}
                </div>
              </div>

               {/* Privacy */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-l-2 border-neon-orange pl-6">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neon-orange mb-1">Shield</p>
                      <h3 className="text-xl font-display font-black text-foreground uppercase italic tracking-widest">Visibility Logic</h3>
                   </div>
                </div>
                <div className="glass-card-hover divide-y divide-white/5 bg-zinc-950/20 border-white/5 overflow-hidden rounded-[2.5rem]">
                  {[
                    { key: "publicProfile", label: "Cloak_Deactivate", desc: "OPEN_NETWORK_DISCOVERY", icon: Unlock },
                    { key: "showStreak", label: "Telemetry_Sync", desc: "BROADCAST_PERSISTENCE_STAT", icon: Activity },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-6 p-8 hover:bg-white/[0.02] transition-colors group">
                      <div className="p-3 rounded-xl bg-zinc-900 border border-white/5 group-hover:border-neon-orange/30 transition-colors">
                        <item.icon className="h-4 w-4 text-muted-foreground/40 group-hover:text-neon-orange transition-colors" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-black text-foreground uppercase tracking-widest">{item.label}</p>
                        <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-tighter mt-1">{item.desc}</p>
                      </div>
                      <Toggle
                        enabled={privacy[item.key as keyof typeof privacy]}
                        onToggle={() => toggle("privacy", item.key)}
                        accent="bg-neon-orange"
                      />
                    </div>
                  ))}
                </div>

                {/* Log Out Section */}
                <div className="pt-8 space-y-6">
                  <button
                    onClick={() => navigate("/")}
                    className="w-full flex items-center justify-center gap-4 h-20 rounded-[2.5rem] bg-red-500/5 text-red-500 border border-red-500/10 hover:bg-red-500/10 transition-all text-[11px] font-black uppercase tracking-[0.4em] active:scale-95 shadow-xl group"
                  >
                    <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                    Terminate_Session
                  </button>
                  <div className="flex flex-col items-center gap-2 opacity-10">
                    <p className="text-[9px] uppercase tracking-[0.5em] font-black">AFTER_HOURS_COLLECTIVE</p>
                    <p className="text-[8px] font-black uppercase tracking-widest tabular-nums">OPERATIONAL_v1.0.4_BETA</p>
                  </div>
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
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setView("menu")} 
                className="p-4 rounded-2xl bg-zinc-950/50 hover:bg-zinc-900 border border-white/5 transition-all active:scale-90"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </button>
              <div>
                <p className="text-[10px] font-black tracking-[0.4em] text-neon-orange uppercase">Identity_Modification</p>
                <h1 className="text-4xl font-display font-black text-foreground uppercase italic tracking-tighter">Edit Biometrics</h1>
              </div>
            </div>

            <div className="glass-card-hover p-10 bg-zinc-950/20 border-white/5 rounded-[3rem] space-y-10">
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground px-1">Unit_Alias</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ENTER_OPERATIVE_NAME"
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-5 text-sm font-black text-foreground placeholder:text-white/10 focus:outline-none focus:border-neon-orange/40 transition-all uppercase tracking-widest"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground px-1">Tactical_Objective</label>
                  <input
                    value={formData.fitnessGoal}
                    onChange={(e) => setFormData({ ...formData, fitnessGoal: e.target.value })}
                    placeholder="e.g., POWER_OUTPUT_MAXIMIZATION"
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-5 text-sm font-black text-foreground placeholder:text-white/10 focus:outline-none focus:border-neon-orange/40 transition-all uppercase tracking-widest"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground px-1">Bio_Mass (kg)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-5 text-sm font-black text-foreground tabular-nums focus:outline-none focus:border-neon-orange/40 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground px-1">Vertical_Delta (cm)</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-5 text-sm font-black text-foreground tabular-nums focus:outline-none focus:border-neon-orange/40 transition-all"
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={handleSaveProfile}
                  className="w-full h-20 bg-foreground text-background rounded-[1.5rem] font-display font-black text-sm uppercase italic tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-2xl group"
                >
                  <Save className="h-6 w-6" />
                  Synchronize_Changes
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

