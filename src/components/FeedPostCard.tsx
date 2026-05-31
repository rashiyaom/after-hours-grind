import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Play, Image as ImageIcon, X } from "lucide-react";
import { Post } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore, useAppStore, useCurrentUser } from "@/hooks/useStore";
import { ApiError } from "@/lib/api";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";
import { toast } from "sonner";

/* rich media bg gradients — dark & premium */
const MEDIA_PALETTES = [
  { bg: "from-[#0D1117] to-[#1a1f2e]", accent: "#4DD2FF" },
  { bg: "from-[#110D17] to-[#1e1a2e]", accent: "#A78BFA" },
  { bg: "from-[#0F1710] to-[#1a2e1a]", accent: "#C9F85A" },
  { bg: "from-[#17120D] to-[#2e221a]", accent: "#FFD36E" },
  { bg: "from-[#17100D] to-[#2e1a1a]", accent: "#FF4D00" },
];

const AVATAR_GRADIENTS = [
  "from-[#C9F85A] to-[#4DD2FF]",
  "from-[#FF7AE5] to-[#A78BFA]",
  "from-[#FFD36E] to-[#FF4D00]",
  "from-[#4DD2FF] to-[#6F5CFF]",
  "from-[#C9F85A] to-[#FFD36E]",
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(ts: string) {
  try {
    const diff = Date.now() - new Date(ts).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "just now";
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch {
    return ts;
  }
}

type FeedPostCardProps = {
  post: Post;
  onClick?: () => void;
  isFollowed?: boolean;
  onToggleFollow?: (userId: string, shouldFollow: boolean) => Promise<void> | void;
};

export default function FeedPostCard({ post, onClick, isFollowed = false, onToggleFollow }: FeedPostCardProps) {
  const { likePost, addComment } = useStore();
  const [bookmarked, setBookmarked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const currentUser = useCurrentUser();
  const followUser = useAppStore((state) => state.followUser);
  const unfollowUser = useAppStore((state) => state.unfollowUser);
  const [followLoading, setFollowLoading] = useState(false);
  const isOtherUser = currentUser?.id !== post.userId && post.userRole === "student";

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowed) {
        if (onToggleFollow) {
          await onToggleFollow(post.userId, false);
        } else {
          await unfollowUser(post.userId);
        }
        toast.info(`Unfollowed ${post.userName}`);
      } else {
        if (onToggleFollow) {
          await onToggleFollow(post.userId, true);
        } else {
          await followUser(post.userId);
        }
        toast.success(`Following ${post.userName}!`);
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  const colorIdx = post.id.charCodeAt(post.id.length - 1) % MEDIA_PALETTES.length;
  const palette = MEDIA_PALETTES[colorIdx];
  const gradIdx = post.userId.charCodeAt(0) % AVATAR_GRADIENTS.length;
  const hasRenderableMedia = /^https?:\/\//i.test(post.mediaUrl);
  const isVideoPost = post.type === "video" || post.type === "reel";
  const [showLightbox, setShowLightbox] = useState(false);

  const handleLike = (e: React.MouseEvent) => { e.stopPropagation(); likePost(post.id); };
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const handleAddComment = async (e: React.MouseEvent | React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const text = commentText.trim();
    if (!text || submittingComment) return;

    setSubmittingComment(true);
    try {
      await addComment(post.id, text);
      setCommentText("");
      toast.success("Comment posted");
    } catch {
      toast.error("Unable to post comment right now");
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={LUXURY_TWEEN_MEDIUM}
      onClick={onClick}
      className="rounded-[28px] border border-white/8 bg-[#111111] overflow-hidden cursor-pointer hover:border-white/15 transition-all group"
    >
      {/* ── Post header ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4">
        <Link
          to={`/student/profile/${post.userId}`}
          onClick={stop}
          className="flex items-center gap-3 hover:opacity-85 transition-opacity"
        >
          {/* avatar */}
          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${AVATAR_GRADIENTS[gradIdx]} p-[1.5px] flex-shrink-0`}>
            <div className="w-full h-full rounded-[13px] bg-[#1A1A1A] flex items-center justify-center text-[11px] font-bold text-white">
              {getInitials(post.userName)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white leading-tight">{post.userName}</p>
              {isOtherUser && (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`text-[11px] font-bold transition-colors disabled:opacity-50 ${
                    isFollowed ? "text-white/45 hover:text-white/80" : "text-[#4DD2FF] hover:text-[#6ee0ff]"
                  }`}
                >
                  {isFollowed ? "· Following" : "· Follow"}
                </button>
              )}
            </div>
            <p className="text-[10px] text-white/35 mt-0.5">{post.location} · {timeAgo(post.timestamp)}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2" onClick={stop}>
          {post.source === "task-proof" && (
            <span
              className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wider ${
                post.status === "visible"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : post.status === "hidden"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-[#FFD36E]/12 text-[#FFD36E] border-[#FFD36E]/25"
              }`}
            >
              {post.status === "visible" ? "Approved" : post.status === "hidden" ? "Rejected" : "Pending Review"}
            </span>
          )}
          {post.userRole === "trainer" && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#FFD36E]/10 text-[#FFD36E] border border-[#FFD36E]/20 font-semibold uppercase tracking-wider">
              Trainer
            </span>
          )}
          <button className="w-7 h-7 rounded-full bg-[#1D1D1D] flex items-center justify-center text-white/40 hover:text-white hover:bg-[#252525] transition-all">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Media block ─────────────────────────────────── */}
      {hasRenderableMedia ? (
        <div className="relative aspect-square overflow-hidden bg-[#090909]">
          {isVideoPost ? (
            <video
              src={post.mediaUrl}
              className="h-full w-full object-cover"
              controls
              preload="metadata"
              playsInline
              onClick={(e) => { stop(e); setShowLightbox(true); }}
            />
          ) : (
            <img
              src={post.mediaUrl}
              alt={`${post.userName} post`}
              className="h-full w-full object-cover"
              loading="lazy"
              onClick={(e) => { stop(e); setShowLightbox(true); }}
            />
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          {isVideoPost && (
            <div className="pointer-events-none absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/55 backdrop-blur-sm border border-white/10 flex items-center justify-center">
              <Play className="h-4 w-4 text-white/80 ml-0.5" />
            </div>
          )}
        </div>
      ) : (
        <div
          className={`relative aspect-square bg-gradient-to-br ${palette.bg} flex items-center justify-center overflow-hidden`}
          style={{ backgroundSize: "cover" }}
        >
          {/* grid overlay */}
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
          />

          {/* TAH watermark */}
          <span
            className="text-[11rem] font-black select-none pointer-events-none opacity-[0.025] group-hover:opacity-[0.05] transition-opacity duration-700"
            style={{ color: palette.accent }}
          >
            TAH
          </span>

          {/* Day badge */}
          {post.caption.includes("Day") && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 z-10">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: palette.accent }} />
              <span className="text-[11px] font-semibold text-white">
                {post.caption.match(/Day \d+ of \d+/)?.[0] || post.caption.match(/Day \d+/)?.[0] || ""}
              </span>
            </div>
          )}

          {/* type indicator */}
          {post.type === "reel" ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-14 h-14 rounded-full border-2 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                style={{ borderColor: `${palette.accent}60` }}
              >
                <Play className="h-6 w-6 ml-0.5" style={{ color: palette.accent, fill: `${palette.accent}30` }} />
              </motion.div>
            </div>
          ) : (
            <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <ImageIcon className="h-3.5 w-3.5 text-white/60" />
            </div>
          )}

          {/* hover overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: `linear-gradient(to top, ${palette.accent}18, transparent 50%)` }}
          />
        </div>
      )}

      {/* ── Actions & content ────────────────────────────── */}
      <div className="px-5 pb-5 pt-4 space-y-4">
        {/* action row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button whileTap={{ scale: 0.85 }} onClick={handleLike}>
              <Heart
                className={`h-5.5 w-5.5 transition-all ${post.liked ? "text-[#FF4D00] fill-[#FF4D00]" : "text-white/50 hover:text-white"}`}
                style={{ width: 22, height: 22 }}
              />
            </motion.button>
            <motion.button whileTap={{ scale: 0.85 }} onClick={(e) => { stop(e); setShowComments(!showComments); }}>
              <MessageCircle className="text-white/50 hover:text-white transition-colors" style={{ width: 22, height: 22 }} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                stop(e);
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied!");
              }}
            >
              <Share2 className="text-white/50 hover:text-white transition-colors" style={{ width: 22, height: 22 }} />
            </motion.button>
          </div>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => { stop(e); setBookmarked((b) => !b); }}
          >
            <Bookmark
              className={`transition-all ${bookmarked ? "text-[#C9F85A] fill-[#C9F85A]" : "text-white/50 hover:text-white"}`}
              style={{ width: 22, height: 22 }}
            />
          </motion.button>
        </div>

        {/* likes */}
        <p className="text-sm font-semibold text-white">{post.likes.toLocaleString()} <span className="text-white/40 font-normal">likes</span></p>

        {/* caption */}
        <p className="text-sm text-white/70 leading-relaxed">
          <Link
            to={`/student/profile/${post.userId}`}
            onClick={stop}
            className="font-semibold text-white hover:text-[#C9F85A] transition-colors"
          >
            {post.userName}
          </Link>{" "}
          {post.caption}
        </p>
        {/* view comments toggle */}
        <button
          onClick={(e) => { stop(e); setShowComments(!showComments); }}
          className="text-[11px] font-semibold text-white/30 hover:text-white/60 transition-colors uppercase tracking-wider"
        >
          {showComments ? "Hide comments" : `View ${post.comments} comments`}
        </button>

        {/* comments section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-3 border-t border-white/5 pt-3 overflow-hidden"
              onClick={stop}
            >
              <p className="text-xs text-white/35">
                Open post to view all comments. New comments are saved instantly.
              </p>

              {/* add comment input */}
              <div className="flex gap-3 items-center mt-3">
                <div className="w-7 h-7 rounded-full bg-[#C9F85A]/20 border border-[#C9F85A]/30 flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-[#C9F85A]">
                  ME
                </div>
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void handleAddComment(e);
                    }
                  }}
                  placeholder="Add a comment…"
                  className="flex-1 bg-[#1A1A1A] border border-white/8 rounded-full px-4 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-[#C9F85A]/30 transition-colors"
                />
                <button
                  onClick={(e) => {
                    void handleAddComment(e);
                  }}
                  disabled={!commentText.trim() || submittingComment}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/70 hover:text-white hover:border-white/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Lightbox modal */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
            onClick={() => setShowLightbox(false)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="max-w-[96%] max-h-[96%] w-full h-full relative flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowLightbox(false)}
                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center border border-white/10"
                aria-label="Close media preview"
              >
                <X className="h-5 w-5 text-white/90" />
              </button>

              {isVideoPost ? (
                <video src={post.mediaUrl} controls autoPlay className="max-w-full max-h-full object-contain rounded-xl" />
              ) : (
                <img src={post.mediaUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
