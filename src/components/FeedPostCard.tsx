import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Play, Image } from "lucide-react";
import { Post } from "@/types";
import { motion } from "framer-motion";
import { useState } from "react";

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

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  const colorIdx = post.id.charCodeAt(post.id.length - 1) % mediaColors.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0">
            {getInitials(post.userName)}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{post.userName}</p>
            <p className="text-[11px] text-muted-foreground">
              {post.location} · {post.timestamp}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.userRole === "trainer" && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground border border-border/50">
              Trainer
            </span>
          )}
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Media */}
      <div className={`relative aspect-square bg-gradient-to-br ${mediaColors[colorIdx]} flex items-center justify-center overflow-hidden`}>
        <div className="text-muted-foreground/10 text-8xl font-display font-black select-none">TAH</div>
        {/* Day badge overlay */}
        {post.caption.includes("Day") && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-streak" />
            <span className="text-[11px] font-medium text-foreground">
              {post.caption.match(/Day \d+ of \d+/)?.[0] || post.caption.match(/Day \d+/)?.[0] || ""}
            </span>
          </div>
        )}
        {post.type === "reel" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-full bg-foreground/10 backdrop-blur-sm border border-white/10">
              <Play className="h-8 w-8 text-foreground" fill="currentColor" />
            </div>
          </div>
        )}
        {post.type === "image" && (
          <div className="absolute bottom-3 right-3 bg-background/60 backdrop-blur-sm rounded-lg p-1.5">
            <Image className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="transition-transform active:scale-90 hover:scale-110">
              <Heart
                className={`h-5 w-5 transition-colors ${liked ? "text-red-500 fill-red-500" : "text-foreground"}`}
              />
            </button>
            <button onClick={() => setShowComments(!showComments)} className="hover:text-muted-foreground transition-colors">
              <MessageCircle className="h-5 w-5 text-foreground" />
            </button>
            <button className="hover:text-muted-foreground transition-colors">
              <Share2 className="h-5 w-5 text-foreground" />
            </button>
          </div>
          <button onClick={() => setBookmarked(!bookmarked)} className="hover:text-muted-foreground transition-colors">
            <Bookmark className={`h-5 w-5 transition-colors ${bookmarked ? "text-foreground fill-foreground" : "text-foreground"}`} />
          </button>
        </div>
        <p className="text-sm font-semibold text-foreground">{likeCount.toLocaleString()} likes</p>
        <p className="text-sm text-secondary-foreground leading-snug">
          <span className="font-semibold text-foreground">{post.userName}</span>{" "}
          {post.caption}
        </p>
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all {post.comments} comments
        </button>

        {/* Inline comments mock */}
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2 pt-2 border-t border-border/40"
          >
            {[
              { user: "Coach Vikram", text: "Excellent effort! 💪" },
              { user: "Priya Sharma", text: "Keep going! 🔥" },
            ].map((c, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[9px] font-bold text-foreground flex-shrink-0">
                  {getInitials(c.user)}
                </div>
                <p className="text-secondary-foreground">
                  <span className="font-medium text-foreground">{c.user}</span> {c.text}
                </p>
              </div>
            ))}
            <div className="flex gap-2 items-center mt-1">
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[9px] font-bold text-foreground flex-shrink-0">
                AM
              </div>
              <input
                placeholder="Add a comment..."
                className="flex-1 bg-transparent text-xs text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none"
              />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
