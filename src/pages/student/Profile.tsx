import { motion } from "framer-motion";
import { Flame, Users, Award, Calendar, Grid3X3, Settings, Edit2, Share2, MapPin } from "lucide-react";
import ProgressRing from "@/components/ProgressRing";
import { useStore } from "@/hooks/useStore";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import SectionHeader from "@/components/SectionHeader";

const postColors = [
  "from-zinc-900 to-zinc-800",
  "from-stone-900 to-stone-800",
  "from-neutral-900 to-neutral-800",
  "from-slate-900 to-zinc-900",
  "from-zinc-900 to-neutral-900",
  "from-stone-900 to-zinc-900",
  "from-neutral-900 to-stone-900",
  "from-slate-900 to-stone-900",
  "from-zinc-900 to-slate-900",
];

const tabs = ["Posts", "Stats"];

export default function ProfilePage() {
  const { student: s, posts } = useStore();
  const [activeTab, setActiveTab] = useState("Posts");
  const userPosts = posts.filter((p) => p.userId === "s1");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center sm:items-start sm:text-left sm:flex-row gap-8">
        <div className="relative group">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-zinc-700 to-zinc-900 border-2 border-border flex items-center justify-center text-3xl font-display font-bold text-foreground rotate-[-3deg] group-hover:rotate-0 transition-transform shadow-2xl">
            {s.name.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-background border border-border rounded-2xl px-2.5 py-1 flex items-center gap-1 shadow-lg ring-4 ring-background">
            <Flame className="h-3 w-3 text-streak" />
            <span className="text-[10px] font-black text-streak">{s.streak}d</span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-4 mb-2">
              <h1 className="text-2xl font-display font-bold">{s.name}</h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-accent border border-border text-muted-foreground">Student</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground">
               <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {s.collegeId}</p>
               <p>@{s.name.toLowerCase().replace(" ", "")}</p>
            </div>
            <p className="mt-4 text-sm leading-relaxed max-w-sm text-secondary-foreground">
              Dedicated to becoming the best version of myself. <span className="text-foreground">Goal: {s.fitnessGoal}</span>. Currently on day {s.currentDay} of the After Hours program.
            </p>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-8 border-y sm:border-y-0 sm:border-none border-border py-4 sm:p-0">
             <div className="text-center sm:text-left">
               <p className="text-lg font-display font-bold">{userPosts.length || 9}</p>
               <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Posts</p>
             </div>
             <div className="text-center sm:text-left">
               <p className="text-lg font-display font-bold">{s.followers}</p>
               <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Followers</p>
             </div>
             <div className="text-center sm:text-left">
               <p className="text-lg font-display font-bold">{s.following}</p>
               <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Following</p>
             </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
            <Link to="/student/settings" className="px-6 py-2.5 rounded-2xl bg-foreground text-background text-sm font-bold hover:scale-105 active:scale-95 transition-all">Edit Profile</Link>
            <button onClick={() => toast.success("Profile link copied to clipboard!")} className="p-2.5 rounded-2xl bg-accent hover:bg-accent/80 transition-colors"><Share2 className="h-4 w-4" /></button>
          </div>
        </div>
      </motion.div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-3 gap-3">
         <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-card p-5 text-center flex flex-col items-center group">
            <div className="w-10 h-10 rounded-2xl bg-streak/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <Flame className="h-5 w-5 text-streak" />
            </div>
            <p className="text-lg font-display font-bold">{s.streak}</p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Day Streak</p>
         </motion.div>
         <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="glass-card p-5 text-center flex flex-col items-center group">
            <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <Calendar className="h-5 w-5 text-foreground" />
            </div>
            <p className="text-lg font-display font-bold">{s.currentDay}</p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Days Completed</p>
         </motion.div>
         <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="glass-card p-5 text-center flex flex-col items-center group">
            <ProgressRing percentage={s.completionPercentage} size={42} strokeWidth={4} />
            <p className="text-lg font-display font-bold mt-2">{s.completionPercentage}%</p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Completion</p>
         </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/20 border border-border rounded-2xl">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === t ? "bg-accent shadow-sm text-foreground":"text-muted-foreground hover:text-foreground"}`}>{t}</button>
        ))}
      </div>

      {activeTab === "Posts" ? (
        <div className="grid grid-cols-3 gap-1.5 animate-in fade-in duration-500">
           {Array.from({ length: 9 }).map((_, i) => (
             <div key={i} className={`aspect-square rounded-xl bg-gradient-to-br ${postColors[i % postColors.length]} flex items-center justify-center relative group cursor-pointer overflow-hidden`}>
                <span className="text-muted-foreground/10 text-2xl font-display font-black group-hover:scale-125 transition-transform">TAH</span>
                <div className="absolute inset-0 bg-background/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> <span className="text-xs font-bold">{47 + i}</span></div>
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
          <div className="glass-card p-6 space-y-6">
             <SectionHeader title="Workout Stats" />
             <div className="space-y-4">
                {[
                  { label: "Plans Finished", value: "2" },
                  { label: "Height", value: `${s.height} cm` },
                  { label: "Weight", value: `${s.weight} kg` },
                  { label: "Preferred Activity", value: "Morning Grind" },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                    <p className="text-sm font-bold">{stat.value}</p>
                  </div>
                ))}
             </div>
          </div>
          <div className="glass-card p-6">
             <SectionHeader title="Coach Recommendations" />
             <div className="bg-accent/30 p-4 rounded-2xl border border-border italic text-sm text-secondary-foreground">
               "Focus on increasing your protein intake by 20g next week. Your strength is progressing well, especially on the compound lifts."
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
