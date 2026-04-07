import { motion } from "framer-motion";
import { Flame, Target, TrendingUp, Upload, Footprints, Award, Activity, ShieldCheck, Zap, Hash, ChevronRight } from "lucide-react";
import StatCard from "@/components/StatCard";
import ProgressRing from "@/components/ProgressRing";
import WeeklyChart from "@/components/WeeklyChart";
import SectionHeader from "@/components/SectionHeader";
import { Link } from "react-router-dom";
import { useStore } from "@/hooks/useStore";

const monthlyData = [
  { label: "Week 1", value: 92 },
  { label: "Week 2", value: 88 },
  { label: "Week 3", value: 95 },
  { label: "Week 4", value: 78 },
];

export default function ProgressPage() {
  const { student: s, weeklyData } = useStore();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-10 pb-28 relative">
       <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl pointer-events-none" />
       
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <div className="flex items-center gap-3 mb-2">
           <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <TrendingUp className="h-4 w-4 text-primary" />
           </div>
           <p className="text-xs font-semibold text-primary uppercase tracking-wider">Performance Analytics</p>
        </div>
        <h1 className="text-4xl font-display font-semibold text-foreground tracking-tight">Your Progress</h1>
        <p className="text-sm font-medium text-muted-foreground mt-2 flex items-center gap-2">
           <Activity className="h-4 w-4 text-muted-foreground" /> Analyzing recent tracking data
        </p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Current Streak" value={s.streak} icon={Flame} accent />
        <StatCard label="Plans Completed" value={s.totalPlansCompleted} icon={ShieldCheck} />
        <StatCard label="Total Log Ins" value={30} icon={Upload} />
        <StatCard label="Total Steps" value="58.2K" icon={Footprints} />
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Weekly */}
          <div className="glass-card p-6 sm:p-8 border border-white/5 bg-card">
            <SectionHeader title="Consistency" subtitle="Activity output over the last 7 days" />
            <div className="h-[300px] w-full mt-8">
               <WeeklyChart data={weeklyData} />
            </div>
          </div>

          {/* Monthly Adherence */}
          <div className="glass-card p-6 sm:p-8 border border-white/5 bg-card">
            <SectionHeader title="Adherence" subtitle="Completion by week" />
            <div className="space-y-6 mt-8">
              {monthlyData.map((w, i) => (
                <div key={w.label} className="group">
                  <div className="flex justify-between text-xs font-semibold tracking-wider mb-2 text-muted-foreground transition-colors group-hover:text-foreground">
                    <span className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                       {w.label}
                    </span>
                    <span>{w.value}%</span>
                  </div>
                  <div className="h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5 p-0.5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${w.value}%` }} transition={{ duration: 1.2, delay: i * 0.1 }} className="h-full bg-foreground rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Streak History */}
          <div className="glass-card p-6 sm:p-8 border border-white/5 bg-card">
            <SectionHeader title="History" subtitle="Your activity map" />
            <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-2 mt-8">
              {Array.from({ length: 28 }, (_, i) => {
                const active = i < s.currentDay;
                const streakDay = i >= s.currentDay - s.streak && i < s.currentDay;
                return (
                  <motion.div 
                    key={i} 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={`aspect-square rounded-md flex items-center justify-center text-xs font-semibold border transition-all ${
                    streakDay ? "bg-primary text-black border-primary shadow-sm" : 
                    active ? "bg-white/5 border-white/10 text-muted-foreground" : 
                    "bg-transparent border-white/5 text-muted-foreground/30"
                  }`}>
                    {i + 1}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-8 flex flex-col items-center bg-card shadow-sm border border-white/5">
            <ProgressRing percentage={s.completionPercentage} size={180} label="Mastery Level" />
            <div className="mt-8 flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
               <Zap className="h-4 w-4 text-primary fill-primary" />
               <span className="text-xs font-bold text-primary">Level {Math.floor(s.completionPercentage/20) + 1} Unlocked</span>
            </div>
          </div>

          {/* Steps Trend */}
          <div className="glass-card p-6 sm:p-8 bg-card border border-white/5">
            <SectionHeader title="Step Activity" />
            <div className="space-y-4 mt-6">
              {["MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d, i) => (
                <div key={d} className="flex items-center justify-between group">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">{d}</span>
                  <div className="flex-1 mx-4 h-px bg-white/5" />
                  <span className="text-sm font-semibold text-foreground tabular-nums group-hover:text-primary transition-colors">{(8000 + (Math.random() * 4000)).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="glass-card p-6 sm:p-8 bg-card border border-white/5">
            <SectionHeader title="Earned Badges" />
            <div className="grid grid-cols-3 gap-3 mt-6">
              {s.badges.slice(0, 6).map((b) => (
                <div key={b.id} className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all border ${b.earned ? "bg-primary/5 border-primary/20 text-primary shadow-sm hover:scale-105" : "bg-transparent border-white/5 opacity-40 grayscale"}`}>
                  <Award className={`h-6 w-6 mb-1 ${b.earned ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-[10px] text-center font-semibold tracking-tight leading-tight">{b.name}</span>
                </div>
              ))}
            </div>
            <Link
              to="/student/achievements"
              className="mt-6 flex items-center justify-center text-xs font-semibold text-muted-foreground hover:text-primary transition-all p-3 border border-white/5 rounded-xl hover:border-primary/30 hover:bg-primary/5 group"
            >
              View All Badges <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
