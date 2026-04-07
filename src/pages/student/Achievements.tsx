import React from "react";
import { motion } from "framer-motion";
import { Award, Flame, Footprints, Trophy, Star, Sun, Leaf, Lock, ShieldCheck, Zap, Activity, ChevronRight, CheckCircle2 } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { Badge } from "@/types";
import { LUXURY_TWEEN_MEDIUM, LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";

const iconMap: Record<string, React.ElementType> = {
  flame: Flame,
  footprints: Footprints,
  trophy: Trophy,
  star: Star,
  sunrise: Sun,
  salad: Leaf,
};

export default function AchievementsPage() {
  const { student: s } = useStore();
  
  const allBadges: Badge[] = [
    ...s.badges,
    { id: "b7", name: "Upload_King", description: "COMMIT_50_INTELLIGENCE_LOGS", icon: "trophy", earned: false, date: "Locked" },
    { id: "b8", name: "Community_Anchor", description: "LINK_20_ACTIVE_UNITS", icon: "star", earned: false, date: "Locked" },
    { id: "b9", name: "Zero_Hour_Operative", description: "COMPLETE_DIRECTIVE_PRE_DAWN", icon: "flame", earned: false, date: "Locked" },
  ];

  const milestones = [
    { label: "7_DAY_PERSISTENCE", current: s.streak, target: 7, done: s.streak >= 7 },
    { label: "14_DAY_PERSISTENCE", current: s.streak, target: 14, done: s.streak >= 14 },
    { label: "LOCOMOTION_STRIKEOUT", current: 8432, target: 10000, done: false },
    { label: "INTEL_COMMITS", current: 30, target: 50, done: false },
    { label: "PROTOCOL_MASTERY", current: s.completionPercentage, target: 100, done: s.completionPercentage >= 100 },
  ];

  const earned = allBadges.filter((b) => b.earned);
  const locked = allBadges.filter((b) => !b.earned);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-10 pb-28 relative">
       <div className="absolute top-0 left-0 w-96 h-96 bg-neon-orange/5 blur-3xl pointer-events-none" />
       
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <div className="flex items-center gap-3 mb-2">
           <div className="p-2 rounded-lg bg-neon-orange/10 border border-neon-orange/20">
              <Award className="h-4 w-4 text-neon-orange" />
           </div>
           <p className="text-[10px] font-black text-neon-orange uppercase tracking-[0.4em]">_Asset_Inventory</p>
        </div>
        <h1 className="text-4xl font-display font-black text-foreground tracking-tighter uppercase italic">Merit Repository</h1>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-2">
           <Zap className="h-3 w-3" /> <span className="text-neon-orange">{earned.length}</span> / {allBadges.length} ASSETS_SYNCHRONIZED
        </p>
      </motion.div>

      {/* Summary Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.1 }}
        className="glass-card-hover p-10 flex flex-col sm:flex-row items-center gap-10 bg-zinc-950/40 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
           <ShieldCheck className="h-32 w-32" />
        </div>
        <div className="relative">
           <div className="w-24 h-24 rounded-[2.5rem] bg-neon-orange/10 border-2 border-neon-orange/40 flex items-center justify-center shadow-[0_0_40px_rgba(255,165,0,0.2)] animate-pulse">
              <Award className="h-12 w-12 text-neon-orange" />
           </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
           <p className="text-3xl font-display font-black text-foreground italic uppercase tracking-tighter leading-none mb-2">Alpha_Specialist</p>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Status: Elite_Status_Imminent</p>
        </div>
        <div className="flex gap-8 border-l border-white/5 pl-8 hidden sm:flex">
          <div>
            <p className="text-3xl font-display font-black text-foreground tabular-nums">{earned.length}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Unlocked</p>
          </div>
          <div>
            <p className="text-3xl font-display font-black text-white/20 tabular-nums">{locked.length}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/20">Locked</p>
          </div>
        </div>
      </motion.div>

      {/* Earned Badges */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.2 }}>
        <div className="flex items-end justify-between border-l-2 border-neon-orange pl-6 mb-8 mt-6">
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-neon-orange mb-1">Authenticated_Assets</p>
              <h2 className="text-2xl font-display font-black text-foreground uppercase italic tracking-widest">_UNLOCKED_CACHE</h2>
           </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {earned.map((badge, i) => {
            const Icon = iconMap[badge.icon] || Award;
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.05 }}
                className="bg-card glass-card-hover p-8 flex flex-col items-center text-center gap-5 border-white/5 rounded-[3rem] group"
              >
                <div className="relative">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-900 border border-neon-orange/40 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                     <Icon className="h-8 w-8 text-neon-orange drop-shadow-[0_0_10px_rgba(255,165,0,0.5)]" />
                   </div>
                </div>
                <div>
                  <p className="text-[11px] font-black text-foreground uppercase tracking-widest mb-2 italic">{badge.name.replace(" ", "_")}</p>
                  <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tighter leading-snug">{badge.description}</p>
                </div>
                {badge.earnedDate && (
                  <div className="mt-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[8px] font-black text-muted-foreground/40 tracking-widest">
                    SYNCED: {badge.earnedDate}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Locked Badges */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.3 }}>
        <div className="flex items-end justify-between border-l-2 border-white/10 pl-6 mb-8 mt-12">
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 mb-1">Encrypted_Items</p>
              <h2 className="text-2xl font-display font-black text-white/10 uppercase italic tracking-widest">_RESTRICTED_ACCESS</h2>
           </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 opacity-40">
          {locked.map((badge, i) => {
            const Icon = iconMap[badge.icon] || Award;
            return (
              <motion.div
                key={badge.id}
                className="bg-zinc-950/20 p-8 flex flex-col items-center text-center gap-5 border border-dashed border-white/5 rounded-[3rem] grayscale group"
              >
                <div className="relative">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-950 border border-white/5 flex items-center justify-center">
                     <Icon className="h-8 w-8 text-white/5" />
                     <Lock className="h-4 w-4 text-white/10 absolute -top-1 -right-1" />
                   </div>
                </div>
                <div>
                  <p className="text-[11px] font-black text-white/10 uppercase tracking-widest mb-2">{badge.name.replace(" ", "_")}</p>
                  <p className="text-[9px] font-bold text-white/5 uppercase tracking-tighter leading-snug">{badge.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Progress Milestones */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.4 }} className="glass-card-hover p-10 bg-zinc-950/20 border-white/5 rounded-[3rem] mt-12">
        <div className="flex items-center gap-4 mb-10">
           <Activity className="h-5 w-5 text-neon-blue" />
           <h3 className="text-xl font-display font-black text-foreground uppercase italic tracking-widest">Operational Milestones</h3>
        </div>
        
        <div className="space-y-8">
          {milestones.map((m, i) => {
            const pct = Math.min(100, Math.round((m.current / m.target) * 100));
            return (
              <div key={i} className="group">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-3 transition-colors group-hover:text-foreground">
                  <span className={`flex items-center gap-2 ${m.done ? "text-neon-orange" : "text-muted-foreground"}`}>
                    {m.done && <CheckCircle2 className="h-3 w-3" />}{m.label}
                  </span>
                  <span className="text-muted-foreground/40 tabular-nums">
                    {m.current.toLocaleString()} / {m.target.toLocaleString()}
                  </span>
                </div>
                <div className="h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ ...LUXURY_TWEEN_SLOW, delay: i * 0.1 }}
                    className={`h-full rounded-full ${m.done ? "bg-neon-orange shadow-[0_0_15px_rgba(255,165,0,0.4)]" : "bg-white/5"}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
