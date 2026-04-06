import { motion } from "framer-motion";
import { Users, ClipboardList, Eye, Trophy, Upload, Plus, Flame } from "lucide-react";
import StatCard from "@/components/StatCard";
import SectionHeader from "@/components/SectionHeader";
import { leaderboardData } from "@/data/mockData";
import { Link } from "react-router-dom";

const recentUploads = [
  { student: "Priya Sharma", type: "Workout Video", time: "2h ago", status: "pending" },
  { student: "Aman Gupta", type: "Meal Photo", time: "3h ago", status: "approved" },
  { student: "Rohit Patel", type: "Workout Video", time: "5h ago", status: "pending" },
  { student: "Neha Reddy", type: "Check-in Note", time: "6h ago", status: "approved" },
];

export default function TrainerDashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Coach Vikram</h1>
        </div>
        <Link to="/trainer/plan-builder" className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-foreground/90 transition-colors">
          <Plus className="h-4 w-4" /> New Plan
        </Link>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={24} icon={Users} />
        <StatCard label="Active Plans" value={18} icon={ClipboardList} />
        <StatCard label="Pending Reviews" value={6} icon={Eye} />
        <StatCard label="Avg Streak" value={11} icon={Flame} accent />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <div className="glass-card p-6">
          <SectionHeader title="Recent Student Uploads" subtitle="Review and approve" />
          <div className="space-y-3">
            {recentUploads.map((u, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent/30 transition-colors">
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-foreground">
                  {u.student.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{u.student}</p>
                  <p className="text-[11px] text-muted-foreground">{u.type} · {u.time}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.status === "pending" ? "bg-streak/10 text-streak" : "bg-muted text-muted-foreground"}`}>
                  {u.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="glass-card p-6">
          <SectionHeader title="Student Leaderboard" />
          <div className="space-y-2">
            {leaderboardData.slice(0, 6).map((e) => (
              <div key={e.rank} className="flex items-center gap-3 p-3 rounded-xl">
                <span className="text-xs font-medium text-muted-foreground w-6 text-center">#{e.rank}</span>
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-medium text-foreground">
                  {e.name.split(" ").map(n => n[0]).join("")}
                </div>
                <span className="text-sm text-foreground flex-1">{e.name}</span>
                <div className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-streak" />
                  <span className="text-xs text-muted-foreground">{e.streak}d</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
