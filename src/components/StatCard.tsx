import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";

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
      transition={LUXURY_TWEEN_MEDIUM}
      className="rounded-[24px] border border-white/8 bg-[#121212] p-6 flex flex-col gap-4 hover:border-white/15 transition-all group overflow-hidden relative shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
    >
      {/* Background icon watermark */}
      <div className="absolute -bottom-2 -right-2 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-0 group-hover:opacity-10">
        <Icon className="h-12 w-12 text-white" />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">{label}</span>
        <div className={`p-2 rounded-xl transition-colors ${accent ? "bg-[#C9F85A]/15 border border-[#C9F85A]/30" : "bg-white/5 border border-white/8"}`}>
          <Icon className={`h-4 w-4 ${accent ? "text-[#C9F85A]" : "text-white/50 group-hover:text-white"} transition-colors`} />
        </div>
      </div>
      <div>
        <p className={`text-3xl font-bold tracking-tight ${accent ? "text-[#C9F85A]" : "text-white"}`}>{value}</p>
        {sub && <p className="text-[10px] font-medium text-white/30 mt-1 uppercase tracking-tighter">{sub}</p>}
      </div>
    </motion.div>
  );
}
