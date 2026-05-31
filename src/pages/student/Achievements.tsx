import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award, Flame, Trophy, Star, Sun, Leaf,
  Lock, Zap, Activity, CheckCircle2, ArrowUpRight,
  Sparkles, Shield, Crown, Target, Heart, Dumbbell,
  Clock, Camera, Users, TrendingUp,
} from "lucide-react";
import { useStore } from "@/hooks/useStore";
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

/* Rotate through a palette of accent colors per badge */
const BADGE_PALETTES = [
  { bg: "#C9F85A", ring: "#C9F85A", glow: "rgba(201,248,90,0.2)", text: "#C9F85A" },
  { bg: "#4DD2FF", ring: "#4DD2FF", glow: "rgba(77,210,255,0.2)", text: "#4DD2FF" },
  { bg: "#FFD36E", ring: "#FFD36E", glow: "rgba(255,211,110,0.2)", text: "#FFD36E" },
  { bg: "#A78BFA", ring: "#A78BFA", glow: "rgba(167,139,250,0.2)", text: "#A78BFA" },
  { bg: "#FF7AE5", ring: "#FF7AE5", glow: "rgba(255,122,229,0.2)", text: "#FF7AE5" },
  { bg: "#FF4D00", ring: "#FF4D00", glow: "rgba(255,77,0,0.2)", text: "#FF4D00" },
  { bg: "#4DD2FF", ring: "#4DD2FF", glow: "rgba(77,210,255,0.2)", text: "#4DD2FF" },
  { bg: "#10B981", ring: "#10B981", glow: "rgba(16,185,129,0.2)", text: "#10B981" },
  { bg: "#F472B6", ring: "#F472B6", glow: "rgba(244,114,182,0.2)", text: "#F472B6" },
  { bg: "#FBBF24", ring: "#FBBF24", glow: "rgba(251,191,36,0.2)", text: "#FBBF24" },
];

type TabFilter = "All" | "Earned" | "Locked";

export default function AchievementsPage() {
  const { student: s, loading } = useStore();
  const [activeTab, setActiveTab] = useState<TabFilter>("All");
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);

  const allBadges: Badge[] = useMemo(() => [
    ...s.badges,
    { id: "b7", name: "Upload King", description: "Submit 50 check-in photos", icon: "camera", earned: false, date: "" },
    { id: "b8", name: "Community Anchor", description: "Follow 20 athletes", icon: "users", earned: false, date: "" },
    { id: "b9", name: "Early Riser", description: "Complete a workout before 7am", icon: "sunrise", earned: false, date: "" },
    { id: "b10", name: "Iron Will", description: "Complete 30-day plan without missing a day", icon: "shield", earned: false, date: "" },
    { id: "b11", name: "Workout Master", description: "Complete 14 consecutive days of training", icon: "dumbbell", earned: false, date: "" },
    { id: "b12", name: "Nutrition Ninja", description: "Log all meals for 21 days straight", icon: "salad", earned: false, date: "" },
    { id: "b13", name: "Peak Performer", description: "Reach #1 on any leaderboard category", icon: "crown", earned: false, date: "" },
    { id: "b14", name: "Social Butterfly", description: "Get 50 likes on your posts", icon: "heart", earned: false, date: "" },
    { id: "b15", name: "Streak Legend", description: "Maintain a 30-day streak", icon: "flame", earned: false, date: "" },
    { id: "b16", name: "Consistency King", description: "Achieve 90%+ completion for 4 weeks", icon: "target", earned: false, date: "" },
  ], [s.badges]);

  const milestones = useMemo(() => [
    { label: "7-Day Streak", current: s.streak, target: 7, done: s.streak >= 7, color: "#C9F85A" },
    { label: "14-Day Streak", current: s.streak, target: 14, done: s.streak >= 14, color: "#4DD2FF" },
    { label: "Workout Day", current: s.streak, target: 14, done: s.streak >= 14, color: "#FFD36E" },
    { label: "50 Check-Ins", current: 30, target: 50, done: false, color: "#A78BFA" },
    { label: "Plan Mastery", current: s.completionPercentage, target: 100, done: s.completionPercentage >= 100, color: "#FF4D00" },
  ], [s.streak, s.completionPercentage]);

  if (loading) {
    return (
      <div
        className="mx-auto max-w-4xl space-y-6 overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-28 sm:pb-10 touch-manipulation"
        style={{ touchAction: "manipulation", WebkitTextSizeAdjust: "100%" }}
      >
        <HeaderSkeleton />
        <AchievementGridSkeleton count={16} />
      </div>
    );
  }

  const earned = allBadges.filter((b) => b.earned);
  const locked = allBadges.filter((b) => !b.earned);
  const displayed = activeTab === "Earned" ? earned : activeTab === "Locked" ? locked : allBadges;

  const earnedPct = allBadges.length > 0 ? Math.round((earned.length / allBadges.length) * 100) : 0;

  return (
    <div
      className="mx-auto max-w-4xl space-y-6 overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-28 sm:pb-10 touch-manipulation"
      style={{ touchAction: "manipulation", WebkitTextSizeAdjust: "100%" }}
    >

      {/* ── Hero header ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        {/* Ambient glows */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#C9F85A]/[0.06] blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full bg-[#A78BFA]/[0.05] blur-[80px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Big glowing icon */}
          <motion.div
            className="w-20 h-20 rounded-3xl flex items-center justify-center flex-shrink-0 relative"
            style={{
              background: "linear-gradient(135deg, rgba(201,248,90,0.15), rgba(167,139,250,0.1))",
              border: "2px solid rgba(201,248,90,0.3)",
              boxShadow: "0 0 40px rgba(201,248,90,0.15), inset 0 0 20px rgba(201,248,90,0.05)",
            }}
            animate={{ rotate: [0, 2, -2, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          >
            <Award className="h-10 w-10 text-[#C9F85A]" />
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#C9F85A] flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-black" />
            </div>
          </motion.div>

          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#C9F85A]/10 border border-[#C9F85A]/20 px-3 py-1.5 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-[#C9F85A]" />
              <span className="text-[11px] font-bold text-[#C9F85A] uppercase tracking-[0.15em]">Achievements</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-none">Your Badges</h1>
            <p className="text-sm text-white/35 mt-2">
              <span className="text-[#C9F85A] font-bold text-base">{earned.length}</span>
              <span className="text-white/25"> / {allBadges.length} unlocked</span>
            </p>
          </div>

          {/* Stats pills */}
          <div className="flex flex-row sm:flex-col gap-3 flex-wrap sm:flex-nowrap justify-center sm:justify-start">
            <div className="rounded-2xl bg-[#C9F85A] px-5 py-3 text-center min-w-[80px] shadow-[0_4px_20px_rgba(201,248,90,0.3)]">
              <p className="text-2xl font-black text-black">{earned.length}</p>
              <p className="text-[10px] font-semibold text-black/60 uppercase tracking-[0.12em]">Earned</p>
            </div>
            <div className="rounded-2xl bg-[#1A1A1A] border border-white/8 px-5 py-3 text-center min-w-[80px]">
              <p className="text-2xl font-black text-white/30">{locked.length}</p>
              <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.12em]">Locked</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/30 uppercase tracking-[0.12em]">Collection Progress</span>
            <span className="text-xs font-bold text-[#C9F85A]">{earnedPct}%</span>
          </div>
          <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden border border-white/5">
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

      {/* ── Tab filters ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.06 }}
        className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide"
      >
        {(["All", "Earned", "Locked"] as TabFilter[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              activeTab === t
                ? "bg-[#C9F85A] text-black border-transparent shadow-[0_4px_20px_rgba(201,248,90,0.3)]"
                : "bg-[#1A1A1A] border-white/8 text-white/50 hover:text-white hover:bg-[#202020]"
            }`}
          >
            {t}
            <span className="ml-2 text-[10px] opacity-70">
              {t === "All" ? allBadges.length : t === "Earned" ? earned.length : locked.length}
            </span>
          </button>
        ))}
      </motion.div>

      {/* ── Badges grid ──────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={LUXURY_TWEEN_MEDIUM}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {displayed.map((badge, i) => {
            const Icon = iconMap[badge.icon] || Award;
            const palette = BADGE_PALETTES[i % BADGE_PALETTES.length];
            const isEarned = badge.earned;
            const isHovered = hoveredBadge === badge.id;

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.04 }}
                onMouseEnter={() => setHoveredBadge(badge.id)}
                onMouseLeave={() => setHoveredBadge(null)}
                className={`rounded-[24px] border p-5 flex flex-col items-center text-center gap-3 group transition-all duration-300 cursor-default relative overflow-hidden ${
                  isEarned
                    ? "bg-[#121212] border-white/10 hover:border-white/20"
                    : "bg-[#0D0D0D] border-dashed border-white/6"
                }`}
                style={isEarned && isHovered ? {
                  borderColor: `${palette.ring}40`,
                  boxShadow: `0 0 30px ${palette.glow}`,
                } : {}}
              >
                {/* Glow background on hover */}
                {isEarned && (
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 50% 30%, ${palette.glow}, transparent 70%)`,
                    }}
                  />
                )}

                {/* Icon container */}
                <div className="relative z-10">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      isEarned
                        ? "group-hover:scale-110 group-hover:rotate-6"
                        : ""
                    }`}
                    style={isEarned ? {
                      background: `${palette.bg}15`,
                      border: `2px solid ${palette.ring}40`,
                      boxShadow: isHovered ? `0 0 20px ${palette.glow}` : "none",
                    } : {
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <Icon
                      className="h-7 w-7 transition-all duration-300"
                      style={{ color: isEarned ? palette.text : "rgba(255,255,255,0.1)" }}
                    />
                  </div>

                  {/* Status badge */}
                  {isEarned ? (
                    <div
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                      style={{ background: palette.bg }}
                    >
                      <CheckCircle2 className="h-3 w-3 text-black" />
                    </div>
                  ) : (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1D1D1D] border border-white/10 flex items-center justify-center">
                      <Lock className="h-3 w-3 text-white/20" />
                    </div>
                  )}
                </div>

                {/* Name + description */}
                <div className="relative z-10">
                  <p
                    className={`text-xs font-bold uppercase tracking-wider mb-1 transition-colors duration-300 ${
                      isEarned ? "" : "text-white/15"
                    }`}
                    style={isEarned ? { color: palette.text } : {}}
                  >
                    {badge.name}
                  </p>
                  <p className={`text-[10px] leading-snug ${isEarned ? "text-white/40" : "text-white/12"}`}>
                    {badge.description}
                  </p>
                </div>

                {/* Date earned */}
                {isEarned && badge.earnedDate && (
                  <div className="relative z-10 rounded-full bg-white/5 px-3 py-1 text-[10px] text-white/25 border border-white/5">
                    {badge.earnedDate}
                  </div>
                )}
                {isEarned && badge.date && !badge.earnedDate && (
                  <div className="relative z-10 rounded-full bg-white/5 px-3 py-1 text-[10px] text-white/25 border border-white/5">
                    {badge.date}
                  </div>
                )}
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

      {/* ── Milestones tracker ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.25 }}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#FFD36E]/[0.03] blur-[80px] pointer-events-none" />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#C9F85A]/10 border border-[#C9F85A]/20">
              <Activity className="h-4 w-4 text-[#C9F85A]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Milestones</h2>
              <p className="text-[10px] text-white/25">Track your progress towards goals</p>
            </div>
          </div>
          <Link
            to="/student/progress"
            className="inline-flex items-center gap-1.5 text-[11px] text-white/30 hover:text-[#C9F85A] transition-colors rounded-full bg-[#1A1A1A] border border-white/8 px-3 py-1.5"
          >
            Full Progress <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-5 relative z-10">
          {milestones.map((m, i) => {
            const pct = Math.min(100, Math.round((m.current / m.target) * 100));
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.3 + i * 0.08 }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    {m.done ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <CheckCircle2 className="h-4 w-4" style={{ color: m.color, filter: `drop-shadow(0 0 4px ${m.color}60)` }} />
                      </motion.div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/10" />
                    )}
                    <span className="text-xs font-semibold text-white">{m.label}</span>
                  </div>
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={{ color: m.done ? m.color : "rgba(255,255,255,0.3)" }}
                  >
                    {m.current.toLocaleString()} / {m.target.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ ...LUXURY_TWEEN_SLOW, delay: 0.35 + i * 0.08 }}
                    className="h-full rounded-full relative"
                    style={{
                      background: m.done
                        ? `linear-gradient(90deg, ${m.color}, ${m.color}CC)`
                        : `${m.color}60`,
                      boxShadow: m.done ? `0 0 10px ${m.color}60` : "none",
                    }}
                  >
                    {/* Shimmer on completed */}
                    {m.done && <div className="absolute inset-0 shimmer" />}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
