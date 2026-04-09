import React from "react";
import { motion } from "framer-motion";
import {
  Award, Flame, Footprints, Trophy, Star, Sun, Leaf,
  Lock, Zap, Activity, CheckCircle2, ArrowUpRight,
} from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { Badge } from "@/types";
import { LUXURY_TWEEN_MEDIUM, LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";
import { Link } from "react-router-dom";

const iconMap: Record<string, React.ElementType> = {
  flame: Flame,
  footprints: Footprints,
  trophy: Trophy,
  star: Star,
  sunrise: Sun,
  salad: Leaf,
};

/* Rotate through a palette of accent colors per badge */
const BADGE_PALETTES = [
  { bg: "#C9F85A", ring: "border-[#C9F85A]/40", glow: "rgba(201,248,90,0.15)", text: "text-[#C9F85A]", pill: "bg-[#C9F85A]/10" },
  { bg: "#4DD2FF", ring: "border-[#4DD2FF]/40", glow: "rgba(77,210,255,0.15)", text: "text-[#4DD2FF]", pill: "bg-[#4DD2FF]/10" },
  { bg: "#FFD36E", ring: "border-[#FFD36E]/40", glow: "rgba(255,211,110,0.15)", text: "text-[#FFD36E]", pill: "bg-[#FFD36E]/10" },
  { bg: "#A78BFA", ring: "border-[#A78BFA]/40", glow: "rgba(167,139,250,0.15)", text: "text-[#A78BFA]", pill: "bg-[#A78BFA]/10" },
  { bg: "#FF7AE5", ring: "border-[#FF7AE5]/40", glow: "rgba(255,122,229,0.15)", text: "text-[#FF7AE5]", pill: "bg-[#FF7AE5]/10" },
  { bg: "#FF4D00", ring: "border-[#FF4D00]/40", glow: "rgba(255,77,0,0.15)", text: "text-[#FF4D00]", pill: "bg-[#FF4D00]/10" },
];

const MILESTONE_COLORS = ["#C9F85A", "#4DD2FF", "#FFD36E", "#A78BFA", "#FF4D00"];

export default function AchievementsPage() {
  const { student: s } = useStore();

  const allBadges: Badge[] = [
    ...s.badges,
    { id: "b7", name: "Upload King", description: "Submit 50 check-in photos", icon: "trophy", earned: false, date: "" },
    { id: "b8", name: "Community Anchor", description: "Follow 20 athletes", icon: "star", earned: false, date: "" },
    { id: "b9", name: "Early Riser", description: "Complete a workout before 7am", icon: "flame", earned: false, date: "" },
  ];

  const milestones = [
    { label: "7-Day Streak", current: s.streak, target: 7, done: s.streak >= 7, color: "#C9F85A" },
    { label: "14-Day Streak", current: s.streak, target: 14, done: s.streak >= 14, color: "#4DD2FF" },
    { label: "10k Steps Day", current: 8432, target: 10000, done: false, color: "#FFD36E" },
    { label: "50 Check-Ins", current: 30, target: 50, done: false, color: "#A78BFA" },
    { label: "Plan Mastery", current: s.completionPercentage, target: 100, done: s.completionPercentage >= 100, color: "#FF4D00" },
  ];

  const earned = allBadges.filter((b) => b.earned);
  const locked = allBadges.filter((b) => !b.earned);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8 pb-10">

      {/* ── Summary header ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#C9F85A]/4 translate-x-16 -translate-y-16 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* glow icon */}
          <div className="w-20 h-20 rounded-3xl bg-[#C9F85A]/10 border-2 border-[#C9F85A]/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_40px_rgba(201,248,90,0.15)]">
            <Award className="h-10 w-10 text-[#C9F85A]" />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#C9F85A]/10 border border-[#C9F85A]/20 px-3 py-1.5 mb-3">
              <Zap className="h-3.5 w-3.5 text-[#C9F85A]" />
              <span className="text-xs font-bold text-[#C9F85A] uppercase tracking-wider">Achievements</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Your Badges</h1>
            <p className="text-sm text-white/40 mt-1">
              <span className="text-[#C9F85A] font-bold">{earned.length}</span> / {allBadges.length} unlocked
            </p>
          </div>

          {/* KPI pills */}
          <div className="flex flex-wrap gap-3 sm:flex-col sm:items-end">
            <div className="rounded-2xl bg-[#C9F85A] px-5 py-3 text-center">
              <p className="text-2xl font-bold text-black">{earned.length}</p>
              <p className="text-[10px] font-semibold text-black/60 uppercase tracking-wider">Earned</p>
            </div>
            <div className="rounded-2xl bg-[#1A1A1A] border border-white/8 px-5 py-3 text-center">
              <p className="text-2xl font-bold text-white/30">{locked.length}</p>
              <p className="text-[10px] font-semibold text-white/20 uppercase tracking-wider">Locked</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Earned badges ───────────────────────────────── */}
      {earned.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#C9F85A]" />
            <h2 className="text-sm font-semibold text-white">Unlocked</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {earned.map((badge, i) => {
              const Icon = iconMap[badge.icon] || Award;
              const palette = BADGE_PALETTES[i % BADGE_PALETTES.length];
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.06 }}
                  className="rounded-[24px] border border-white/8 bg-[#121212] p-6 flex flex-col items-center text-center gap-4 group hover:border-white/15 transition-all"
                >
                  <div className="relative">
                    <div
                      className={`w-14 h-14 rounded-2xl border-2 ${palette.ring} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                      style={{ background: palette.glow }}
                    >
                      <Icon className={`h-7 w-7 ${palette.text}`} />
                    </div>
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#C9F85A] flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-black" />
                    </div>
                  </div>

                  <div>
                    <p className={`text-xs font-bold ${palette.text} uppercase tracking-wider mb-1`}>{badge.name}</p>
                    <p className="text-[10px] text-white/40 leading-snug">{badge.description}</p>
                  </div>

                  {badge.earnedDate && (
                    <div className="rounded-full bg-white/5 px-3 py-1 text-[10px] text-white/25 border border-white/5">
                      {badge.earnedDate}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Locked badges ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.18 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-white/15" />
          <h2 className="text-sm font-semibold text-white/40">Locked</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {locked.map((badge, i) => {
            const Icon = iconMap[badge.icon] || Award;
            return (
              <div
                key={badge.id}
                className="rounded-[24px] border border-dashed border-white/8 bg-[#0D0D0D] p-6 flex flex-col items-center text-center gap-4 opacity-50"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center">
                    <Icon className="h-7 w-7 text-white/10" />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1D1D1D] border border-white/10 flex items-center justify-center">
                    <Lock className="h-3 w-3 text-white/20" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-white/20 uppercase tracking-wider mb-1">{badge.name}</p>
                  <p className="text-[10px] text-white/15 leading-snug">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Milestones ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.25 }}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#C9F85A]" />
            <h2 className="text-base font-semibold text-white">Milestones</h2>
          </div>
          <Link
            to="/student/progress"
            className="inline-flex items-center gap-1 text-[11px] text-white/30 hover:text-[#C9F85A] transition-colors"
          >
            Full Progress <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-5">
          {milestones.map((m, i) => {
            const pct = Math.min(100, Math.round((m.current / m.target) * 100));
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {m.done && <CheckCircle2 className="h-3.5 w-3.5" style={{ color: m.color }} />}
                    <span className="text-xs font-semibold text-white">{m.label}</span>
                  </div>
                  <span className="text-xs font-bold tabular-nums" style={{ color: m.done ? m.color : "rgba(255,255,255,0.3)" }}>
                    {m.current.toLocaleString()} / {m.target.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ ...LUXURY_TWEEN_SLOW, delay: i * 0.08 }}
                    className="h-full rounded-full"
                    style={{
                      background: m.done ? m.color : `${m.color}60`,
                      boxShadow: m.done ? `0 0 8px ${m.color}60` : "none",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
