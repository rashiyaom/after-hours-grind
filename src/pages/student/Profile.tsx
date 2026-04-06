import { motion } from "framer-motion";
import { Flame, Users, Award, Calendar, Grid3X3 } from "lucide-react";
import ProgressRing from "@/components/ProgressRing";
import { currentStudent } from "@/data/mockData";

export default function ProfilePage() {
  const s = currentStudent;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center text-2xl font-display font-bold text-foreground">
          {s.name.split(" ").map(n => n[0]).join("")}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-xl font-display font-bold text-foreground">{s.name}</h1>
          <p className="text-sm text-muted-foreground">@{s.name.toLowerCase().replace(" ", "")} · {s.fitnessGoal}</p>
          <p className="text-xs text-muted-foreground mt-1">Trained by Coach Vikram</p>
          <div className="flex items-center justify-center sm:justify-start gap-6 mt-4">
            <div className="text-center"><p className="text-sm font-bold text-foreground">{s.followers}</p><p className="text-[10px] text-muted-foreground">Followers</p></div>
            <div className="text-center"><p className="text-sm font-bold text-foreground">{s.following}</p><p className="text-[10px] text-muted-foreground">Following</p></div>
            <div className="text-center"><p className="text-sm font-bold text-foreground">{s.totalPlansCompleted}</p><p className="text-[10px] text-muted-foreground">Plans Done</p></div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <Flame className="h-5 w-5 text-streak mx-auto mb-1" />
          <p className="text-lg font-display font-bold text-foreground">{s.streak}</p>
          <p className="text-[10px] text-muted-foreground">Day Streak</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Calendar className="h-5 w-5 text-foreground mx-auto mb-1" />
          <p className="text-lg font-display font-bold text-foreground">Day {s.currentDay}</p>
          <p className="text-[10px] text-muted-foreground">of {s.totalDays}</p>
        </div>
        <div className="glass-card p-4 flex flex-col items-center">
          <ProgressRing percentage={s.completionPercentage} size={52} strokeWidth={4} />
          <p className="text-[10px] text-muted-foreground mt-1">Completion</p>
        </div>
      </div>

      {/* Badges */}
      <div className="glass-card p-6">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2"><Award className="h-4 w-4" /> Achievements</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {s.badges.map((b) => (
            <div key={b.id} className={`flex flex-col items-center p-3 rounded-xl ${b.earned ? "bg-accent" : "bg-muted/20 opacity-30"}`}>
              <Award className={`h-5 w-5 mb-1 ${b.earned ? "text-foreground" : "text-muted-foreground"}`} />
              <span className="text-[8px] text-center text-muted-foreground leading-tight">{b.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-display font-semibold text-foreground">Posts</h3>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="aspect-square bg-muted/30 rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground/20 text-xs font-display">TAH</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
