import { useState } from "react";
import { motion } from "framer-motion";
import LeaderboardRow from "@/components/LeaderboardRow";
import { leaderboardData } from "@/data/mockData";

const filters = ["Daily", "Weekly", "Monthly", "Streak", "Trainer Group"];

export default function LeaderboardPage() {
  const [activeFilter, setActiveFilter] = useState("Weekly");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Compete. Climb. Conquer.</p>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${activeFilter === f ? "bg-foreground text-background" : "bg-muted/40 text-muted-foreground hover:text-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Top 3 */}
      <div className="flex items-end justify-center gap-4 py-8">
        {[leaderboardData[1], leaderboardData[0], leaderboardData[2]].map((e, i) => {
          const heights = ["h-20", "h-28", "h-16"];
          const sizes = ["w-12 h-12", "w-16 h-16", "w-12 h-12"];
          return (
            <motion.div key={e.userId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex flex-col items-center gap-2">
              <div className={`${sizes[i]} rounded-full bg-accent flex items-center justify-center text-sm font-medium text-foreground`}>
                {e.name.split(" ").map(n => n[0]).join("")}
              </div>
              <p className="text-xs font-medium text-foreground">{e.name.split(" ")[0]}</p>
              <div className={`${heights[i]} w-16 bg-muted/40 rounded-t-xl flex items-center justify-center`}>
                <span className="text-lg font-display font-bold text-foreground">#{e.rank}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full list */}
      <div className="glass-card p-2 space-y-1">
        {leaderboardData.map((entry) => (
          <LeaderboardRow key={entry.rank} entry={entry} highlight={entry.userId === "s1"} />
        ))}
      </div>
    </div>
  );
}
