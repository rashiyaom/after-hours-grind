import { motion } from "framer-motion";
import { Plus, Trash2, Dumbbell, Utensils, Target, FileText, Users } from "lucide-react";
import { useState } from "react";

export default function PlanBuilder() {
  const [days, setDays] = useState([1]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Plan Builder</h1>
        <p className="text-sm text-muted-foreground mt-1">Create a custom fitness plan for your students</p>
      </motion.div>

      {/* Plan Meta */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 space-y-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Plan Details</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Plan Title</label>
            <input placeholder="Advanced Hypertrophy 2.0" className="w-full mt-1.5 bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Duration (days)</label>
            <input type="number" defaultValue={28} className="w-full mt-1.5 bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Goal Type</label>
            <select className="w-full mt-1.5 bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option>Muscle Building</option>
              <option>Fat Loss</option>
              <option>Endurance</option>
              <option>General Fitness</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Difficulty</label>
            <select className="w-full mt-1.5 bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Daily Plans */}
      {days.map((day) => (
        <motion.div key={day} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground">Day {day}</h3>
            {days.length > 1 && (
              <button onClick={() => setDays(d => d.filter(x => x !== day))} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Workout</label>
              </div>
              <textarea placeholder="e.g., 4x10 Bench Press, 3x12 Incline DB Press..." rows={3} className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Utensils className="h-4 w-4 text-muted-foreground" />
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Diet</label>
              </div>
              <textarea placeholder="e.g., Breakfast: Oats + protein shake..." rows={3} className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Activity Target</label>
                </div>
                <input placeholder="e.g., 45 min workout + 20 min walk" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Notes</label>
                </div>
                <input placeholder="Focus on form today..." className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}

      <button onClick={() => setDays(d => [...d, d.length + 1])} className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all">
        <Plus className="h-4 w-4" /> Add Day
      </button>

      {/* Assign Students */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-display font-semibold text-foreground">Assign Students</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Arjun Mehta", "Priya Sharma", "Aman Gupta", "Neha Reddy"].map((name) => (
            <label key={name} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 cursor-pointer hover:bg-accent/50 transition-colors">
              <input type="checkbox" className="rounded" />
              <span className="text-sm text-foreground">{name}</span>
            </label>
          ))}
        </div>
      </div>

      <button className="w-full bg-foreground text-background py-3.5 rounded-xl font-medium text-sm hover:bg-foreground/90 transition-colors">
        Publish Plan
      </button>
    </div>
  );
}
