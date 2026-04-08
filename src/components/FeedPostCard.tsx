import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Play, Image as ImageIcon, ArrowUpRight } from "lucide-react";
import { Post } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
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

export default function FeedPostCard({ post, onClick }: { post: Post; onClick?: () => void }) {
  const { likePost } = useStore();
  const [bookmarked, setBookmarked] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const colorIdx = post.id.charCodeAt(post.id.length - 1) % MEDIA_PALETTES.length;
  const palette = MEDIA_PALETTES[colorIdx];
  const gradIdx = post.userId.charCodeAt(0) % AVATAR_GRADIENTS.length;

  const handleLike = (e: React.MouseEvent) => { e.stopPropagation(); likePost(post.id); };
  const stop = (e: React.MouseEvent) => e.stopPropagation();

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
            <p className="text-sm font-semibold text-white leading-tight">{post.userName}</p>
            <p className="text-[10px] text-white/35 mt-0.5">{post.location} · {timeAgo(post.timestamp)}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2" onClick={stop}>
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
              {[
                { user: "Coach Vikram", text: "Excellent effort! 💪", initials: "CV" },
                { user: "Priya Sharma", text: "Keep going! 🔥", initials: "PS" },
              ].map((c, i) => (
                <div key={i} className="flex gap-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-[#1D1D1D] border border-white/8 flex items-center justify-center text-[9px] font-bold text-white/60 flex-shrink-0">
                    {c.initials}
                  </div>
                  <div>
                    <span className="font-semibold text-white">{c.user}</span>
                    <span className="text-white/50 ml-1.5">{c.text}</span>
                    <p className="text-[10px] text-white/25 mt-0.5">2h ago · Reply</p>
                  </div>
                </div>
              ))}

              {/* add comment input */}
              <div className="flex gap-3 items-center mt-3">
                <div className="w-7 h-7 rounded-full bg-[#C9F85A]/20 border border-[#C9F85A]/30 flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-[#C9F85A]">
                  ME
                </div>
                <input
                  placeholder="Add a comment…"
                  className="flex-1 bg-[#1A1A1A] border border-white/8 rounded-full px-4 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-[#C9F85A]/30 transition-colors"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
