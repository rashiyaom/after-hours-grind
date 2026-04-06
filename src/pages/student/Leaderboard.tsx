import React, { useState } from "react";
import { motion } from "framer-motion";
import LeaderboardRow from "@/components/LeaderboardRow";
import { leaderboardData } from "@/data/mockData";
import { Trophy, Flame, Footprints, Target } from "lucide-react";

const filters = ["Weekly", "Monthly", "Streak", "Steps", "Uploads"];

function getSortedData(filter: string) {
  switch (filter) {
    case "Streak":
      return [...leaderboardData].sort((a, b) => b.streak - a.streak).map((e, i) => ({ ...e, rank: i + 1 }));
    case "Steps":
      return [...leaderboardData].sort((a, b) => b.steps - a.steps).map((e, i) => ({ ...e, rank: i + 1 }));
    case "Uploads":
      return [...leaderboardData].sort((a, b) => b.uploads - a.uploads).map((e, i) => ({ ...e, rank: i + 1 }));
    case "Monthly":
      return [...leaderboardData]
        .sort((a, b) => b.completionPercentage - a.completionPercentage)
        .map((e, i) => ({ ...e, rank: i + 1 }));
    default:
      return leaderboardData;
  }
}

const filterIcons: Record<string, React.ElementType> = {
  Weekly: Trophy,
  Monthly: Target,
  Streak: Flame,
  Steps: Footprints,
  Uploads: Trophy,
};

export default function LeaderboardPage() {
  const [activeFilter, setActiveFilter] = useState("Weekly");
  const sorted = getSortedData(activeFilter);
  const top3 = [sorted[1], sorted[0], sorted[2]];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Compete. Climb. Conquer.</p>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map((f) => {
          const Icon = filterIcons[f] || Trophy;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeFilter === f
                  ? "bg-foreground text-background"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3 w-3" />
              {f}
            </button>
          );
        })}
      </div>

      {/* Top 3 Podium */}
      <motion.div
        key={activeFilter}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-center gap-3 py-6"
      >
        {top3.map((e, i) => {
          const heights = ["h-20", "h-28", "h-16"];
          const sizes = ["w-14 h-14", "w-20 h-20", "w-12 h-12"];
          const labels = ["🥈 2nd", "🥇 1st", "🥉 3rd"];
          const scoreLabel = {
            Weekly: `${e.score.toLocaleString()} pts`,
            Monthly: `${e.completionPercentage}%`,
            Streak: `${e.streak}d`,
            Steps: `${(e.steps / 1000).toFixed(0)}K`,
            Uploads: `${e.uploads}`,
          }[activeFilter] || `${e.score.toLocaleString()} pts`;

          return (
            <motion.div
              key={e.userId + activeFilter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex flex-col items-center gap-2"
            >
              <div className={`${sizes[i]} rounded-full bg-accent border-2 ${i === 1 ? "border-foreground/30" : "border-border/50"} flex items-center justify-center text-sm font-bold text-foreground`}>
                {e.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <p className="text-xs font-medium text-foreground">{e.name.split(" ")[0]}</p>
              <p className="text-[10px] text-muted-foreground">{scoreLabel}</p>
              <div className={`${heights[i]} w-20 rounded-t-xl flex items-end justify-center pb-2 ${i === 1 ? "bg-foreground/10 border-t border-foreground/20" : "bg-muted/30"}`}>
                <span className={`text-xs font-display font-bold ${i === 1 ? "text-foreground" : "text-muted-foreground"}`}>
                  {labels[i]}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Your rank callout */}
      {(() => {
        const myEntry = sorted.find((e) => e.userId === "s1");
        if (!myEntry) return null;
        return (
          <motion.div
            key={activeFilter + "me"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-foreground/5 border border-foreground/10"
          >
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-foreground flex-1">
              You are <span className="font-bold">#{myEntry.rank}</span> on {activeFilter} leaderboard
            </p>
            <span className="text-xs text-muted-foreground">{myEntry.score.toLocaleString()} pts</span>
          </motion.div>
        );
      })()}

      {/* Full list */}
      <motion.div
        key={activeFilter + "list"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-2 space-y-1"
      >
        {sorted.map((entry) => (
          <LeaderboardRow key={entry.userId + activeFilter} entry={entry} highlight={entry.userId === "s1"} />
        ))}
      </motion.div>
    </div>
  );
}
