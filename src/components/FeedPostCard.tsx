import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Play, Image } from "lucide-react";
import { Post } from "@/types";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";

// Generate deterministic gradient backgrounds for posts without media
const mediaColors = [
  "from-zinc-900 to-zinc-800",
  "from-stone-900 to-stone-800",
  "from-neutral-900 to-neutral-800",
  "from-slate-900 to-slate-800",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();
}

export default function FeedPostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [bookmarked, setBookmarked] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const colorIdx = post.id.charCodeAt(post.id.length - 1) % mediaColors.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-muted/10 group">
        <Link 
          to={`/student/profile/${post.userId}`} 
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          onClick={handleAction}
        >
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0 transition-transform group-hover:scale-105">
            {getInitials(post.userName)}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground group-hover:underline">{post.userName}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              {post.location} · {post.timestamp}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {post.userRole === "trainer" && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-streak/10 text-streak border border-streak/20 font-bold uppercase tracking-widest">
              Trainer
            </span>
          )}
          <button onClick={handleAction} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-accent">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Media */}
      <div className={`relative aspect-square bg-gradient-to-br ${mediaColors[colorIdx]} flex items-center justify-center overflow-hidden cursor-zoom-in group`}>
        <div className="text-muted-foreground/5 text-8xl font-display font-black select-none group-hover:scale-110 transition-transform">TAH</div>
        {/* Day badge overlay */}
        {post.caption.includes("Day") && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-border/50 shadow-xl z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-streak animate-pulse" />
            <span className="text-[11px] font-bold text-foreground tracking-tight">
              {post.caption.match(/Day \d+ of \d+/)?.[0] || post.caption.match(/Day \d+/)?.[0] || ""}
            </span>
          </div>
        )}
        {post.type === "reel" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/0 transition-colors">
            <div className="p-5 rounded-3xl bg-background/20 backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform shadow-2xl">
              <Play className="h-8 w-8 text-foreground fill-foreground" />
            </div>
          </div>
        )}
        {post.type === "image" && (
          <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-md rounded-xl p-2 border border-border/50 shadow-lg">
            <Image className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity" />
      </div>

      {/* Actions */}
      <div className="p-4 space-y-4 bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button onClick={handleLike} className="transition-transform active:scale-90 hover:scale-110">
              <Heart
                className={`h-6 w-6 transition-colors ${liked ? "text-red-500 fill-red-500" : "text-foreground hover:text-muted-foreground"}`}
              />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }} className="hover:scale-110 transition-transform hover:text-muted-foreground">
              <MessageCircle className="h-6 w-6 text-foreground" />
            </button>
            <button onClick={handleAction} className="hover:scale-110 transition-transform hover:text-muted-foreground">
              <Share2 className="h-6 w-6 text-foreground" />
            </button>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setBookmarked(!bookmarked); }} className="hover:scale-110 transition-transform hover:text-muted-foreground">
            <Bookmark className={`h-6 w-6 transition-colors ${bookmarked ? "text-foreground fill-foreground" : "text-foreground"}`} />
          </button>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">{likeCount.toLocaleString()} grind enthusiasts liked this</p>
          <p className="text-sm text-secondary-foreground leading-relaxed">
            <Link to={`/student/profile/${post.userId}`} className="font-bold text-foreground hover:underline" onClick={handleAction}>{post.userName}</Link>{" "}
            {post.caption}
          </p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
        >
          {showComments ? "Hide comments" : `View all ${post.comments} comments`}
        </button>

        {/* Inline comments mock */}
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-3 pt-3 border-t border-border/20"
          >
            {[
              { user: "Coach Vikram", text: "Excellent effort! 💪", initials: "CV" },
              { user: "Priya Sharma", text: "Keep going! 🔥", initials: "PS" },
            ].map((c, i) => (
              <div key={i} className="flex gap-3 text-xs items-start">
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-[9px] font-bold text-foreground flex-shrink-0">
                  {c.initials}
                </div>
                <div className="flex-1">
                  <p className="text-secondary-foreground leading-snug">
                    <span className="font-bold text-foreground mr-1.5">{c.user}</span> {c.text}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">2h ago · Reply</p>
                </div>
              </div>
            ))}
            <div className="flex gap-3 items-center mt-2 group/input">
              <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center text-[9px] font-bold text-foreground flex-shrink-0">
                AM
              </div>
              <div className="flex-1 relative">
                <input
                  onClick={handleAction}
                  placeholder="Add a comment..."
                  className="w-full bg-accent/20 border border-border/40 rounded-xl px-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-border transition-colors"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
