import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, useStore } from "@/hooks/useStore";
import {
  Trophy, Flame, Footprints, Target, Crown, Activity, Zap,
  ChevronUp, TrendingUp, Medal, Sparkles,
} from "lucide-react";
import { LeaderboardEntry } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { LUXURY_TWEEN_MEDIUM, LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";
import { Link } from "react-router-dom";

const filters = ["Weekly", "Monthly", "Streak", "Uploads"] as const;
type Filter = (typeof filters)[number];

const filterIcons: Record<Filter, React.ElementType> = {
  Weekly: Trophy,
  Monthly: Target,
  Streak: Flame,
  Uploads: Zap,
};

const filterColors: Record<Filter, string> = {
  Weekly: "#C9F85A",
  Monthly: "#4DD2FF",
  Streak: "#FF4D00",
  Uploads: "#FFD36E",
};

function getSortedData(data: LeaderboardEntry[], filter: Filter) {
  switch (filter) {
    case "Streak":
      return [...data].sort((a, b) => b.streak - a.streak).map((e, i) => ({ ...e, rank: i + 1 }));
    case "Uploads":
      return [...data].sort((a, b) => b.uploads - a.uploads).map((e, i) => ({ ...e, rank: i + 1 }));
    case "Monthly":
      return [...data].sort((a, b) => b.completionPercentage - a.completionPercentage).map((e, i) => ({ ...e, rank: i + 1 }));
    default:
      return [...data].sort((a, b) => b.score - a.score).map((e, i) => ({ ...e, rank: i + 1 }));
  }
}

function getScoreLabel(entry: LeaderboardEntry, filter: Filter) {
  switch (filter) {
    case "Monthly": return `${entry.completionPercentage}%`;
    case "Streak":  return `${entry.streak} days`;
    case "Uploads": return `${entry.uploads} logs`;
    default:        return entry.score.toLocaleString();
  }
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_GRADIENTS = [
  "from-[#C9F85A] to-[#4DD2FF]",
  "from-[#FFD36E] to-[#FF4D00]",
  "from-[#FF7AE5] to-[#A78BFA]",
  "from-[#4DD2FF] to-[#6F5CFF]",
  "from-[#C9F85A] to-[#FFD36E]",
];

const PODIUM_ORDER = [1, 0, 2]; // visual: 2nd, 1st, 3rd

export default function LeaderboardPage() {
  const { leaderboard, student, loading } = useStore();
  const refreshData = useAppStore((state) => state.refreshData);
  const [activeFilter, setActiveFilter] = useState<Filter>("Weekly");

  useEffect(() => {
    void refreshData({ background: true, scope: "student" });
  }, [refreshData]);

  const sorted = getSortedData(leaderboard, activeFilter);
  const top3 = useMemo(() => {
    if (sorted.length < 3) return sorted;
    return PODIUM_ORDER.map((i) => sorted[i]);
  }, [sorted]);

  const myEntry = sorted.find((e) => e.userId === student.id);
  const accentColor = filterColors[activeFilter];
  const rest = sorted.slice(3);

  if (loading && leaderboard.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-14 w-72 rounded-2xl" />
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-24 shrink-0 rounded-full" />)}
        </div>
        <div className="flex items-end justify-center gap-4 h-72">
          <Skeleton className="h-44 w-28 rounded-t-3xl" />
          <Skeleton className="h-60 w-28 rounded-t-3xl" />
          <Skeleton className="h-36 w-28 rounded-t-3xl" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-3xl space-y-5 overflow-x-hidden p-3 sm:p-6 lg:p-8 pb-24 sm:pb-10 touch-manipulation"
      style={{ touchAction: "manipulation", WebkitTextSizeAdjust: "100%" }}
    >

      {/* ── Hero header ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-[28px] border border-white/10 bg-[#121212] p-4 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        {/* Ambient glow */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none transition-all duration-700 opacity-30"
          style={{ background: accentColor }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full blur-[80px] pointer-events-none transition-all duration-700 opacity-15"
          style={{ background: accentColor }}
        />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors duration-300"
              style={{ background: `${accentColor}18`, borderColor: `${accentColor}35` }}
            >
              <Sparkles className="h-3.5 w-3.5" style={{ color: accentColor }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: accentColor }}>
                Leaderboard
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-none">Rankings</h1>
            <p className="text-sm text-white/35 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" style={{ color: accentColor }} />
              <span><span className="font-semibold text-white/60">{sorted.length}</span> athletes ranked · {activeFilter}</span>
            </p>
          </div>

          {myEntry && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.2 }}
              className="rounded-2xl border p-4 sm:p-5 text-center w-full sm:min-w-[90px] relative overflow-hidden"
              style={{ background: `${accentColor}0C`, borderColor: `${accentColor}30` }}
            >
              <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, ${accentColor}15, transparent 60%)` }} />
              <p className="text-[10px] text-white/30 uppercase tracking-[0.15em] mb-1.5 relative z-10">Your Rank</p>
              <p className="text-3xl font-black relative z-10" style={{ color: accentColor }}>#{myEntry.rank}</p>
              <p className="text-[10px] text-white/25 mt-1 relative z-10">{getScoreLabel(myEntry, activeFilter)}</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Filter pills ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.06 }}
        className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide"
      >
        {filters.map((f) => {
          const Icon = filterIcons[f];
          const active = activeFilter === f;
          const col = filterColors[f];
          return (
            <motion.button
              key={f}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(f)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 border ${
                active
                  ? "text-black border-transparent shadow-lg"
                  : "bg-[#1A1A1A] border-white/8 text-white/50 hover:text-white hover:bg-[#202020] hover:border-white/15"
              }`}
              style={active ? { background: col, boxShadow: `0 4px 24px ${col}40` } : {}}
            >
              <Icon className="h-3.5 w-3.5" />
              {f}
            </motion.button>
          );
        })}
      </motion.div>

      {/* ── Podium showcase ──────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFilter + "podium"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.08 }}
          className="rounded-[28px] border border-white/10 bg-[#121212] p-4 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(${accentColor} 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }} />

          <div className="grid grid-cols-3 items-end justify-center gap-2 sm:flex sm:gap-8 pt-4 sm:pt-8 pb-2 relative z-10">
            {top3.map((e, visualIdx) => {
              if (!e) return null;
              const isWinner = visualIdx === 1;
              const gradIdx = e.userId.charCodeAt(0) % AVATAR_GRADIENTS.length;
              const podiumHeights = ["h-20 sm:h-32", "h-28 sm:h-48", "h-16 sm:h-24"];
              const avatarSizes = ["w-12 h-12 sm:w-16 sm:h-16", "w-16 h-16 sm:w-24 sm:h-24", "w-11 h-11 sm:w-14 sm:h-14"];
              const rankEmojis = ["🥈", "🥇", "🥉"];
              const medalColors = ["#C0C0C0", accentColor, "#CD7F32"];

              return (
                <motion.div
                  key={e.userId + activeFilter}
                  initial={{ opacity: 0, y: 30, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ ...LUXURY_TWEEN_SLOW, delay: visualIdx * 0.12 }}
                  className="flex flex-col items-center gap-2 sm:gap-3 min-w-0"
                >
                  {/* Avatar + Crown */}
                  <div className="relative">
                    {isWinner && (
                      <motion.div
                        animate={{ y: [0, -5, 0], rotate: [0, 3, -3, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        className="absolute -top-9 left-1/2 -translate-x-1/2"
                      >
                        <Crown className="h-6 w-6 drop-shadow-lg" style={{ color: accentColor, filter: `drop-shadow(0 0 8px ${accentColor}80)` }} />
                      </motion.div>
                    )}

                    {/* Glow ring behind avatar */}
                    <div
                      className="absolute inset-0 rounded-2xl blur-md transition-all duration-500"
                      style={{
                        background: isWinner ? `${accentColor}30` : `${medalColors[visualIdx]}15`,
                        transform: "scale(1.3)",
                      }}
                    />

                    <div className={`${avatarSizes[visualIdx]} rounded-2xl bg-gradient-to-br ${AVATAR_GRADIENTS[gradIdx]} p-[2.5px] relative`}>
                      <div className="w-full h-full rounded-[14px] bg-[#1A1A1A] flex items-center justify-center font-bold text-white" style={{ fontSize: isWinner ? "1.05rem" : "0.8rem" }}>
                        {getInitials(e.name)}
                      </div>
                    </div>

                    {/* Rank badge overlay */}
                    <div
                      className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-lg border-2 border-[#121212]"
                      style={{ background: medalColors[visualIdx] }}
                    >
                      <span className="text-xs font-black text-black">{[2, 1, 3][visualIdx]}</span>
                    </div>
                  </div>

                  {/* Name + Score */}
                  <div className="text-center mt-1">
                    <p className={`font-semibold text-white truncate max-w-[80px] ${isWinner ? "text-sm" : "text-xs"}`}>
                      {e.name.split(" ")[0]}
                    </p>
                    <p
                      className="text-[11px] mt-0.5 font-bold"
                      style={{ color: isWinner ? accentColor : "rgba(255,255,255,0.45)" }}
                    >
                      {getScoreLabel(e, activeFilter)}
                    </p>
                  </div>

                  {/* Podium column */}
                  <div className="relative">
                    <div
                      className={`${podiumHeights[visualIdx]} w-full sm:w-28 rounded-t-[20px] border-x border-t flex flex-col items-center justify-end pb-3 sm:pb-5 transition-all relative overflow-hidden`}
                      style={{
                        borderColor: `${medalColors[visualIdx]}30`,
                        background: `linear-gradient(to bottom, ${medalColors[visualIdx]}12, transparent 80%)`,
                      }}
                    >
                      {/* Shimmer effect on winner */}
                      {isWinner && (
                        <div className="absolute inset-0 shimmer opacity-50" />
                      )}
                      <span className="text-2xl sm:text-3xl relative z-10">{rankEmojis[visualIdx]}</span>
                      <div className="w-8 sm:w-10 h-0.5 rounded-full mt-2 relative z-10" style={{ background: `${medalColors[visualIdx]}30` }} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Your rank highlight ──────────────────────── */}
      {myEntry && (
        <motion.div
          key={activeFilter + "me"}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={LUXURY_TWEEN_MEDIUM}
          className="rounded-2xl border p-4 flex items-center gap-3 sm:gap-4 relative overflow-hidden group"
          style={{ background: `${accentColor}0C`, borderColor: `${accentColor}25` }}
        >
          {/* Animated left accent */}
          <motion.div
            className="w-1 h-10 rounded-full flex-shrink-0"
            style={{ background: accentColor }}
            animate={{ scaleY: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/35 uppercase tracking-[0.15em] mb-0.5 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" style={{ color: accentColor }} />
              Your Position
            </p>
            <p className="text-base font-bold text-white">Rank #{myEntry.rank} <span className="text-xs text-white/30 font-normal">of {sorted.length}</span></p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-black" style={{ color: accentColor }}>{getScoreLabel(myEntry, activeFilter)}</p>
            <p className="text-[10px] text-white/25">{myEntry.score.toLocaleString()} total pts</p>
          </div>
        </motion.div>
      )}

      {/* ── Full ranking list ────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFilter + "list"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.15 }}
          className="rounded-[28px] border border-white/10 bg-[#121212] p-3 sm:p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {/* Table header */}
          <div className="hidden sm:flex items-center gap-4 px-4 py-3 border-b border-white/5 mb-1">
            <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em] w-10 text-center">Rank</p>
            <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em] flex-1">Athlete</p>
            <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em] text-right w-20">Score</p>
            <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em] text-right w-16 hidden sm:block">Streak</p>
          </div>

          {sorted.map((entry, idx) => {
            const isMe = entry.userId === student.id;
            const gradIdx = entry.userId.charCodeAt(0) % AVATAR_GRADIENTS.length;
            const isTop3 = entry.rank <= 3;
            const rankColors: Record<number, string> = { 1: "#FFD36E", 2: "#C0C0C0", 3: "#CD7F32" };

            return (
              <Link key={entry.userId + activeFilter} to={`/student/profile/${entry.userId}`}>
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...LUXURY_TWEEN_MEDIUM, delay: Math.min(idx, 15) * 0.03 }}
                  className={`flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3.5 rounded-2xl transition-all cursor-pointer group ${
                    isMe
                      ? "border border-[#C9F85A]/20 bg-[#C9F85A]/[0.04]"
                      : "hover:bg-white/[0.03] border border-transparent hover:border-white/8"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-9 sm:w-10 flex-shrink-0 flex items-center justify-center">
                    {isTop3 ? (
                      <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shadow-md"
                        style={{
                          background: `linear-gradient(135deg, ${rankColors[entry.rank]}, ${rankColors[entry.rank]}80)`,
                          color: entry.rank === 2 ? "#111" : entry.rank === 3 ? "#fff" : "#111",
                          boxShadow: `0 2px 12px ${rankColors[entry.rank]}40`,
                        }}
                      >
                        {entry.rank}
                      </div>
                    ) : (
                      <span className={`text-xs font-bold tabular-nums ${isMe ? "text-[#C9F85A]" : "text-white/25"}`}>
                        #{entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${AVATAR_GRADIENTS[gradIdx]} p-[1.5px] flex-shrink-0`}>
                    <div className="w-full h-full rounded-[10px] bg-[#1A1A1A] flex items-center justify-center text-[11px] font-bold text-white">
                      {getInitials(entry.name)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] sm:text-sm font-semibold truncate transition-colors ${isMe ? "text-[#C9F85A]" : "text-white group-hover:text-white/90"}`}>
                      {entry.name}
                      {isMe && <span className="ml-2 text-[10px] text-[#C9F85A]/50 font-normal">(you)</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Flame className="h-3 w-3 text-[#FF4D00]" />
                      <span className="text-[11px] text-white/30">{entry.streak}d</span>
                      <span className="text-white/15">·</span>
                      <span className="text-[11px] text-white/30">{entry.completionPercentage}%</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0 w-18 sm:w-20">
                    <p className={`text-sm font-bold tabular-nums ${isMe ? "text-[#C9F85A]" : "text-white"}`}>
                      {getScoreLabel(entry, activeFilter)}
                    </p>
                    <p className="text-[10px] text-white/20">{entry.score.toLocaleString()} pts</p>
                  </div>

                  {/* Streak bar (hidden on mobile) */}
                  <div className="w-16 flex-shrink-0 hidden sm:block">
                    <div className="h-1 bg-[#1A1A1A] rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (entry.streak / 30) * 100)}%` }}
                        transition={{ ...LUXURY_TWEEN_SLOW, delay: idx * 0.03 }}
                        className="h-full rounded-full"
                        style={{
                          background: isMe ? "#C9F85A" : accentColor,
                          boxShadow: entry.streak > 7 ? `0 0 6px ${accentColor}60` : "none",
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}

          {sorted.length === 0 && (
            <div className="text-center py-16 text-white/25 text-sm">
              No rankings available yet. Start grinding!
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
