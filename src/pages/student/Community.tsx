import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, UserPlus, UserCheck, Flame, Star, TrendingUp, Users, Activity, Target, ShieldCheck } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { toast } from "sonner";
import { useStore } from "@/hooks/useStore";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommunityPage() {
  const { suggestedUsers, loading, setLoading, followUser } = useStore();
  const [query, setQuery] = useState("");
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [setLoading]);

  const toggleFollow = (id: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.info("Link Severed");
      } else {
        followUser(id);
        next.add(id);
        toast.success("Identity Linked!");
      }
      return next;
    });
  };

  const filtered = suggestedUsers.filter((u) =>
    query.trim() === "" || u.name.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-10 pb-24 relative">
       <div className="absolute top-0 left-0 w-64 h-64 bg-neon-blue/5 blur-3xl pointer-events-none" />
       
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <div className="flex items-center gap-3 mb-2">
           <div className="p-2 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
              <Users className="h-4 w-4 text-neon-blue" />
           </div>
           <p className="text-[10px] font-black text-neon-blue uppercase tracking-[0.4em]">_Tactical_Network</p>
        </div>
        <h1 className="text-4xl font-display font-black text-foreground tracking-tighter uppercase italic">The Community</h1>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-2">
           <Activity className="h-3 w-3" /> <span className="text-neon-orange">{suggestedUsers.length}</span> ACTIVE_UNITS_DETECTED
        </p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-neon-orange transition-colors" />
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SEARCH UNITS BY ID or DESIGNATION..."
          className="w-full bg-zinc-900 border border-white/5 rounded-[1.5rem] pl-14 pr-6 py-5 text-sm font-medium text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-neon-orange/50 transition-all focus:ring-4 focus:ring-neon-orange/5"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:text-neon-orange transition-colors"
          >
            Reset_Search
          </button>
        )}
      </motion.div>

      {/* Community Stats Quick Row */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: "Detected_Units", value: "24", icon: ShieldCheck, color: "text-neon-blue" },
          { label: "Elite_Streak", value: "21D", icon: Flame, color: "text-neon-orange" },
          { label: "Bio_Efficiency", value: "88%", icon: TrendingUp, color: "text-neon-green" },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-950/50 border border-white/5 p-6 rounded-[2rem] text-center group hover:border-white/10 transition-all">
            <s.icon className={`h-4 w-4 mx-auto mb-4 ${s.color} group-hover:scale-125 transition-transform`} />
            <p className="text-2xl font-display font-black text-foreground uppercase italic tracking-tighter">{s.value}</p>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1 opacity-60 group-hover:opacity-100 transition-all">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Suggested / Search Results */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="flex items-end justify-between border-l-2 border-neon-orange pl-6 mb-8 mt-6">
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-neon-orange mb-1">Target_Acquisition</p>
              <h2 className="text-2xl font-display font-black text-foreground uppercase italic tracking-widest">{query ? `MATCHES: "${query}"` : "ACTIVE_COMM_NODES"}</h2>
           </div>
        </div>
        
        {filtered.length === 0 ? (
          <div className="bg-zinc-950/50 p-20 text-center rounded-[3rem] border border-dashed border-white/10">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60 flex flex-col items-center gap-4">
               <Target className="h-10 w-10 opacity-20" /> No_Matches_In_Radius
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            {filtered.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card glass-card-hover p-6 flex items-center gap-5 relative group border-white/5 rounded-[2.5rem]"
              >
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-sm font-display font-black text-foreground flex-shrink-0 transition-all group-hover:rotate-12 group-hover:scale-110 group-hover:border-neon-orange/40">
                  {u.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/student/profile/${u.id}`} className="block">
                    <p className="text-sm font-black text-foreground truncate group-hover:text-neon-orange transition-colors uppercase tracking-widest italic">{u.name}</p>
                    <div className="flex items-center gap-3 mt-2">
                       {u.streak > 0 && <span className="text-[9px] font-black text-neon-orange flex items-center gap-1">🔥 {u.streak}D</span>}
                       <span className="text-[9px] font-black text-muted-foreground/60 flex items-center gap-1 uppercase tracking-widest">{u.mutualFriends} MUTUAL_LINKS</span>
                    </div>
                  </Link>
                </div>
                <button
                  onClick={() => toggleFollow(u.id)}
                  className={`h-12 w-12 rounded-[1.25rem] transition-all flex items-center justify-center flex-shrink-0 active:scale-90 border ${
                    followed.has(u.id)
                      ? "bg-foreground text-background border-transparent shadow-xl"
                      : "bg-zinc-900 border-white/10 hover:border-neon-blue hover:text-neon-blue text-muted-foreground"
                  }`}
                >
                  {followed.has(u.id) ? (
                    <UserCheck className="h-5 w-5" />
                  ) : (
                    <UserPlus className="h-5 w-5" />
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Trending Section */}
      {!query && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-8 pt-8">
           <div className="flex items-center gap-4 text-neon-green">
              <Activity className="h-5 w-5" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em]">High_Performance_Metrics</p>
           </div>
           
           <div className="grid sm:grid-cols-3 gap-4">
              {[
                { name: "Karan Singh", stat: "21D_STR", icon: Flame, badge: "🥇", color: "text-neon-orange" },
                { name: "Priya Sharma", stat: "98%_EFF", icon: Star, badge: "🥈", color: "text-neon-blue" },
                { name: "Rohit Patel", stat: "165K_STP", icon: TrendingUp, badge: "🥉", color: "text-neon-green" },
              ].map((a, i) => (
                <div key={a.name} className="bg-zinc-950/80 border border-white/5 p-8 rounded-[3rem] text-center group hover:border-white/20 transition-all relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 font-display font-black text-white/5 text-6xl group-hover:text-white/10 transition-colors italic">{i+1}</div>
                  <div className="relative mx-auto w-20 h-20 mb-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-zinc-900 flex items-center justify-center text-md font-display font-black text-foreground border border-white/10 group-hover:scale-110 group-hover:-rotate-3 transition-all relative z-10">
                       {a.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="absolute -top-3 -right-3 bg-foreground rounded-xl px-2 py-1.5 border border-white/20 shadow-2xl z-20">
                       <span className="text-xs">{a.badge}</span>
                    </div>
                  </div>
                  <p className="text-[11px] font-black text-foreground uppercase tracking-widest mb-3 italic">{a.name}</p>
                  <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5 group-hover:border-neon-orange/20 transition-all">
                    <a.icon className={`h-3 w-3 ${a.color}`} />
                    <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground group-hover:text-foreground transition-colors">{a.stat}</span>
                  </div>
                </div>
              ))}
           </div>
        </motion.div>
      )}
    </div>
  );
}
