import { Flame } from "lucide-react";
import { motion } from "framer-motion";

interface StreakCardProps {
  streak: number;
  label?: string;
}

export default function StreakCard({ streak, label = "Day Streak" }: StreakCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-5 flex items-center gap-4"
    >
      <div className="relative">
        <div className="p-3 rounded-2xl bg-streak/10">
          <Flame className="h-7 w-7 text-streak animate-pulse-glow" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-display font-bold text-foreground">{streak}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  );
}
