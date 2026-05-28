import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Flame, ArrowUpRight, Users, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppStore, useCurrentUser } from "@/hooks/useStore";
import { Student, Trainer } from "@/types";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";
import { RosterSkeleton } from "@/components/Skeletons";

export default function StudentRoster() {
  const currentUser = useCurrentUser();
  // Defensive: ensure `users` is always an object to avoid runtime crashes
  const users = useAppStore((s) => s.users ?? {} as Record<string, unknown>);
  const plans = useAppStore((s) => s.plans);

  const trainer = currentUser?.role === "trainer" ? (currentUser as Trainer) : null;

  // Strictly filter students assigned to this trainer
  const assignedStudents = useMemo(
    () => Object.values(users).filter((u): u is Student => {
      if (u.role !== "student") return false;
      const s = u as Student;
      return s.trainerId === trainer?.id;
    }),
    [users, trainer?.id]
  );

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "progress" | "streak">("progress");
  const loading = useAppStore((s) => s.system?.isLoading ?? false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? assignedStudents.filter((s) => s.name.toLowerCase().includes(q) || s.fitnessGoal?.toLowerCase().includes(q))
      : [...assignedStudents];
    return list.sort((a, b) =>
      sortBy === "name" ? a.name.localeCompare(b.name) :
      sortBy === "streak" ? b.streak - a.streak :
      b.completionPercentage - a.completionPercentage
    );
  }, [assignedStudents, search, sortBy]);

  const avgCompletion = assignedStudents.length > 0
    ? Math.round(assignedStudents.reduce((s, st) => s + st.completionPercentage, 0) / assignedStudents.length)
    : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9F85A]">My Students</p>
            <h1 className="mt-2 text-4xl font-semibold text-white tracking-tight">Roster</h1>
            <p className="text-sm text-white/50 mt-1">
              {assignedStudents.length} student{assignedStudents.length !== 1 ? "s" : ""} assigned to {trainer?.name ?? "you"}
            </p>
          </div>
          <div className="rounded-3xl border border-white/8 bg-[#1A1A1A] p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Avg Completion</p>
            <p className="text-3xl font-bold text-[#C9F85A] mt-1">{avgCompletion}%</p>
          </div>
        </div>

        {/* Search + Sort */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#1A1A1A] border border-white/8 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-[#C9F85A]/30 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {(["progress", "streak", "name"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-3 py-2 rounded-xl text-[10px] font-semibold capitalize transition-all ${
                  sortBy === key ? "bg-[#C9F85A] text-black" : "bg-[#1A1A1A] border border-white/8 text-white/40 hover:text-white"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Student Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#151515] p-12 text-center">
            <Users className="h-14 w-14 text-white/8 mx-auto mb-4" />
            <p className="text-base font-semibold text-white/30">
              {search ? "No students match your search." : "No students assigned to you yet."}
            </p>
            <p className="text-xs text-white/20 mt-2">Students are assigned through admin or onboarding flow.</p>
          </div>
        ) : (
          filtered.map((student, i) => {
            const plan = student.currentPlanId ? plans[student.currentPlanId] : null;
            const initials = student.name.split(" ").map((n) => n[0]).join("");

            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.05 }}
              >
                <Link
                  to={`/trainer/students/${student.id}`}
                  className="flex items-center gap-5 rounded-3xl border border-white/8 bg-[#151515] p-5 hover:border-[#C9F85A]/20 hover:bg-[#191919] group transition-all relative overflow-hidden"
                >
                  {/* Hover glow */}
                  <div className="absolute top-0 left-0 w-0 h-full bg-[#C9F85A]/3 group-hover:w-full transition-all duration-500 pointer-events-none" />

                  {/* Avatar */}
                  <div className="relative z-10 w-14 h-14 rounded-2xl bg-[#1A1A1A] border border-white/8 flex items-center justify-center text-lg font-bold text-white flex-shrink-0 group-hover:border-[#C9F85A]/20 transition-colors">
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="relative z-10 flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-base font-semibold text-white truncate group-hover:text-[#C9F85A] transition-colors">{student.name}</p>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className="text-sm font-bold text-white">{student.completionPercentage}%</span>
                        <span className="flex items-center gap-1 text-xs text-[#FF4D00] font-semibold">
                          <Flame className="h-3 w-3" />{student.streak}d
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-xs text-white/40 truncate max-w-[200px]">{student.fitnessGoal}</span>
                      <span className="text-white/20">·</span>
                      <span className="text-xs text-white/40">Day {student.currentDay}/{student.totalDays}</span>
                      {plan && (
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize ${
                          plan.status === "active" ? "bg-emerald-500/15 text-emerald-400" :
                          plan.status === "pending_trainer_approval" ? "bg-[#FFD36E]/15 text-[#FFD36E]" :
                          "bg-white/8 text-white/30"
                        }`}>
                          {(plan.status ?? "draft").replace(/_/g, " ")}
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${student.completionPercentage}%`,
                          background: student.completionPercentage >= 75
                            ? "#C9F85A"
                            : student.completionPercentage >= 40
                            ? "#4DD2FF"
                            : "#FF7AE5",
                        }}
                      />
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="relative z-10 flex-shrink-0 w-9 h-9 rounded-xl border border-white/8 flex items-center justify-center text-white/20 group-hover:border-[#C9F85A]/30 group-hover:text-[#C9F85A] transition-all">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>

      {filtered.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.4 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: "Top Streak", value: `${Math.max(0, ...assignedStudents.map(s => s.streak))} days`, icon: Flame, color: "#FF4D00" },
            { label: "Avg Completion", value: `${avgCompletion}%`, icon: Target, color: "#C9F85A" },
            { label: "Total Students", value: `${assignedStudents.length}`, icon: Users, color: "#4DD2FF" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-white/8 bg-[#151515] p-4 text-center">
                <Icon className="h-5 w-5 mx-auto mb-2" style={{ color: stat.color }} />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">{stat.label}</p>
                <p className="text-xl font-bold mt-0.5 text-white">{stat.value}</p>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
