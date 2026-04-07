import { WeeklyData } from "@/types";
import { motion } from "framer-motion";

export default function WeeklyChart({ data }: { data: WeeklyData[] }) {
  const maxPct = Math.max(...data.map((d) => (d.completed / d.total) * 100));

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2 h-32">
        {data.map((d, i) => {
          const pct = (d.completed / d.total) * 100;
          const isMax = pct === maxPct;
          return (
            <div key={`${d.day}-${i}`} className="flex-1 flex flex-col items-center gap-1.5 group">
              <span className="text-[9px] text-muted-foreground/0 group-hover:text-muted-foreground transition-colors">
                {Math.round(pct)}%
              </span>
              <div className="w-full bg-muted rounded-lg relative overflow-hidden" style={{ height: "80px" }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.07, ease: "easeOut" }}
                  className={`absolute bottom-0 left-0 right-0 rounded-lg transition-colors ${
                    isMax ? "bg-foreground" : "bg-foreground/50"
                  }`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.day}</span>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-1 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-foreground" />
          <span>Best day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-foreground/50" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-muted" />
          <span>Remaining</span>
        </div>
      </div>
    </div>
  );
}
