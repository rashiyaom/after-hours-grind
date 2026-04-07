import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Flame, Dumbbell, Utensils, Footprints, Droplets,
  MessageSquare, Upload, ChevronRight, ChevronLeft, ChevronRight as ChevRight,
  Play, Info, ListChecks, Clock, LayoutGrid, X, Search, Activity, Zap
} from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { useCurrentUser, usePermissions, useStore } from "@/hooks/useStore";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { LUXURY_TWEEN_MEDIUM, LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";

const dayTypes = [
  "Push Day — Chest & Triceps",
  "Pull Day — Back & Biceps",
  "Legs Day — Quads & Hamstrings",
  "Rest & Recovery",
  "Push Day — Shoulders",
  "Pull Day — Back",
  "Cardio & Core",
];

export default function DailyPlanPage() {
  const { student: s, getDayTask, completeTask, canStartCurrentPlan, currentStudentPlan } = useStore();
  const currentUser = useCurrentUser();
  const permissions = usePermissions();
  const canPostFeed = Boolean(currentUser && permissions[currentUser.role].post_feed);
  const [selectedDay, setSelectedDay] = useState(s.currentDay);
  const todayTask = getDayTask(selectedDay);
  const [selectedExercise, setSelectedExercise] = useState<typeof todayTask.workout[0] | null>(null);

  const workouts = todayTask.workout;
  const meals = todayTask.diet;

  const toggleWorkout = (id: string) => {
    if(!workouts.find(w => w.id === id)?.completed) {
      completeTask('workout', id, selectedDay);
      toast.success("Workout logged.");
    }
  };

  const toggleMeal = (id: string) => {
    if(!meals.find(m => m.id === id)?.completed) {
      completeTask('diet', id, selectedDay);
      toast.success("Meal logged.");
    }
  };

  const totalTasks = workouts.length + meals.length;
  const completedTasks =
    workouts.filter((w) => w.completed).length + meals.filter((m) => m.completed).length;
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const dayType = dayTypes[(selectedDay - 1) % 7];
  const isToday = selectedDay === s.currentDay;
  const isPast = selectedDay < s.currentDay;

  if (!canStartCurrentPlan) {
    return (
      <div className="p-6 sm:p-8 lg:p-12 max-w-3xl mx-auto space-y-6">
        <div className="bg-card border border-white/10 rounded-3xl p-8 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Plan Access</p>
          <h1 className="text-3xl font-display font-semibold text-foreground tracking-tight">Waiting for trainer approval</h1>
          <p className="text-sm text-muted-foreground">
            Your auto-generated plan status is <span className="text-foreground font-semibold">{currentStudentPlan?.status}</span>. You cannot start daily tasks until the plan becomes active.
          </p>
          <Link to="/student/plan-status" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-black">
            View plan status
            <ChevRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 lg:p-12 max-w-4xl mx-auto space-y-12">
      {/* Exercise Detail Overlay */}
      <AnimatePresence>
        {selectedExercise && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[100]">
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               onClick={() => setSelectedExercise(null)} 
               className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }} 
               animate={{ opacity: 1, scale: 1, y: 0 }} 
               exit={{ opacity: 0, scale: 0.95, y: 20 }} 
               className="w-full max-w-xl bg-card border border-white/10 shadow-2xl relative rounded-[2.5rem] overflow-hidden max-h-[90vh] flex flex-col"
            >
               <div className="aspect-video bg-muted relative flex items-center justify-center group flex-shrink-0">
                 <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black" />
                 <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                 <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:scale-110 transition-all z-10">
                    <Play className="h-6 w-6 text-primary fill-primary/20" />
                 </div>
                 <button onClick={() => setSelectedExercise(null)} className="absolute top-6 right-6 p-2 rounded-xl bg-black/40 text-muted-foreground hover:text-white transition-all z-20">
                    <X className="h-5 w-5" />
                 </button>
               </div>
               <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                  <div>
                    <h3 className="text-2xl font-display font-semibold text-foreground tracking-tight">{selectedExercise.name}</h3>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-2">
                       <Zap className="h-4 w-4 text-primary" /> Primary Goal: Hypertrophy
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-background border border-white/5 p-4 rounded-2xl text-center">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Sets</p>
                      <p className="text-lg font-semibold text-foreground">{selectedExercise.sets}</p>
                    </div>
                    <div className="bg-background border border-white/5 p-4 rounded-2xl text-center">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Reps</p>
                      <p className="text-lg font-semibold text-foreground">{selectedExercise.reps}</p>
                    </div>
                    <div className="bg-background border border-white/5 p-4 rounded-2xl text-center">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Rest</p>
                      <p className="text-lg font-semibold text-foreground">{selectedExercise.rest}</p>
                    </div>
                  </div>
                  <div className="space-y-3 bg-card p-6 rounded-2xl border border-white/5">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                       <Info className="h-4 w-4" /> Coach Notes
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">"Focus on the eccentric phase. Control the weight for 3 seconds on the way down. Keep your intensity high."</p>
                  </div>
                  <button onClick={() => { setSelectedExercise(null); toggleWorkout(selectedExercise.id); }} className="w-full bg-primary text-black py-4 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-95">
                    Complete Set
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Flame className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary">{s.streak} Day Streak</span>
            </div>
            {isToday && (
              <span className="text-xs px-2.5 py-1 rounded-md bg-foreground text-background font-bold uppercase tracking-wider">Today</span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Current Plan</p>
            <h1 className="text-4xl font-display font-semibold text-foreground tracking-tight">
              Day {selectedDay} <span className="text-muted-foreground text-2xl font-bold">/ {s.totalDays}</span>
            </h1>
          </div>
        </div>
        <div className="text-left md:text-right">
           <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Focus</p>
           <p className="text-lg font-semibold text-foreground tracking-tight">{dayType}</p>
        </div>
      </motion.div>

      {/* 28-Day Timeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.1 }} className="bg-card border border-white/5 p-6 sm:p-8 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 flex gap-2">
           <button onClick={() => setSelectedDay((d) => Math.max(1, d - 7))} disabled={selectedDay <= 7} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all disabled:opacity-30"><ChevronLeft className="h-5 w-5" /></button>
           <button onClick={() => setSelectedDay((d) => Math.min(s.totalDays, d + 7))} disabled={selectedDay > s.totalDays - 7} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all disabled:opacity-30"><ChevronRight className="h-5 w-5" /></button>
        </div>
        <div className="mb-6">
           <p className="text-sm font-semibold text-foreground">Timeline</p>
        </div>
        <div className="grid grid-cols-7 sm:grid-cols-14 gap-3">
          {Array.from({ length: s.totalDays }, (_, i) => {
            const day = i + 1;
            const isSelected = day === selectedDay;
            const isDone = day < s.currentDay;
            const isTodayDay = day === s.currentDay;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative border ${
                  isSelected ? "bg-primary border-primary text-black translate-y-[-2px] shadow-sm" :
                  isTodayDay ? "bg-primary/10 border-primary/30 text-primary" :
                  isDone ? "bg-card border-white/5 text-muted-foreground opacity-70" : "bg-transparent border-white/5 text-muted-foreground/30 hover:border-white/10"
                }`}
              >
                <span className="text-xs font-semibold">{day}</span>
                {isDone && !isSelected && <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Main Grid: Workout & Diet */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Workout Section */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.2 }} className="bg-card border border-white/5 p-6 sm:p-8 rounded-3xl space-y-6 relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
             <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Dumbbell className="h-5 w-5 text-primary" />
             </div>
             <div>
                <h2 className="text-lg font-display font-semibold text-foreground tracking-tight">Workout Plan</h2>
                <p className="text-xs font-medium text-muted-foreground mt-1">{workouts.filter(w=>w.completed).length} / {workouts.length} acts done</p>
             </div>
          </div>
          <div className="space-y-3 relative z-10">
            {workouts.map((w) => (
              <div key={w.id} className="group">
                <div
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                    w.completed ? "bg-primary/5 border-primary/20" : "bg-background border-white/5 hover:border-white/10"
                  }`}
                >
                  <button
                    onClick={() => isToday && toggleWorkout(w.id)}
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${w.completed ? "bg-primary border-primary":"border-white/10 group-hover:border-primary/50"}`}
                  >
                    {w.completed && <Check className="h-4 w-4 text-black" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold tracking-tight ${w.completed ? "text-foreground opacity-80":""}`}>{w.name}</p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">{w.sets} Sets × {w.reps} Reps</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{w.focus}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {w.equipmentMode.replace(/_/g, " ")}
                      </span>
                      {w.alternatives.slice(0, 2).map((alt) => (
                        <span key={alt} className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                          Alt: {alt}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setSelectedExercise(w)} className="p-2.5 rounded-xl bg-white/5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100">
                    <Play className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Diet Section */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.3 }} className="bg-card border border-white/5 p-6 sm:p-8 rounded-3xl space-y-6 relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
             <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Utensils className="h-5 w-5 text-emerald-500" />
             </div>
             <div>
                <h2 className="text-lg font-display font-semibold text-foreground tracking-tight">Nutrition Plan</h2>
                <p className="text-xs font-medium text-muted-foreground mt-1">{meals.filter(m=>m.completed).length} / {meals.length} meals logged</p>
             </div>
          </div>
          <div className="space-y-3 relative z-10">
            {meals.map((m) => (
              <button
                key={m.id}
                onClick={() => isToday && toggleMeal(m.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border text-left group ${
                  m.completed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-background border-white/5 hover:border-white/10"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${m.completed ? "bg-emerald-500 border-emerald-500":"border-white/10 group-hover:border-emerald-500/50"}`}>
                  {m.completed && <Check className="h-4 w-4 text-black" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold tracking-tight ${m.completed ? "text-foreground opacity-80":""}`}>{m.meal}</p>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">{m.time} · {m.calories} kcal</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{m.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.foods.map((f) => (
                      <span key={`${m.id}-${f.item}`} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                        {f.item}: {f.grams}g
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-[10px] text-muted-foreground">
                    Protein {m.macros.protein}g · Carbs {m.macros.carbs}g · Fats {m.macros.fats}g
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.4 }} className="bg-card border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
           <p className="text-xs font-semibold text-muted-foreground mb-4 relative z-10">Steps</p>
           <p className="text-4xl font-display font-semibold text-foreground mb-2 relative z-10 tracking-tight">{s.todaySteps.toLocaleString()}</p>
           <p className="text-xs font-medium text-muted-foreground relative z-10 flex items-center gap-2">
              <Activity className="h-3 w-3 text-primary" /> Target: {todayTask.stepTarget.toLocaleString()}
           </p>
           <div className="h-1.5 bg-background rounded-full mt-6 overflow-hidden relative z-10 border border-white/5">
              <motion.div initial={{ width: 0 }} animate={{ width: "75%" }} transition={LUXURY_TWEEN_SLOW} className="h-full bg-primary rounded-full" />
           </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.5 }} className="bg-card border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
           <p className="text-xs font-semibold text-muted-foreground mb-4 relative z-10">Hydration</p>
           <p className="text-4xl font-display font-semibold text-foreground mb-2 relative z-10 tracking-tight">2.4L</p>
           <p className="text-xs font-medium text-muted-foreground relative z-10 flex items-center gap-2">
              <Droplets className="h-3 w-3 text-sky-400" /> Goal: {todayTask.hydrationGoal}
           </p>
           <div className="h-1.5 bg-background rounded-full mt-6 overflow-hidden relative z-10 border border-white/5">
              <motion.div initial={{ width: 0 }} animate={{ width: "65%" }} transition={LUXURY_TWEEN_SLOW} className="h-full bg-sky-400 rounded-full" />
           </div>
        </motion.div>
      </div>

      {/* Upload Check-in CTA */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.6 }} className="bg-card border border-white/5 p-12 rounded-3xl text-center relative overflow-hidden group">
         <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-background border border-white/5 flex items-center justify-center mx-auto mb-6 transition-all duration-500">
              <Upload className="h-6 w-6 text-foreground" />
            </div>
            <h2 className="text-3xl font-display font-semibold tracking-tight">Daily Check-In</h2>
            <p className="text-sm font-medium mt-3 text-muted-foreground max-w-sm mx-auto">Submit your daily progress and photos for your trainer to review.</p>
          {canPostFeed && (
            <Link to="/student/upload" className="mt-8 inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-xl font-semibold text-sm transition-all hover:bg-primary hover:text-black">
              <Upload className="h-4 w-4" /> Submit Check-in
            </Link>
          )}
         </div>
      </motion.div>
    </div>
  );
}
