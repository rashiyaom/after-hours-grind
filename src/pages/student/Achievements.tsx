import React from "react";
import { motion } from "framer-motion";
import { Award, Flame, Footprints, Trophy, Star, Sun, Leaf, Lock } from "lucide-react";
import { currentStudent } from "@/data/mockData";
import SectionHeader from "@/components/SectionHeader";

const iconMap: Record<string, React.ElementType> = {
  flame: Flame,
  footprints: Footprints,
  trophy: Trophy,
  star: Star,
  sunrise: Sun,
  salad: Leaf,
};

const allBadges = [
  ...currentStudent.badges,
  { id: "b7", name: "Upload King", description: "Upload 50 check-ins", icon: "trophy", earned: false },
  { id: "b8", name: "Community Builder", description: "Follow 20 students", icon: "star", earned: false },
  { id: "b9", name: "Speed Demon", description: "Finish workout in record time", icon: "flame", earned: false },
];

const milestones = [
  { label: "7 Days Streak", current: 12, target: 7, done: true },
  { label: "14 Days Streak", current: 12, target: 14, done: false },
  { label: "21 Days Streak", current: 12, target: 21, done: false },
  { label: "10K Steps in a Day", current: 8432, target: 10000, done: false },
  { label: "50 Likes on Post", current: 47, target: 50, done: false },
  { label: "Complete 28-Day Plan", current: 7, target: 28, done: false },
];

export default function AchievementsPage() {
  const earned = allBadges.filter((b) => b.earned);
  const locked = allBadges.filter((b) => !b.earned);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Achievements</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {earned.length} of {allBadges.length} badges earned
        </p>
      </motion.div>

      {/* Summary Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-6 flex items-center gap-6"
      >
        <div className="p-4 rounded-2xl bg-streak/10">
          <Award className="h-10 w-10 text-streak" />
        </div>
        <div>
          <p className="text-3xl font-display font-bold text-foreground">{earned.length}</p>
          <p className="text-sm text-muted-foreground">Badges Earned</p>
        </div>
        <div className="w-px h-12 bg-border mx-2" />
        <div>
          <p className="text-3xl font-display font-bold text-foreground">{locked.length}</p>
          <p className="text-sm text-muted-foreground">Yet to Unlock</p>
        </div>
      </motion.div>

      {/* Earned Badges */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SectionHeader title="Earned Badges" subtitle={`${earned.length} unlocked`} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {earned.map((badge, i) => {
            const Icon = iconMap[badge.icon] || Award;
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 flex flex-col items-center text-center gap-3"
              >
                <div className="p-3 rounded-2xl bg-streak/10">
                  <Icon className="h-6 w-6 text-streak" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{badge.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{badge.description}</p>
                </div>
                {badge.earnedDate && (
                  <span className="text-[10px] text-muted-foreground/60">
                    Earned {badge.earnedDate}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Locked Badges */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <SectionHeader title="Locked Badges" subtitle="Keep grinding to unlock" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {locked.map((badge, i) => {
            const Icon = iconMap[badge.icon] || Award;
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="glass-card p-5 flex flex-col items-center text-center gap-3 opacity-40"
              >
                <div className="relative p-3 rounded-2xl bg-muted/30">
                  <Icon className="h-6 w-6 text-muted-foreground" />
                  <Lock className="h-3 w-3 text-muted-foreground absolute -bottom-1 -right-1" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{badge.name}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">{badge.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Progress Milestones */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
        <SectionHeader title="Milestone Tracker" />
        <div className="space-y-5">
          {milestones.map((m, i) => {
            const pct = Math.min(100, Math.round((m.current / m.target) * 100));
            return (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={`font-medium ${m.done ? "text-foreground" : "text-muted-foreground"}`}>
                    {m.done && "✓ "}{m.label}
                  </span>
                  <span className="text-muted-foreground">
                    {m.current.toLocaleString()} / {m.target.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className={`h-full rounded-full ${m.done ? "bg-streak" : "bg-foreground/60"}`}
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
