import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Filter, X, Heart, MessageCircle, Share2, Send, Play, Image as ImageIcon } from "lucide-react";
import FeedPostCard from "@/components/FeedPostCard";
import { useStore } from "@/hooks/useStore";
import { useCurrentUser, usePermissions } from "@/hooks/useStore";
import { Post } from "@/types";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { filterPostsByTab } from "@/lib/feedFilters";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";

export default function FeedPage() {
  const { posts, likePost, addComment, loading, setLoading } = useStore();
  const currentUser = useCurrentUser();
  const permissions = usePermissions();
  const canPostFeed = Boolean(currentUser && permissions[currentUser.role].post_feed);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState("");

  const activePost = selectedPost ? posts.find(p => p.id === selectedPost.id) : null;

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [setLoading]);

  const handleComment = () => {
    if (!commentText.trim() || !activePost) return;
    addComment(activePost.id, commentText);
    toast.success("Engagement logged!");
    setCommentText("");
  };

  const filteredPosts = filterPostsByTab(posts, activeTab);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="flex justify-between items-center">
           <Skeleton className="h-10 w-48" />
           <Skeleton className="h-12 w-12 rounded-full" />
        </div>
        <div className="flex gap-2">
           {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-24 rounded-xl" />)}
        </div>
        <div className="space-y-8">
           {[1,2].map(i => <Skeleton key={i} className="h-[400px] w-full rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Feed Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-display font-black text-foreground tracking-tight">The Grind Feed</h1>
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1 px-1">Community Intelligence</p>
        </div>
        {canPostFeed && (
          <Link
            to="/student/upload"
            className="p-4 rounded-[1.25rem] bg-neon-orange text-background hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(255,165,0,0.3)] ring-offset-background focus:ring-2 ring-neon-orange"
          >
            <Plus className="h-5 w-5" />
          </Link>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.1 }} className="flex gap-1.5 bg-accent/20 p-1.5 border border-white/5 rounded-2xl w-fit">
        {["All", "Videos", "Photos"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === tab ? "bg-card shadow-xl text-neon-orange border border-white/5" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "Videos" && <Play className="h-3 w-3 inline mr-2 opacity-50" />}
            {tab === "Photos" && <ImageIcon className="h-3 w-3 inline mr-2 opacity-50" />}
            {tab}
          </button>
        ))}
      </motion.div>

      {/* Posts */}
      <div className="space-y-10 pb-24">
        {filteredPosts.map((post, i) => (
          <motion.div 
             key={post.id} 
             initial={{ opacity: 0, y: 20 }} 
             animate={{ opacity: 1, y: 0 }} 
             transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.1 }}
             onClick={() => setSelectedPost(post)}
          >
            <FeedPostCard post={post} />
          </motion.div>
        ))}
      </div>

      {/* Post Modal */}
      <AnimatePresence>
        {activePost && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="fixed inset-0 bg-background/95 backdrop-blur-2xl z-[100] cursor-zoom-out"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="fixed inset-2 sm:inset-6 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[1100px] md:h-[90vh] bg-card border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] z-[101] rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row transition-all duration-500"
            >
              {/* Media Part */}
              <div className="flex-1 bg-black flex items-center justify-center relative group min-h-[350px] md:min-h-0 border-b md:border-b-0 md:border-r border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black" />
                <span className="text-white/5 text-[15rem] font-display font-black select-none pointer-events-none group-hover:scale-110 transition-transform duration-1000">TAH</span>
                
                {/* Media Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4 px-10 group-hover:translate-y-[-10px] transition-transform duration-700">
                       <div className="w-24 h-24 rounded-full bg-neon-orange/10 border border-neon-orange/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(255,165,0,0.1)] group-hover:scale-125 group-hover:border-neon-orange group-hover:bg-neon-orange/20 transition-all duration-500">
                          {activePost.type === 'reel' ? <Play className="h-10 w-10 text-neon-orange fill-neon-orange/20" /> : <ImageIcon className="h-10 w-10 text-neon-orange" />}
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-white/40 tracking-[0.4em] uppercase">{activePost.type.toUpperCase()}_STREAM_001</p>
                          <p className="text-xs font-bold text-white/20 uppercase">AUTHORIZED_GRIND_VISUAL</p>
                       </div>
                    </div>
                </div>

                <div className="absolute top-8 left-8 flex items-center gap-4 z-10">
                   <button
                    onClick={() => setSelectedPost(null)}
                    className="p-3.5 rounded-2xl bg-black/60 backdrop-blur-md text-foreground border border-white/10 hover:bg-white/10 transition-all active:scale-90"
                   >
                    <X className="h-5 w-5" />
                   </button>
                   <div className="px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 hidden md:block">
                      <p className="text-[9px] font-black uppercase tracking-widest text-neon-orange">System Overlay: Operational</p>
                   </div>
                </div>
              </div>

              {/* Interaction Part */}
              <div className="w-full md:w-[450px] flex flex-col bg-card h-[60vh] md:h-full relative">
                <div className="p-6 border-b border-white/5 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-accent/10 to-transparent">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent border-2 border-neon-orange/50 p-0.5 shadow-[0_0_15px_rgba(255,165,0,0.2)]">
                       <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-xs font-black">
                         {activePost.userName.split(" ").map(n => n[0]).join("")}
                       </div>
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground uppercase tracking-tight">{activePost.userName}</p>
                      <p className="text-[9px] font-black text-neon-blue uppercase tracking-widest">{activePost.location}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-zinc-950/20">
                  <div className="space-y-8">
                    <div className="flex gap-4">
                      <div className="w-9 h-9 rounded-full bg-accent border border-border flex items-center justify-center text-[10px] font-black flex-shrink-0">
                        {activePost.userName.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs leading-relaxed font-bold text-foreground/90">
                          {activePost.caption}
                        </p>
                        <p className="text-[10px] font-black text-neon-orange uppercase tracking-widest font-mono opacity-50 mt-2">#AFTER_HOURS #GRIND</p>
                      </div>
                    </div>

                    <div className="space-y-6 pt-8 border-t border-white/5">
                      <div className="flex items-center justify-between">
                         <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Intel Feed: {activePost.comments}</p>
                         <Filter className="h-3.5 w-3.5 text-muted-foreground/30 hover:text-foreground cursor-pointer" />
                      </div>
                      {[
                        { user: "Coach Vikram", text: "Superior form on those reps. Keep the delta consistent. 🚀" },
                        { user: "Rohan Patel", text: "Visual aesthetic is high. Sync up for the next session?" },
                        { user: "Priya Sharma", text: "Unmatched consistency detected. 🔥" },
                      ].map((c, i) => (
                        <div key={i} className="flex gap-4 group">
                          <div className="w-9 h-9 rounded-full bg-muted/40 border border-border flex items-center justify-center text-[10px] font-black flex-shrink-0 group-hover:border-neon-blue/50 transition-colors">
                            {c.user.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div className="space-y-1.5 flex-1 pt-1">
                            <p className="text-xs font-bold leading-relaxed">
                              <span className="text-neon-blue mr-2 font-black uppercase text-[10px] tracking-tight">{c.user}</span> 
                              <span className="text-foreground/80">{c.text}</span>
                            </p>
                            <div className="flex items-center gap-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                              <span>0{i + 2}H AGO</span>
                              <button className="hover:text-neon-blue font-black transition-colors">Relay Response</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-8 border-t border-white/5 bg-gradient-to-b from-transparent to-accent/10 flex-shrink-0 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <Heart 
                        onClick={(e) => { e.stopPropagation(); likePost(activePost.id); }} 
                        className={`h-7 w-7 cursor-pointer transition-all active:scale-[1.5] ${activePost.liked ? "text-neon-orange fill-neon-orange shadow-[0_0_20px_rgba(255,165,0,0.3)]" : "text-foreground hover:text-neon-orange"}`} 
                      />
                      <MessageCircle className="h-7 w-7 cursor-pointer text-foreground hover:text-neon-blue transition-colors" />
                      <Share2 onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Intel shared!");
                      }} className="h-7 w-7 cursor-pointer text-foreground hover:text-neon-blue transition-colors" />
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{activePost.timestamp}</p>
                       <p className="text-[9px] font-black text-neon-orange uppercase mt-0.5 tracking-widest">Live Sync</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                     <div className="text-lg font-display font-black text-foreground tracking-tight underline decoration-neon-orange decoration-2 underline-offset-4">{activePost.likes.toLocaleString()} <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Affirmations</span></div>
                  </div>

                  <div className="relative group">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleComment();
                      }}
                      placeholder="Commit message to feed..."
                      className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-muted-foreground/30 focus:outline-none focus:border-neon-orange/30 pr-16 transition-all group-hover:bg-zinc-950"
                    />
                    <button 
                      onClick={handleComment}
                      disabled={!commentText.trim()}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-neon-orange disabled:opacity-0 transition-all hover:bg-neon-orange/10"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
