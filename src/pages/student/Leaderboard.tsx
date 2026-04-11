import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LeaderboardRow from "@/components/LeaderboardRow";
import { useStore } from "@/hooks/useStore";
import { Trophy, Flame, Footprints, Target, Crown, Activity, Zap } from "lucide-react";
import { LeaderboardEntry } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";
import { fetchLeaderboardAPI, fetchLeaderboardMeAPI } from "@/lib/api";

const filters = ["Points", "Streak", "Completed"] as const;
type Filter = typeof filters[number];

const filterIcons: Record<Filter, React.ElementType> = {
  Points: Trophy,
  Streak: Flame,
  Completed: Target,
};

const filterColors: Record<Filter, string> = {
  Points: "#C9F85A",
  Streak: "#FF4D00",
  Completed: "#4DD2FF",
};

const filterKeyMap: Record<Filter, "points" | "streak" | "completed"> = {
  Points: "points",
  Streak: "streak",
  Completed: "completed",
};

function getSortedData(data: any[], filter: Filter) {
  return data.map((e, i) => ({ ...e, rank: i + 1 }));
}

function getScoreLabel(entry: any, filter: Filter) {
  switch (filter) {
    case "Streak":  return `${entry.streak} days`;
    case "Completed": return `${entry.totalPlansCompleted} done`;
    default:        return entry.totalPoints.toLocaleString() + " pts";
  }
}

const PODIUM_GRADIENTS = [
  "from-[#C0C0C0]/10", // 2nd — silver
  "from-[#FFD36E]/10", // 1st — gold
  "from-[#CD7F32]/10", // 3rd — bronze
];
const PODIUM_BORDERS = [
  "border-white/15",
  "border-[#FFD36E]/35",
  "border-[#CD7F32]/25",
];
const PODIUM_HEIGHTS = ["h-28", "h-44", "h-20"];
const PODIUM_LABELS = ["🥈", "🥇", "🥉"];
const PODIUM_AVATAR_SIZE = ["w-14 h-14", "w-20 h-20", "w-12 h-12"];

const AVATAR_GRADIENTS = [
  "from-[#C9F85A] to-[#4DD2FF]",
  "from-[#FFD36E] to-[#FF4D00]",
  "from-[#FF7AE5] to-[#A78BFA]",
  "from-[#4DD2FF] to-[#6F5CFF]",
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function LeaderboardPage() {
  const { student } = useStore();
  const [activeFilter, setActiveFilter] = useState<Filter>("Points");
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [myEntry, setMyEntry] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const apiFilter = filterKeyMap[activeFilter];
        const data = await fetchLeaderboardAPI(apiFilter, 50);
        const me = await fetchLeaderboardMeAPI(apiFilter);
        setLeaderboardData(data || []);
        setMyEntry(me);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
        setError("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeFilter]);

  const sorted = getSortedData(leaderboardData, activeFilter);
  // podium order: 2nd, 1st, 3rd
  const top3 = sorted.length >= 3 ? [sorted[1], sorted[0], sorted[2]] : sorted;
  const accentColor = filterColors[activeFilter];

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-24 shrink-0 rounded-full" />)}
        </div>
        <div className="flex items-end justify-center gap-4 h-64">
          <Skeleton className="h-40 w-24 rounded-t-3xl" />
          <Skeleton className="h-56 w-24 rounded-t-3xl" />
          <Skeleton className="h-32 w-24 rounded-t-3xl" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="rounded-[32px] border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6 lg:p-8 pb-10">

      {/* ── Header card ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-colors duration-500"
          style={{ background: `${accentColor}08`, transform: "translate(30%, -30%)" }}
        />
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors duration-300"
              style={{ background: `${accentColor}15`, borderColor: `${accentColor}30` }}>
              <Trophy className="h-3.5 w-3.5" style={{ color: accentColor }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: accentColor }}>Leaderboard</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Rankings</h1>
            <p className="text-sm text-white/40 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" style={{ color: accentColor }} />
              {sorted.length} athletes ranked · {activeFilter}
            </p>
          </div>
          {myEntry && (
            <div className="rounded-2xl bg-[#1A1A1A] border border-white/8 p-4 text-center">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Your Rank</p>
              <p className="text-2xl font-bold" style={{ color: accentColor }}>#{myEntry.rank}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{getScoreLabel(myEntry, activeFilter)}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Filter pills ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.06 }}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 border ${
                active
                  ? "text-black border-transparent shadow-lg"
                  : "bg-[#1A1A1A] border-white/8 text-white/50 hover:text-white hover:bg-[#202020]"
              }`}
              style={active ? { background: accentColor } : {}}
            >
              <Icon className="h-3.5 w-3.5" />
              {f}
            </motion.button>
          );
        })}
      </motion.div>

      {/* ── Podium ───────────────────────────────────────── */}
      <motion.div
        key={activeFilter + "podium"}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.08 }}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
      >
        <div className="flex items-end justify-center gap-3 sm:gap-5 pt-6 pb-2">
          {top3.map((e, i) => {
            const isWinner = i === 1;
            const gradIdx = e.userId.charCodeAt(0) % AVATAR_GRADIENTS.length;
            return (
              <motion.div
                key={e.userId + activeFilter}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.12 }}
                className="flex flex-col items-center gap-3"
              >
                {/* avatar + crown */}
                <div className="relative">
                  {isWinner && (
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="absolute -top-8 left-1/2 -translate-x-1/2"
                    >
                      <Crown className="h-5 w-5" style={{ color: accentColor }} />
                    </motion.div>
                  )}
                  <div className={`${PODIUM_AVATAR_SIZE[i]} rounded-2xl bg-gradient-to-br ${AVATAR_GRADIENTS[gradIdx]} p-[2px]`}>
                    <div className="w-full h-full rounded-[14px] bg-[#1A1A1A] flex items-center justify-center font-bold text-white text-sm">
                      {getInitials(e.name)}
                    </div>
                  </div>
                </div>

                {/* name + score */}
                <div className="text-center">
                  <p className="text-xs font-semibold text-white truncate max-w-[70px]">{e.name.split(" ")[0]}</p>
                  <p className="text-[10px] mt-0.5 font-bold" style={{ color: isWinner ? accentColor : "rgba(255,255,255,0.4)" }}>
                    {getScoreLabel(e, activeFilter)}
                  </p>
                </div>

                {/* podium column */}
                <div
                  className={`${PODIUM_HEIGHTS[i]} w-20 sm:w-24 rounded-t-[20px] border-x border-t bg-gradient-to-b ${PODIUM_GRADIENTS[i]} to-transparent ${PODIUM_BORDERS[i]} flex flex-col items-center justify-end pb-4 transition-all`}
                >
                  <span className="text-2xl">{PODIUM_LABELS[i]}</span>
                  <div className="w-8 h-0.5 rounded-full bg-white/10 mt-2" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Your rank callout ──────────────────────────── */}
      {myEntry && (
        <motion.div
          key={activeFilter + "me"}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={LUXURY_TWEEN_MEDIUM}
          className="rounded-2xl border p-4 flex items-center gap-4 relative overflow-hidden"
          style={{ background: `${accentColor}10`, borderColor: `${accentColor}30` }}
        >
          <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: accentColor }} />
          <div className="flex-1">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Your Position</p>
            <p className="text-base font-bold text-white">Rank #{myEntry.rank}</p>
          </div>
          <div className="text-right">
            <p className="text-base font-bold" style={{ color: accentColor }}>{getScoreLabel(myEntry, activeFilter)}</p>
            <p className="text-[10px] text-white/30">{myEntry.totalPoints.toLocaleString()} pts</p>
          </div>
        </motion.div>
      )}

      {/* ── Full list ─────────────────────────────────── */}
      <motion.div
        key={activeFilter + "list"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.15 }}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
      >
        {/* table header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5 mb-1">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider w-8 text-center">Rank</p>
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider flex-1">Athlete</p>
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider text-right">Score</p>
        </div>

        {sorted.map((entry) => (
          <LeaderboardRow key={entry.userId + activeFilter} entry={entry} highlight={entry.userId === student.id || entry.userId === (myEntry?.userId)} />
        ))}
      </motion.div>
    </div>
  );
}
