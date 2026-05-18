import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, CheckCircle2, MessageCircle, X, Sparkles,
  Flame, ChevronRight, Users,
} from "lucide-react";
import { useStore, useAppStore } from "@/hooks/useStore";
import { Link, useNavigate } from "react-router-dom";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";
import { toast } from "sonner";
import { fetchFollowingAPI } from "@/lib/api";

const AVATAR_GRADIENTS = [
  "from-[#C9F85A] to-[#4DD2FF]",
  "from-[#FF7AE5] to-[#A78BFA]",
  "from-[#FFD36E] to-[#FF4D00]",
  "from-[#4DD2FF] to-[#6F5CFF]",
  "from-[#C9F85A] to-[#FFD36E]",
  "from-[#10B981] to-[#4DD2FF]",
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface SuggestedAthletesProps {
  /** "feed" = horizontal scroll strip, "explore" = full grid */
  variant?: "feed" | "explore";
  /** Max number of suggestions to show */
  limit?: number;
  /** Show the "View all" link */
  showViewAll?: boolean;
}

export default function SuggestedAthletes({
  variant = "feed",
  limit = 10,
  showViewAll = true,
}: SuggestedAthletesProps) {
  const { student, suggestedUsers, followUser, unfollowUser } = useStore();
  const createOrGetChatThread = useAppStore((state) => state.createOrGetChatThread);
  const navigate = useNavigate();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const suggestions = useMemo(() => {
    return suggestedUsers
      .filter((u) => u.id !== student.id && !dismissedIds.has(u.id))
      .slice(0, limit);
  }, [suggestedUsers, student.id, dismissedIds, limit]);

  useEffect(() => {
    const loadFollowing = async () => {
      try {
        const following = await fetchFollowingAPI(student.id);
        const ids = new Set((following as Array<{ following: { id: string } }>).map(f => f.following.id));
        setFollowingIds(ids);
      } catch (e) {
        import("@sentry/react").then(({ default: Sentry }) => {
          Sentry.captureException(e, { tags: { component: "SuggestedAthletes", action: "fetch_following" } });
        });
      }
    };
    void loadFollowing();
  }, [student.id]);

  const handleFollow = async (userId: string) => {
    if (loadingIds.has(userId)) return;
    setLoadingIds((prev) => new Set(prev).add(userId));
    try {
      if (followingIds.has(userId)) {
        await unfollowUser(userId);
        setFollowingIds((prev) => { const s = new Set(prev); s.delete(userId); return s; });
        toast.info("Unfollowed");
      } else {
        await followUser(userId);
        setFollowingIds((prev) => new Set(prev).add(userId));
        toast.success("Following!");
      }
    } catch {
      toast.error("Could not update follow status");
    } finally {
      setLoadingIds((prev) => { const s = new Set(prev); s.delete(userId); return s; });
    }
  };

  const handleMessage = (userId: string) => {
    createOrGetChatThread(userId);
    navigate("/student/community");
  };

  const handleDismiss = (userId: string) => {
    setDismissedIds((prev) => new Set(prev).add(userId));
  };

  if (suggestions.length === 0) return null;

  /* ── Feed variant: horizontal scroll strip ─────────── */
  if (variant === "feed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-[28px] border border-white/10 bg-[#111111] p-5 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#C9F85A]/10 border border-[#C9F85A]/20">
              <Sparkles className="h-3.5 w-3.5 text-[#C9F85A]" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Suggested for you</p>
              <p className="text-[10px] text-white/30">Athletes you might know</p>
            </div>
          </div>
          {showViewAll && (
            <Link
              to="/student/explore"
              className="text-[11px] font-semibold text-[#C9F85A] hover:text-[#d4ff60] transition-colors flex items-center gap-1"
            >
              See All <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          <AnimatePresence>
            {suggestions.map((user, i) => {
              const gradIdx = user.id.charCodeAt(0) % AVATAR_GRADIENTS.length;
              const isFollowed = followingIds.has(user.id);
              const isLoading = loadingIds.has(user.id);

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.85, x: -20 }}
                  transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.04 }}
                  className="flex-shrink-0 w-[150px] rounded-[20px] border border-white/8 bg-[#0D0D0D] p-4 flex flex-col items-center gap-3 relative group hover:border-white/15 transition-all"
                >
                  {/* Dismiss */}
                  <button
                    onClick={() => handleDismiss(user.id)}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>

                  {/* Avatar */}
                  <Link to={`/student/profile/${user.id}`} className="relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${AVATAR_GRADIENTS[gradIdx]} p-[2px]`}>
                      <div className="w-full h-full rounded-[14px] bg-[#1A1A1A] flex items-center justify-center text-base font-bold text-white">
                        {getInitials(user.name)}
                      </div>
                    </div>
                    {user.streak > 7 && (
                      <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 bg-[#111] border border-[#FF4D00]/40 rounded-full px-1.5 py-0.5">
                        <Flame className="h-2.5 w-2.5 text-[#FF4D00]" />
                        <span className="text-[8px] font-bold text-[#FF4D00]">{user.streak}</span>
                      </div>
                    )}
                  </Link>

                  {/* Name + info */}
                  <div className="text-center w-full">
                    <Link
                      to={`/student/profile/${user.id}`}
                      className="text-xs font-semibold text-white truncate block hover:text-[#C9F85A] transition-colors"
                    >
                      {user.name}
                    </Link>
                    <p className="text-[10px] text-white/25 mt-0.5 flex items-center justify-center gap-1">
                      <Users className="h-2.5 w-2.5" />
                      {user.mutualFriends} mutual
                    </p>
                  </div>

                  {/* Follow/Message */}
                  <div className="flex gap-1.5 w-full">
                    <button
                      onClick={() => { void handleFollow(user.id); }}
                      disabled={isLoading}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all ${
                        isFollowed
                          ? "bg-[#1D1D1D] border border-white/10 text-white/50"
                          : "bg-[#C9F85A] text-black hover:bg-[#d4ff60] shadow-[0_2px_10px_rgba(201,248,90,0.2)]"
                      } disabled:opacity-60`}
                    >
                      {isFollowed
                        ? <><CheckCircle2 className="h-3 w-3" />Following</>
                        : <><UserPlus className="h-3 w-3" />Follow</>
                      }
                    </button>
                    <button
                      onClick={() => handleMessage(user.id)}
                      className="w-8 rounded-xl bg-[#1D1D1D] border border-white/10 flex items-center justify-center text-white/40 hover:text-[#4DD2FF] hover:border-[#4DD2FF]/25 transition-all"
                    >
                      <MessageCircle className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  /* ── Explore variant: full grid ────────────────────── */
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <AnimatePresence>
        {suggestions.map((user, i) => {
          const gradIdx = user.id.charCodeAt(0) % AVATAR_GRADIENTS.length;
          const isFollowed = followingIds.has(user.id);
          const isLoading = loadingIds.has(user.id);

          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.03 }}
              className="rounded-[24px] border border-white/10 bg-[#121212] p-5 flex flex-col items-center gap-3.5 relative group hover:border-white/20 transition-all"
            >
              {/* Dismiss */}
              <button
                onClick={() => handleDismiss(user.id)}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              {/* Avatar with glow */}
              <Link to={`/student/profile/${user.id}`} className="relative">
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                  style={{ background: `${AVATAR_GRADIENTS[gradIdx].includes("C9F85A") ? "#C9F85A" : "#4DD2FF"}30` }}
                />
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${AVATAR_GRADIENTS[gradIdx]} p-[2.5px] relative`}>
                  <div className="w-full h-full rounded-[14px] bg-[#1A1A1A] flex items-center justify-center text-xl font-bold text-white">
                    {getInitials(user.name)}
                  </div>
                </div>
                {user.streak > 7 && (
                  <div className="absolute -bottom-1.5 -right-1.5 flex items-center gap-0.5 bg-[#111] border border-[#FF4D00]/40 rounded-full px-2 py-0.5 shadow-lg">
                    <Flame className="h-3 w-3 text-[#FF4D00]" />
                    <span className="text-[9px] font-bold text-[#FF4D00]">{user.streak}d</span>
                  </div>
                )}
              </Link>

              {/* Name + stats */}
              <div className="text-center w-full">
                <Link
                  to={`/student/profile/${user.id}`}
                  className="text-sm font-semibold text-white truncate block hover:text-[#C9F85A] transition-colors"
                >
                  {user.name}
                </Link>
                <div className="flex items-center justify-center gap-3 mt-1.5 text-[10px] text-white/25">
                  <span className="flex items-center gap-1">
                    <Users className="h-2.5 w-2.5" />
                    {user.mutualFriends} mutual
                  </span>
                  <span>Rank #{user.rank}</span>
                </div>
                <p className="text-[10px] text-white/35 mt-1">
                  {user.completionPercentage}% completion
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => { void handleFollow(user.id); }}
                  disabled={isLoading}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isFollowed
                      ? "bg-[#1D1D1D] border border-white/10 text-white/50"
                      : "bg-[#C9F85A] text-black hover:bg-[#d4ff60] shadow-[0_4px_16px_rgba(201,248,90,0.25)]"
                  } disabled:opacity-60`}
                >
                  {isFollowed
                    ? <><CheckCircle2 className="h-3.5 w-3.5" />Following</>
                    : <><UserPlus className="h-3.5 w-3.5" />Follow</>
                  }
                </button>
                <button
                  onClick={() => handleMessage(user.id)}
                  className="w-10 rounded-xl bg-[#1D1D1D] border border-white/10 flex items-center justify-center text-white/40 hover:text-[#4DD2FF] hover:border-[#4DD2FF]/25 transition-all"
                  title="Message"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
