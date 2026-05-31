import { motion } from "framer-motion";
import {
  Flame, TrendingUp, Upload, Award, Activity,
  ShieldCheck, Zap, ChevronRight,
} from "lucide-react";
import ProgressRing from "@/components/ProgressRing";
import WeeklyChart from "@/components/WeeklyChart";
import { Link } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import { LUXURY_TWEEN_MEDIUM, LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";

const monthlyColors = ["#C9F85A", "#4DD2FF", "#FFD36E", "#A78BFA"];

export default function ProgressPage() {
  const { student: s, weeklyData, progressOverview, progressWeekly, progressMonthly, progressHeatmap } = useStore();

  const monthlyData = progressMonthly.map((item, index) => ({
    label: item.week,
    value: item.completion,
    color: monthlyColors[index % monthlyColors.length],
  }));

  const fallbackMonthly = [
    { label: "Week 1", value: 0, color: "#C9F85A" },
    { label: "Week 2", value: 0, color: "#4DD2FF" },
    { label: "Week 3", value: 0, color: "#FFD36E" },
    { label: "Week 4", value: 0, color: "#A78BFA" },
  ];

  const monthlyBars = monthlyData.length > 0 ? monthlyData : fallbackMonthly;
  const activityData = progressWeekly.length > 0
    ? progressWeekly.map((item) => ({ day: item.day, minutes: item.workoutMinutes }))
    : weeklyData.map((item) => ({ day: item.name, minutes: 0 }));
  const maxMinutes = Math.max(1, ...activityData.map((d) => d.minutes));

  const kpis = [
    { label: "Current Streak", value: `${progressOverview?.streak ?? s.streak}`, unit: "days", icon: Flame, color: "#FF4D00", bg: "bg-[#FF4D00]", dark: false },
    { label: "Plans Done", value: String(s.totalPlansCompleted), unit: "plans", icon: ShieldCheck, color: "#C9F85A", bg: "bg-[#1A1A1A]", dark: false },
    { label: "Check-Ins", value: String(progressOverview?.checkInsLast30Days ?? 0), unit: "sessions", icon: Upload, color: "#4DD2FF", bg: "bg-[#1A1A1A]", dark: false },
    { label: "Calories Burned", value: `${Math.round((progressOverview?.totalCaloriesBurnedLast30Days ?? 0) / 100) / 10}k`, unit: "calories", icon: Award, color: "#A78BFA", bg: "bg-[#1A1A1A]", dark: false },
  ];

  return (
    <div
      className="mx-auto max-w-7xl space-y-6 overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-28 sm:pb-10 touch-manipulation"
      style={{ touchAction: "manipulation", WebkitTextSizeAdjust: "100%" }}
    >

      {/* ── Header card ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#C9F85A]/4 translate-x-16 -translate-y-16 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#C9F85A]/10 border border-[#C9F85A]/20 px-3 py-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-[#C9F85A]" />
            <span className="text-xs font-bold text-[#C9F85A] uppercase tracking-wider">Analytics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Your Progress</h1>
          <p className="text-sm text-white/40 flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-[#C9F85A]" />
            Tracking {s.totalDays}-day programme · Day {s.currentDay}
          </p>
        </div>
      </motion.div>

      {/* ── KPI row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.06 }}
            className={`${k.bg} rounded-[24px] border border-white/5 p-5 relative overflow-hidden`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{k.label}</p>
              <k.icon className="h-4 w-4" style={{ color: k.color }} />
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">{k.value}</p>
            <p className="text-[10px] text-white/30 mt-1">{k.unit}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Main grid ───────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column — charts */}
        <div className="lg:col-span-2 space-y-6">

          {/* Weekly chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.15 }}
            className="rounded-[32px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">7-day view</p>
                <h2 className="text-base font-semibold text-white">Weekly Consistency</h2>
              </div>
              <div className="w-2 h-2 rounded-full bg-[#C9F85A] animate-pulse" />
            </div>
            <div className="h-[220px] sm:h-[260px] w-full">
              <WeeklyChart data={weeklyData} />
            </div>
          </motion.div>

          {/* Monthly adherence bars */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.2 }}
            className="rounded-[32px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
          >
            <div className="mb-6">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Monthly view</p>
              <h2 className="text-base font-semibold text-white">Plan Adherence</h2>
            </div>

            <div className="space-y-5">
              {monthlyBars.map((w, i) => (
                <div key={w.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: w.color }} />
                      <span className="text-xs font-semibold text-white">{w.label}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: w.color }}>{w.value}%</span>
                  </div>
                  <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${w.value}%` }}
                      transition={{ ...LUXURY_TWEEN_SLOW, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: w.color, opacity: 0.8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Activity heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.25 }}
            className="rounded-[32px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
          >
            <div className="mb-6">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">28-day view</p>
              <h2 className="text-base font-semibold text-white">Workout Activity Map</h2>
            </div>

            <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5">
              {(progressHeatmap.length > 0 ? progressHeatmap : Array.from({ length: 28 }, (_, i) => ({ date: String(i + 1), value: 0, level: 0 }))).map((item, i) => {
                const level = item.level ?? 0;
                return (
                  <motion.div
                    key={`${item.date}-${i}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.015 }}
                    className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all ${
                      level >= 3
                        ? "bg-[#C9F85A] border-[#C9F85A] text-black shadow-[0_2px_8px_rgba(201,248,90,0.3)]"
                        : level > 0
                        ? "bg-[#1A1A1A] border-white/10 text-white/40"
                        : "bg-transparent border-white/5 text-white/15"
                    }`}
                  >
                    {i + 1}
                  </motion.div>
                );
              })}
            </div>

            <div className="flex gap-4 mt-4 text-[10px] text-white/30">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#C9F85A]" />Streak days</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#1A1A1A] border border-white/10" />Active</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm border border-white/5" />Upcoming</div>
            </div>
          </motion.div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Completion ring */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.12 }}
            className="rounded-[32px] border border-white/10 bg-[#121212] p-8 flex flex-col items-center shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
          >
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-6">Overall</p>
            <ProgressRing percentage={progressOverview?.completionPercentage ?? s.completionPercentage} size={180} label="Mastery" />
            <div className="mt-6 flex items-center gap-2 bg-[#C9F85A]/10 px-4 py-2.5 rounded-full border border-[#C9F85A]/20">
              <Zap className="h-4 w-4 text-[#C9F85A] fill-[#C9F85A]/30" />
              <span className="text-xs font-bold text-[#C9F85A]">Level {Math.floor((progressOverview?.completionPercentage ?? s.completionPercentage) / 20) + 1} Unlocked</span>
            </div>
          </motion.div>

          {/* Workout activity */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.18 }}
            className="rounded-[32px] border border-white/10 bg-[#121212] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center gap-2 mb-5">
              <Flame className="h-4 w-4 text-[#A78BFA]" />
              <h2 className="text-sm font-semibold text-white">Workout Activity</h2>
            </div>
            <div className="space-y-3">
              {activityData.map((d) => {
                const pct = (d.minutes / maxMinutes) * 100;
                return (
                  <div key={d.day} className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold text-white/40 w-8 uppercase">{d.day}</span>
                    <div className="flex-1 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={LUXURY_TWEEN_SLOW}
                        className="h-full rounded-full bg-[#A78BFA]/70"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-white/50 tabular-nums w-12 text-right">
                      {d.minutes} min
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Badges mini */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.22 }}
            className="rounded-[32px] border border-white/10 bg-[#121212] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center gap-2 mb-5">
              <Award className="h-4 w-4 text-[#FFD36E]" />
              <h2 className="text-sm font-semibold text-white">Earned Badges</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {s.badges.slice(0, 6).map((b, i) => (
                <div
                  key={b.id}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 border transition-all ${
                    b.earned
                      ? "bg-[#C9F85A]/8 border-[#C9F85A]/20 hover:scale-105"
                      : "bg-transparent border-white/5 opacity-30 grayscale"
                  }`}
                >
                  <Award className={`h-5 w-5 mb-1 ${b.earned ? "text-[#C9F85A]" : "text-white/20"}`} />
                  <span className="text-[9px] text-center font-semibold tracking-tight leading-tight text-white/50">{b.name}</span>
                </div>
              ))}
            </div>
            <Link
              to="/student/achievements"
              className="mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-white/30 hover:text-[#C9F85A] transition-colors p-3 border border-white/5 rounded-2xl hover:border-[#C9F85A]/20 group"
            >
              View All Badges
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
