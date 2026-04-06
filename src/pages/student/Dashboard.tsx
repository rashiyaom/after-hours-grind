import { motion } from "framer-motion";
import { Flame, Footprints, Trophy, Target, Calendar, Dumbbell, Utensils, TrendingUp, Upload } from "lucide-react";
import StatCard from "@/components/StatCard";
import StreakCard from "@/components/StreakCard";
import ProgressRing from "@/components/ProgressRing";
import WeeklyChart from "@/components/WeeklyChart";
import SectionHeader from "@/components/SectionHeader";
import { currentStudent, todayTask, weeklyData, leaderboardData } from "@/data/mockData";
import { Link } from "react-router-dom";

export default function StudentDashboard() {
  const s = currentStudent;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">{s.name}</h1>
        <p className="text-xs text-muted-foreground mt-1">Day {s.currentDay} of {s.totalDays} · Assigned to Coach Vikram</p>
      </motion.div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Streak" value={s.streak} icon={Flame} sub="consecutive days" accent />
        <StatCard label="Today's Steps" value={s.todaySteps.toLocaleString()} icon={Footprints} sub={`/ 10,000 target`} />
        <StatCard label="Rank" value={`#${s.rank}`} icon={Trophy} sub="of 24 students" />
        <StatCard label="Completion" value={`${s.completionPercentage}%`} icon={Target} sub="overall plan" />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left col */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Mission */}
          <div className="glass-card p-6">
            <SectionHeader title="Today's Mission" subtitle={`Day ${s.currentDay} — Push Day`} action={
              <Link to="/student/daily-plan" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View full plan →</Link>
            } />
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-foreground" />
                  <span className="text-sm font-medium text-foreground">Workout</span>
                </div>
                {todayTask.workout.slice(0, 3).map((w) => (
                  <div key={w.id} className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${w.completed ? "bg-foreground" : "bg-muted-foreground/30"}`} />
                    <span className={`text-xs ${w.completed ? "text-foreground" : "text-muted-foreground"}`}>{w.name}</span>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground">+{todayTask.workout.length - 3} more exercises</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-foreground" />
                  <span className="text-sm font-medium text-foreground">Diet</span>
                </div>
                {todayTask.diet.slice(0, 3).map((d) => (
                  <div key={d.id} className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${d.completed ? "bg-foreground" : "bg-muted-foreground/30"}`} />
                    <span className={`text-xs ${d.completed ? "text-foreground" : "text-muted-foreground"}`}>{d.meal}: {d.description}</span>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground">+{todayTask.diet.length - 3} more meals</p>
              </div>
            </div>
          </div>

          {/* Weekly Consistency */}
          <div className="glass-card p-6">
            <SectionHeader title="Weekly Consistency" />
            <WeeklyChart data={weeklyData} />
          </div>

          {/* Leaderboard Preview */}
          <div className="glass-card p-6">
            <SectionHeader title="Leaderboard" action={<Link to="/student/leaderboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">See all →</Link>} />
            <div className="space-y-2">
              {leaderboardData.slice(0, 5).map((e) => (
                <div key={e.rank} className={`flex items-center gap-3 p-3 rounded-xl ${e.userId === "s1" ? "bg-accent/60" : ""}`}>
                  <span className="text-xs font-medium text-muted-foreground w-6 text-center">#{e.rank}</span>
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-medium text-foreground">
                    {e.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <span className="text-sm text-foreground flex-1">{e.name}</span>
                  <span className="text-xs text-muted-foreground">{e.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-6">
          <StreakCard streak={s.streak} />

          <div className="glass-card p-6 flex flex-col items-center">
            <ProgressRing percentage={s.completionPercentage} label="Plan Completion" />
          </div>

          {/* Daily Goals */}
          <div className="glass-card p-6">
            <SectionHeader title="Daily Goals" />
            <div className="space-y-3">
              {[
                { label: "Workout", done: true },
                { label: "Diet logged", done: false },
                { label: "Steps (8,432 / 10,000)", done: false },
                { label: "Upload proof", done: false },
                { label: "Hydration (2.5 / 3.5L)", done: false },
              ].map((g) => (
                <div key={g.label} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-md border ${g.done ? "bg-foreground border-foreground" : "border-border"} flex items-center justify-center`}>
                    {g.done && <span className="text-background text-[10px]">✓</span>}
                  </div>
                  <span className={`text-xs ${g.done ? "text-foreground line-through" : "text-muted-foreground"}`}>{g.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <Link to="/student/upload" className="flex items-center gap-3 glass-card-hover p-4">
              <Upload className="h-4 w-4 text-foreground" />
              <span className="text-sm text-foreground">Upload Check-in</span>
            </Link>
            <Link to="/student/feed" className="flex items-center gap-3 glass-card-hover p-4">
              <TrendingUp className="h-4 w-4 text-foreground" />
              <span className="text-sm text-foreground">View Feed</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
