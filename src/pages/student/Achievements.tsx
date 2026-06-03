import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award, Flame, Trophy, Star, Sun, Leaf,
  Lock, Zap, Activity, CheckCircle2,
  Sparkles, Shield, Crown, Target, Heart, Dumbbell,
  Clock, Camera, Users, TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { useAppStore, useStore } from "@/hooks/useStore";
import { Badge } from "@/types";
import { LUXURY_TWEEN_MEDIUM, LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";
import { Link } from "react-router-dom";
import { AchievementGridSkeleton, HeaderSkeleton } from "@/components/Skeletons";

const iconMap: Record<string, React.ElementType> = {
  flame: Flame,
  footprints: Activity,
  trophy: Trophy,
  star: Star,
  sunrise: Sun,
  salad: Leaf,
  award: Award,
  zap: Zap,
  shield: Shield,
  crown: Crown,
  target: Target,
  heart: Heart,
  dumbbell: Dumbbell,
  clock: Clock,
  camera: Camera,
  users: Users,
  trending: TrendingUp,
};

const BADGE_PALETTES = [
  { bg: "#C9F85A", ring: "#C9F85A", glow: "rgba(201,248,90,0.2)", text: "#C9F85A" },
  { bg: "#4DD2FF", ring: "#4DD2FF", glow: "rgba(77,210,255,0.2)", text: "#4DD2FF" },
  { bg: "#FFD36E", ring: "#FFD36E", glow: "rgba(255,211,110,0.2)", text: "#FFD36E" },
  { bg: "#A78BFA", ring: "#A78BFA", glow: "rgba(167,139,250,0.2)", text: "#A78BFA" },
  { bg: "#FF7AE5", ring: "#FF7AE5", glow: "rgba(255,122,229,0.2)", text: "#FF7AE5" },
  { bg: "#FF4D00", ring: "#FF4D00", glow: "rgba(255,77,0,0.2)", text: "#FF4D00" },
  { bg: "#10B981", ring: "#10B981", glow: "rgba(16,185,129,0.2)", text: "#10B981" },
  { bg: "#F472B6", ring: "#F472B6", glow: "rgba(244,114,182,0.2)", text: "#F472B6" },
  { bg: "#FBBF24", ring: "#FBBF24", glow: "rgba(251,191,36,0.2)", text: "#FBBF24" },
];

type TabFilter = "All" | "Earned" | "Locked";

export default function AchievementsPage() {
  const { student: s, loading } = useStore();
  const liveBadges = useAppStore((state) => state.system.achievementBadges);
  const [activeTab, setActiveTab] = useState<TabFilter>("All");
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);

  const allBadges: Badge[] = useMemo(() => {
    const sourceBadges = liveBadges.length > 0 ? liveBadges : s.badges;
    return sourceBadges.map((badge) => ({
      id: badge.id,
      name: badge.name,
      icon: badge.icon,
      date: badge.date,
      description: badge.description,
      earned: badge.earned,
      earnedDate: badge.earnedDate,
    }));
  }, [liveBadges, s.badges]);

  const earned = allBadges.filter((badge) => badge.earned);
  const locked = allBadges.filter((badge) => !badge.earned);
  const displayed = activeTab === "Earned" ? earned : activeTab === "Locked" ? locked : allBadges;
  const earnedPct = allBadges.length > 0 ? Math.round((earned.length / allBadges.length) * 100) : 0;
  const milestones = useMemo(() => locked.slice(0, 4), [locked]);

  if (loading && allBadges.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 overflow-x-hidden p-3 sm:p-6 lg:p-8 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:pb-10 touch-manipulation" style={{ touchAction: "manipulation", WebkitTextSizeAdjust: "100%" }}>
        <HeaderSkeleton />
        <AchievementGridSkeleton count={16} />
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-4xl space-y-6 overflow-x-hidden p-3 sm:p-6 lg:p-8 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:pb-10 touch-manipulation"
      style={{ touchAction: "manipulation", WebkitTextSizeAdjust: "100%" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-[28px] sm:rounded-[32px] border border-white/10 bg-[#121212] p-5 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#C9F85A]/[0.06] blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full bg-[#A78BFA]/[0.05] blur-[80px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 relative z-10">
          <motion.div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center flex-shrink-0 relative"
            style={{
              background: "linear-gradient(135deg, rgba(201,248,90,0.15), rgba(167,139,250,0.1))",
              border: "2px solid rgba(201,248,90,0.3)",
              boxShadow: "0 0 40px rgba(201,248,90,0.15), inset 0 0 20px rgba(201,248,90,0.05)",
            }}
            animate={{ rotate: [0, 2, -2, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          >
            <Award className="h-8 w-8 sm:h-10 sm:w-10 text-[#C9F85A]" />
            <div className="absolute -top-1 -right-1 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-[#C9F85A] flex items-center justify-center">
              <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-black" />
            </div>
          </motion.div>

          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C9F85A]/10 border border-[#C9F85A]/20 px-2.5 py-1 mb-2.5">
              <Sparkles className="h-3 w-3 text-[#C9F85A]" />
              <span className="text-[9px] sm:text-[11px] font-bold text-[#C9F85A] uppercase tracking-[0.15em]">Achievements</span>
            </div>
            <h1 className="text-2xl sm:text-5xl font-bold text-white tracking-tight leading-none">Your Badges</h1>
            <p className="text-xs sm:text-sm text-white/35 mt-1.5">
              <span className="text-[#C9F85A] font-bold text-sm sm:text-base">{earned.length}</span>
              <span className="text-white/25"> / {allBadges.length} unlocked</span>
            </p>
          </div>

          <div className="flex flex-row sm:flex-col gap-2.5 flex-wrap sm:flex-nowrap justify-center sm:justify-start">
            <div className="rounded-xl sm:rounded-2xl bg-[#C9F85A] px-4 py-2 sm:px-5 sm:py-3 text-center min-w-[72px] sm:min-w-[80px] shadow-[0_4px_20px_rgba(201,248,90,0.25)]">
              <p className="text-xl sm:text-2xl font-black text-black leading-tight">{earned.length}</p>
              <p className="text-[8px] sm:text-[10px] font-semibold text-black/60 uppercase tracking-[0.12em]">Earned</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 px-4 py-2 sm:px-5 sm:py-3 text-center min-w-[72px] sm:min-w-[80px]">
              <p className="text-xl sm:text-2xl font-black text-white/30 leading-tight">{locked.length}</p>
              <p className="text-[8px] sm:text-[10px] font-semibold text-white/20 uppercase tracking-[0.12em]">Locked</p>
            </div>
          </div>
        </div>

        <div className="mt-5 relative z-10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] sm:text-[10px] text-white/35 uppercase tracking-[0.12em]">Collection Progress</span>
            <span className="text-xs font-bold text-[#C9F85A]">{earnedPct}%</span>
          </div>
          <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${earnedPct}%` }}
              transition={{ ...LUXURY_TWEEN_SLOW, delay: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-[#C9F85A] via-[#4DD2FF] to-[#A78BFA]"
              style={{ boxShadow: "0 0 12px rgba(201,248,90,0.4)" }}
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.06 }}
        className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide"
      >
        {(["All", "Earned", "Locked"] as TabFilter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border backdrop-blur-md active:scale-95 ${
              activeTab === tab
                ? "bg-[#C9F85A] text-black border-transparent shadow-[0_4px_20px_rgba(201,248,90,0.25)]"
                : "bg-white/[0.03] border-white/5 text-white/50 hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            {tab}
            <span className="ml-1.5 text-[9px] opacity-60">
              {tab === "All" ? allBadges.length : tab === "Earned" ? earned.length : locked.length}
            </span>
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={LUXURY_TWEEN_MEDIUM}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {displayed.map((badge, index) => {
            const palette = BADGE_PALETTES[index % BADGE_PALETTES.length];
            const isEarned = Boolean(badge.earned);
            const Icon = iconMap[badge.icon] || Award;
            const isHovered = hoveredBadge === badge.id;

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ ...LUXURY_TWEEN_MEDIUM, delay: index * 0.03 }}
                onMouseEnter={() => setHoveredBadge(badge.id)}
                onMouseLeave={() => setHoveredBadge(null)}
                className={`rounded-[20px] sm:rounded-[24px] border p-3.5 sm:p-5 flex flex-col items-center text-center gap-2 sm:gap-3 group transition-all duration-300 cursor-default relative overflow-hidden ${
                  isEarned
                    ? "bg-[#121212] border-white/10 hover:border-white/20"
                    : "bg-[#0D0D0D] border-dashed border-white/5"
                }`}
                style={isEarned && isHovered ? {
                  borderColor: `${palette.ring}40`,
                  boxShadow: `0 0 30px ${palette.glow}`,
                } : {}}
              >
                {isEarned && (
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 50% 30%, ${palette.glow}, transparent 70%)` }}
                  />
                )}

                <div className="relative z-10 mt-1">
                  <div
                    className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      isEarned ? "group-hover:scale-110 group-hover:rotate-6" : ""
                    }`}
                    style={isEarned ? {
                      background: `${palette.bg}15`,
                      border: `2px solid ${palette.ring}40`,
                      boxShadow: isHovered ? `0 0 20px ${palette.glow}` : "none",
                    } : {
                      background: "rgba(255,255,255,0.01)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <Icon className="h-5.5 w-5.5 sm:h-7 sm:w-7 transition-all duration-300" style={{ color: isEarned ? palette.text : "rgba(255,255,255,0.1)" }} />
                  </div>

                  {isEarned ? (
                    <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-md" style={{ background: palette.bg }}>
                      <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-black" />
                    </div>
                  ) : (
                    <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#1D1D1D] border border-white/5 flex items-center justify-center">
                      <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white/20" />
                    </div>
                  )}
                </div>

                <div className="relative z-10 w-full flex-1 flex flex-col justify-between">
                  <div>
                    <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isEarned ? "" : "text-white/15"}`} style={isEarned ? { color: palette.text } : {}}>
                      {badge.name}
                    </p>
                    <p className={`text-[9px] sm:text-[10px] leading-snug mt-1 ${isEarned ? "text-white/40" : "text-white/12"}`}>
                      {badge.description}
                    </p>
                  </div>

                  {isEarned && (
                    <div className="relative z-10 rounded-full bg-white/5 px-2.5 py-0.5 text-[8px] sm:text-[10px] text-white/25 border border-white/5 mt-2.5 inline-block mx-auto">
                      {badge.earnedDate || badge.date}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {displayed.length === 0 && (
        <div className="text-center py-16 text-white/25 text-sm">
          {activeTab === "Earned" ? "No badges earned yet. Keep grinding!" : "All badges are unlocked! 🎉"}
        </div>
      )}

      {/* ── Next Milestones section ──────── */}
      {milestones.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.25 }}
          className="rounded-[28px] sm:rounded-[32px] border border-white/10 bg-[#121212] p-5 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#FFD36E]/[0.03] blur-[80px] pointer-events-none" />

          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#C9F85A]/10 border border-[#C9F85A]/20">
                <Target className="h-4 w-4 text-[#C9F85A]" />
              </div>
              <div className="text-left">
                <h2 className="text-sm sm:text-base font-semibold text-white">Next Milestones</h2>
                <p className="text-[9px] sm:text-[10px] text-white/25">Target these locked challenges next</p>
              </div>
            </div>
            <Link
              to="/student/progress"
              className="inline-flex items-center gap-1 text-[9px] sm:text-[11px] text-white/40 hover:text-[#C9F85A] transition-colors rounded-full bg-white/[0.03] border border-white/5 px-2.5 py-1"
            >
              Full Progress <ArrowUpRight className="h-2.5 w-2.5" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 relative z-10">
            {milestones.map((badge, index) => {
              const palette = BADGE_PALETTES[index % BADGE_PALETTES.length];
              const Icon = iconMap[badge.icon] || Award;
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.3 + index * 0.04 }}
                  className="rounded-2xl border border-white/5 bg-black/25 p-3.5 flex items-start gap-3 text-left"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-white/[0.01] border-white/10"
                  >
                    <Icon className="h-4.5 w-4.5 text-white/20" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-white/80 truncate">{badge.name}</p>
                      <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1">
                        <Lock className="h-2 w-2" /> Locked
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] leading-snug text-white/30">{badge.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
