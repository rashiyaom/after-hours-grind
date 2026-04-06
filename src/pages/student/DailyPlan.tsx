import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Flame, Dumbbell, Utensils, Footprints, Droplets,
  MessageSquare, Upload, ChevronRight, ChevronLeft, ChevronRight as ChevRight,
  Play, Info, ListChecks, Clock, LayoutGrid, X
} from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { currentStudent } from "@/data/mockData";
import { useStore } from "@/hooks/useStore";
import { todayTask } from "@/data/mockData";
import { Link } from "react-router-dom";
import { toast } from "sonner";

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
  const { student: s, completeTask } = useStore();
  const [selectedDay, setSelectedDay] = useState(s.currentDay);
  const [workouts, setWorkouts] = useState(todayTask.workout);
  const [meals, setMeals] = useState(todayTask.diet);
  const [selectedExercise, setSelectedExercise] = useState<typeof todayTask.workout[0] | null>(null);

  const toggleWorkout = (id: string) => {
    setWorkouts((w) => w.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x)));
    if(!workouts.find(w => w.id === id)?.completed) {
      toast.success("Exercise completed! Keep it up.");
    }
  };

  const toggleMeal = (id: string) => {
    setMeals((m) => m.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x)));
    if(!meals.find(m => m.id === id)?.completed) {
      toast.success("Meal logged. Stay consistent.");
    }
  };

  const totalTasks = workouts.length + meals.length + 2;
  const completedTasks =
    workouts.filter((w) => w.completed).length + meals.filter((m) => m.completed).length;
  const pct = Math.round((completedTasks / totalTasks) * 100);

  const dayType = dayTypes[(selectedDay - 1) % 7];
  const isToday = selectedDay === s.currentDay;
  const isPast = selectedDay < s.currentDay;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Exercise Detail Overlay */}
      <AnimatePresence>
        {selectedExercise && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedExercise(null)} className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border shadow-2xl z-[101] rounded-3xl overflow-hidden">
               <div className="aspect-video bg-muted relative flex items-center justify-center group">
                 <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
                 <Play className="h-10 w-10 text-foreground/40 group-hover:scale-110 transition-all z-10" />
                 <X onClick={() => setSelectedExercise(null)} className="absolute top-4 right-4 h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer z-20" />
               </div>
               <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-display font-bold text-foreground">{selectedExercise.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Focus on full range of motion</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-accent/40 p-3 rounded-2xl text-center">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1">Sets</p>
                      <p className="text-sm font-bold">{selectedExercise.sets}</p>
                    </div>
                    <div className="bg-accent/40 p-3 rounded-2xl text-center">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1">Reps</p>
                      <p className="text-sm font-bold">{selectedExercise.reps}</p>
                    </div>
                    <div className="bg-accent/40 p-3 rounded-2xl text-center">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1">Rest</p>
                      <p className="text-sm font-bold">{selectedExercise.rest}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Coach's Instruction</p>
                    <p className="text-sm text-secondary-foreground leading-relaxed italic">"Keep your core tight throughout the movement. Don't rush the descent—3 seconds per rep for maximum hyperthrophy."</p>
                  </div>
                  <button onClick={() => { setSelectedExercise(null); toggleWorkout(selectedExercise.id); }} className="w-full bg-foreground text-background py-3.5 rounded-2xl font-bold text-sm hover:translate-y-[-2px] transition-all">
                    Complete Set
                  </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-streak/10">
            <Flame className="h-3.5 w-3.5 text-streak" />
            <span className="text-xs font-medium text-streak">{s.streak} day streak</span>
          </div>
          {isToday && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-foreground text-background font-medium">Today</span>
          )}
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Day {selectedDay} of {s.totalDays}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{dayType}</p>
      </motion.div>

      {/* 28-Day Timeline */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Workout Timeline</p>
          <div className="flex gap-1">
            <button onClick={() => setSelectedDay((d) => Math.max(1, d - 7))} disabled={selectedDay <= 7} className="p-2 rounded-xl hover:bg-accent transition-colors disabled:opacity-20"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setSelectedDay((d) => Math.min(s.totalDays, d + 7))} disabled={selectedDay > s.totalDays - 7} className="p-2 rounded-xl hover:bg-accent transition-colors disabled:opacity-20"><ChevRight className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: s.totalDays }, (_, i) => {
            const day = i + 1;
            const isSelected = day === selectedDay;
            const isDone = day < s.currentDay;
            const isTodayDay = day === s.currentDay;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  isSelected ? "bg-foreground text-background scale-110 shadow-lg" :
                  isTodayDay ? "border-2 border-streak/50 text-streak bg-streak/5" :
                  isDone ? "bg-accent/40 text-muted-foreground" : "bg-muted/20 text-muted-foreground/30"
                }`}
              >
                {isDone && !isSelected ? <Check className="h-3 w-3" /> : day}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Main Grid: Workout & Diet */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Workout Section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2.5 rounded-2xl bg-accent/60 outline outline-4 outline-accent/10"><Dumbbell className="h-5 w-5" /></div>
               <div>
                  <h2 className="font-display font-bold">Workout</h2>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{workouts.filter(w=>w.completed).length}/{workouts.length} Done</p>
               </div>
             </div>
             <Info className="h-4 w-4 text-muted-foreground opacity-40" />
          </div>
          <div className="space-y-2">
            {workouts.map((w) => (
              <div key={w.id} className="flex items-center gap-3 group">
                <button
                  onClick={() => isToday && toggleWorkout(w.id)}
                  className={`flex-1 flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${
                    w.completed ? "bg-accent/20 opacity-50" : "bg-accent/40 hover:bg-accent/60"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${w.completed ? "bg-foreground border-foreground":"border-border"}`}>
                    {w.completed && <Check className="h-3 w-3 text-background" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${w.completed ? "line-through text-muted-foreground":""}`}>{w.name}</p>
                    <p className="text-[10px] text-muted-foreground">{w.sets} sets · {w.reps} reps</p>
                  </div>
                </button>
                <button onClick={() => setSelectedExercise(w)} className="p-2.5 rounded-xl bg-accent opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground text-muted-foreground">
                  <Play className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Diet Section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-accent/60 outline outline-4 outline-accent/10"><Utensils className="h-5 w-5" /></div>
              <div>
                <h2 className="font-display font-bold">Today's Meals</h2>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Calories tracked</p>
              </div>
          </div>
          <div className="space-y-2">
            {meals.map((m) => (
              <button
                key={m.id}
                onClick={() => isToday && toggleMeal(m.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${
                  m.completed ? "bg-accent/20 opacity-50" : "bg-accent/40 hover:bg-accent/60"
                }`}
              >
                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${m.completed ? "bg-foreground border-foreground":"border-border"}`}>
                  {m.completed && <Check className="h-3 w-3 text-background" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${m.completed ? "line-through text-muted-foreground":""}`}>{m.meal}</p>
                  <p className="text-[10px] text-muted-foreground">{m.time} · {m.calories} kcal</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 relative overflow-hidden">
           <Footprints className="h-10 w-10 text-foreground/5 absolute -bottom-2 -right-2 rotate-12" />
           <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-4">Daily Steps</p>
           <p className="text-3xl font-display font-bold">{s.todaySteps.toLocaleString()}</p>
           <p className="text-xs text-muted-foreground mt-1">Target: {todayTask.stepTarget.toLocaleString()}</p>
           <div className="h-1.5 bg-muted rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-foreground w-3/4 rounded-full" />
           </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-6 relative overflow-hidden">
           <Droplets className="h-10 w-10 text-foreground/5 absolute -bottom-2 -right-2 rotate-12" />
           <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-4">Hydration</p>
           <p className="text-3xl font-display font-bold">2.4L</p>
           <p className="text-xs text-muted-foreground mt-1">Goal: {todayTask.hydrationGoal}</p>
           <div className="h-1.5 bg-muted rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-foreground w-[65%] rounded-full" />
           </div>
        </motion.div>
      </div>

      {/* Upload Check-in Call to Action */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-8 text-center bg-gradient-to-t from-accent/20 to-transparent border-t-0">
         <div className="w-16 h-16 rounded-3xl bg-accent flex items-center justify-center mx-auto mb-4 border border-border shadow-xl">
           <Upload className="h-6 w-6 text-foreground" />
         </div>
         <h2 className="text-xl font-display font-bold">Ready to check-in?</h2>
         <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Upload your workout video or meal photo to maintain your streak and get feedback from Coach Vikram.</p>
         <Link to="/student/upload" className="mt-6 inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-2xl font-bold tracking-tight hover:scale-105 active:scale-95 transition-all">
            Upload Progress
         </Link>
      </motion.div>
    </div>
  );
}
