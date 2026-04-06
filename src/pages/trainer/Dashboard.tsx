import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, CheckCircle2, AlertCircle, Clock, Search, Filter,
  ChevronRight, ArrowUpRight, MessageSquare, Plus, Check, X,
  Play, Eye, ExternalLink, Calendar,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import SectionHeader from "@/components/SectionHeader";
import { recentUploads as initialUploads } from "@/data/mockData";
import { toast } from "sonner";

export default function TrainerDashboard() {
  const [uploads, setUploads] = useState(initialUploads);
  const [selectedUpload, setSelectedUpload] = useState<typeof initialUploads[0] | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const stats = [
    { label: "Total Students", value: "24", icon: Users },
    { label: "Active Today", value: "18", icon: ArrowUpRight, trend: "+12%" },
    { label: "Pending Reviews", value: uploads.filter(u => u.status === "pending").length.toString(), icon: Clock },
    { label: "Avg Completion", value: "88%", icon: CheckCircle2 },
  ];

  const handleReview = (id: string, action: 'approved' | 'rejected') => {
    setReviewing(true);
    setTimeout(() => {
      setUploads(prev => prev.map(u => u.id === id ? { ...u, status: action } : u));
      setSelectedUpload(null);
      setReviewing(false);
      toast.success(action === 'approved' ? "Check-in approved! Student notified." : "Review sent back to student.");
    }, 1000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Coach Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your students and their progress</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-sm font-medium text-foreground hover:bg-accent/80 transition-colors">
            <Calendar className="h-4 w-4" />
            Schedule
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors shadow-lg">
            <Plus className="h-4 w-4" />
            Create Plan
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Uploads Table */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <SectionHeader title="Recent Submissions" subtitle="Approve student proof videos" />
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input placeholder="Search..." className="pl-9 pr-4 py-2 rounded-xl bg-muted/30 border border-border text-xs focus:outline-none w-40" />
              </div>
              <button className="p-2 rounded-xl bg-muted/30 border border-border text-muted-foreground">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-accent/20">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Student</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Task</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Proof</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {uploads.map((upload) => (
                  <tr key={upload.id} className="hover:bg-accent/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold">
                          {upload.studentName.split(" ").map(n => n[0]).join("")}
                        </div>
                        <p className="text-sm font-medium">{upload.studentName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{upload.taskName}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => setSelectedUpload(upload)} className="flex items-center gap-2 text-xs text-foreground/80 hover:text-foreground">
                        <Play className="h-3 w-3" /> View
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
                        upload.status === "approved" ? "bg-success/10 text-success" :
                        upload.status === "rejected" ? "bg-destructive/10 text-destructive" :
                        "bg-amber-500/10 text-amber-500"
                      }`}>
                        {upload.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {upload.status === "pending" ? (
                        <button onClick={() => setSelectedUpload(upload)} className="text-xs font-semibold hover:underline">Review</button>
                      ) : (
                        <button className="text-muted-foreground hover:text-foreground"><ChevronRight className="h-4 w-4 ml-auto" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Messaging Quick Panel */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <SectionHeader title="Messages" subtitle="Active conversations" />
          <div className="glass-card divide-y divide-border/50">
            {[1, 2, 3].map(id => (
              <div key={id} className="p-4 flex items-center gap-3 hover:bg-accent/30 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold relative">
                   {id === 1 ? "AM" : id === 2 ? "PS" : "RG"}
                   <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-card" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{id === 1 ? "Aman Gupta" : id === 2 ? "Priya Sharma" : "Rohan Gupta"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">Sent a check-in proof for critique.</p>
                </div>
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            ))}
            <button className="w-full py-3 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium">View Inbox</button>
          </div>
        </motion.div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedUpload && (
          <>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUpload(null)} className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100]" />
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-card border border-border shadow-2xl z-[101] rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center font-bold text-sm">
                      {selectedUpload.studentName.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="font-display font-bold">{selectedUpload.studentName}</h3>
                      <p className="text-xs text-muted-foreground">Submission for {selectedUpload.taskName}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUpload(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Media Placeholder */}
                  <div className="aspect-video bg-muted rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
                     <Play className="h-12 w-12 text-foreground/20 group-hover:text-foreground/40 transition-all group-hover:scale-110 z-10" />
                     <p className="text-[10px] font-bold text-muted-foreground tracking-widest mt-4 z-10">STUDENT_VIDEO.MP4</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest px-1">Feedback Note</label>
                    <textarea placeholder="Great form, focus more on slow eccentric phase next time..." className="w-full bg-muted/30 border border-border rounded-2xl p-4 text-xs focus:outline-none min-h-[100px]" />
                  </div>

                  <div className="flex gap-3">
                     <button
                        onClick={() => handleReview(selectedUpload.id, 'approved')}
                        disabled={reviewing}
                        className="flex-1 bg-foreground text-background py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-foreground/90 disabled:opacity-50"
                      >
                       {reviewing ? <Clock className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Approve Submission</>}
                     </button>
                     <button
                        onClick={() => handleReview(selectedUpload.id, 'rejected')}
                        disabled={reviewing}
                        className="px-6 border border-border py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-accent/40 disabled:opacity-50"
                      >
                       <AlertCircle className="h-4 w-4 text-destructive" /> Reject
                     </button>
                  </div>
                </div>
             </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
