import { useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Flame, Footprints, TrendingUp, Calendar, Target,
  Dumbbell, Utensils, CheckCircle2, XCircle, Clock, Award, BarChart3
} from "lucide-react";
import { useAppStore } from "@/hooks/useStore";
import { Student, Plan } from "@/types";
import SectionHeader from "@/components/SectionHeader";
import ProgressRing from "@/components/ProgressRing";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";

export default function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const users = useAppStore((s) => s.users);
  const plans = useAppStore((s) => s.plans);
  const legacySubmissions = useAppStore((s) => s.system.legacySubmissions);

  const student = studentId ? users[studentId] : null;
  const isStudent = student?.role === "student";
  const s = isStudent ? (student as Student) : null;

  const plan: Plan | null = s?.currentPlanId ? plans[s.currentPlanId] ?? null : null;

  const studentSubmissions = useMemo(() =>
    s ? legacySubmissions.filter((sub) => sub.studentId === s.id) : [],
    [legacySubmissions, s]
  );

  if (!s) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Student not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary text-sm font-semibold">← Go Back</button>
      </div>
    );
  }

  const approvedCount = studentSubmissions.filter((sub) => sub.status === "approved").length;
  const pendingCount = studentSubmissions.filter((sub) => sub.status === "pending").length;
  const rejectedCount = studentSubmissions.filter((sub) => sub.status === "rejected").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-10 pb-24">
      {/* Back button */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Roster
        </button>
      </motion.div>

      {/* Profile header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[80px] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center gap-8">
          <div className="w-24 h-24 rounded-3xl bg-background border border-white/5 flex items-center justify-center text-2xl font-bold text-foreground">
            {s.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-display font-semibold text-foreground tracking-tight">{s.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{s.fitnessGoal} · {s.collegeId}</p>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold text-foreground">{s.streak}</span> day streak
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Footprints className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold text-foreground">{s.todaySteps.toLocaleString()}</span> steps today
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Award className="h-3.5 w-3.5 text-primary" />
                Rank <span className="font-semibold text-foreground">#{s.rank}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold text-foreground">{s.height}cm / {s.weight}kg</span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <ProgressRing percentage={s.completionPercentage} size={100} />
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Plan Info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.1 }} className="glass-card p-8 border border-white/5 space-y-6">
          <SectionHeader title="Current Plan" subtitle="Active training programme details" />
          {plan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-foreground">{plan.title ?? plan.name}</p>
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize border ${
                  plan.status === "active" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                  plan.status === "pending_trainer_approval" ? "bg-primary/10 text-primary border-primary/20" :
                  plan.status === "rejected" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                  "bg-muted text-muted-foreground border-white/5"
                }`}>
                  {(plan.status ?? "draft").replace(/_/g, " ")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-xl p-4 border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Duration</p>
                  <p className="text-lg font-bold text-foreground">{plan.duration ?? s.totalDays} days</p>
                </div>
                <div className="bg-background rounded-xl p-4 border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Progress</p>
                  <p className="text-lg font-bold text-foreground">Day {s.currentDay} / {s.totalDays}</p>
                </div>
                <div className="bg-background rounded-xl p-4 border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Goal</p>
                  <p className="text-sm font-semibold text-foreground">{plan.goalType ?? "General"}</p>
                </div>
                <div className="bg-background rounded-xl p-4 border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Difficulty</p>
                  <p className="text-sm font-semibold text-foreground capitalize">{plan.difficulty}</p>
                </div>
              </div>

              {/* Week preview if available */}
              {plan.weeks && plan.weeks[0] && (
                <div className="bg-background rounded-xl p-4 border border-white/5 space-y-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Week 1 Preview</p>
                  <div className="space-y-2">
                    {plan.weeks[0].days.slice(0, 3).map((day) => (
                      <div key={day.day} className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground font-semibold w-10">Day {day.day}</span>
                        <div className="flex-1 flex flex-wrap gap-1">
                          {day.tasks.map((task, ti) => (
                            <span key={ti} className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              task.type === "workout" ? "bg-primary/10 text-primary" :
                              task.type === "nutrition" ? "bg-blue-500/10 text-blue-400" :
                              "bg-green-500/10 text-green-400"
                            }`}>
                              {task.title.slice(0, 25)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No active plan assigned</p>
              <Link to="/trainer/plan-builder" className="inline-block mt-3 text-xs font-semibold text-primary hover:underline">Create a plan →</Link>
            </div>
          )}
        </motion.div>

        {/* Submissions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.2 }} className="glass-card p-8 border border-white/5 space-y-6">
          <SectionHeader title="Submissions" subtitle="Check-in history and reviews" />

          {/* Stats row */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs font-semibold text-green-500">{approvedCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">{pendingCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs font-semibold text-red-500">{rejectedCount}</span>
            </div>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {studentSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No submissions yet from this student.</p>
              </div>
            ) : (
              studentSubmissions.map((sub) => (
                <div key={sub.id} className="flex items-center gap-4 p-4 rounded-xl bg-background border border-white/5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    sub.status === "approved" ? "bg-green-500/10" :
                    sub.status === "rejected" ? "bg-red-500/10" :
                    "bg-primary/10"
                  }`}>
                    {sub.status === "approved" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                     sub.status === "rejected" ? <XCircle className="h-4 w-4 text-red-500" /> :
                     <Clock className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{sub.taskName}</p>
                    <p className="text-xs text-muted-foreground">{sub.timestamp}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground capitalize">{sub.status}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Onboarding data if available */}
      {s.onboardingDraft && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.3 }} className="glass-card p-8 border border-white/5 space-y-6">
          <SectionHeader title="Fitness Profile" subtitle="Onboarding questionnaire data" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Age", value: s.onboardingDraft.basic.age.toString() },
              { label: "Gender", value: s.onboardingDraft.basic.gender },
              { label: "BMI", value: s.onboardingDraft.basic.bmi?.toFixed(1) ?? "—" },
              { label: "Goal", value: s.onboardingDraft.goals.primaryGoal.replace(/_/g, " ") },
              { label: "Experience", value: s.onboardingDraft.fitnessStatus.experience },
              { label: "Activity", value: s.onboardingDraft.fitnessStatus.activityLevel.replace(/_/g, " ") },
              { label: "Days/Week", value: s.onboardingDraft.commitment.daysPerWeek.toString() },
              { label: "Diet", value: s.onboardingDraft.lifestyle.dietType === "veg" ? "Vegetarian" : "Non-veg" },
              { label: "Equipment", value: s.onboardingDraft.environment.equipment.replace(/_/g, " ") },
              { label: "Workout", value: s.onboardingDraft.environment.workoutType },
              { label: "Sleep", value: `${s.onboardingDraft.lifestyle.sleepHours}h` },
              { label: "Hydration", value: s.onboardingDraft.lifestyle.hydrationHabit },
            ].map((item) => (
              <div key={item.label} className="bg-background rounded-xl p-3 border border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{item.label}</p>
                <p className="text-sm font-semibold text-foreground capitalize">{item.value}</p>
              </div>
            ))}
          </div>
          {s.onboardingDraft.constraints.hasInjuries && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-400 mb-1">⚠️ Injury Notes</p>
              <p className="text-sm text-foreground">{s.onboardingDraft.constraints.injuryTypes.join(", ") || s.onboardingDraft.constraints.restrictions || "Has injuries flagged"}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
