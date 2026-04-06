import { useState } from "react";
import { motion } from "framer-motion";
import { Search, UserPlus, UserCheck, Flame, Star, TrendingUp, Users } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { suggestedUsers } from "@/data/mockData";
import { toast } from "sonner";

export default function CommunityPage() {
  const [query, setQuery] = useState("");
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  const toggleFollow = (id: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filtered = suggestedUsers.filter((u) =>
    query.trim() === "" || u.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Community</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover and connect with your fitness tribe
        </p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search students and trainers..."
          className="w-full bg-muted/30 border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </motion.div>

      {/* Community Stats Quick Row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: "Students", value: "24", icon: Users },
          { label: "Avg Streak", value: "11d", icon: Flame },
          { label: "Active Today", value: "18", icon: TrendingUp },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <s.icon className="h-4 w-4 text-muted-foreground mx-auto mb-2" />
            <p className="text-lg font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Suggested / Search Results */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SectionHeader
          title={query ? `Results for "${query}"` : "Suggested For You"}
          subtitle={query ? `${filtered.length} found` : undefined}
        />
        {filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-sm text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card-hover p-4 flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0">
                  {u.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {u.role === "trainer" ? "🏋️ Trainer" : `🔥 ${u.streak}d streak`}
                    {" · "}
                    {u.mutualFriends} mutual
                  </p>
                </div>
                <button
                  onClick={() => toggleFollow(u.id)}
                  className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
                    followed.has(u.id)
                      ? "bg-foreground text-background"
                      : "bg-accent hover:bg-accent/70 text-foreground"
                  }`}
                >
                  {followed.has(u.id) ? (
                    <UserCheck className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Trending */}
      {!query && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SectionHeader title="Trending Athletes" subtitle="Top performers this month" />
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { name: "Karan Singh", stat: "21d streak", icon: Flame, badge: "🥇" },
              { name: "Priya Sharma", stat: "98% completion", icon: Star, badge: "🥈" },
              { name: "Rohit Patel", stat: "165K steps", icon: TrendingUp, badge: "🥉" },
            ].map((a, i) => (
              <motion.div
                key={a.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="glass-card p-5 text-center"
              >
                <div className="relative mx-auto w-14 h-14 mb-3">
                  <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-foreground">
                    {a.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <span className="absolute -top-1 -right-1 text-base">{a.badge}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{a.name}</p>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <a.icon className="h-3 w-3 text-streak" />
                  <span className="text-xs text-muted-foreground">{a.stat}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Featured Transformations */}
      {!query && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <SectionHeader title="Featured Transformations" />
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                name: "Aman Gupta",
                story: "60kg → 100kg deadlift in 3 months",
                tag: "Strength",
              },
              {
                name: "Neha Reddy",
                story: "Lost 8kg while building strength",
                tag: "Fat Loss",
              },
            ].map((t, i) => (
              <div key={i} className="glass-card overflow-hidden cursor-pointer group">
                <div className="aspect-video bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center relative overflow-hidden">
                  <div className="text-muted-foreground/10 text-4xl font-display font-black">TAH</div>
                  <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center">
                    <span className="text-xs text-muted-foreground/0 group-hover:text-muted-foreground transition-colors">
                      Before → After
                    </span>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground">{t.tag}</span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.story}</p>
                  <button onClick={() => toast("Transformation feature coming soon!")} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-2">
                    View full story →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
