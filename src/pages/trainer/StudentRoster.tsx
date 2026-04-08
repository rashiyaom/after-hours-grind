import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, TrendingUp, Flame, ChevronRight, Activity, Eye, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppStore, useCurrentUser } from "@/hooks/useStore";
import { Student, Trainer } from "@/types";
import SectionHeader from "@/components/SectionHeader";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";

export default function StudentRoster() {
  const currentUser = useCurrentUser();
  const users = useAppStore((s) => s.users);
  const plans = useAppStore((s) => s.plans);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "streak" | "completion" | "day">("name");

  const trainer = currentUser?.role === "trainer" ? (currentUser as Trainer) : null;

  const allStudents = useMemo(() =>
    Object.values(users).filter((u): u is Student => u.role === "student"),
    [users]
  );

  const assignedStudents = useMemo(() =>
    allStudents.filter((s) => s.trainerId === trainer?.id || allStudents.length <= 10),
    [allStudents, trainer?.id]
  );

  const filteredStudents = useMemo(() => {
    let result = assignedStudents;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((s) => s.name.toLowerCase().includes(q) || s.fitnessGoal.toLowerCase().includes(q));
    }
    return result.sort((a, b) => {
      switch (sortBy) {
        case "streak": return b.streak - a.streak;
        case "completion": return b.completionPercentage - a.completionPercentage;
        case "day": return b.currentDay - a.currentDay;
        default: return a.name.localeCompare(b.name);
      }
    });
  }, [assignedStudents, searchQuery, sortBy]);

  const teamStats = useMemo(() => {
    const total = assignedStudents.length;
    if (total === 0) return { avgCompletion: 0, avgStreak: 0, activeCount: 0, totalSteps: 0 };
    return {
      avgCompletion: Math.round(assignedStudents.reduce((s, st) => s + st.completionPercentage, 0) / total),
      avgStreak: Math.round(assignedStudents.reduce((s, st) => s + st.streak, 0) / total),
      activeCount: assignedStudents.filter((s) => s.currentPlanId && plans[s.currentPlanId]?.status === "active").length,
      totalSteps: assignedStudents.reduce((s, st) => s + st.todaySteps, 0),
    };
  }, [assignedStudents, plans]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-10 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Student Management</p>
          </div>
          <h1 className="text-4xl font-display font-semibold text-foreground tracking-tight">
            Athlete Roster
          </h1>
          <p className="text-sm text-muted-foreground mt-2">{assignedStudents.length} athletes assigned</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search athletes..."
            className="pl-12 pr-6 py-3 rounded-xl bg-card border border-white/5 text-sm font-medium focus:outline-none w-72 transition-all focus:border-primary/20"
          />
        </div>
      </motion.div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Avg Completion", value: `${teamStats.avgCompletion}%`, icon: TrendingUp },
          { label: "Avg Streak", value: `${teamStats.avgStreak}d`, icon: Flame },
          { label: "Active Plans", value: teamStats.activeCount.toString(), icon: Activity },
          { label: "Total Steps Today", value: teamStats.totalSteps.toLocaleString(), icon: Award },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.08 }}
            className="glass-card p-5 border border-white/5"
          >
            <div className="flex items-center gap-3 mb-2">
              <stat.icon className="h-4 w-4 text-primary" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Sort Tabs */}
      <div className="flex items-center gap-2">
        {(["name", "streak", "completion", "day"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${
              sortBy === key
                ? "bg-primary text-black"
                : "bg-card border border-white/5 text-muted-foreground hover:text-foreground"
            }`}
          >
            {key === "day" ? "Progress" : key}
          </button>
        ))}
      </div>

      {/* Student Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student, i) => {
          const plan = student.currentPlanId ? plans[student.currentPlanId] : null;
          return (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.05 }}
            >
              <Link
                to={`/trainer/students/${student.id}`}
                className="glass-card p-6 border border-white/5 hover:border-primary/20 transition-all block group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 blur-[40px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-background border border-white/5 flex items-center justify-center text-sm font-bold text-foreground group-hover:bg-primary/10 transition-colors">
                    {student.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-foreground truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.fitnessGoal}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>

                {/* Progress bar */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Day {student.currentDay} / {student.totalDays}</span>
                    <span className="font-semibold text-foreground">{student.completionPercentage}%</span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-primary transition-all duration-500 rounded-full"
                      style={{ width: `${student.completionPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">🔥 {student.streak}d</span>
                  <span>👣 {student.todaySteps.toLocaleString()}</span>
                  {plan && (
                    <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                      plan.status === "active" ? "bg-green-500/10 text-green-500" :
                      plan.status === "pending_trainer_approval" ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {(plan.status ?? "none").replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No students found matching your search.</p>
        </div>
      )}
    </div>
  );
}
