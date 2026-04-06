import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Play } from "lucide-react";
import { Post } from "@/types";
import { motion } from "framer-motion";
import { useState } from "react";

export default function FeedPostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-foreground">
            {post.userName.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{post.userName}</p>
            <p className="text-[11px] text-muted-foreground">{post.location} · {post.timestamp}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.userRole === "trainer" && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground border border-border/50">Trainer</span>
          )}
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Media */}
      <div className="relative aspect-square bg-muted/30 flex items-center justify-center">
        <div className="text-muted-foreground/30 text-6xl font-display font-bold">TAH</div>
        {post.type === "reel" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-full bg-foreground/10 backdrop-blur-sm">
              <Play className="h-8 w-8 text-foreground" fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="transition-transform hover:scale-110">
              <Heart className={`h-5 w-5 ${liked ? "text-streak fill-streak" : "text-foreground"}`} />
            </button>
            <MessageCircle className="h-5 w-5 text-foreground" />
            <Share2 className="h-5 w-5 text-foreground" />
          </div>
          <Bookmark className="h-5 w-5 text-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">{likeCount} likes</p>
        <p className="text-sm text-secondary-foreground">
          <span className="font-medium text-foreground">{post.userName}</span>{" "}
          {post.caption}
        </p>
        <button className="text-xs text-muted-foreground">View all {post.comments} comments</button>
      </div>
    </motion.div>
  );
}
