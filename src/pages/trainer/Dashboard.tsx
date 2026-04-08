import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, CheckCircle2, AlertCircle, Clock, Search,
  ChevronRight, MessageSquare, Plus, Check, X,
  Play, Calendar, Activity, Zap, TrendingUp, Eye
} from "lucide-react";
import StatCard from "@/components/StatCard";
import SectionHeader from "@/components/SectionHeader";
import { useAppStore } from "@/hooks/useStore";
import { useCurrentUser } from "@/hooks/useStore";
import { Student, Trainer } from "@/types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { LUXURY_TWEEN_MEDIUM, LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";

export default function TrainerDashboard() {
  const currentUser = useCurrentUser();
  const users = useAppStore((s) => s.users);
  const plans = useAppStore((s) => s.plans);
  const posts = useAppStore((s) => s.posts);
  const legacySubmissions = useAppStore((s) => s.system.legacySubmissions);
  const isLoading = useAppStore((s) => s.system.isLoading);
  const setLoading = useAppStore((s) => s.setLoading);

  const [feedbackNote, setFeedbackNote] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  const trainer = currentUser?.role === "trainer" ? (currentUser as Trainer) : null;

  // Derive all students (in a real app, filter by trainer assignment)
  const allStudents = useMemo(() =>
    Object.values(users).filter((u): u is Student => u.role === "student"),
    [users]
  );

  const assignedStudents = useMemo(() =>
    allStudents.filter((s) => s.trainerId === trainer?.id || allStudents.length <= 5),
    [allStudents, trainer?.id]
  );

  // Live-computed stats
  const stats = useMemo(() => {
    const totalStudents = assignedStudents.length;
    const activePlanCount = assignedStudents.filter((s) => {
      const plan = s.currentPlanId ? plans[s.currentPlanId] : null;
      return plan?.status === "active";
    }).length;
    const pendingReviews = legacySubmissions.filter((s) => s.status === "pending").length;
    const avgCompletion = totalStudents > 0
      ? Math.round(assignedStudents.reduce((sum, s) => sum + s.completionPercentage, 0) / totalStudents)
      : 0;
    return [
      { label: "Total Students", value: totalStudents.toString(), icon: Users },
      { label: "Active Plans", value: activePlanCount.toString(), icon: Zap, trend: `+${activePlanCount}` },
      { label: "Pending Reviews", value: pendingReviews.toString(), icon: Clock, accent: true },
      { label: "Avg Completion", value: `${avgCompletion}%`, icon: Activity },
    ];
  }, [assignedStudents, plans, legacySubmissions]);

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return legacySubmissions;
    return legacySubmissions.filter(
      (s) => s.studentName.toLowerCase().includes(q) || s.taskName.toLowerCase().includes(q)
    );
  }, [legacySubmissions, searchQuery]);

  const selectedSubmission = filteredSubmissions.find((s) => s.id === selectedSubmissionId) ?? null;

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [setLoading]);

  const handleReview = (id: string, action: "approved" | "rejected") => {
    if (action === "rejected" && !feedbackNote.trim()) {
      toast.error("Please provide feedback when requesting changes.");
      return;
    }
    setReviewing(true);
    setTimeout(() => {
      useAppStore.setState((prev) => ({
        ...prev,
        system: {
          ...prev.system,
          legacySubmissions: prev.system.legacySubmissions.map((s) =>
            s.id === id ? { ...s, status: action, trainerNote: feedbackNote || s.trainerNote } : s
          ),
        },
      }));
      setSelectedSubmissionId(null);
      setFeedbackNote("");
      setReviewing(false);
      if (action === "approved") toast.success("Submission approved and student notified.");
      else toast.warning("Changes requested. Student notified.");
    }, 800);
  };

  // Auto-generated plans needing review
  const pendingAutoPlans = useMemo(() =>
    Object.values(plans).filter((p) => p.type === "auto_generated" && p.status === "pending_trainer_approval"),
    [plans]
  );

  // Recent posts by students
  const recentStudentPosts = useMemo(() =>
    Object.values(posts)
      .filter((p) => assignedStudents.some((s) => s.id === p.userId))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5),
    [posts, assignedStudents]
  );

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-80" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-12 w-32 rounded-2xl" />
            <Skeleton className="h-12 w-48 rounded-2xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-[2rem]" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-10">
          <Skeleton className="lg:col-span-2 h-[600px] rounded-[2.5rem]" />
          <Skeleton className="h-[600px] rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-10 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-in slide-in-from-left duration-700">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary fill-primary/20" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Status: Online</p>
          </div>
          <h1 className="text-[3.5rem] font-display font-semibold text-foreground tracking-tight leading-none mt-2">
            {trainer?.name ?? "Coach"}
          </h1>
        </div>

        <div className="flex items-center gap-3 bg-card p-2 rounded-2xl border border-white/5 shadow-sm">
          <Link to="/trainer/auto-plans" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-background text-sm font-semibold text-foreground hover:bg-white/5 transition-all relative">
            Queue ({pendingAutoPlans.length})
            {pendingAutoPlans.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-black flex items-center justify-center">
                {pendingAutoPlans.length}
              </span>
            )}
          </Link>
          <Link to="/trainer/students" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-background text-sm font-semibold text-foreground hover:bg-white/5 transition-all">
            <Users className="h-4 w-4" /> Roster
          </Link>
          <Link to="/trainer/plan-builder" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-black text-sm font-semibold hover:opacity-90 active:scale-95 transition-all">
            <Plus className="h-5 w-5" /> New Plan
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.1 }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Submissions Table */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.4 }} className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <SectionHeader title="Submissions" subtitle="Student check-ins pending review" />
            <div className="hidden md:flex gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search students..." className="pl-12 pr-6 py-3 rounded-xl bg-card border border-white/5 text-sm font-medium focus:outline-none w-64 transition-all focus:border-primary/20" />
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden rounded-3xl border-white/5 relative bg-card">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] pointer-events-none" />
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[650px]">
                <thead>
                  <tr className="border-b border-white/5 bg-background/50">
                    <th className="px-8 py-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student</th>
                    <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
                    <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Status</th>
                    <th className="px-8 py-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-sm text-muted-foreground">
                        {searchQuery ? "No submissions match your search." : "No submissions yet. Students will appear here after their check-ins."}
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-background border border-white/5 flex items-center justify-center text-xs font-semibold text-foreground group-hover:bg-primary/10 transition-colors">
                              {sub.studentName.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground tracking-tight">{sub.studentName}</p>
                              <p className="text-xs font-medium text-muted-foreground mt-0.5">ID: {sub.studentId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground tracking-tight">{sub.taskName}</p>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-muted-foreground/50" />
                              <p className="text-xs text-muted-foreground">{sub.timestamp}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                            sub.status === "approved" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                            sub.status === "rejected" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                            "bg-primary/10 text-primary border-primary/20"
                          }`}>
                            {sub.status === "pending" && <Activity className="h-3 w-3" />}
                            <span className="capitalize">{sub.status}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {sub.status === "pending" ? (
                            <button
                              onClick={() => setSelectedSubmissionId(sub.id)}
                              className="text-xs font-semibold px-6 py-2.5 rounded-xl bg-foreground text-background hover:bg-primary hover:text-black transition-all active:scale-95 shadow-sm"
                            >
                              Review
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedSubmissionId(sub.id)}
                              className="text-muted-foreground hover:text-foreground text-xs font-semibold px-5 py-2.5 hover:bg-white/5 rounded-xl transition-all"
                            >
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Right sidebar */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.5 }} className="lg:col-span-4 space-y-8">
          {/* Student roster quick view */}
          <SectionHeader title="Student Roster" subtitle="Assigned athletes overview" />
          <div className="glass-card rounded-3xl divide-y divide-white/5 overflow-hidden border-white/5 relative bg-card">
            <div className="absolute top-0 left-0 w-24 h-24 bg-primary/5 blur-[60px] pointer-events-none" />
            {assignedStudents.slice(0, 5).map((s) => {
              const plan = s.currentPlanId ? plans[s.currentPlanId] : null;
              return (
                <Link key={s.id} to={`/trainer/students/${s.id}`} className="p-5 flex items-center gap-4 hover:bg-white/5 cursor-pointer transition-all border-l-4 border-l-transparent hover:border-l-primary block">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-xl bg-background border border-white/5 flex items-center justify-center text-xs font-semibold">
                      {s.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${s.streak > 0 ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-semibold truncate text-foreground">{s.name}</p>
                      <span className="text-[10px] font-bold text-primary">{s.completionPercentage}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Day {s.currentDay}/{s.totalDays}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">🔥 {s.streak}</span>
                      {plan?.status && <span className="ml-auto text-[10px] capitalize px-1.5 py-0.5 rounded bg-white/5">{plan.status.replace(/_/g, " ")}</span>}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                </Link>
              );
            })}
            <Link to="/trainer/students" className="w-full block py-5 text-center text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all font-semibold">
              View All Students →
            </Link>
          </div>

          {/* System status */}
          <div className="glass-card p-8 border border-white/5 relative overflow-hidden bg-card">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground tracking-tight">Team Performance</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: "Avg Completion", value: stats[3].value, color: "bg-green-500" },
                { label: "Streak Avg", value: `${assignedStudents.length > 0 ? Math.round(assignedStudents.reduce((s, st) => s + st.streak, 0) / assignedStudents.length) : 0}d`, color: "bg-primary" },
              ].map((metric) => (
                <div key={metric.label} className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                    <p className="text-sm font-bold text-foreground">{metric.value}</p>
                  </div>
                  <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-white/5">
                    <motion.div initial={{ width: 0 }} animate={{ width: metric.value }} transition={{ ...LUXURY_TWEEN_SLOW, delay: 0.8 }} className={`h-full ${metric.color}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          {recentStudentPosts.length > 0 && (
            <div className="glass-card rounded-3xl overflow-hidden border-white/5 bg-card">
              <div className="p-5 border-b border-white/5">
                <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
              </div>
              {recentStudentPosts.map((post) => (
                <div key={post.id} className="p-4 border-b border-white/5 last:border-b-0 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-background border border-white/5 flex items-center justify-center text-[10px] font-semibold">
                    {post.userName.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{post.userName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{post.caption.slice(0, 40)}...</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{new Date(post.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[100]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSubmissionId(null)} className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-card border border-white/10 shadow-2xl relative rounded-3xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-background border border-primary/20 flex items-center justify-center font-bold text-lg text-foreground">
                    {selectedSubmission.studentName.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-2xl text-foreground tracking-tight">{selectedSubmission.studentName}</h3>
                    <p className="text-xs font-semibold text-primary mt-1">Task: {selectedSubmission.taskName}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedSubmissionId(null)} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-8 gap-8 grid md:grid-cols-2">
                <div className="space-y-6">
                  <div className="aspect-[4/5] bg-background rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group border border-white/5">
                    {selectedSubmission.mediaUrl ? (
                      <img src={selectedSubmission.mediaUrl} alt="Submission" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Play className="h-16 w-16 text-white/10 group-hover:text-primary/50 transition-all duration-300 z-10" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6 z-10">
                          <p className="text-xs font-medium text-white/70 truncate">{selectedSubmission.studentId}_media</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col h-full justify-between py-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <label className="text-xs text-muted-foreground font-medium">Feedback</label>
                    </div>
                    <textarea
                      value={feedbackNote}
                      onChange={(e) => setFeedbackNote(e.target.value)}
                      placeholder={selectedSubmission.status === "pending" ? "Leave feedback for the student..." : selectedSubmission.trainerNote || "Review submitted."}
                      readOnly={selectedSubmission.status !== "pending"}
                      className="w-full bg-background border border-white/10 rounded-xl p-5 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 min-h-[160px] transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-3 mt-6">
                    {selectedSubmission.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleReview(selectedSubmission.id, "approved")}
                          disabled={reviewing}
                          className="w-full h-14 bg-primary text-black rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          {reviewing ? <Clock className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> Approve</>}
                        </button>
                        <button
                          onClick={() => handleReview(selectedSubmission.id, "rejected")}
                          disabled={reviewing}
                          className="w-full h-12 bg-transparent text-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/5 transition-all active:scale-[0.98] disabled:opacity-50 border border-white/10"
                        >
                          <AlertCircle className="h-4 w-4" /> Request Changes
                        </button>
                      </>
                    ) : (
                      <div className={`h-14 w-full rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-wider border ${
                        selectedSubmission.status === "approved" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}>
                        STATUS: {selectedSubmission.status}
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
