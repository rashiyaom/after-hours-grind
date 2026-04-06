import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, icon: Icon, sub, accent }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-xl ${accent ? "bg-streak/10" : "bg-accent"}`}>
          <Icon className={`h-4 w-4 ${accent ? "text-streak" : "text-muted-foreground"}`} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}
