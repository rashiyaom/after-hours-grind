import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, X, Heart, MessageCircle, Share2, Send,
  Play, Image as ImageIcon, Filter, Bookmark, ArrowUpRight,
  Flame, TrendingUp,
} from "lucide-react";
import FeedPostCard from "@/components/FeedPostCard";
import { useStore } from "@/hooks/useStore";
import { useAppStore } from "@/hooks/useStore";
import { useCurrentUser, usePermissions } from "@/hooks/useStore";
import { Post } from "@/types";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { filterPostsByTab } from "@/lib/feedFilters";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";
import { createPortal } from "react-dom";
import { fetchFeedFromBackend } from "@/lib/api";

const TABS = ["All", "Videos", "Photos"] as const;

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
  } catch { return ts; }
}

export default function FeedPage() {
  const { posts, likePost, addComment, loading, setLoading } = useStore();
  const currentUser = useCurrentUser();
  const permissions = usePermissions();
  const canPostFeed = Boolean(currentUser && permissions[currentUser.role].post_feed);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("All");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState("");

  const activePost = selectedPost ? posts.find((p) => p.id === selectedPost.id) : null;

  useEffect(() => {
    let isMounted = true;

    const hydrateFeed = async () => {
      setLoading(true);
      try {
        const remotePosts = await fetchFeedFromBackend();
        if (!isMounted || remotePosts.length === 0) return;

        useAppStore.setState((prev) => ({
          ...prev,
          posts: remotePosts.reduce((acc, post) => {
            acc[post.id] = post;
            return acc;
          }, {} as Record<string, Post>),
        }));
      } catch {
        // Keep local mock/store posts as fallback if backend is not reachable.
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void hydrateFeed();
    return () => {
      isMounted = false;
    };
  }, [setLoading]);

  const handleComment = () => {
    if (!commentText.trim() || !activePost) return;
    addComment(activePost.id, commentText);
    toast.success("Comment posted!");
    setCommentText("");
  };

  const filteredPosts = filterPostsByTab(posts, activeTab);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-44 rounded-2xl" />
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-24 rounded-full" />)}
        </div>
        <div className="space-y-6">
          {[1, 2].map((i) => <Skeleton key={i} className="h-[440px] w-full rounded-[28px]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6 lg:p-8">

      {/* ── Post detail modal ────────────────────────────── */}
      <AnimatePresence>
        {activePost && createPortal(
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[100] cursor-zoom-out"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 32 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 32 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-1/2 top-1/2 z-[101] w-[calc(100vw-1.25rem)] max-w-[1120px] h-[min(90vh,900px)] -translate-x-1/2 -translate-y-1/2 rounded-[32px] overflow-hidden flex flex-col md:flex-row border border-white/10 bg-[#0D0D0D] shadow-[0_0_120px_rgba(0,0,0,0.9)]"
            >
              {/* ─ Left: media ─────────────────────────── */}
              <div className="flex-1 relative flex items-center justify-center bg-[#080808] min-h-[320px] md:min-h-0 border-b md:border-b-0 md:border-r border-white/5 overflow-hidden group">
                <div className="absolute inset-0"
                  style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "32px 32px" }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#C9F85A]/4 via-transparent to-[#4DD2FF]/4" />

                {/* watermark */}
                <span className="text-[18rem] font-black select-none pointer-events-none text-white/[0.025] group-hover:text-white/[0.04] transition-opacity duration-1000">
                  TAH
                </span>

                {/* media icon center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    className="w-20 h-20 rounded-full bg-[#C9F85A]/10 border border-[#C9F85A]/25 flex items-center justify-center"
                  >
                    {activePost.type === "reel"
                      ? <Play className="h-9 w-9 text-[#C9F85A] fill-[#C9F85A]/20 ml-1" />
                      : <ImageIcon className="h-9 w-9 text-[#C9F85A]" />
                    }
                  </motion.div>
                </div>

                {/* close + type badge */}
                <div className="absolute top-5 left-5 flex items-center gap-3 z-10">
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <span className="rounded-full bg-[#C9F85A] px-3 py-1 text-[10px] font-bold text-black uppercase tracking-wider hidden md:block">
                    {activePost.type === "reel" ? "Video" : "Photo"}
                  </span>
                </div>
              </div>

              {/* ─ Right: interaction panel ─────────────── */}
              <div className="w-full md:w-[420px] flex flex-col bg-[#0F0F0F] h-[60vh] md:h-full">
                {/* user info */}
                <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3 flex-shrink-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C9F85A] to-[#4DD2FF] p-[1.5px]">
                    <div className="w-full h-full rounded-[13px] bg-[#1A1A1A] flex items-center justify-center text-[11px] font-bold text-white">
                      {getInitials(activePost.userName)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{activePost.userName}</p>
                    <p className="text-[10px] text-white/35">{activePost.location} · {timeAgo(activePost.timestamp)}</p>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-[#1D1D1D] border border-white/8 flex items-center justify-center text-white/40 hover:text-white transition-all">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* scroll area: caption + comments */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* caption */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#1D1D1D] flex items-center justify-center text-[10px] font-bold text-white/50 flex-shrink-0">
                      {getInitials(activePost.userName)}
                    </div>
                    <div>
                      <p className="text-sm text-white/80 leading-relaxed">
                        <span className="font-semibold text-white mr-1">{activePost.userName}</span>
                        {activePost.caption}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {["#AfterHours", "#Grind"].map((tag) => (
                          <span key={tag} className="text-[10px] font-semibold text-[#C9F85A]/60">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* comments */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                        {activePost.comments} comments
                      </p>
                      <Filter className="h-3.5 w-3.5 text-white/20" />
                    </div>
                    {[
                      { user: "Coach Vikram", text: "Superior form on those reps. Keep the delta consistent. 🚀" },
                      { user: "Rohan Patel", text: "Visual aesthetic is high. Sync up for the next session?" },
                      { user: "Priya Sharma", text: "Unmatched consistency. 🔥" },
                    ].map((c, i) => (
                      <div key={i} className="flex gap-3 group">
                        <div className="w-8 h-8 rounded-xl bg-[#1D1D1D] border border-white/5 flex items-center justify-center text-[9px] font-bold text-white/50 flex-shrink-0 group-hover:border-[#C9F85A]/20 transition-colors">
                          {getInitials(c.user)}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-xs leading-relaxed text-white/70">
                            <span className="font-semibold text-white mr-1.5">{c.user}</span>
                            {c.text}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/25">
                            <span>0{i + 2}h ago</span>
                            <button className="hover:text-[#C9F85A] transition-colors font-medium">Reply</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* actions + comment input */}
                <div className="px-6 py-5 border-t border-white/5 space-y-4 flex-shrink-0">
                  {/* action row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.button whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); likePost(activePost.id); }}>
                        <Heart className={`transition-all ${activePost.liked ? "text-[#FF4D00] fill-[#FF4D00]" : "text-white/50 hover:text-white"}`} style={{ width: 22, height: 22 }} />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.85 }}>
                        <MessageCircle className="text-white/50 hover:text-white transition-colors" style={{ width: 22, height: 22 }} />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.85 }} onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Link copied!");
                      }}>
                        <Share2 className="text-white/50 hover:text-white transition-colors" style={{ width: 22, height: 22 }} />
                      </motion.button>
                    </div>
                    <p className="text-sm font-bold text-white">{activePost.likes.toLocaleString()} <span className="text-white/30 font-normal text-xs">likes</span></p>
                  </div>

                  {/* comment input */}
                  <div className="relative">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleComment(); }}
                      placeholder="Add a comment…"
                      className="w-full bg-[#1A1A1A] border border-white/8 rounded-2xl px-5 py-3.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C9F85A]/40 pr-14 transition-all"
                    />
                    <AnimatePresence>
                      {commentText.trim() && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={handleComment}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#C9F85A] flex items-center justify-center text-black hover:bg-[#d4ff60] transition-all"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </>,
          document.body
        )}
      </AnimatePresence>

      {/* ── Feed header ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#C9F85A]/4 translate-x-12 -translate-y-12 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#C9F85A]/10 border border-[#C9F85A]/20 px-3 py-1.5 mb-3">
              <Flame className="h-3.5 w-3.5 text-[#C9F85A]" />
              <span className="text-xs font-bold text-[#C9F85A] uppercase tracking-wider">Live Feed</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight leading-none">The Grind Feed</h1>
            <p className="text-sm text-white/40 mt-1">{filteredPosts.length} posts · Community activity</p>
          </div>

          {canPostFeed && (
            <Link
              to="/student/upload"
              className="inline-flex items-center gap-2 rounded-full bg-[#C9F85A] text-black px-5 py-3 text-sm font-bold hover:bg-[#d4ff60] transition-all shadow-[0_8px_32px_rgba(201,248,90,0.25)] hover:shadow-[0_8px_40px_rgba(201,248,90,0.35)] flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:block">Post</span>
            </Link>
          )}
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-white/5 relative z-10">
          {[
            { label: "Posts today", value: String(filteredPosts.length), color: "#C9F85A" },
            { label: "Total likes", value: filteredPosts.reduce((a, p) => a + p.likes, 0).toLocaleString(), color: "#FF4D00" },
            { label: "Active members", value: new Set(filteredPosts.map((p) => p.userId)).size.toString(), color: "#4DD2FF" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl bg-[#1A1A1A] border border-white/5 px-4 py-2.5 flex items-center gap-2">
              <span className="text-base font-bold" style={{ color: k.color }}>{k.value}</span>
              <span className="text-[10px] text-white/30 uppercase tracking-wider">{k.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Tab filter ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.08 }}
        className="flex gap-2"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              activeTab === tab
                ? "bg-[#C9F85A] text-black"
                : "bg-[#1A1A1A] border border-white/8 text-white/50 hover:text-white hover:bg-[#202020]"
            }`}
          >
            {tab === "Videos" && <Play className="h-3 w-3" />}
            {tab === "Photos" && <ImageIcon className="h-3 w-3" />}
            {tab}
          </button>
        ))}
      </motion.div>

      {/* ── Posts list ───────────────────────────────────── */}
      {filteredPosts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-[32px] border border-dashed border-white/10 bg-[#0D0D0D] p-16 text-center"
        >
          <TrendingUp className="h-10 w-10 text-white/15 mx-auto mb-3" />
          <p className="text-sm text-white/30">No posts for this filter.</p>
        </motion.div>
      ) : (
        <div className="space-y-6 pb-10">
          {filteredPosts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.07 }}
            >
              <FeedPostCard post={post} onClick={() => setSelectedPost(post)} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
