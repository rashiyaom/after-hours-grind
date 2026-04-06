import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Filter, X, Heart, MessageCircle, Share2, Send } from "lucide-react";
import FeedPostCard from "@/components/FeedPostCard";
import { useStore } from "@/hooks/useStore";
import { Post } from "@/types";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function FeedPage() {
  const { posts, likePost, addComment } = useStore();
  const [activeTab, setActiveTab] = useState("All");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState("");

  const activePost = selectedPost ? posts.find(p => p.id === selectedPost.id) : null;

  const handleComment = () => {
    if (!commentText.trim() || !activePost) return;
    addComment(activePost.id, commentText);
    toast.success("Comment added!");
    setCommentText("");
  };

  const filteredPosts = posts.filter((p) => {
    if (activeTab === "Videos") return p.type === "reel";
    if (activeTab === "Photos") return p.type === "image";
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-foreground">Community Feed</h1>
        <Link
          to="/student/upload"
          className="p-2.5 rounded-full bg-foreground text-background hover:scale-105 active:scale-95 transition-all shadow-lg"
        >
          <Plus className="h-5 w-5" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/30 p-1 rounded-xl w-fit">
        {["All", "Videos", "Photos"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === tab ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-6 pb-20">
        {filteredPosts.map((post) => (
          <div key={post.id} onClick={() => setSelectedPost(post)}>
            <FeedPostCard post={post} />
          </div>
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
              className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] cursor-zoom-out"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[900px] md:max-h-[80vh] bg-card border border-border shadow-2xl z-[101] rounded-3xl overflow-hidden flex flex-col md:flex-row"
            >
              {/* Media Part */}
              <div className="md:flex-1 bg-black flex items-center justify-center relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-800" />
                <span className="text-muted-foreground/10 text-9xl font-display font-black select-none">TAH</span>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-4 left-4 p-2 rounded-full bg-background/40 backdrop-blur-sm text-foreground md:hidden"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Interaction Part */}
              <div className="w-full md:w-[380px] flex flex-col bg-card">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold">
                      {activePost.userName.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activePost.userName}</p>
                      <p className="text-[10px] text-muted-foreground">{activePost.location}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedPost(null)} className="hidden md:block text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <p className="text-sm">
                    <span className="font-semibold">{activePost.userName}</span> {activePost.caption}
                  </p>
                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Comments ({activePost.comments})</p>
                    {[
                      { user: "Coach Vikram", text: "Quality form on those reps! Keep pushing. 🚀" },
                      { user: "Rohan Patel", text: "That gym looks aesthetic as hell. Where is it?" },
                      { user: "Priya Sharma", text: "Consistency is key! 🔥" },
                    ].map((c, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                          {c.user.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-xs">
                            <span className="font-semibold">{c.user}</span> {c.text}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">2h ago · Reply</p>
                        </div>
                      </div>
                    ))}
                    {Array.from({ length: Math.max(0, activePost.comments - 3) }).map((_, i) => (
                      <div key={`new-${i}`} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                          ME
                        </div>
                        <div>
                          <p className="text-xs">
                            <span className="font-semibold">You</span> Added a new comment!
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">Just now</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-4">
                      <Heart onClick={() => likePost(activePost.id)} className={`h-5 w-5 cursor-pointer ${activePost.liked ? "text-red-500 fill-red-500" : ""}`} />
                      <MessageCircle className="h-5 w-5 cursor-pointer" />
                      <Share2 onClick={() => toast.success("Post link copied to clipboard!")} className="h-5 w-5 cursor-pointer" />
                    </div>
                    <span className="text-xs text-muted-foreground">{activePost.timestamp}</span>
                  </div>
                  <div className="text-sm font-semibold px-1">{activePost.likes} likes</div>
                  <div className="relative mt-2">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleComment();
                      }}
                      placeholder="Add a comment..."
                      className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-xs focus:outline-none pr-10"
                    />
                    <Send onClick={handleComment} className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground cursor-pointer hover:text-foreground" />
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
