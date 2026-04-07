import React from "react";
import { LeaderboardEntry } from "@/types";
import { Flame, Medal } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";

const medalColors: Record<number, string> = {
  1: "text-yellow-500",
  2: "text-zinc-400",
  3: "text-amber-700",
};

export default function LeaderboardRow({ entry, highlight }: { entry: LeaderboardEntry; highlight?: boolean }) {
  return (
    <Link to={`/student/profile/${entry.userId}`}>
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: entry.rank * 0.04 }}
        className={`flex items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer group ${
          highlight ? "bg-accent/80 border border-border" : "hover:bg-accent/40"
        }`}
      >
        {/* Rank */}
        <div className="w-8 text-center flex-shrink-0">
          {entry.rank <= 3 ? (
            <Medal className={`h-5 w-5 mx-auto ${medalColors[entry.rank]}`} />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">#{entry.rank}</span>
          )}
        </div>

        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0 transition-transform group-hover:scale-110 ${highlight ? "bg-foreground/20" : "bg-accent"}`}>
          {entry.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate group-hover:underline">
            {entry.name}
            {highlight && <span className="ml-1.5 text-[10px] text-muted-foreground">(You)</span>}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <Flame className="h-3 w-3 text-streak" />
            <span className="text-[11px] text-muted-foreground">{entry.streak}d</span>
            <span className="text-[11px] text-muted-foreground">·</span>
            <span className="text-[11px] text-muted-foreground">{entry.completionPercentage}%</span>
          </div>
        </div>

        {/* Score */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-display font-bold text-foreground">{entry.score.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">pts</p>
        </div>
      </motion.div>
    </Link>
  );
}
