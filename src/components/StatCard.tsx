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
      className="glass-card p-6 flex flex-col gap-4 border border-border/50 hover:border-neon-orange/20 transition-all group overflow-hidden relative"
    >
      <div className="absolute -bottom-2 -right-2 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-0">
        <Icon className="h-12 w-12 text-foreground" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
        <div className={`p-2 rounded-xl transition-colors ${accent ? "bg-neon-orange/10 text-neon-orange" : "bg-accent/40 text-muted-foreground group-hover:text-foreground"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-display font-bold text-foreground tracking-tight">{value}</p>
        {sub && <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-tighter">{sub}</p>}
      </div>
    </motion.div>
  );
}
