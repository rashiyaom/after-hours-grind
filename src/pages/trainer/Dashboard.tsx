import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, CheckCircle2, AlertCircle, Clock, Search,
  ChevronRight, MessageSquare, Plus, X,
  Calendar, Activity, Zap, TrendingUp, Bell,
  ArrowUpRight, Flame, Target
} from "lucide-react";
import { useAppStore } from "@/hooks/useStore";
import { useCurrentUser } from "@/hooks/useStore";
import { Student, Trainer } from "@/types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { LUXURY_TWEEN_MEDIUM, LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";

type DashTab = "Submissions" | "Roster" | "Activity";
const PENDING_LONG_HOURS = 8;
type SubmissionQuickFilter = "all" | "pending" | "pending_long" | "missing_proof" | "latest_retries";

export default function TrainerDashboard() {
  const currentUser = useCurrentUser();
  const users = useAppStore((s) => s.users);
  const plans = useAppStore((s) => s.plans);
  const posts = useAppStore((s) => s.posts);
  const legacySubmissions = useAppStore((s) => s.system.legacySubmissions);
  const isLoading = useAppStore((s) => s.system.isLoading);
  const approveTaskSubmission = useAppStore((s) => s.approveTaskSubmission);
  const rejectTaskSubmission = useAppStore((s) => s.rejectTaskSubmission);

  const [feedbackNote, setFeedbackNote] = useState("");
  const [awardedPointsInput, setAwardedPointsInput] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashTab>("Submissions");
  const [submissionQuickFilter, setSubmissionQuickFilter] = useState<SubmissionQuickFilter>("all");

  const trainer = currentUser?.role === "trainer" ? (currentUser as Trainer) : null;

  // Strictly filter students assigned to this trainer only
  const assignedStudents = useMemo(() =>
    Object.values(users).filter((u): u is Student => {
      if (u.role !== "student") return false;
      const s = u as Student;
      return s.trainerId === trainer?.id;
    }),
    [users, trainer?.id]
  );

  // Live-computed stats
  const stats = useMemo(() => {
    const totalStudents = assignedStudents.length;
    const activePlanCount = assignedStudents.filter((s) => {
      const plan = s.currentPlanId ? plans[s.currentPlanId] : null;
      return plan?.status === "active";
    }).length;
    // Submissions from my students only
    const pendingReviews = legacySubmissions.filter((s) =>
      s.status === "pending" && assignedStudents.some((st) => st.id === s.studentId)
    ).length;
    const avgCompletion = totalStudents > 0
      ? Math.round(assignedStudents.reduce((sum, s) => sum + s.completionPercentage, 0) / totalStudents)
      : 0;
    return { totalStudents, activePlanCount, pendingReviews, avgCompletion };
  }, [assignedStudents, plans, legacySubmissions]);

  // Submissions from my assigned students only, filtered by search
  const mySubmissions = useMemo(() => {
    const studentIds = new Set(assignedStudents.map((s) => s.id));
    return legacySubmissions.filter((s) => studentIds.has(s.studentId));
  }, [legacySubmissions, assignedStudents]);

  const filteredSubmissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const quickFiltered = mySubmissions.filter((submission) => {
      if (submissionQuickFilter === "all") return true;
      if (submissionQuickFilter === "pending") return submission.status === "pending";
      if (submissionQuickFilter === "pending_long") {
        return submission.status === "pending" && (submission.pendingAgeHours ?? 0) >= PENDING_LONG_HOURS;
      }
      if (submissionQuickFilter === "missing_proof") {
        return submission.status === "pending" && !submission.whatsappReceived;
      }
      if (submissionQuickFilter === "latest_retries") {
        return submission.status === "pending" && submission.pendingCheckinLabel === "latest";
      }
      return true;
    });

    if (!q) return quickFiltered;
    return quickFiltered.filter(
      (s) => s.studentName.toLowerCase().includes(q) || s.taskName.toLowerCase().includes(q)
    );
  }, [mySubmissions, searchQuery, submissionQuickFilter]);

  const triageStats = useMemo(() => {
    const pendingSubmissions = mySubmissions.filter((submission) => submission.status === "pending");
    const totalPending = pendingSubmissions.length;
    const pendingLong = pendingSubmissions.filter((submission) => (submission.pendingAgeHours ?? 0) >= PENDING_LONG_HOURS).length;
    const missingProof = pendingSubmissions.filter((submission) => !submission.whatsappReceived).length;
    const latestRetries = pendingSubmissions.filter((submission) => submission.pendingCheckinLabel === "latest").length;

    return {
      totalPending,
      pendingLong,
      missingProof,
      latestRetries,
    };
  }, [mySubmissions]);

  const handleTriageCardClick = (filter: SubmissionQuickFilter) => {
    setActiveTab("Submissions");
    setSubmissionQuickFilter(filter);
    setSelectedSubmissionId(null);
  };

  const selectedSubmission = filteredSubmissions.find((s) => s.id === selectedSubmissionId) ?? null;

  // Auto-generated plans needing review from my students
  const pendingAutoPlans = useMemo(() =>
    Object.values(plans).filter((p) => {
      if (p.type !== "auto_generated" || p.status !== "pending_trainer_approval") return false;
      return assignedStudents.some((s) => s.currentPlanId === p.id);
    }),
    [plans, assignedStudents]
  );

  // Recent posts by my students
  const recentStudentPosts = useMemo(() =>
    Object.values(posts)
      .filter((p) => assignedStudents.some((s) => s.id === p.userId))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5),
    [posts, assignedStudents]
  );

  const handleApprove = async (id: string) => {
    const maxPoints = selectedSubmission?.points ?? 10;
    const parsedPoints = Number.parseInt(awardedPointsInput.trim(), 10);
    const awardedPoints = Number.isFinite(parsedPoints) ? parsedPoints : maxPoints;
    if (awardedPoints < 0 || awardedPoints > maxPoints) {
      toast.error(`Marks must be between 0 and ${maxPoints}.`);
      return;
    }

    try {
      setReviewing(true);
      await approveTaskSubmission(id, feedbackNote || undefined, awardedPoints);
      setSelectedSubmissionId(null);
      setFeedbackNote("");
      setAwardedPointsInput("");
      toast.success("Task approved! Student has been notified and awarded points.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not approve submission. Please try again.";
      toast.error(message);
    } finally {
      setReviewing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!feedbackNote.trim()) {
      toast.error("Please provide feedback when requesting changes.");
      return;
    }

    try {
      setReviewing(true);
      await rejectTaskSubmission(id, feedbackNote);
      setSelectedSubmissionId(null);
      setFeedbackNote("");
      setAwardedPointsInput("");
      toast.warning("Changes requested. Student has been notified.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not reject submission. Please try again.";
      toast.error(message);
    } finally {
      setReviewing(false);
    }
  };

  const pendingCount = filteredSubmissions.filter((s) => s.status === "pending").length;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="rounded-[32px] border border-white/10 bg-[#121212] p-6">
          <Skeleton className="h-10 w-72 rounded-full" />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-3xl" />)}
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-[500px] rounded-3xl lg:col-span-8" />
          <Skeleton className="h-[500px] rounded-3xl lg:col-span-4" />
        </div>
      </div>
    );
  }

  const kpiData = [
    { label: "Students", value: stats.totalStudents.toString(), icon: Users, color: "#C9F85A", link: "/trainer/students" },
    { label: "Active Plans", value: stats.activePlanCount.toString(), icon: Activity, color: "#4DD2FF", link: "/trainer/students" },
    { label: "Pending Reviews", value: stats.pendingReviews.toString(), icon: Clock, color: "#FFD36E", link: "#", alert: stats.pendingReviews > 0 },
    { label: "Avg Completion", value: `${stats.avgCompletion}%`, icon: TrendingUp, color: "#A78BFA", link: "/trainer/students" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">

      {/* Top Header + Stats */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9F85A]">Trainer Console · Online</p>
            <h1 className="mt-2 text-4xl font-semibold text-white tracking-tight">{trainer?.name ?? "Coach"}</h1>
            <p className="mt-1 text-sm text-white/50">{trainer?.specialization} · {assignedStudents.length} students assigned</p>
          </div>
          <div className="flex items-center gap-3">
            {pendingAutoPlans.length > 0 && (
              <Link to="/trainer/auto-plans" className="relative inline-flex items-center gap-2 rounded-full bg-[#FFD36E]/15 border border-[#FFD36E]/30 px-4 py-2.5 text-xs font-semibold text-[#FFD36E] hover:bg-[#FFD36E]/20 transition-all">
                <Bell className="h-3.5 w-3.5" />
                Plans Queue ({pendingAutoPlans.length})
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FFD36E] text-[9px] font-bold text-black flex items-center justify-center">{pendingAutoPlans.length}</span>
              </Link>
            )}
            <Link to="/trainer/students" className="inline-flex items-center gap-2 rounded-full bg-[#1A1A1A] border border-white/10 px-4 py-2.5 text-xs font-semibold text-white/80 hover:text-white hover:bg-[#222] transition-all">
              <Users className="h-3.5 w-3.5" />
              Roster
            </Link>
            <Link to="/trainer/plan-builder" className="inline-flex items-center gap-2 rounded-full bg-[#C9F85A] px-5 py-2.5 text-xs font-bold text-black hover:bg-[#d4ff60] transition-all shadow-[0_4px_20px_rgba(201,248,90,0.2)]">
              <Plus className="h-4 w-4" />
              New Plan
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiData.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.08 }}
              >
                <Link to={kpi.link} className={`block rounded-3xl border p-5 relative overflow-hidden hover:scale-[1.02] transition-transform ${kpi.alert ? "border-[#FFD36E]/30 bg-[#FFD36E]/5" : "border-white/8 bg-[#171717]"}`}>
                  {kpi.alert && <div className="absolute inset-0 bg-[#FFD36E]/3 animate-pulse" />}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}18`, border: `1px solid ${kpi.color}30` }}>
                        <Icon className="h-4 w-4" style={{ color: kpi.color }} />
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-white/20" />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{kpi.label}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight" style={{ color: kpi.alert ? "#FFD36E" : "white" }}>{kpi.value}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-[#151515] p-3.5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Instant Triage</p>
            <span className="text-[10px] text-white/30">Assigned students only</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {[
              {
                label: "Total Pending",
                value: triageStats.totalPending,
                icon: Clock,
                color: "#FFD36E",
                bgClass: "bg-[#FFD36E]/10 border-[#FFD36E]/20",
                filter: "pending" as SubmissionQuickFilter,
              },
              {
                label: `Pending ${PENDING_LONG_HOURS}h+`,
                value: triageStats.pendingLong,
                icon: Flame,
                color: "#FF7A45",
                bgClass: "bg-[#FF7A45]/10 border-[#FF7A45]/20",
                filter: "pending_long" as SubmissionQuickFilter,
              },
              {
                label: "Missing Proof",
                value: triageStats.missingProof,
                icon: AlertCircle,
                color: "#FF6B8A",
                bgClass: "bg-[#FF6B8A]/10 border-[#FF6B8A]/20",
                filter: "missing_proof" as SubmissionQuickFilter,
              },
              {
                label: "Latest Retries",
                value: triageStats.latestRetries,
                icon: Target,
                color: "#4DD2FF",
                bgClass: "bg-[#4DD2FF]/10 border-[#4DD2FF]/20",
                filter: "latest_retries" as SubmissionQuickFilter,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleTriageCardClick(item.filter)}
                  className={`rounded-xl border p-3 text-left transition-all hover:scale-[1.01] hover:brightness-110 ${item.bgClass} ${submissionQuickFilter === item.filter ? "ring-1 ring-white/25" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-white/55">{item.label}</p>
                    <Icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                  </div>
                  <p className="mt-1.5 text-2xl font-bold leading-none" style={{ color: item.color }}>
                    {item.value}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Main Content Grid */}
      <section className="grid gap-6 lg:grid-cols-12">

        {/* Submissions Panel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.1 }}
          className="lg:col-span-8 rounded-3xl border border-white/10 bg-[#151515] overflow-hidden"
        >
          {/* Tab header */}
          <div className="p-5 pb-0 border-b border-white/5">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">Student Management</h2>
                <p className="text-xs text-white/40 mt-0.5">Students assigned to you only</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students or tasks..."
                  className="pl-9 pr-4 py-2.5 rounded-xl bg-[#1A1A1A] border border-white/8 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-[#C9F85A]/30 w-64 transition-all"
                />
              </div>
            </div>
            {activeTab === "Submissions" && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {([
                  ["all", "All"],
                  ["pending", "Pending"],
                  ["pending_long", `Pending ${PENDING_LONG_HOURS}h+`],
                  ["missing_proof", "Missing Proof"],
                  ["latest_retries", "Latest Retries"],
                ] as Array<[SubmissionQuickFilter, string]>).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSubmissionQuickFilter(value)}
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide border transition-all ${
                      submissionQuickFilter === value
                        ? "bg-[#C9F85A] text-black border-[#C9F85A]"
                        : "bg-[#1A1A1A] border-white/10 text-white/50 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                {submissionQuickFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setSubmissionQuickFilter("all")}
                    className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide border border-white/12 bg-white/5 text-white/60 hover:text-white"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            )}
            <div className="flex gap-1">
              {(["Submissions", "Roster", "Activity"] as DashTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-t-lg text-xs font-semibold transition-all ${activeTab === tab ? "bg-[#C9F85A] text-black" : "text-white/40 hover:text-white"}`}
                >
                  {tab}
                  {tab === "Submissions" && pendingCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#FFD36E] text-[9px] font-bold text-black">{pendingCount}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">
            {activeTab === "Submissions" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[580px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Student</th>
                      <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Task</th>
                      <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-white/30 text-center">Status</th>
                      <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-white/30 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4">
                    {filteredSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-sm text-white/30">
                          {searchQuery ? "No submissions match your search." : "No submissions yet. Students will appear here after their check-ins."}
                        </td>
                      </tr>
                    ) : (
                      filteredSubmissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-white/3 transition-colors group">
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#1D1D1D] border border-white/8 flex items-center justify-center text-[10px] font-bold text-white group-hover:border-[#C9F85A]/20 transition-colors">
                                {sub.studentName.split(" ").map((n) => n[0]).join("")}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">{sub.studentName}</p>
                                <p className="text-[10px] text-white/30">{sub.timestamp}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 pr-4">
                            <p className="text-sm font-medium text-white/80">{sub.taskName}</p>
                            {sub.taskType && (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block ${sub.taskType === "workout" ? "bg-[#4DD2FF]/15 text-[#4DD2FF]" : sub.taskType === "diet" ? "bg-[#FFD36E]/15 text-[#FFD36E]" : "bg-white/8 text-white/40"}`}>
                                {sub.taskType}
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold ${
                              sub.status === "approved" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" :
                              sub.status === "rejected" ? "bg-red-500/15 text-red-400 border border-red-500/20" :
                              "bg-[#FFD36E]/15 text-[#FFD36E] border border-[#FFD36E]/20"
                            }`}>
                              {sub.status === "pending" && <Clock className="h-3 w-3" />}
                              {sub.status === "approved" && <CheckCircle2 className="h-3 w-3" />}
                              {sub.status === "rejected" && <AlertCircle className="h-3 w-3" />}
                              <span className="capitalize">{sub.status}</span>
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedSubmissionId(sub.id);
                                setAwardedPointsInput(String(sub.points ?? 10));
                              }}
                              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                                sub.status === "pending"
                                  ? "bg-[#C9F85A] text-black hover:bg-[#d4ff60] shadow-[0_2px_12px_rgba(201,248,90,0.2)]"
                                  : "bg-[#1A1A1A] border border-white/8 text-white/50 hover:text-white"
                              }`}
                            >
                              {sub.status === "pending" ? "Review" : "View"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "Roster" && (
              <div className="space-y-3">
                {assignedStudents.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="h-12 w-12 text-white/10 mx-auto mb-3" />
                    {selectedSubmission.status === "pending" && (
                      <div className="rounded-xl bg-[#1A1A1A] border border-white/5 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-white/30 uppercase tracking-wider">Custom Marks</p>
                          <p className="text-[10px] text-white/40">Max {selectedSubmission.points ?? 10}</p>
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={selectedSubmission.points ?? 10}
                          value={awardedPointsInput}
                          onChange={(e) => setAwardedPointsInput(e.target.value)}
                          className="w-full bg-[#101010] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9F85A]/30"
                        />
                      </div>
                    )}
                    <p className="text-sm text-white/30">No students assigned to you yet.</p>
                  </div>
                ) : (
                  assignedStudents.map((s) => {
                    const plan = s.currentPlanId ? plans[s.currentPlanId] : null;
                    return (
                      <Link
                        key={s.id}
                        to={`/trainer/students/${s.id}`}
                        className="flex items-center gap-4 rounded-2xl bg-[#1B1B1B] hover:bg-[#212121] transition-all px-4 py-3.5 group border border-white/5 hover:border-[#C9F85A]/20"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#252525] border border-white/8 flex items-center justify-center text-xs font-bold text-white group-hover:border-[#C9F85A]/20 transition-colors">
                          {s.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                            <span className="text-xs font-bold text-[#C9F85A]">{s.completionPercentage}%</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[11px] text-white/40">Day {s.currentDay}/{s.totalDays}</span>
                            <span className="text-[11px] text-[#FF4D00] flex items-center gap-1"><Flame className="h-3 w-3" />{s.streak}d</span>
                            {plan?.status && (
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize ${plan.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-[#FFD36E]/15 text-[#FFD36E]"}`}>
                                {plan.status.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                            <div className="h-full bg-[#C9F85A] rounded-full transition-all" style={{ width: `${s.completionPercentage}%` }} />
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-[#C9F85A] transition-colors flex-shrink-0" />
                      </Link>
                    );
                  })
                )}
                <Link to="/trainer/students" className="block text-center py-3 text-xs font-semibold text-white/40 hover:text-[#C9F85A] transition-colors">
                  View full roster →
                </Link>
              </div>
            )}

            {activeTab === "Activity" && (
              <div className="space-y-3">
                {recentStudentPosts.length === 0 ? (
                  <div className="py-12 text-center">
                    <Activity className="h-12 w-12 text-white/10 mx-auto mb-3" />
                    <p className="text-sm text-white/30">No recent activity from your students.</p>
                  </div>
                ) : (
                  recentStudentPosts.map((post) => (
                    <div key={post.id} className="flex items-start gap-4 rounded-2xl bg-[#1B1B1B] border border-white/5 px-4 py-3.5">
                      <div className="w-9 h-9 rounded-xl bg-[#252525] border border-white/8 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                        {post.userName.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{post.userName}</p>
                        <p className="text-xs text-white/50 mt-0.5 truncate">{post.caption}</p>
                      </div>
                      <span className="text-[10px] text-white/25 flex-shrink-0">{new Date(post.timestamp).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right column */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.2 }}
          className="lg:col-span-4 space-y-5"
        >
          {/* Team Performance */}
          <div className="rounded-3xl border border-white/10 bg-[#151515] p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 rounded-lg bg-[#C9F85A]/10 border border-[#C9F85A]/20">
                <TrendingUp className="h-3.5 w-3.5 text-[#C9F85A]" />
              </div>
              <h3 className="text-sm font-semibold text-white">Team Performance</h3>
            </div>
            {assignedStudents.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">No students assigned yet</p>
            ) : (
              <div className="space-y-4">
                {[
                  { label: "Avg Completion", value: stats.avgCompletion, pct: stats.avgCompletion, color: "#C9F85A" },
                  {
                    label: "Avg Streak",
                    value: Math.round(assignedStudents.reduce((s, st) => s + st.streak, 0) / (assignedStudents.length || 1)),
                    pct: Math.min(100, Math.round(assignedStudents.reduce((s, st) => s + st.streak, 0) / (assignedStudents.length || 1)) * 3),
                    color: "#4DD2FF",
                    suffix: "d",
                  },
                ].map((metric) => (
                  <div key={metric.label} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-white/40">{metric.label}</p>
                      <p className="text-sm font-bold text-white">{metric.value}{metric.suffix ?? "%"}</p>
                    </div>
                    <div className="h-1.5 w-full bg-[#1D1D1D] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.pct}%` }}
                        transition={{ ...LUXURY_TWEEN_SLOW, delay: 0.5 }}
                        className="h-full rounded-full"
                        style={{ background: metric.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-3xl border border-white/10 bg-[#151515] p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2.5">
              <Link to="/trainer/plan-builder" className="flex items-center gap-3 rounded-2xl bg-[#C9F85A]/10 border border-[#C9F85A]/20 px-4 py-3 text-xs font-semibold text-[#C9F85A] hover:bg-[#C9F85A]/15 transition-all group">
                <Plus className="h-4 w-4" />
                <span className="flex-1">Create New Plan</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link to="/trainer/students" className="flex items-center gap-3 rounded-2xl bg-[#1A1A1A] border border-white/8 px-4 py-3 text-xs font-semibold text-white/70 hover:text-white hover:bg-[#222] transition-all group">
                <Users className="h-4 w-4" />
                <span className="flex-1">Manage Students</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </Link>
              {pendingAutoPlans.length > 0 && (
                <Link to="/trainer/auto-plans" className="flex items-center gap-3 rounded-2xl bg-[#FFD36E]/10 border border-[#FFD36E]/20 px-4 py-3 text-xs font-semibold text-[#FFD36E] hover:bg-[#FFD36E]/15 transition-all group">
                  <Zap className="h-4 w-4" />
                  <span className="flex-1">Review Auto Plans ({pendingAutoPlans.length})</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Link>
              )}
            </div>
          </div>

          {/* Pending Submissions Summary */}
          {pendingCount > 0 && (
            <div className="rounded-3xl border border-[#FFD36E]/20 bg-[#FFD36E]/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-[#FFD36E]" />
                <h3 className="text-sm font-semibold text-[#FFD36E]">{pendingCount} Pending Reviews</h3>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                {pendingCount} student task{pendingCount > 1 ? "s" : ""} waiting for your approval before points are awarded.
              </p>
              <button
                onClick={() => setActiveTab("Submissions")}
                className="mt-3 w-full rounded-xl bg-[#FFD36E]/20 border border-[#FFD36E]/30 py-2.5 text-xs font-semibold text-[#FFD36E] hover:bg-[#FFD36E]/25 transition-all"
              >
                Review Now →
              </button>
            </div>
          )}
        </motion.div>
      </section>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[100]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSubmissionId(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#111111] overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.7)]"
            >
              {/* Modal header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#1A1A1A] border border-[#C9F85A]/20 flex items-center justify-center font-bold text-base text-white">
                    {selectedSubmission.studentName.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white tracking-tight">{selectedSubmission.studentName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-[#C9F85A]">{selectedSubmission.taskName}</span>
                      {selectedSubmission.points && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C9F85A]/15 text-[#C9F85A]">
                          +{selectedSubmission.points} pts on approval
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubmissionId(null)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 grid md:grid-cols-2 gap-6">
                {/* Proof handoff area */}
                <div className="aspect-[4/5] bg-[#0D0D0D] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-white/5">
                  <div className="max-w-[84%] rounded-2xl border border-[#4DD2FF]/25 bg-[#4DD2FF]/10 p-4 text-xs text-white/75 leading-relaxed">
                    Student proof is shared via WhatsApp. Review the received media there, then approve/reject here to update progress and points.
                  </div>
                  {selectedSubmission.proofRefId && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-[#151515] px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-white/35">Proof Reference</p>
                      <p className="text-xs font-semibold text-[#C9F85A] mt-1">{selectedSubmission.proofRefId}</p>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      selectedSubmission.status === "approved" ? "bg-emerald-500/20 text-emerald-400" :
                      selectedSubmission.status === "rejected" ? "bg-red-500/20 text-red-400" :
                      "bg-[#FFD36E]/20 text-[#FFD36E]"
                    }`}>
                      {selectedSubmission.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Feedback + actions */}
                <div className="flex flex-col h-full justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-[#C9F85A]" />
                      <label className="text-xs font-semibold text-white/50">Trainer Feedback</label>
                    </div>
                    <textarea
                      value={feedbackNote}
                      onChange={(e) => setFeedbackNote(e.target.value)}
                      placeholder={selectedSubmission.status === "pending" ? "Leave feedback for the student..." : selectedSubmission.trainerNote || "Review submitted."}
                      readOnly={selectedSubmission.status !== "pending"}
                      className="w-full bg-[#1A1A1A] border border-white/8 rounded-xl p-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C9F85A]/30 min-h-[160px] resize-none transition-all"
                    />
                    <div className="rounded-xl bg-[#1A1A1A] border border-white/5 p-3 space-y-1">
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Submitted</p>
                      <p className="text-xs font-medium text-white/60">{selectedSubmission.timestamp}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 mt-4">
                    {selectedSubmission.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleApprove(selectedSubmission.id)}
                          disabled={reviewing}
                          className="w-full h-12 bg-[#C9F85A] text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#d4ff60] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_4px_20px_rgba(201,248,90,0.2)]"
                        >
                          {reviewing ? <Clock className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Approve & Award Points</>}
                        </button>
                        <button
                          onClick={() => handleReject(selectedSubmission.id)}
                          disabled={reviewing}
                          className="w-full h-11 bg-transparent text-white/70 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/5 transition-all active:scale-[0.98] disabled:opacity-50 border border-white/10"
                        >
                          <AlertCircle className="h-4 w-4" /> Request Changes
                        </button>
                      </>
                    ) : (
                      <div className={`h-12 w-full rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-wider border ${
                        selectedSubmission.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {selectedSubmission.status === "approved" ? "✓ Approved" : "✗ Changes Requested"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
