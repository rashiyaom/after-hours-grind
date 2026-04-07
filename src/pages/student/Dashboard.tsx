import { useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Footprints, Trophy, Target, Calendar, Dumbbell, Utensils, TrendingUp, Upload } from "lucide-react";
import StatCard from "@/components/StatCard";
import StreakCard from "@/components/StreakCard";
import ProgressRing from "@/components/ProgressRing";
import WeeklyChart from "@/components/WeeklyChart";
import SectionHeader from "@/components/SectionHeader";
import { Link } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDashboard() {
  const { student: s, leaderboard, todayTask, weeklyData, loading, setLoading } = useStore();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Welcome back,</p>
        <h1 className="text-3xl sm:text-4xl font-display font-semibold text-foreground tracking-tight">
          {s.name} <span className="inline-block animate-bounce ml-1">👋</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          <span className="text-primary font-semibold">Day {s.currentDay}</span> of {s.totalDays} · Assigned to Coach <span className="text-foreground">Vikram</span>
        </p>
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
          <div className="glass-card p-6 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 transition-all group-hover:bg-primary/10" />
            <SectionHeader title="Today's Plan" subtitle={`Day ${s.currentDay} — Push Day`} action={
              <Link to="/student/daily-plan" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">View All →</Link>
            } />
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <div className="p-5 rounded-2xl bg-background/50 border border-white/5 hover:border-primary/20 transition-all space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Dumbbell className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Workout</span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {todayTask.workout.slice(0, 3).map((w) => (
                    <div key={w.id} className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full transition-all ${w.completed ? "bg-primary shadow-[0_0_8px_rgba(255,165,0,0.4)]" : "bg-muted-foreground/20"}`} />
                      <span className={`text-xs font-medium ${w.completed ? "text-foreground" : "text-muted-foreground"}`}>{w.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs font-medium text-muted-foreground/60 transition-colors group-hover:text-muted-foreground">+{todayTask.workout.length - 3} more routines</p>
              </div>
              <div className="p-5 rounded-2xl bg-background/50 border border-white/5 hover:border-primary/20 transition-all space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Utensils className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Nutrition</span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {todayTask.diet.slice(0, 3).map((d) => (
                    <div key={d.id} className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full transition-all ${d.completed ? "bg-primary shadow-[0_0_8px_rgba(255,165,0,0.4)]" : "bg-muted-foreground/20"}`} />
                      <span className={`text-xs font-medium ${d.completed ? "text-foreground" : "text-muted-foreground"}`}>{d.meal}: {d.description}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs font-medium text-muted-foreground/60 transition-colors group-hover:text-muted-foreground">+{todayTask.diet.length - 3} meals remaining</p>
              </div>
            </div>
          </div>

          {/* Weekly Consistency */}
          <div className="glass-card p-8">
            <SectionHeader title="Consistency Score" subtitle="Activity over the last 7 days" />
            <div className="h-[240px] w-full mt-6">
              <WeeklyChart data={weeklyData} />
            </div>
          </div>

          {/* Leaderboard Preview */}
          <div className="glass-card p-6 relative overflow-hidden border border-white/5">
            <div className="absolute bottom-0 right-0 p-4 opacity-5 pointer-events-none">
              <Trophy className="h-24 w-24" />
            </div>
            <SectionHeader title="Top Performers" subtitle="Highest scores this week" action={<Link to="/student/leaderboard" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">See all →</Link>} />
            <div className="space-y-3 mt-6">
              {leaderboard.slice(0, 5).map((e) => (
                <div key={e.rank} className={`group flex items-center gap-4 p-3 rounded-xl border transition-all ${e.userId === "s1" ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-transparent border-transparent hover:bg-white/5"}`}>
                  <span className={`text-sm font-bold w-6 text-center ${e.rank === 1 ? "text-primary" : "text-muted-foreground"}`}>
                    {e.rank}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-foreground border border-white/5">
                    {e.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground block truncate">{e.name} {e.userId === "s1" && <span className="text-[10px] bg-primary text-black px-1.5 py-0.5 rounded ml-2 font-bold">YOU</span>}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-foreground block">{e.score.toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase">Points</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-primary rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500" />
            <StreakCard streak={s.streak} />
          </div>

          <div className="glass-card p-6 border border-white/5 flex flex-col items-center">
            <ProgressRing percentage={s.completionPercentage} label="Mastery Level" />
            <p className="text-xs font-medium text-muted-foreground mt-4 text-center">Your path to <span className="text-foreground font-semibold">Level 4 Elite</span></p>
          </div>

          {/* Daily Goals */}
          <div className="glass-card p-6 border border-white/5 space-y-6">
            <div className="flex items-center gap-2">
               <Calendar className="h-4 w-4 text-primary" />
               <h3 className="font-display font-semibold text-lg text-foreground">Daily Check-ins</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: "Morning Routine", done: true, key: "morn" },
                { label: "Diet Logged", done: false, key: "diet" },
                { label: "Step Target", sub: `${s.todaySteps.toLocaleString()} / 10,000`, done: false, key: "steps" },
                { label: "Upload Proof", done: false, key: "proof" },
                { label: "Water (2.5L / 3.5L)", done: false, key: "water" },
              ].map((g) => (
                <div key={g.key} className="flex items-start gap-3 group px-1">
                  <div className={`mt-0.5 w-4 h-4 rounded-sm border transition-all ${g.done ? "bg-primary border-primary shadow-sm" : "border-white/20 group-hover:border-white/40 bg-zinc-900"} flex items-center justify-center shrink-0`}>
                    {g.done && <span className="text-black text-[10px] font-bold">✓</span>}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-xs font-medium ${g.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{g.label}</span>
                    {g.sub && <span className="text-[10px] font-medium text-muted-foreground/60">{g.sub}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link to="/student/upload" className="flex flex-col items-center justify-center gap-3 glass-card p-5 border border-white/5 hover:border-primary/30 transition-all group">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                <Upload className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-foreground">Check In</span>
            </Link>
            <Link to="/student/feed" className="flex flex-col items-center justify-center gap-3 glass-card p-5 border border-white/5 hover:border-primary/30 transition-all group">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-foreground">Activity</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
