import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, useStore } from "@/hooks/useStore";
import {
  Trophy, Flame, Target, Crown, Activity, Zap,
  TrendingUp, Sparkles, Medal, ChevronRight, Star,
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
  Weekly:  "#C9F85A",
  Monthly: "#4DD2FF",
  Streak:  "#FF4D00",
  Uploads: "#FFD36E",
};

function getSortedData(data: LeaderboardEntry[], filter: Filter) {
  switch (filter) {
    case "Streak":  return [...data].sort((a, b) => b.streak - a.streak).map((e, i) => ({ ...e, rank: i + 1 }));
    case "Uploads": return [...data].sort((a, b) => b.uploads - a.uploads).map((e, i) => ({ ...e, rank: i + 1 }));
    case "Monthly": return [...data].sort((a, b) => b.completionPercentage - a.completionPercentage).map((e, i) => ({ ...e, rank: i + 1 }));
    default:        return [...data].sort((a, b) => b.score - a.score).map((e, i) => ({ ...e, rank: i + 1 }));
  }
}

function getScoreValue(entry: LeaderboardEntry, filter: Filter): string {
  switch (filter) {
    case "Monthly": return `${entry.completionPercentage}%`;
    case "Streak":  return `${entry.streak}d`;
    case "Uploads": return `${entry.uploads}`;
    default:        return entry.score.toLocaleString();
  }
}

function getScoreUnit(filter: Filter): string {
  switch (filter) {
    case "Monthly": return "completion";
    case "Streak":  return "streak";
    case "Uploads": return "uploads";
    default:        return "points";
  }
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_GRADIENTS = [
  ["#C9F85A", "#4DD2FF"],
  ["#FFD36E", "#FF4D00"],
  ["#FF7AE5", "#A78BFA"],
  ["#4DD2FF", "#6F5CFF"],
  ["#C9F85A", "#FFD36E"],
];

const MEDAL_CONFIG = [
  { color: "#C9F85A", label: "1st", icon: Crown,  glow: "rgba(201,248,90,0.25)"  },
  { color: "#C0C0C0", label: "2nd", icon: Medal,  glow: "rgba(192,192,192,0.2)"  },
  { color: "#CD7F32", label: "3rd", icon: Star,   glow: "rgba(205,127,50,0.2)"   },
];

export default function LeaderboardPage() {
  const { leaderboard, student, loading } = useStore();
  const refreshData = useAppStore((state) => state.refreshData);
  const [activeFilter, setActiveFilter] = useState<Filter>("Weekly");

  useEffect(() => {
    void refreshData({ background: true, scope: "student" });
  }, [refreshData]);

  const sorted      = getSortedData(leaderboard, activeFilter);
  const top3        = sorted.slice(0, 3);
  const rest        = sorted.slice(3);
  const myEntry     = sorted.find((e) => e.userId === student.id);
  const accentColor = filterColors[activeFilter];
  const myIndex     = myEntry ? sorted.findIndex((e) => e.userId === student.id) : -1;
  const nextAthlete = myIndex > 0 ? sorted[myIndex - 1] : null;

  const gapLabel = useMemo(() => {
    if (!nextAthlete || !myEntry) return null;
    const diff =
      activeFilter === "Monthly" ? nextAthlete.completionPercentage - myEntry.completionPercentage
      : activeFilter === "Streak"  ? nextAthlete.streak  - myEntry.streak
      : activeFilter === "Uploads" ? nextAthlete.uploads - myEntry.uploads
      : nextAthlete.score - myEntry.score;
    const unit = activeFilter === "Monthly" ? "%" : activeFilter === "Streak" ? "d" : activeFilter === "Uploads" ? " uploads" : " pts";
    return `${diff}${unit} behind ${nextAthlete.name.split(" ")[0]}`;
  }, [nextAthlete, myEntry, activeFilter]);

  if (loading && leaderboard.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 px-4 pt-4 pb-32">
        <Skeleton className="h-20 w-full rounded-3xl" />
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-24 shrink-0 rounded-full" />)}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-3xl mx-auto space-y-3 overflow-x-hidden px-3 sm:px-6 lg:px-8 pt-2 pb-[calc(env(safe-area-inset-bottom)+9rem)] sm:pb-10"
      style={{ WebkitTextSizeAdjust: "100%", touchAction: "pan-y" }}
    >
      {/* ── Hero header ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-3xl border border-white/10 bg-[#111] p-4 sm:p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full blur-[80px] pointer-events-none opacity-20 transition-all duration-700" style={{ background: accentColor }} />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 mb-2" style={{ background: `${accentColor}15`, borderColor: `${accentColor}30` }}>
              <Sparkles className="h-3 w-3" style={{ color: accentColor }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accentColor }}>Leaderboard</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-none">Rankings</h1>
            <p className="text-xs text-white/35 mt-1 flex items-center gap-1.5">
              <Activity className="h-3 w-3 flex-shrink-0" style={{ color: accentColor }} />
              <span><span className="font-semibold text-white/60">{sorted.length}</span> athletes · {activeFilter}</span>
            </p>
          </div>

          {myEntry && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.15 }}
              className="rounded-2xl border p-3 text-center flex-shrink-0 min-w-[72px]"
              style={{ background: `${accentColor}0C`, borderColor: `${accentColor}30` }}
            >
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">Your Rank</p>
              <p className="text-2xl font-black" style={{ color: accentColor }}>#{myEntry.rank}</p>
              <p className="text-[10px] text-white/25 mt-0.5">{getScoreValue(myEntry, activeFilter)}</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Filter pills ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.05 }}
        className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide"
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 border transition-all ${
                active ? "text-black border-transparent" : "bg-white/[0.03] border-white/8 text-white/45 hover:text-white hover:bg-white/[0.07]"
              }`}
              style={active ? { background: col, boxShadow: `0 6px 20px ${col}35` } : {}}
            >
              <Icon className="h-3 w-3" />
              {f}
            </motion.button>
          );
        })}
      </motion.div>

      {/* ── Top 3 podium cards ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFilter + "-top3"}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={LUXURY_TWEEN_MEDIUM}
          className="space-y-2"
        >
          {top3.map((entry, visualIdx) => {
            const medal    = MEDAL_CONFIG[visualIdx];
            const gradIdx  = entry.userId.charCodeAt(0) % AVATAR_GRADIENTS.length;
            const [gA, gB] = AVATAR_GRADIENTS[gradIdx];
            const isFirst  = visualIdx === 0;
            const MedalIcon = medal.icon;

            return (
              <motion.div
                key={entry.userId + activeFilter + "-card"}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...LUXURY_TWEEN_MEDIUM, delay: visualIdx * 0.06 }}
              >
                <Link to={`/student/profile/${entry.userId}`} className="block">
                  <div
                    className="rounded-3xl border p-3.5 flex items-center gap-3.5 active:scale-[0.98] transition-transform relative overflow-hidden"
                    style={{
                      background: isFirst
                        ? `linear-gradient(135deg, ${medal.color}12, rgba(255,255,255,0.02))`
                        : `rgba(255,255,255,0.015)`,
                      borderColor: isFirst ? `${medal.color}35` : "rgba(255,255,255,0.07)",
                      boxShadow: isFirst ? `0 0 30px ${medal.glow}` : "none",
                    }}
                  >
                    {isFirst && (
                      <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: `radial-gradient(${medal.color} 1px, transparent 1px)`,
                        backgroundSize: "14px 14px",
                      }} />
                    )}

                    {/* Rank badge */}
                    <div
                      className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 relative z-10"
                      style={{ background: `${medal.color}18`, border: `1.5px solid ${medal.color}40` }}
                    >
                      <MedalIcon className="h-4 w-4" style={{ color: medal.color }} />
                    </div>

                    {/* Avatar */}
                    <div
                      className="w-11 h-11 rounded-2xl p-[2px] flex-shrink-0 relative z-10"
                      style={{ background: `linear-gradient(135deg, ${gA}, ${gB})` }}
                    >
                      <div className="w-full h-full rounded-[14px] bg-[#1A1A1A] flex items-center justify-center text-sm font-black text-white">
                        {getInitials(entry.name)}
                      </div>
                    </div>

                    {/* Name + subtitle */}
                    <div className="flex-1 min-w-0 relative z-10">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white truncate">{entry.name}</p>
                        <span className="text-[9px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: medal.color }}>
                          {medal.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Flame className="h-3 w-3 text-[#FF4D00] flex-shrink-0" />
                        <span className="text-[11px] text-white/35">{entry.streak}d streak</span>
                        <span className="text-white/15 text-[10px]">·</span>
                        <span className="text-[11px] text-white/35">{entry.completionPercentage}%</span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0 relative z-10">
                      <p className="text-lg font-black" style={{ color: medal.color }}>
                        {getScoreValue(entry, activeFilter)}
                      </p>
                      <p className="text-[9px] text-white/20 uppercase tracking-wider">{getScoreUnit(activeFilter)}</p>
                    </div>

                    <ChevronRight className="h-4 w-4 text-white/15 flex-shrink-0 relative z-10" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* ── My rank highlight ── */}
      {myEntry && myEntry.rank > 3 && (
        <motion.div
          key={activeFilter + "me-highlight"}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={LUXURY_TWEEN_MEDIUM}
          className="rounded-2xl border p-3.5 flex items-center gap-3 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${accentColor}0A, rgba(255,255,255,0.02))`,
            borderColor: `${accentColor}25`,
          }}
        >
          <div className="relative flex h-2.5 w-2.5 items-center justify-center flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: accentColor }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: accentColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white">Rank #{myEntry.rank} · <span className="font-normal text-white/35">of {sorted.length}</span></p>
            {gapLabel && (
              <p className="text-[10px] text-white/35 mt-0.5 flex items-center gap-1">
                <TrendingUp className="h-2.5 w-2.5 flex-shrink-0" style={{ color: accentColor }} />
                {gapLabel} to advance
              </p>
            )}
          </div>
          <p className="text-sm font-black flex-shrink-0" style={{ color: accentColor }}>{getScoreValue(myEntry, activeFilter)}</p>
        </motion.div>
      )}

      {/* ── Full ranking list (Ranks 4+) ── */}
      {rest.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter + "list"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.12 }}
            className="rounded-3xl border border-white/8 bg-[#111] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Full Rankings</p>
              <p className="text-[10px] text-white/20">{sorted.length} athletes</p>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {rest.map((entry, idx) => {
                const isMe    = entry.userId === student.id;
                const gradIdx = entry.userId.charCodeAt(0) % AVATAR_GRADIENTS.length;
                const [gA, gB] = AVATAR_GRADIENTS[gradIdx];

                return (
                  <Link key={entry.userId + activeFilter} to={`/student/profile/${entry.userId}`}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...LUXURY_TWEEN_MEDIUM, delay: Math.min(idx, 12) * 0.025 }}
                      className={`flex items-center gap-3 px-4 py-3 transition-all active:bg-white/[0.03] ${
                        isMe ? "bg-[#C9F85A]/[0.03]" : ""
                      }`}
                    >
                      {/* Rank */}
                      <div className="w-7 flex-shrink-0 text-center">
                        <span className={`text-xs font-bold tabular-nums ${isMe ? "text-[#C9F85A]" : "text-white/20"}`}>
                          #{entry.rank}
                        </span>
                      </div>

                      {/* Avatar */}
                      <div
                        className="w-9 h-9 rounded-xl p-[1.5px] flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${gA}, ${gB})` }}
                      >
                        <div className="w-full h-full rounded-[10px] bg-[#1A1A1A] flex items-center justify-center text-[10px] font-bold text-white">
                          {getInitials(entry.name)}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-semibold truncate ${isMe ? "text-[#C9F85A]" : "text-white/85"}`}>
                          {entry.name}
                          {isMe && <span className="ml-1.5 text-[10px] text-[#C9F85A]/50 font-normal">(you)</span>}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Flame className="h-2.5 w-2.5 text-[#FF4D00] flex-shrink-0" />
                          <span className="text-[10px] text-white/30">{entry.streak}d</span>
                          <span className="text-white/12 text-[9px]">·</span>
                          <span className="text-[10px] text-white/30">{entry.completionPercentage}%</span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold tabular-nums ${isMe ? "text-[#C9F85A]" : "text-white/80"}`}>
                          {getScoreValue(entry, activeFilter)}
                        </p>
                        <p className="text-[9px] text-white/20">{getScoreUnit(activeFilter)}</p>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {sorted.length === 0 && (
        <div className="text-center py-20 text-white/25 text-sm">
          No rankings yet. Start grinding! 💪
        </div>
      )}
    </div>
  );
}
