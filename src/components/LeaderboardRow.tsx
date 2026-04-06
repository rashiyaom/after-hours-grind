import { LeaderboardEntry } from "@/types";
import { Flame, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function LeaderboardRow({ entry, highlight }: { entry: LeaderboardEntry; highlight?: boolean }) {
  const rankColors: Record<number, string> = {
    1: "text-foreground",
    2: "text-muted-foreground",
    3: "text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: entry.rank * 0.05 }}
      className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${
        highlight ? "bg-accent/80 border border-border" : "hover:bg-accent/40"
      }`}
    >
      <div className="w-8 text-center">
        {entry.rank <= 3 ? (
          <Trophy className={`h-5 w-5 mx-auto ${rankColors[entry.rank] || "text-muted-foreground"}`} />
        ) : (
          <span className="text-sm font-medium text-muted-foreground">#{entry.rank}</span>
        )}
      </div>
      <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-foreground flex-shrink-0">
        {entry.name.split(" ").map((n) => n[0]).join("")}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{entry.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Flame className="h-3 w-3 text-streak" />
          <span className="text-[11px] text-muted-foreground">{entry.streak}d</span>
          <span className="text-[11px] text-muted-foreground">·</span>
          <span className="text-[11px] text-muted-foreground">{entry.completionPercentage}%</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-display font-bold text-foreground">{entry.score.toLocaleString()}</p>
        <p className="text-[11px] text-muted-foreground">pts</p>
      </div>
    </motion.div>
  );
}
