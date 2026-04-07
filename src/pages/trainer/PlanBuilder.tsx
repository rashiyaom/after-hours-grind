import { motion } from "framer-motion";
import { Plus, Trash2, Dumbbell, Utensils, Target, FileText, Users, ChevronRight, Zap, Shield, Activity } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import SectionHeader from "@/components/SectionHeader";
import { useStore } from "@/hooks/useStore";

export default function PlanBuilder() {
  const [days, setDays] = useState([1]);
  const [publishing, setPublishing] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [cycleDuration, setCycleDuration] = useState(28);
  const [primaryObjective, setPrimaryObjective] = useState("Power Output Maximization");
  const [athleticTier, setAthleticTier] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const { students, createPlan } = useStore();

  const toggleStudent = (studentId: string, checked: boolean) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(studentId);
      else next.delete(studentId);
      return next;
    });
  };

  const handlePublish = () => {
    if (!planTitle.trim()) {
      toast.error("Protocol title required for deployment");
      return;
    }
    if (selectedStudentIds.size === 0) {
      toast.error("Select at least one athlete for deployment");
      return;
    }
    setPublishing(true);
    setTimeout(() => {
      createPlan({
        title: planTitle.trim(),
        duration: Math.max(1, cycleDuration),
        goalType: primaryObjective,
        difficulty: athleticTier,
        studentIds: Array.from(selectedStudentIds),
      });
      setPublishing(false);
      toast.success(`Protocol assigned to ${selectedStudentIds.size} athlete${selectedStudentIds.size > 1 ? "s" : ""}!`);
    }, 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-4xl font-display font-black text-foreground tracking-tighter uppercase italic">Protocol Builder</h1>
           <p className="text-[10px] font-black tracking-[0.4em] text-neon-orange uppercase mt-2 flex items-center gap-2">
             <Zap className="h-3 w-3 fill-neon-orange" /> Authorized Content Distribution Module
           </p>
        </div>
        <div className="flex items-center gap-3 bg-accent/20 px-5 py-3 rounded-2xl border border-white/5 backdrop-blur-md">
           <Shield className="h-4 w-4 text-neon-blue" />
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status: Secure Pipeline</p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Plan Meta */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card-hover p-8 space-y-8 relative overflow-hidden border-l-4 border-l-neon-blue">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <FileText className="h-24 w-24 text-neon-blue" />
            </div>
            <SectionHeader title="Protocol Specifications" subtitle="Core parameters for the training cycle" />
            
            <div className="grid sm:grid-cols-2 gap-8 pt-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Protocol Identifier</label>
                <input 
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="e.g., HYPERTROPHY_DELTA_2.0" 
                  className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-neon-blue/50 transition-all font-mono" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Cycle Duration (Days)</label>
                <div className="relative group">
                  <input
                    type="number"
                    min={1}
                    value={cycleDuration}
                    onChange={(e) => setCycleDuration(Number(e.target.value) || 1)}
                    className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-foreground focus:outline-none focus:border-neon-blue/50 transition-all font-mono"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-neon-blue/40 group-hover:text-neon-blue transition-colors">DAYS</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Primary Objective</label>
                <select
                  value={primaryObjective}
                  onChange={(e) => setPrimaryObjective(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-foreground focus:outline-none focus:border-neon-blue/50 transition-all cursor-pointer"
                >
                  <option>Power Output Maximization</option>
                  <option>Metabolic Optimization</option>
                  <option>Endurance Threshold</option>
                  <option>Hypertrophy Focus</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Athletic Tier</label>
                <select
                  value={athleticTier}
                  onChange={(e) => setAthleticTier(e.target.value as "beginner" | "intermediate" | "advanced")}
                  className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-foreground focus:outline-none focus:border-neon-blue/50 transition-all cursor-pointer"
                >
                  <option value="beginner">Initial Recruit (Beginner)</option>
                  <option value="intermediate">Field Operative (Intermediate)</option>
                  <option value="advanced">Elite Specialist (Advanced)</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Daily Plans */}
          <div className="space-y-6">
            {days.map((day, i) => (
              <motion.div key={day} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card-hover p-8 space-y-6 relative group border-t-4 border-t-neon-orange">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-display font-black text-foreground tracking-tight italic uppercase">Day 0{day} Matrix</h3>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Operational Directive</p>
                  </div>
                  {days.length > 1 && (
                    <button onClick={() => setDays(d => d.filter(x => x !== day))} className="p-3 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 border border-transparent hover:border-red-500/20 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-6 pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-neon-orange/10 border border-neon-orange/20">
                         <Dumbbell className="h-4 w-4 text-neon-orange" />
                      </div>
                      <label className="text-[10px] font-black text-foreground uppercase tracking-widest">Physical Training Protocols</label>
                    </div>
                    <textarea placeholder="e.g., [4x12] COMPOUND_PRESS_A&#10;[3x15] TARGET_ISO_ISOLATION..." rows={4} className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-neon-orange/50 transition-all font-mono resize-none leading-relaxed" />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-neon-blue/10 border border-neon-blue/20">
                           <Utensils className="h-4 w-4 text-neon-blue" />
                        </div>
                        <label className="text-[10px] font-black text-foreground uppercase tracking-widest">Fueling Strategy</label>
                      </div>
                      <textarea placeholder="e.g., PROTEIN_LOADING_PHASE..." rows={2} className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-neon-blue/50 transition-all font-mono resize-none" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-neon-green/10 border border-neon-green/20">
                           <Target className="h-4 w-4 text-neon-green" />
                        </div>
                        <label className="text-[10px] font-black text-foreground uppercase tracking-widest">Operational Goal</label>
                      </div>
                      <textarea placeholder="e.g., 15k STEP_COUNT_KPI..." rows={2} className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-neon-green/50 transition-all font-mono resize-none" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <button onClick={() => setDays(d => [...d, d.length + 1])} className="w-full group flex items-center justify-center gap-4 p-8 rounded-[2rem] border-2 border-dashed border-white/5 text-muted-foreground hover:text-neon-orange hover:border-neon-orange/20 hover:bg-neon-orange/5 transition-all font-black uppercase tracking-[0.3em] text-[10px]">
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90 duration-500" /> Initialize Next Sequence
          </button>
        </div>

        <div className="lg:col-span-4 space-y-8">
           {/* Assign Students */}
           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card-hover p-8 border-t-4 border-t-neon-blue sticky top-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-neon-blue/10 border border-neon-blue/20">
                   <Users className="h-5 w-5 text-neon-blue" />
                </div>
                <div>
                   <h3 className="text-xl font-display font-black text-foreground tracking-tight uppercase italic">Target Units</h3>
                   <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">Deployment List</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {students.map((student) => (
                  <label key={student.userId} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/30 border border-white/5 cursor-pointer hover:bg-neon-blue/10 hover:border-neon-blue/20 transition-all group">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-[10px] font-black text-muted-foreground group-hover:text-neon-blue transition-colors">
                          {student.name.split(" ").map(n => n[0]).join("")}
                       </div>
                       <div>
                          <p className="text-xs font-black text-foreground group-hover:ml-1 transition-all">{student.name}</p>
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">ID: {student.userId.toUpperCase()}</p>
                       </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.has(student.userId)}
                      onChange={(e) => toggleStudent(student.userId, e.target.checked)}
                      className="w-5 h-5 rounded-lg bg-zinc-900 border-white/10 text-neon-blue focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-10 pt-10 border-t border-white/5 space-y-6">
                <div className="flex items-center justify-between px-2">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Global Sync</p>
                   <div className="h-2 w-2 rounded-full bg-neon-green animate-pulse shadow-[0_0_8px_rgba(0,255,170,0.5)]" />
                </div>
                
                <button 
                  onClick={handlePublish}
                  disabled={publishing}
                  className="w-full relative overflow-hidden group/btn bg-foreground text-background py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-orange to-neon-blue opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {publishing ? (
                      <>Deploying Protocol...</>
                    ) : (
                      <>Deploy Directive <ChevronRight className="h-4 w-4" /></>
                    )}
                  </span>
                </button>
              </div>
           </motion.div>
        </div>
      </div>
    </div>
  );
}
