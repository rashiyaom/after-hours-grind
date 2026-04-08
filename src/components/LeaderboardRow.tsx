import { LeaderboardEntry } from "@/types";
import { Flame } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";

const RANK_STYLES: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "bg-[#FFD36E]/20 border border-[#FFD36E]/40", text: "text-[#FFD36E]", label: "🥇" },
  2: { bg: "bg-white/10 border border-white/20", text: "text-white/70", label: "🥈" },
  3: { bg: "bg-[#CD7F3240]/20 border border-[#CD7F32]/30", text: "text-[#CD7F32]", label: "🥉" },
};

const AVATAR_GRADIENTS = [
  "from-[#C9F85A] to-[#4DD2FF]",
  "from-[#FF7AE5] to-[#A78BFA]",
  "from-[#FFD36E] to-[#FF4D00]",
  "from-[#4DD2FF] to-[#6F5CFF]",
  "from-[#C9F85A] to-[#FFD36E]",
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function LeaderboardRow({
  entry,
  highlight,
}: {
  entry: LeaderboardEntry;
  highlight?: boolean;
}) {
  const rankStyle = RANK_STYLES[entry.rank];
  const gradIdx = entry.userId.charCodeAt(0) % AVATAR_GRADIENTS.length;

  return (
    <Link to={`/student/profile/${entry.userId}`}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: Math.min(entry.rank, 10) * 0.04 }}
        className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all cursor-pointer group ${
          highlight
            ? "bg-[#C9F85A]/8 border border-[#C9F85A]/25"
            : "hover:bg-white/3 border border-transparent hover:border-white/8"
        }`}
      >
        {/* Rank badge */}
        <div className="w-8 flex-shrink-0 flex items-center justify-center">
          {rankStyle ? (
            <span className="text-lg leading-none">{rankStyle.label}</span>
          ) : (
            <span className={`text-xs font-bold tabular-nums ${highlight ? "text-[#C9F85A]" : "text-white/30"}`}>
              #{entry.rank}
            </span>
          )}
        </div>

        {/* Avatar */}
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${AVATAR_GRADIENTS[gradIdx]} p-[1.5px] flex-shrink-0`}>
          <div className="w-full h-full rounded-[10px] bg-[#1A1A1A] flex items-center justify-center text-[10px] font-bold text-white">
            {getInitials(entry.name)}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${highlight ? "text-[#C9F85A]" : "text-white group-hover:text-white/90"}`}>
            {entry.name}
            {highlight && <span className="ml-2 text-[10px] text-[#C9F85A]/60 font-normal">(you)</span>}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <Flame className="h-3 w-3 text-[#FF4D00]" />
            <span className="text-[11px] text-white/35">{entry.streak}d streak</span>
            <span className="text-white/20">·</span>
            <span className="text-[11px] text-white/35">{entry.completionPercentage}%</span>
          </div>
        </div>

        {/* Score */}
        <div className="text-right flex-shrink-0">
          <p className={`text-sm font-bold tabular-nums ${highlight ? "text-[#C9F85A]" : "text-white"}`}>
            {entry.score.toLocaleString()}
          </p>
          <p className="text-[10px] text-white/25">pts</p>
        </div>
      </motion.div>
    </Link>
  );
}
