import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, UserPlus, UserCheck, Flame, Star, TrendingUp,
  Users, Activity, Target, ShieldCheck, ArrowUpRight, X,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/hooks/useStore";
import { Skeleton } from "@/components/ui/skeleton";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";

/* gradient per index for avatar rings */
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

export default function CommunityPage() {
  const { suggestedUsers, loading, setLoading, followUser } = useStore();
  const [query, setQuery] = useState("");
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [setLoading]);

  const toggleFollow = (id: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.info("Unfollowed.");
      } else {
        followUser(id);
        next.add(id);
        toast.success("Following!");
      }
      return next;
    });
  };

  const filtered = suggestedUsers.filter(
    (u) => query.trim() === "" || u.name.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">

      {/* ── Header ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden"
      >
        {/* BG glow */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#C9F85A]/4 translate-x-16 -translate-y-16 blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#C9F85A]/10 border border-[#C9F85A]/20 px-3 py-1.5">
              <Users className="h-3.5 w-3.5 text-[#C9F85A]" />
              <span className="text-xs font-bold text-[#C9F85A] uppercase tracking-wider">Community</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">The Grind Network</h1>
            <p className="text-sm text-white/40 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-[#C9F85A]" />
              <span className="text-[#C9F85A] font-bold">{suggestedUsers.length}</span>
              <span>athletes detected</span>
            </p>
          </div>

          {/* KPI strip */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Total Members", value: String(suggestedUsers.length), color: "#C9F85A" },
              { label: "Avg Streak", value: "21d", color: "#FF4D00" },
              { label: "Completion", value: "88%", color: "#4DD2FF" },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl bg-[#1A1A1A] border border-white/5 px-4 py-3 text-center min-w-[80px]">
                <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Search bar ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.08 }}
        className="relative"
      >
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-white/30" />
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search athletes by name…"
          className="w-full bg-[#121212] border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9F85A]/40 focus:ring-2 focus:ring-[#C9F85A]/10 transition-all"
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 hover:text-white transition-all"
            >
              <X className="h-3 w-3" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Top Podium (no search active) ──────────────── */}
      {!query && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.12 }}
          className="rounded-[32px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-4 w-4 text-[#C9F85A]" />
            <h2 className="text-base font-semibold text-white">Top Performers</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { name: "Karan Singh", stat: "21 day streak", icon: Flame, badge: "🥇", rank: 1, color: "#FFD36E", accent: "from-[#FFD36E]/10" },
              { name: "Priya Sharma", stat: "98% efficiency", icon: Star, badge: "🥈", rank: 2, color: "#C9F85A", accent: "from-[#C9F85A]/10" },
              { name: "Rohit Patel", stat: "165k steps", icon: TrendingUp, badge: "🥉", rank: 3, color: "#4DD2FF", accent: "from-[#4DD2FF]/10" },
            ].map((a, i) => (
              <motion.div
                key={a.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.07 }}
                className={`rounded-[24px] border border-white/8 bg-gradient-to-b ${a.accent} to-transparent p-6 text-center relative overflow-hidden group hover:border-white/15 transition-all`}
              >
                {/* rank bg watermark */}
                <div className="absolute top-2 right-3 text-5xl font-black text-white/4 group-hover:text-white/6 transition-colors select-none">{a.rank}</div>

                {/* avatar */}
                <div className="relative mx-auto w-16 h-16 mb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-sm font-bold text-white border border-white/10 group-hover:scale-105 transition-transform`}>
                    {getInitials(a.name)}
                  </div>
                  <div className="absolute -top-2 -right-2 text-lg">{a.badge}</div>
                </div>

                <p className="text-sm font-semibold text-white">{a.name}</p>
                <div className="inline-flex items-center gap-1.5 mt-2 rounded-full px-3 py-1 bg-[#1A1A1A] border border-white/5">
                  <a.icon className="h-3 w-3" style={{ color: a.color }} />
                  <span className="text-[10px] font-semibold text-white/50">{a.stat}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Athletes Grid ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.18 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#C9F85A]" />
            <h2 className="text-sm font-semibold text-white">
              {query ? `Results for "${query}"` : "Athletes"}
            </h2>
          </div>
          <span className="rounded-full bg-[#1D1D1D] border border-white/8 px-3 py-1.5 text-xs text-white/50">
            {filtered.length} found
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-white/10 bg-[#0D0D0D] p-16 text-center">
            <Target className="h-10 w-10 text-white/15 mx-auto mb-3" />
            <p className="text-sm text-white/30">No athletes match your search.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map((u, i) => {
              const grad = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
              const isFollowing = followed.has(u.id);
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.04 }}
                  className="rounded-[24px] border border-white/8 bg-[#121212] p-4 flex items-center gap-4 hover:border-white/15 transition-all group"
                >
                  {/* Avatar with gradient ring */}
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} p-[2px] flex-shrink-0`}>
                    <div className="w-full h-full rounded-[14px] bg-[#1A1A1A] flex items-center justify-center text-xs font-bold text-white">
                      {getInitials(u.name)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/student/profile/${u.id}`}>
                      <p className="text-sm font-semibold text-white truncate group-hover:text-[#C9F85A] transition-colors">{u.name}</p>
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {u.streak > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#FF4D00]">
                          <Flame className="h-3 w-3" />{u.streak}d streak
                        </span>
                      )}
                      <span className="text-[10px] text-white/30">{u.mutualFriends} mutual</span>
                    </div>
                  </div>

                  {/* Follow button */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => toggleFollow(u.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all flex-shrink-0 ${
                      isFollowing
                        ? "bg-[#C9F85A] text-black"
                        : "bg-[#1D1D1D] border border-white/10 text-white/60 hover:border-[#C9F85A]/40 hover:text-[#C9F85A]"
                    }`}
                  >
                    {isFollowing ? (
                      <><UserCheck className="h-3.5 w-3.5" />Following</>
                    ) : (
                      <><UserPlus className="h-3.5 w-3.5" />Follow</>
                    )}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

    </div>
  );
}
