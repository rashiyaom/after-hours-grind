import { motion } from "framer-motion";
import { Flame, Target, TrendingUp, Upload, Footprints, Award } from "lucide-react";
import StatCard from "@/components/StatCard";
import ProgressRing from "@/components/ProgressRing";
import WeeklyChart from "@/components/WeeklyChart";
import SectionHeader from "@/components/SectionHeader";
import { currentStudent, weeklyData } from "@/data/mockData";
import { Link } from "react-router-dom";

const monthlyData = [
  { label: "Week 1", value: 92 },
  { label: "Week 2", value: 88 },
  { label: "Week 3", value: 95 },
  { label: "Week 4", value: 78 },
];

export default function ProgressPage() {
  const s = currentStudent;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Progress & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Your fitness journey, visualized</p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Current Streak" value={s.streak} icon={Flame} accent />
        <StatCard label="Plans Completed" value={s.totalPlansCompleted} icon={Target} />
        <StatCard label="Total Uploads" value={30} icon={Upload} />
        <StatCard label="Steps This Week" value="58K" icon={Footprints} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly */}
          <div className="glass-card p-6">
            <SectionHeader title="Weekly Consistency" subtitle="Tasks completed per day" />
            <WeeklyChart data={weeklyData} />
          </div>

          {/* Monthly Adherence */}
          <div className="glass-card p-6">
            <SectionHeader title="Monthly Adherence" subtitle="Workout completion by week" />
            <div className="space-y-4">
              {monthlyData.map((w) => (
                <div key={w.label}>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>{w.label}</span>
                    <span>{w.value}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${w.value}%` }} transition={{ duration: 0.8 }} className="h-full bg-foreground rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Streak History */}
          <div className="glass-card p-6">
            <SectionHeader title="Streak History" />
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: 28 }, (_, i) => {
                const active = i < s.currentDay;
                const streakDay = i >= s.currentDay - s.streak && i < s.currentDay;
                return (
                  <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] ${
                    streakDay ? "bg-foreground text-background font-medium" : active ? "bg-muted text-muted-foreground" : "bg-muted/30 text-muted-foreground/30"
                  }`}>
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 flex flex-col items-center">
            <ProgressRing percentage={s.completionPercentage} size={140} label="Overall Completion" />
          </div>

          {/* Steps Trend */}
          <div className="glass-card p-6">
            <SectionHeader title="Steps Trend" />
            <div className="space-y-3">
              {["Mon: 9,200", "Tue: 11,400", "Wed: 8,800", "Thu: 7,500", "Fri: 10,200", "Sat: 8,432"].map((d) => (
                <div key={d} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{d.split(":")[0]}</span>
                  <span className="text-foreground font-medium">{d.split(":")[1]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="glass-card p-6">
            <SectionHeader title="Badges Earned" />
            <div className="grid grid-cols-3 gap-3">
              {s.badges.map((b) => (
                <div key={b.id} className={`flex flex-col items-center p-3 rounded-xl ${b.earned ? "bg-accent" : "bg-muted/20 opacity-40"}`}>
                  <Award className={`h-5 w-5 mb-1 ${b.earned ? "text-foreground" : "text-muted-foreground"}`} />
                  <span className="text-[9px] text-center text-muted-foreground leading-tight">{b.name}</span>
                </div>
              ))}
            </div>
            <Link
              to="/student/achievements"
              className="mt-4 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all achievements →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
