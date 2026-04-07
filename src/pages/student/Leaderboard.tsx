import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LeaderboardRow from "@/components/LeaderboardRow";
import { useStore } from "@/hooks/useStore";
import { Trophy, Flame, Footprints, Target, Crown, Activity, ShieldCheck, Zap } from "lucide-react";
import { LeaderboardEntry } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

const filters = ["Weekly", "Monthly", "Streak", "Steps", "Uploads"];

function getSortedData(data: LeaderboardEntry[], filter: string) {
  switch (filter) {
    case "Streak":
      return [...data].sort((a, b) => b.streak - a.streak).map((e, i) => ({ ...e, rank: i + 1 }));
    case "Steps":
      return [...data].sort((a, b) => b.steps - a.steps).map((e, i) => ({ ...e, rank: i + 1 }));
    case "Uploads":
      return [...data].sort((a, b) => b.uploads - a.uploads).map((e, i) => ({ ...e, rank: i + 1 }));
    case "Monthly":
      return [...data]
        .sort((a, b) => b.completionPercentage - a.completionPercentage)
        .map((e, i) => ({ ...e, rank: i + 1 }));
    default:
      return [...data].sort((a, b) => b.score - a.score).map((e, i) => ({ ...e, rank: i + 1 }));
  }
}

const filterIcons: Record<string, React.ElementType> = {
  Weekly: Trophy,
  Monthly: Target,
  Streak: Flame,
  Steps: Footprints,
  Uploads: Zap,
};

export default function LeaderboardPage() {
  const { leaderboard, student, loading, setLoading } = useStore();
  const [activeFilter, setActiveFilter] = useState("Weekly");

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, [activeFilter, setLoading]);
  
  const allEntries = leaderboard.map(e => {
    if (e.userId === student.id) {
       return {
         ...e,
         streak: student.streak,
         steps: student.todaySteps,
         completionPercentage: student.completionPercentage
       };
    }
    return e;
  });

  const sorted = getSortedData(allEntries, activeFilter);
  const top3 = sorted.length >= 3 ? [sorted[1], sorted[0], sorted[2]] : sorted;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-2 overflow-hidden">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-24 shrink-0 rounded-xl" />)}
        </div>
        <div className="flex items-end justify-center gap-4 h-64">
           <Skeleton className="h-40 w-24 rounded-t-3xl" />
           <Skeleton className="h-56 w-24 rounded-t-3xl" />
           <Skeleton className="h-32 w-24 rounded-t-3xl" />
        </div>
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-10 pb-24 relative">
       <div className="absolute top-0 right-0 w-64 h-64 bg-neon-orange/5 blur-3xl pointer-events-none" />
       
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <div className="flex items-center gap-3 mb-2">
           <div className="p-2 rounded-lg bg-neon-orange/10 border border-neon-orange/20">
              <Trophy className="h-4 w-4 text-neon-orange" />
           </div>
           <p className="text-[10px] font-black text-neon-orange uppercase tracking-[0.4em]">_Tactical_Hierarchy</p>
        </div>
        <h1 className="text-4xl font-display font-black text-foreground tracking-tighter uppercase italic">The Leaderboard</h1>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-2">
           <Activity className="h-3 w-3" /> Live_Telemetry_Feeds
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
        {filters.map((f) => {
          const Icon = filterIcons[f] || Trophy;
          const active = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex items-center gap-3 px-6 py-3.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0 border ${
                active
                  ? "bg-foreground text-background border-neon-orange shadow-[0_15px_30px_rgba(0,0,0,0.3)] scale-105"
                  : "bg-zinc-900 border-white/5 text-muted-foreground hover:text-white hover:border-white/10"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? 'text-neon-orange' : 'opacity-40'}`} />
              {f}
            </button>
          );
        })}
      </div>

      {/* Top 3 Podium */}
      <div className="relative pt-16 pb-12">
        <motion.div
          key={activeFilter + "podium"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-center gap-4"
        >
          {top3.map((e, i) => {
            const isWinner = i === 1;
            const heights = ["h-32", "h-48", "h-24"];
            const colors = ["bg-zinc-900/50 border-white/5", "bg-neon-orange/5 border-neon-orange/20 shadow-[0_30px_60px_rgba(255,165,0,0.05)]", "bg-zinc-950/50 border-white/5"];
            const labels = ["🥈", "🥇", "🥉"];
            const scoreLabel = {
              Weekly: `${e.score.toLocaleString()}`,
              Monthly: `${e.completionPercentage}%`,
              Streak: `${e.streak}D_STR`,
              Steps: `${(e.steps / 1000).toFixed(1)}K_STP`,
              Uploads: `${e.uploads}_LOGS`,
            }[activeFilter] || `${e.score.toLocaleString()}`;

            return (
              <motion.div
                key={e.userId + activeFilter}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center gap-4 relative group"
              >
                <div className="relative">
                   {isWinner && <Crown className="h-6 w-6 text-neon-orange absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce drop-shadow-[0_0_10px_rgba(255,165,0,0.5)]" />}
                   <div className={`rounded-3xl bg-zinc-900/80 backdrop-blur-xl border-2 flex items-center justify-center font-display font-black transition-all group-hover:scale-110 group-hover:rotate-6 ${isWinner ? "w-24 h-24 text-2xl border-neon-orange shadow-[0_20px_40px_rgba(0,0,0,0.5)]" : "w-16 h-16 text-md border-white/10"}`}>
                     {e.name.split(" ").map((n) => n[0]).join("")}
                   </div>
                </div>
                <div className="text-center font-black">
                   <p className="text-[10px] text-foreground uppercase tracking-widest truncate max-w-[90px] mb-1">{e.name.split(" ")[0]}</p>
                   <p className={`text-[11px] uppercase tracking-tighter ${isWinner ? "text-neon-orange" : "text-muted-foreground opacity-60"}`}>{scoreLabel}</p>
                </div>
                <div className={`${heights[i]} w-24 rounded-t-[2.5rem] border-x border-t flex flex-col items-center justify-end pb-6 transition-all group-hover:translate-y-[-8px] ${colors[i]}`}>
                  <span className="text-3xl mb-2">{labels[i]}</span>
                  <div className={`w-12 h-1 rounded-full ${isWinner ? 'bg-neon-orange/40' : 'bg-white/5'}`} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Your rank callout */}
      {(() => {
        const myEntry = sorted.find((e) => e.userId === student.id);
        if (!myEntry) return null;
        return (
          <motion.div
            key={activeFilter + "me"}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-6 px-8 py-6 rounded-[2rem] bg-foreground text-background shadow-[0_30px_60px_rgba(0,0,0,0.3)] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-neon-orange translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 opacity-20" />
            <div className="h-14 w-1 flex flex-col gap-1">
               <div className="flex-1 w-full bg-neon-orange" />
               <div className="flex-1 w-full bg-neon-orange/20" />
            </div>
            <div className="flex-1">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Your_Rank</p>
               <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter">Position #{myEntry.rank}</h3>
            </div>
            <div className="text-right flex flex-col items-end">
               <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-neon-orange" />
                  <span className="text-xl font-display font-black tabular-nums">{myEntry.score.toLocaleString()}</span>
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Grind_Pts</span>
            </div>
          </motion.div>
        );
      })()}

      {/* Full list */}
      <motion.div
        key={activeFilter + "list"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-4 space-y-1 mt-10 border-t-2 border-t-white/5"
      >
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5 mb-4 opacity-50">
           <p className="text-[9px] font-black uppercase tracking-widest w-10 text-center">Rnk</p>
           <p className="text-[9px] font-black uppercase tracking-widest flex-1">Athlete_Unit</p>
           <p className="text-[9px] font-black uppercase tracking-widest text-right w-24">Performance</p>
        </div>
        {sorted.map((entry) => (
          <LeaderboardRow key={entry.userId + activeFilter} entry={entry} highlight={entry.userId === student.id} />
        ))}
      </motion.div>
    </div>
  );
}
