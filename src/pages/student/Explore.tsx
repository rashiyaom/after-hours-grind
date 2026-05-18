import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Compass, Users, TrendingUp, Flame, Trophy,
  Sparkles, ArrowUpRight, Filter, ShieldCheck,
} from "lucide-react";
import { useStore, useAppStore } from "@/hooks/useStore";
import { Link } from "react-router-dom";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";
import SuggestedAthletes from "@/components/SuggestedAthletes";
import { User, Student, Trainer } from "@/types";

const AVATAR_GRADIENTS = [
  "from-[#C9F85A] to-[#4DD2FF]",
  "from-[#FF7AE5] to-[#A78BFA]",
  "from-[#FFD36E] to-[#FF4D00]",
  "from-[#4DD2FF] to-[#6F5CFF]",
  "from-[#C9F85A] to-[#FFD36E]",
  "from-[#10B981] to-[#4DD2FF]",
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

type SortKey = "trending" | "streak" | "rank" | "followers";

export default function ExplorePage() {
  const { student: me } = useStore();
  const users = useAppStore((state) => state.users);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("trending");

  const allUsers = useMemo<User[]>(() => {
    return Object.values(users).filter(
      (u) => u.id !== me.id && u.role !== "admin"
    );
  }, [users, me.id]);

  const sortedUsers = useMemo(() => {
    let list = [...allUsers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.role === "student" && (a as Student).collegeId && (a as Student).collegeId.toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case "streak":
        list.sort((a, b) => (b.role === "student" ? (b as Student).streak : 0) - (a.role === "student" ? (a as Student).streak : 0));
        break;
      case "rank":
        list.sort((a, b) => (a.role === "student" ? (a as Student).rank : 9999) - (b.role === "student" ? (b as Student).rank : 9999));
        break;
      case "followers":
        list.sort((a, b) => ((b.followers ?? 0) - (a.followers ?? 0)));
        break;
      default: // trending
        list.sort((a, b) => {
          const scoreA = (a.role === "student" ? (a as Student).streak + (a as Student).completionPercentage : 50) + (a.followers ?? 0);
          const scoreB = (b.role === "student" ? (b as Student).streak + (b as Student).completionPercentage : 50) + (b.followers ?? 0);
          return scoreB - scoreA;
        });
    }

    return list;
  }, [allUsers, searchQuery, sortBy]);

  const topUsers = sortedUsers.slice(0, 3);
  const restUsers = sortedUsers.slice(3);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8 pb-24">

      {/* ── Hero header ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#4DD2FF]/[0.04] blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[#C9F85A]/[0.04] blur-[80px] pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#4DD2FF]/10 border border-[#4DD2FF]/20 px-3 py-1.5 mb-3">
            <Compass className="h-3.5 w-3.5 text-[#4DD2FF]" />
            <span className="text-[11px] font-bold text-[#4DD2FF] uppercase tracking-[0.15em]">Explore Profiles</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-none">Discover Community</h1>
          <p className="text-sm text-white/35 mt-2">
            Find and follow athletes and elite trainers · <span className="text-white/50 font-semibold">{allUsers.length}</span> profiles
          </p>
        </div>
      </motion.div>

      {/* ── Search + Sort ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.04 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search community by name..."
            className="w-full h-12 rounded-2xl border border-white/10 bg-[#121212] pl-11 pr-4 text-sm text-white placeholder:text-white/25 focus:border-[#4DD2FF]/40 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          {(
            [
              { key: "trending", icon: TrendingUp, label: "Trending" },
              { key: "streak", icon: Flame, label: "Streak" },
              { key: "rank", icon: Trophy, label: "Rank" },
              { key: "followers", icon: Users, label: "Popular" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border flex-shrink-0 ${
                sortBy === opt.key
                  ? "bg-[#4DD2FF] text-black border-transparent shadow-[0_4px_16px_rgba(77,210,255,0.3)]"
                  : "bg-[#1A1A1A] border-white/8 text-white/40 hover:text-white hover:bg-[#202020]"
              }`}
            >
              <opt.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Suggested for you (algorithm-based) ───────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.08 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-[#C9F85A]/10 border border-[#C9F85A]/20">
            <Sparkles className="h-3.5 w-3.5 text-[#C9F85A]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Suggested For You</p>
            <p className="text-[10px] text-white/30">Based on mutual connections and activity</p>
          </div>
        </div>
        <SuggestedAthletes variant="explore" limit={8} showViewAll={false} />
      </motion.div>

      {/* ── Top performing users ───────────────────── */}
      {topUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.12 }}
          className="rounded-[32px] border border-white/10 bg-[#121212] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#FFD36E]/[0.03] blur-[80px] pointer-events-none" />

          <div className="flex items-center gap-2 mb-5 relative z-10">
            <div className="p-1.5 rounded-lg bg-[#FFD36E]/10 border border-[#FFD36E]/20">
              <Trophy className="h-3.5 w-3.5 text-[#FFD36E]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Top Profiles</p>
              <p className="text-[10px] text-white/30">Highest performers right now</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 relative z-10">
            {topUsers.map((user, i) => {
              const gradIdx = user.id.charCodeAt(0) % AVATAR_GRADIENTS.length;
              const medals = ["🥇", "🥈", "🥉"];
              const medalColors = ["#FFD36E", "#C0C0C0", "#CD7F32"];

              return (
                <Link
                  key={user.id}
                  to={`/student/profile/${user.id}`}
                  className="rounded-[20px] border border-white/8 bg-[#0D0D0D] p-5 flex flex-col items-center gap-3 hover:border-white/20 transition-all group"
                >
                  {/* Medal + Avatar */}
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${AVATAR_GRADIENTS[gradIdx]} p-[2px]`}>
                      <div className="w-full h-full rounded-[14px] bg-[#1A1A1A] flex items-center justify-center text-lg font-bold text-white overflow-hidden relative">
                         {user.avatar ? (
                           <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                         ) : (
                           getInitials(user.name)
                         )}
                      </div>
                    </div>
                    <div
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-lg border-2 border-[#0D0D0D]"
                      style={{ background: medalColors[i] }}
                    >
                      <span>{medals[i]}</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-[#C9F85A] transition-colors">{user.name}</p>
                      {user.role === "trainer" && <ShieldCheck className="h-3 w-3 text-[#4DD2FF]" />}
                    </div>
                    
                    {user.role === "trainer" ? (
                      <div className="mt-1 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-[#4DD2FF] bg-[#4DD2FF]/10 px-2 py-0.5 rounded-full border border-[#4DD2FF]/20 uppercase">Pro Trainer</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 mt-1 text-[10px] text-white/30">
                        <span className="flex items-center gap-0.5">
                          <Flame className="h-2.5 w-2.5 text-[#FF4D00]" />
                          {(user as Student).streak}d
                        </span>
                        <span>·</span>
                        <span>{(user as Student).completionPercentage}%</span>
                        <span>·</span>
                          <span>{user.followers ?? 0} followers</span>
                      </div>
                    )}
                  </div>

                  {/* View profile */}
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-white/20 group-hover:text-[#4DD2FF] transition-colors">
                    View Profile <ArrowUpRight className="h-3 w-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── All users list ────────────────────────── */}
      {restUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.16 }}
          className="rounded-[32px] border border-white/10 bg-[#121212] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
              <Filter className="h-3.5 w-3.5 text-white/40" />
            </div>
            <p className="text-sm font-semibold text-white">Community</p>
            <span className="text-[10px] text-white/25 ml-1">({restUsers.length})</span>
          </div>

          <div className="space-y-1">
            {restUsers.map((user) => {
              const gradIdx = user.id.charCodeAt(0) % AVATAR_GRADIENTS.length;

              return (
                <Link
                  key={user.id}
                  to={`/student/profile/${user.id}`}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-white/[0.03] transition-all group border border-transparent hover:border-white/8"
                >
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[gradIdx]} p-[1.5px] flex-shrink-0`}>
                    <div className="w-full h-full rounded-full bg-[#1A1A1A] flex items-center justify-center text-[12px] font-bold text-white overflow-hidden relative">
                      {user.avatar ? (
                         <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                      ) : (
                         getInitials(user.name)
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-[#C9F85A] transition-colors">
                        {user.name}
                      </p>
                      {user.role === "trainer" && <ShieldCheck className="h-3 w-3 text-[#4DD2FF]" />}
                    </div>
                    
                    {user.role === "trainer" ? (
                      <div className="mt-1">
                        <span className="text-[9px] font-bold text-[#4DD2FF] bg-[#4DD2FF]/10 px-2 py-0.5 rounded-full border border-[#4DD2FF]/20 uppercase">Pro Trainer</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/25">
                        <Flame className="h-2.5 w-2.5 text-[#FF4D00]" />
                        <span>{(user as Student).streak}d streak</span>
                        <span>·</span>
                        <span>Rank #{(user as Student).rank}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats / Action */}
                  <div className="text-right flex-shrink-0 mr-2">
                      <p className="text-xs font-bold text-white/80">{user.followers ?? 0}</p>
                    <p className="text-[9px] text-white/30 uppercase tracking-wider">followers</p>
                  </div>

                  <ArrowUpRight className="h-4 w-4 text-white/15 group-hover:text-[#4DD2FF] transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}

      {sortedUsers.length === 0 && (
        <div className="text-center py-16 text-white/25 text-sm">
          {searchQuery ? "No profiles match your search." : "No profiles to discover yet."}
        </div>
      )}
    </div>
  );
}
