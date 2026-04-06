import { WeeklyData } from "@/types";

export default function WeeklyChart({ data }: { data: WeeklyData[] }) {
  return (
    <div className="flex items-end justify-between gap-2 h-32">
      {data.map((d) => {
        const pct = (d.completed / d.total) * 100;
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full bg-muted rounded-full relative" style={{ height: "80px" }}>
              <div
                className="absolute bottom-0 left-0 right-0 rounded-full bg-foreground/80 transition-all duration-700"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}
