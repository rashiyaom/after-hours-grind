import { motion } from "framer-motion";
import { Flame, Users, Award, Calendar, Grid3X3, Settings, Edit2, Share2, MapPin, UserPlus, MessageCircle, Star } from "lucide-react";
import ProgressRing from "@/components/ProgressRing";
import { useStore } from "@/hooks/useStore";
import { useState, useMemo, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import SectionHeader from "@/components/SectionHeader";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { userId } = useParams();
  const { student: me, posts, students, loading, setLoading } = useStore();
  const [activeTab, setActiveTab] = useState("Posts");
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [userId, setLoading]);

  const isMe = !userId || userId === me.id;
  
  const s = useMemo(() => {
    if (isMe) return me;
    const found = students.find(l => l.userId === userId);
    return found ? {
      ...me,
      id: found.userId,
      name: found.name,
      streak: found.streak,
      rank: found.rank,
      completionPercentage: found.completionPercentage,
      followers: 124,
      following: 89,
    } : me;
  }, [userId, isMe, me]);

  const userPosts = posts.filter((p) => p.userId === s.id);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    if (!isFollowing) toast.success(`Started following ${s.name}`);
    else toast.info(`Unfollowed ${s.name}`);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left">
           <Skeleton className="w-28 h-28 rounded-3xl shrink-0" />
           <div className="flex-1 space-y-3 w-full">
             <Skeleton className="h-8 w-48 mx-auto sm:mx-0" />
             <Skeleton className="h-4 w-64 mx-auto sm:mx-0" />
             <Skeleton className="h-20 w-80 mx-auto sm:mx-0" />
             <div className="flex gap-4 justify-center sm:justify-start pt-2">
                <Skeleton className="h-10 w-32 rounded-2xl" />
                <Skeleton className="h-10 w-10 rounded-2xl" />
             </div>
           </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
           <Skeleton className="h-28 rounded-2xl" />
           <Skeleton className="h-28 rounded-2xl" />
           <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-1.5">
           {[1,2,3,4,5,6,7,8,9].map(i => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-8 pb-20">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center sm:items-start sm:text-left sm:flex-row gap-8">
        <div className="relative group perspective-1000">
          <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/5 flex items-center justify-center text-4xl font-display font-black text-foreground shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform-gpu transition-all duration-500 group-hover:rotate-y-12 group-hover:scale-105 group-hover:border-neon-orange/30">
            {s.name.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:-right-3 bg-background/90 backdrop-blur-md border border-neon-orange/20 rounded-[1.25rem] px-4 py-1.5 flex items-center gap-2 shadow-[0_4px_20px_rgba(255,165,0,0.2)] ring-1 ring-white/10">
            <Flame className="h-3.5 w-3.5 text-neon-orange drop-shadow-[0_0_5px_rgba(255,165,0,0.5)]" />
            <span className="text-xs font-black text-neon-orange tracking-tighter">{s.streak}D STREAK</span>
          </div>
        </div>

        <div className="flex-1 space-y-5">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-4 mb-3">
              <h1 className="text-3xl font-display font-black tracking-tight text-foreground">{s.name}</h1>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl bg-neon-orange/10 border border-neon-orange/20 text-neon-orange">Member</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
               <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-neon-blue" /> {s.collegeId || 'ATH_GRP_001'}</p>
               <p className="flex items-center gap-1.5"><Star className="h-3 w-3 text-neon-green" /> LEVEL_04</p>
            </div>
            <p className="mt-4 text-sm leading-relaxed max-w-sm text-muted-foreground font-medium italic sm:not-italic sm:text-zinc-400">
              "{isMe ? "Relentless pursuit of excellence. Day by day, gram by gram." : "Athlete in the After Hours program. Committed to the grind."}"
            </p>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-10 border-y sm:border-y-0 sm:border-none border-white/5 py-6 sm:p-0">
             <div className="text-center sm:text-left transition-transform hover:scale-110 cursor-pointer">
               <p className="text-2xl font-display font-black text-foreground">{userPosts.length}</p>
               <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Posts</p>
             </div>
             <div className="text-center sm:text-left transition-transform hover:scale-110 cursor-pointer text-neon-orange">
               <p className="text-2xl font-display font-black">{s.followers.toLocaleString()}</p>
               <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Followers</p>
             </div>
             <div className="text-center sm:text-left transition-transform hover:scale-110 cursor-pointer">
               <p className="text-2xl font-display font-black text-foreground">{s.following.toLocaleString()}</p>
               <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Following</p>
             </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
            {isMe ? (
              <>
                <Link to="/student/settings" className="px-8 py-3.5 rounded-[1.25rem] bg-foreground text-background text-[11px] font-black uppercase tracking-widest hover:bg-neon-orange hover:text-background transition-all active:scale-95 shadow-xl">Account Ops</Link>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Intel link copied!"); }} className="p-3.5 rounded-[1.25rem] bg-accent/30 hover:bg-neon-blue/10 hover:text-neon-blue transition-all border border-border/50"><Share2 className="h-4 w-4" /></button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleFollow}
                  className={`px-10 py-3.5 rounded-[1.25rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl ${
                    isFollowing 
                      ? "bg-accent/40 text-foreground border border-white/5" 
                      : "bg-neon-orange text-background hover:scale-105"
                  }`}
                >
                  {isFollowing ? "Protocol: Active" : "Initialize Link"}
                </button>
                <button className="p-3.5 rounded-[1.25rem] bg-accent/30 hover:bg-neon-blue/10 hover:text-neon-blue transition-all border border-border/50"><MessageCircle className="h-4 w-4" /></button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Intel link copied!"); }} className="p-3.5 rounded-[1.25rem] bg-accent/30 hover:bg-neon-blue/10 hover:text-neon-blue transition-all border border-border/50"><Share2 className="h-4 w-4" /></button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-3 gap-3">
         <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card-hover p-6 text-center flex flex-col items-center group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-neon-orange/20" />
            <div className="w-12 h-12 rounded-2xl bg-neon-orange/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-neon-orange/20 transition-all">
               <Flame className="h-6 w-6 text-neon-orange" />
            </div>
            <p className="text-2xl font-display font-black text-foreground">{s.streak}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Stamina Streak</p>
         </motion.div>
         <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card-hover p-6 text-center flex flex-col items-center group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-neon-blue/20" />
            <div className="w-12 h-12 rounded-2xl bg-neon-blue/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-neon-blue/20 transition-all">
               <Award className="h-6 w-6 text-neon-blue" />
            </div>
            <p className="text-2xl font-display font-black text-foreground">{s.currentDay}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Ops Completed</p>
         </motion.div>
         <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card-hover p-6 text-center flex flex-col items-center group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-neon-green/20" />
            <div className="mb-4 group-hover:scale-110 transition-transform">
               <ProgressRing percentage={s.completionPercentage} size={48} strokeWidth={4} />
            </div>
            <p className="text-2xl font-display font-black text-foreground">{s.completionPercentage}%</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Efficiency Ratio</p>
         </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-accent/20 border border-white/5 rounded-2xl">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === t ? "bg-card shadow-xl text-neon-orange border border-white/5" : "text-muted-foreground hover:text-foreground"}`}>{t}</button>
        ))}
      </div>

      {activeTab === "Posts" ? (
        <div className="grid grid-cols-3 gap-2 animate-in fade-in duration-500">
           {Array.from({ length: isMe ? 9 : 6 }).map((_, i) => (
             <motion.div 
               key={i} 
               initial={{ opacity: 0, scale: 0.9 }} 
               animate={{ opacity: 1, scale: 1 }} 
               transition={{ delay: i * 0.05 }}
               className={`aspect-square rounded-[1.5rem] bg-gradient-to-br ${postColors[i % postColors.length]} flex items-center justify-center relative group cursor-pointer overflow-hidden border border-white/5`}
             >
                <div className="absolute inset-0 bg-zinc-950 opacity-20 group-hover:opacity-40 transition-opacity" />
                <span className="text-white/10 text-3xl font-display font-black group-hover:scale-150 group-hover:rotate-12 transition-transform duration-700">TAH</span>
                <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                   <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full border border-white/10 shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
                      <Users className="h-3.5 w-3.5 text-neon-orange" />
                      <span className="text-[10px] font-black text-white">{47 + (i * 12)}</span>
                   </div>
                </div>
             </motion.div>
           ))}
        </div>
      ) : (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
          <div className="glass-card p-8 space-y-8 border-l-4 border-l-neon-blue">
             <SectionHeader title="Biometric Data" subtitle="Core athlete specifications" />
             <div className="grid sm:grid-cols-2 gap-x-12 gap-y-6">
                {[
                  { label: "Ops Executed", value: isMe ? "14" : "8", icon: Award },
                  { label: "Height Delta", value: `${s.height} CM`, icon: Grid3X3 },
                  { label: "Mass Payload", value: `${s.weight} KG`, icon: Calendar },
                  { label: "Sync Pref", value: "A.M. GRIND", icon: Settings },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center justify-between border-b border-white/5 pb-3 group cursor-default">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 group-hover:text-neon-blue transition-colors"><stat.icon className="h-3.5 w-3.5" /> {stat.label}</p>
                    <p className="text-sm font-black text-foreground group-hover:scale-110 transition-transform">{stat.value}</p>
                  </div>
                ))}
             </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 border-l-4 border-l-neon-orange relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <Star className="h-16 w-16 text-neon-orange" />
             </div>
             <SectionHeader title="Tactical Critique" subtitle="Authorized Coach Feedback" />
             <div className="mt-6 bg-zinc-950/50 p-6 rounded-[1.5rem] border border-white/5 italic text-sm font-medium text-zinc-400 relative">
                <span className="text-neon-orange absolute -top-3 left-4 text-3xl font-serif">"</span>
                {isMe 
                  ? "Form looks sharp. Focus on increasing protein intake by 15% next phase. Tactical readiness is high."
                  : "Consistent output detected. Maintain current intensity. Strength markers are trending upward."}
                <span className="text-neon-orange absolute -bottom-8 right-4 text-3xl font-serif">"</span>
             </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
