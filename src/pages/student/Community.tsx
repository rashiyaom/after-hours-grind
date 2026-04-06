import { motion } from "framer-motion";
import { Search, UserPlus, Flame, Star, TrendingUp } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { suggestedUsers } from "@/data/mockData";

export default function CommunityPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Community</h1>
        <p className="text-sm text-muted-foreground mt-1">Discover and connect with your fitness tribe</p>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input placeholder="Search students and trainers..." className="w-full bg-muted/30 border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>

      {/* Suggested */}
      <div>
        <SectionHeader title="Suggested For You" />
        <div className="grid sm:grid-cols-2 gap-3">
          {suggestedUsers.map((u) => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card-hover p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-foreground flex-shrink-0">
                {u.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {u.role === "trainer" ? "Trainer" : `${u.streak}d streak`} · {u.mutualFriends} mutual
                </p>
              </div>
              <button className="p-2 rounded-xl bg-accent hover:bg-accent/80 transition-colors">
                <UserPlus className="h-4 w-4 text-foreground" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trending */}
      <div>
        <SectionHeader title="Trending Athletes" subtitle="Top performers this month" />
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { name: "Karan Singh", stat: "21d streak", icon: Flame },
            { name: "Priya Sharma", stat: "98% completion", icon: Star },
            { name: "Rohit Patel", stat: "165K steps", icon: TrendingUp },
          ].map((a) => (
            <div key={a.name} className="glass-card p-5 text-center">
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-sm font-medium text-foreground mx-auto mb-3">
                {a.name.split(" ").map(n => n[0]).join("")}
              </div>
              <p className="text-sm font-medium text-foreground">{a.name}</p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <a.icon className="h-3 w-3 text-streak" />
                <span className="text-xs text-muted-foreground">{a.stat}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Transformations */}
      <div>
        <SectionHeader title="Featured Transformations" />
        <div className="grid sm:grid-cols-2 gap-4">
          {["Aman Gupta: 60kg → 100kg deadlift in 3 months", "Neha Reddy: Lost 8kg while building strength"].map((t, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <div className="aspect-video bg-muted/30 flex items-center justify-center">
                <span className="text-muted-foreground/20 font-display">Before → After</span>
              </div>
              <div className="p-4">
                <p className="text-sm text-foreground">{t}</p>
                <p className="text-[11px] text-muted-foreground mt-1">Tap to view full story</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
