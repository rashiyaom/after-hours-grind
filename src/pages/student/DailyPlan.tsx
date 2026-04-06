import { motion } from "framer-motion";
import { Check, Flame, Dumbbell, Utensils, Footprints, Droplets, MessageSquare, Upload, ChevronRight } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { currentStudent, todayTask } from "@/data/mockData";
import { useState } from "react";

export default function DailyPlanPage() {
  const s = currentStudent;
  const [workouts, setWorkouts] = useState(todayTask.workout);
  const [meals, setMeals] = useState(todayTask.diet);

  const toggleWorkout = (id: string) => setWorkouts(w => w.map(x => x.id === id ? { ...x, completed: !x.completed } : x));
  const toggleMeal = (id: string) => setMeals(m => m.map(x => x.id === id ? { ...x, completed: !x.completed } : x));

  const totalTasks = workouts.length + meals.length + 2; // +steps, +hydration
  const completedTasks = workouts.filter(w => w.completed).length + meals.filter(m => m.completed).length;
  const pct = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-streak/10">
            <Flame className="h-3.5 w-3.5 text-streak" />
            <span className="text-xs font-medium text-streak">{s.streak} day streak</span>
          </div>
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">Day {s.currentDay} of {s.totalDays}</h1>
        <p className="text-sm text-muted-foreground mt-1">Push Day — Chest & Triceps</p>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{completedTasks}/{totalTasks} tasks completed</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full bg-foreground rounded-full" />
          </div>
        </div>
      </motion.div>

      {/* Workout Section */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-accent">
            <Dumbbell className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-foreground">Workout Plan</h2>
            <p className="text-xs text-muted-foreground">{workouts.filter(w => w.completed).length}/{workouts.length} exercises done</p>
          </div>
        </div>
        <div className="space-y-3">
          {workouts.map((w) => (
            <button key={w.id} onClick={() => toggleWorkout(w.id)} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${w.completed ? "bg-muted/20" : "bg-muted/40 hover:bg-muted/60"}`}>
              <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${w.completed ? "bg-foreground border-foreground" : "border-border"}`}>
                {w.completed && <Check className="h-3 w-3 text-background" />}
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${w.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>{w.name}</p>
                <p className="text-[11px] text-muted-foreground">{w.sets} sets × {w.reps} · {w.rest} rest</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Diet Section */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-accent">
            <Utensils className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-foreground">Diet Plan</h2>
            <p className="text-xs text-muted-foreground">{meals.filter(m => m.completed).length}/{meals.length} meals logged</p>
          </div>
        </div>
        <div className="space-y-3">
          {meals.map((m) => (
            <button key={m.id} onClick={() => toggleMeal(m.id)} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${m.completed ? "bg-muted/20" : "bg-muted/40 hover:bg-muted/60"}`}>
              <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${m.completed ? "bg-foreground border-foreground" : "border-border"}`}>
                {m.completed && <Check className="h-3 w-3 text-background" />}
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${m.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>{m.meal}</p>
                <p className="text-[11px] text-muted-foreground">{m.description} · {m.calories} kcal · {m.time}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Activity & Steps */}
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <Footprints className="h-5 w-5 text-foreground" />
            <h3 className="font-display font-semibold text-foreground">Step Goal</h3>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">8,432</p>
          <p className="text-xs text-muted-foreground">/ {todayTask.stepTarget.toLocaleString()} steps</p>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-foreground rounded-full" style={{ width: "84%" }} />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <Droplets className="h-5 w-5 text-foreground" />
            <h3 className="font-display font-semibold text-foreground">Hydration</h3>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">2.5L</p>
          <p className="text-xs text-muted-foreground">/ {todayTask.hydrationGoal}</p>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-foreground rounded-full" style={{ width: "71%" }} />
          </div>
        </motion.div>
      </div>

      {/* Trainer Notes */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-3">
          <MessageSquare className="h-5 w-5 text-foreground" />
          <h3 className="font-display font-semibold text-foreground">Notes from Coach</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed italic">"{todayTask.trainerNotes}"</p>
      </motion.div>

      {/* Upload Proof */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-6 text-center">
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-display font-semibold text-foreground mb-1">Upload Proof</h3>
        <p className="text-xs text-muted-foreground mb-4">Take a photo or record a video of your workout</p>
        <button className="bg-foreground text-background px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-foreground/90 transition-colors">
          Upload Now
        </button>
      </motion.div>
    </div>
  );
}
