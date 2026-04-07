import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, CheckCircle2, AlertCircle, Clock, Search, Filter,
  ChevronRight, ArrowUpRight, MessageSquare, Plus, Check, X,
  Play, Calendar, Activity, Zap
} from "lucide-react";
import StatCard from "@/components/StatCard";
import SectionHeader from "@/components/SectionHeader";
import { useStore } from "@/hooks/useStore";
import { Submission } from "@/types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

export default function TrainerDashboard() {
  const { trainer, submissions: uploads, reviewSubmission, loading, setLoading, students } = useStore();
  const [selectedUpload, setSelectedUpload] = useState<Submission | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, [setLoading]);

  const stats = [
    { label: "Total Students", value: trainer.totalStudents.toString(), icon: Users },
    { label: "Active Cycles", value: trainer.activePlans.toString(), icon: Zap, trend: "+2" },
    { label: "Pending Reviews", value: uploads.filter(u => u.status === "pending").length.toString(), icon: Clock, accent: true },
    { label: "Avg Completion", value: "88%", icon: Activity },
  ];

  const handleReview = (id: string, action: 'approved' | 'rejected') => {
    if (action === 'rejected' && !feedbackNote.trim()) {
      toast.error("Please provide feedback when requesting changes.");
      return;
    }
    setReviewing(true);
    setTimeout(() => {
      reviewSubmission(id, action, feedbackNote);
      setSelectedUpload(null);
      setFeedbackNote("");
      setReviewing(false);
      if (action === 'approved') toast.success("Submission approved and user notified.");
      else toast.warning("Changes requested. Student notified.");
    }, 1200);
  };

  const filteredUploads = searchQuery.trim()
    ? uploads.filter(u => u.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || u.taskName.toLowerCase().includes(searchQuery.toLowerCase()))
    : uploads;

  if (loading) {
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
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 rounded-[2rem]" />)}
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
             Coach {trainer.name.split(" ")[1]}
           </h1>
        </div>
        
        <div className="flex items-center gap-3 bg-card p-2 rounded-2xl border border-white/5 shadow-sm">
           <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-background text-sm font-semibold text-foreground hover:bg-white/5 transition-all">
             <Calendar className="h-4 w-4" /> Schedule
           </button>
           <Link to="/trainer/plan-builder" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-black text-sm font-semibold hover:opacity-90 active:scale-95 transition-all">
             <Plus className="h-5 w-5" /> New Plan
           </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Recent Uploads Table */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <SectionHeader title="Submissions" subtitle="Pending student check-ins" />
            <div className="hidden md:flex gap-4">
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search students..." className="pl-12 pr-6 py-3 rounded-xl bg-card border border-white/5 text-sm font-medium focus:outline-none w-64 transition-all focus:border-primary/20" />
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
                  {filteredUploads.map((upload, i) => (
                    <tr key={upload.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-background border border-white/5 flex items-center justify-center text-xs font-semibold text-foreground group-hover:bg-primary/10 transition-colors">
                            {upload.studentName.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                             <p className="text-sm font-semibold text-foreground tracking-tight">{upload.studentName}</p>
                             <p className="text-xs font-medium text-muted-foreground mt-0.5">ID: {upload.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground tracking-tight">{upload.taskName}</p>
                            <div className="flex items-center gap-1.5">
                               <Clock className="h-3 w-3 text-muted-foreground/50" />
                               <p className="text-xs text-muted-foreground">{upload.timestamp}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                          upload.status === "approved" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                          upload.status === "rejected" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          "bg-primary/10 text-primary border-primary/20"
                        }`}>
                          {upload.status === "pending" && <Activity className="h-3 w-3" />}
                          <span className="capitalize">{upload.status}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {upload.status === "pending" ? (
                          <button 
                            onClick={() => setSelectedUpload(upload)} 
                            className="text-xs font-semibold px-6 py-2.5 rounded-xl bg-foreground text-background hover:bg-primary hover:text-black transition-all active:scale-95 shadow-sm"
                          >
                            Review
                          </button>
                        ) : (
                          <button 
                            onClick={() => setSelectedUpload(upload)} 
                            className="text-muted-foreground hover:text-foreground text-xs font-semibold px-5 py-2.5 hover:bg-white/5 rounded-xl transition-all"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Messaging Quick Panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-4 space-y-8">
          <SectionHeader title="Messages" subtitle="Quick chat with students" />
          <div className="glass-card rounded-3xl divide-y divide-white/5 overflow-hidden border-white/5 relative bg-card">
            <div className="absolute top-0 left-0 w-24 h-24 bg-primary/5 blur-[60px] pointer-events-none" />
            {students.slice(0, 5).map((s, i) => (
               <div key={s.userId} className="p-6 flex items-center gap-4 hover:bg-white/5 cursor-pointer transition-all border-l-4 border-l-transparent hover:border-l-primary">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-background border border-white/5 flex items-center justify-center text-xs font-semibold">
                     {s.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                     <p className="text-sm font-semibold truncate text-foreground">{s.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground truncate pr-2">Hey coach, about my form...</p>
                </div>
                <MessageSquare className="h-4 w-4 text-muted-foreground hover:text-primary transition-all" />
              </div>
            ))}
            <button className="w-full py-6 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all font-semibold bg-transparent">Open Messages</button>
          </div>
          
          <div className="glass-card p-8 border border-white/5 relative overflow-hidden bg-card">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                   <Activity className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground tracking-tight">System Status</h3>
             </div>
             <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                   <p className="text-xs font-medium text-muted-foreground">Completion Rate</p>
                   <p className="text-sm font-bold text-foreground">94%</p>
                </div>
                <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-white/5">
                   <motion.div initial={{ width: 0 }} animate={{ width: "94%" }} transition={{ duration: 1.5, delay: 0.8 }} className="h-full bg-green-500" />
                </div>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedUpload && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[100]">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUpload(null)} className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
             <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                className="w-full max-w-2xl bg-card border border-white/10 shadow-2xl relative rounded-3xl overflow-hidden"
             >
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-background border border-primary/20 flex items-center justify-center font-bold text-lg text-foreground">
                      {selectedUpload.studentName.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-2xl text-foreground tracking-tight">{selectedUpload.studentName}</h3>
                      <p className="text-xs font-semibold text-primary mt-1">Task: {selectedUpload.taskName}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUpload(null)} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"><X className="h-5 w-5" /></button>
                </div>

                <div className="p-8 gap-8 grid md:grid-cols-2">
                  <div className="space-y-6">
                    <div className="aspect-[4/5] bg-background rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group border border-white/5">
                       <Play className="h-16 w-16 text-white/10 group-hover:text-primary/50 transition-all duration-300 z-10" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                       <div className="absolute bottom-6 left-6 right-6 z-10">
                          <p className="text-xs font-medium text-white/70 truncate">{selectedUpload.studentId}_video</p>
                       </div>
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
                        placeholder={selectedUpload.status === "pending" ? "Leave feedback for the student..." : "Review submitted."}
                        readOnly={selectedUpload.status !== "pending"}
                        className="w-full bg-background border border-white/10 rounded-xl p-5 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 min-h-[160px] transition-all resize-none" 
                      />
                    </div>

                    <div className="space-y-3 mt-6">
                      {selectedUpload.status === "pending" ? (
                        <>
                           <button
                              onClick={() => handleReview(selectedUpload.id, 'approved')}
                              disabled={reviewing}
                              className="w-full h-14 bg-primary text-black rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                             {reviewing ? <Clock className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> Approve</>}
                           </button>
                           <button
                              onClick={() => handleReview(selectedUpload.id, 'rejected')}
                              disabled={reviewing}
                              className="w-full h-12 bg-transparent text-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/5 transition-all active:scale-[0.98] disabled:opacity-50 border border-white/10"
                            >
                             <AlertCircle className="h-4 w-4" /> Request Changes
                           </button>
                        </>
                      ) : (
                        <div className={`h-14 w-full rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-wider border ${
                          selectedUpload.status === "approved" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                        }`}>
                          STATUS: {selectedUpload.status}
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
