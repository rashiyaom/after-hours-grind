import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Users, Award, Calendar, Settings,
  Edit2, Share2, MapPin, UserPlus, Star,
  TrendingUp, CheckCircle2, Grid3X3, ChevronRight,
} from "lucide-react";
import { useAppStore, useStore } from "@/hooks/useStore";
import { useState, useMemo, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ProfileCardSkeleton } from "@/components/Skeletons";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";
import { fetchFollowersAPI, fetchFollowingAPI, fetchUserProfileAPI } from "@/lib/api";

const POST_PALETTES = [
  { bg: "from-[#0D1117] to-[#1a1f2e]", accent: "#4DD2FF" },
  { bg: "from-[#110D17] to-[#1e1a2e]", accent: "#A78BFA" },
  { bg: "from-[#0F1710] to-[#1a2e1a]", accent: "#C9F85A" },
  { bg: "from-[#17120D] to-[#2e221a]", accent: "#FFD36E" },
  { bg: "from-[#17100D] to-[#2e1a1a]", accent: "#FF4D00" },
  { bg: "from-[#0D1117] to-[#111827]", accent: "#FF7AE5" },
];

const AVATAR_GRADIENTS = [
  ["#C9F85A", "#4DD2FF"],
  ["#FF7AE5", "#A78BFA"],
  ["#FFD36E", "#FF4D00"],
  ["#4DD2FF", "#6F5CFF"],
  ["#C9F85A", "#FFD36E"],
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const tabs = ["Posts", "Stats"] as const;
type Tab = typeof tabs[number];

// Typed view of the resolved profile — covers both own and other-user data shapes
type ProfileView = {
  id: string;
  name: string;
  avatar?: string;
  streak: number;
  rank: number;
  completionPercentage: number;
  followers: number;
  following: number;
  collegeId?: string;
  totalPoints?: number;
  currentDay?: number;
  totalDays?: number;
  height?: number;
  weight?: number;
  fitnessGoal?: string;
};

type SocialListItem = {
  id: string;
  name: string;
  avatar: string;
};

function normalizeSocialList(
  edges: Array<Record<string, unknown>>,
  direction: "followers" | "following"
): SocialListItem[] {
  return edges
    .map((edge) => {
      const candidate = (direction === "followers" ? edge.follower : edge.following) as Record<string, unknown> | undefined;
      if (!candidate || typeof candidate.id !== "string") return null;
      return {
        id: candidate.id,
        name: typeof candidate.name === "string" ? candidate.name : "User",
        avatar: typeof candidate.avatar === "string" ? candidate.avatar : "",
      };
    })
    .filter((item): item is SocialListItem => Boolean(item));
}

export default function ProfilePage() {
  const { userId } = useParams();
  const { student: me, posts, students, loading, followUser, unfollowUser } = useStore();
  const users = useAppStore((state) => state.users);
  const leaderboard = useAppStore((state) => state.system.leaderboardEntries);
  const [activeTab, setActiveTab] = useState<Tab>("Posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [socialOpen, setSocialOpen] = useState<"followers" | "following" | null>(null);
  const [followersList, setFollowersList] = useState<SocialListItem[]>([]);
  const [followingList, setFollowingList] = useState<SocialListItem[]>([]);
  const [fetchedProfile, setFetchedProfile] = useState<Record<string, unknown> | null>(null);

  const isMe = !userId || userId === me.id;

  // Reset fetchedProfile when userId changes so we don't flash stale data
  useEffect(() => {
    setFetchedProfile(null);
  }, [userId]);

  useEffect(() => {
    let isMounted = true;
    const loadSocial = async () => {
      const targetId = isMe ? me.id : userId;
      if (!targetId) return;
      setSocialLoading(true);
      if (!isMe) setProfileLoading(true);
      try {
        const [profile, followers, following] = await Promise.all([
          fetchUserProfileAPI(targetId),
          fetchFollowersAPI(targetId),
          fetchFollowingAPI(targetId),
        ]);
        if (!isMounted) return;
        setFetchedProfile(profile);
        setFollowersList(normalizeSocialList(followers as Array<Record<string, unknown>>, "followers"));
        setFollowingList(normalizeSocialList(following as Array<Record<string, unknown>>, "following"));
        setIsFollowing(Boolean(profile.isFollowing));
      } catch {
        if (!isMounted) return;
        setFollowersList([]);
        setFollowingList([]);
      } finally {
        if (isMounted) {
          setSocialLoading(false);
          setProfileLoading(false);
        }
      }
    };
    void loadSocial();
    return () => { isMounted = false; };
  }, [isMe, me.id, userId]);

  // Derive own rank from leaderboard if me.rank is 0
  const myRankFromLeaderboard = useMemo(() => {
    if (me.rank && me.rank > 0) return me.rank;
    const entry = leaderboard.find((e) => e.userId === me.id);
    return entry?.rank ?? 0;
  }, [me.rank, me.id, leaderboard]);

  const sRaw = useMemo(() => {
    if (isMe) return { ...me, rank: myRankFromLeaderboard };
    if (fetchedProfile) {
      // rank can be at top-level OR inside studentProfile depending on backend response shape
      const sp = fetchedProfile.studentProfile as Record<string, unknown> | undefined;
      const rank =
        typeof fetchedProfile.rank === "number" && fetchedProfile.rank > 0
          ? (fetchedProfile.rank as number)
          : typeof sp?.rank === "number"
            ? (sp.rank as number)
            : 0;
      return {
        ...me,
        id: fetchedProfile.id || userId,
        name: fetchedProfile.name || "User",
        avatar: fetchedProfile.avatar || "",
        streak: typeof sp?.streak === "number" ? sp.streak : (typeof fetchedProfile.streak === "number" ? fetchedProfile.streak as number : 0),
        rank,
        completionPercentage: typeof sp?.completionPercentage === "number" ? sp.completionPercentage : 0,
        followers: typeof fetchedProfile.followersCount === "number" ? fetchedProfile.followersCount : 0,
        following: typeof fetchedProfile.followingCount === "number" ? fetchedProfile.followingCount : 0,
        collegeId: (sp?.collegeId ?? fetchedProfile.collegeId) as string | undefined,
        totalPoints: typeof sp?.totalPoints === "number" ? sp.totalPoints : (typeof fetchedProfile.totalPoints === "number" ? fetchedProfile.totalPoints as number : 0),
        currentDay: typeof sp?.currentDay === "number" ? sp.currentDay : undefined,
        totalDays: typeof sp?.totalDays === "number" ? sp.totalDays : undefined,
        height: typeof sp?.heightCm === "number" ? sp.heightCm : (typeof sp?.height === "number" ? sp.height : undefined),
        weight: typeof sp?.weightKg === "number" ? sp.weightKg : (typeof sp?.weight === "number" ? sp.weight : undefined),
        fitnessGoal: typeof sp?.fitnessGoal === "string" ? sp.fitnessGoal : (typeof fetchedProfile.fitnessGoal === "string" ? fetchedProfile.fitnessGoal as string : undefined),
      };
    }
    if (userId) {
      const selected = users[userId];
      if (selected) {
        return {
          ...me,
          id: selected.id,
          name: selected.name,
          avatar: selected.avatar,
          streak: selected.role === "student" ? selected.streak : 0,
          rank: selected.role === "student" ? selected.rank : 0,
          completionPercentage: selected.role === "student" ? selected.completionPercentage : 0,
          followers: selected.role === "student" ? selected.followers : 0,
          following: selected.role === "student" ? selected.following : 0,
          collegeId: selected.collegeId,
          totalPoints: (selected as any).totalPoints ?? 0,
        };
      }
    }
    const found = students.find((l) => l.userId === userId);
    return found
      ? { ...me, id: found.userId, name: found.name, streak: found.streak, rank: found.rank, completionPercentage: found.completionPercentage, followers: 0, following: 0 }
      : me;
  }, [userId, isMe, me, students, users, fetchedProfile, myRankFromLeaderboard]);

  const s = sRaw as ProfileView;
  const gradIdx = String(s.id || '').charCodeAt(0) % AVATAR_GRADIENTS.length;
  const [gradFrom, gradTo] = AVATAR_GRADIENTS[gradIdx];
  const userPosts = useMemo(() => posts.filter((post) => post.userId === s.id), [posts, s.id]);
  const followersCount = followersList.length > 0 ? followersList.length : s.followers;
  const followingCount = followingList.length > 0 ? followingList.length : s.following;

  const recentRewards = useMemo(() => {
    const rewards = (fetchedProfile?.rewardTransactions as Array<Record<string, unknown>> | undefined) ?? [];
    return rewards.map((reward) => ({
      id: String(reward.id ?? reward.createdAt ?? Math.random()),
      kind: typeof reward.kind === "string" ? reward.kind : "reward",
      reason: typeof reward.reason === "string" ? reward.reason : "Reward recorded",
      delta: Number(reward.delta ?? 0),
      createdAt: typeof reward.createdAt === "string" ? reward.createdAt : "",
    }));
  }, [fetchedProfile]);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowUser(s.id);
        setIsFollowing(false);
        setFollowersList((prev) => prev.filter((entry) => entry.id !== me.id));
        toast.info(`Unfollowed ${s.name}`);
      } else {
        await followUser(s.id);
        setIsFollowing(true);
        setFollowersList((prev) =>
          prev.some((entry) => entry.id === me.id)
            ? prev
            : [{ id: me.id, name: me.name, avatar: me.avatar }, ...prev]
        );
        toast.success(`Following ${s.name}!`);
      }
    } catch {
      toast.error("Could not update follow status");
    }
  };

  // Show skeleton while fetching other user's profile (prevents the flash-of-current-user bug)
  if (loading || (!isMe && profileLoading && !fetchedProfile)) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
        <ProfileCardSkeleton />
      </div>
    );
  }

  const levelNum = Math.floor(s.completionPercentage / 20) + 1;

  return (
    <div className="min-h-screen bg-[#080808] pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:pb-10 overflow-x-hidden">

      {/* ── Hero Banner ─── */}
      <div className="relative overflow-hidden">
        {/* Full-bleed gradient banner */}
        <div
          className="h-44 sm:h-56 w-full relative"
          style={{
            background: `linear-gradient(135deg, ${gradFrom}22 0%, ${gradTo}18 50%, #080808 100%)`,
          }}
        >
          {/* Animated orbs */}
          <div
            className="absolute -top-10 -left-10 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ background: gradFrom }}
          />
          <div
            className="absolute -bottom-10 right-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: gradTo }}
          />
          {/* Dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(white 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
            }}
          />
          {/* Settings / Share CTA at top right */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            {isMe ? (
              <Link
                to="/student/settings"
                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-90"
              >
                <Settings className="h-4 w-4" />
              </Link>
            ) : (
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-90"
              >
                <Share2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Avatar overlapping the banner */}
        <div className="absolute left-5 sm:left-8" style={{ bottom: "-2.5rem" }}>
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.1 }}
            className="relative"
          >
            {/* Pulsing outer ring */}
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.15, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
              className="absolute inset-0 rounded-[26px]"
              style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}
            />
            {/* Avatar border */}
            <div
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[24px] p-[2.5px] shadow-xl"
              style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}
            >
              <div className="w-full h-full rounded-[22px] bg-[#141414] flex items-center justify-center text-3xl sm:text-4xl font-black text-white border-2 border-[#141414]">
                {getInitials(s.name)}
              </div>
            </div>
            {/* Streak badge */}
            <div className="absolute -bottom-2 -right-2 flex items-center gap-1 bg-[#111] border border-[#FF4D00]/50 rounded-full px-2 py-0.5 shadow-lg">
              <Flame className="h-3 w-3 text-[#FF4D00]" />
              <span className="text-[10px] font-bold text-[#FF4D00]">{s.streak}d</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Profile info below banner ── */}
      <div className="px-5 sm:px-8 pt-14 sm:pt-16 space-y-4">

        {/* Name + action buttons row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={LUXURY_TWEEN_MEDIUM}
          className="flex items-start justify-between gap-3"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">{s.name}</h1>
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
                style={{ background: `${gradFrom}18`, borderColor: `${gradFrom}35`, color: gradFrom }}
              >
                Lv.{levelNum}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-white/40">
              {s.collegeId && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {s.collegeId}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-[#FFD36E]" />
                {s.completionPercentage}% complete
              </span>
            </div>
            {s.fitnessGoal && (
              <p className="mt-2 text-sm text-white/45 leading-relaxed max-w-xs">
                {s.fitnessGoal}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 flex-shrink-0 mt-1">
            {isMe ? (
              <Link
                to="/student/settings"
                className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all active:scale-95 border"
                style={{
                  background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
                  color: "#000",
                  borderColor: "transparent",
                  boxShadow: `0 6px 20px ${gradFrom}30`,
                }}
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit
              </Link>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleFollow}
                disabled={socialLoading}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all border ${isFollowing
                  ? "bg-white/[0.04] border-white/10 text-white/60"
                  : "text-black border-transparent"
                  }`}
                style={!isFollowing ? {
                  background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
                  boxShadow: `0 6px 20px ${gradFrom}30`,
                } : {}}
              >
                {isFollowing ? <><CheckCircle2 className="h-3.5 w-3.5" />Following</> : <><UserPlus className="h-3.5 w-3.5" />Follow</>}
              </motion.button>
            )}
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
              className="w-full h-9 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all active:scale-90"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>

        {/* ── Social stats row ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.08 }}
          className="flex items-center gap-0 rounded-2xl overflow-hidden border border-white/8 bg-[#111]"
        >
          {[
            { label: "Posts", value: userPosts.length, onClick: undefined },
            { label: "Followers", value: followersCount, onClick: () => setSocialOpen("followers") },
            { label: "Following", value: followingCount, onClick: () => setSocialOpen("following") },
          ].map((st, i) => (
            <button
              key={st.label}
              type="button"
              onClick={st.onClick}
              disabled={!st.onClick || socialLoading}
              className={`flex-1 py-3.5 text-center transition-all active:bg-white/5 ${i > 0 ? "border-l border-white/8" : ""} ${st.onClick ? "cursor-pointer" : "cursor-default"}`}
            >
              <p className="text-lg font-black text-white">{st.value.toLocaleString()}</p>
              <p className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">{st.label}</p>
            </button>
          ))}
        </motion.div>

        {/* ── Mini stat chips ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.12 }}
          className="grid grid-cols-4 gap-2"
        >
          {[
            { label: "Streak", value: `${s.streak}d`, color: "#FF4D00", icon: Flame, bg: "rgba(255,77,0,0.08)" },
            { label: "Rank", value: s.rank > 0 ? `#${s.rank}` : "–", color: "#FFD36E", icon: TrendingUp, bg: "rgba(255,211,110,0.08)" },
            { label: "Points", value: (s.totalPoints ?? 0) >= 1000 ? `${((s.totalPoints ?? 0) / 1000).toFixed(1)}k` : String(s.totalPoints ?? 0), color: "#C9F85A", icon: Award, bg: "rgba(201,248,90,0.08)" },
            { label: "Day", value: String(s.currentDay ?? 1), color: "#4DD2FF", icon: Calendar, bg: "rgba(77,210,255,0.08)" },
          ].map((st, i) => (
            <motion.div
              key={st.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.14 + i * 0.05 }}
              className="rounded-2xl border border-white/8 p-3 text-center relative overflow-hidden"
              style={{ background: st.bg }}
            >
              <st.icon className="h-3.5 w-3.5 mx-auto mb-1" style={{ color: st.color }} />
              <p className="text-lg font-black leading-tight" style={{ color: st.color }}>{st.value}</p>
              <p className="text-[9px] text-white/35 mt-0.5 uppercase tracking-wider">{st.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Tab switcher ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.18 }}
          className="flex gap-1 p-1 bg-[#111] border border-white/8 rounded-2xl"
        >
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === t
                ? "text-black"
                : "text-white/40 hover:text-white/70"
                }`}
              style={activeTab === t ? {
                background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
              } : {}}
            >
              {t}
            </button>
          ))}
        </motion.div>

        {/* ── Posts grid ── */}
        <AnimatePresence mode="wait">
          {activeTab === "Posts" && (
            <motion.div
              key="posts"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-3 gap-2"
            >
              {userPosts.map((post, i) => {
                const palette = POST_PALETTES[i % POST_PALETTES.length];
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.04 }}
                    className={`aspect-square rounded-2xl bg-gradient-to-br ${palette.bg} flex items-center justify-center relative group cursor-pointer overflow-hidden border border-white/5`}
                  >
                    <span
                      className="text-4xl font-black select-none pointer-events-none opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500"
                      style={{ color: palette.accent }}
                    >
                      TAH
                    </span>
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                      style={{ background: `${palette.accent}18`, backdropFilter: "blur(2px)" }}
                    >
                      <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-full border border-white/10">
                        <Users className="h-3 w-3 text-white" />
                        <span className="text-[10px] font-bold text-white">{post.likes}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {userPosts.length === 0 && (
                <div className="col-span-3 rounded-2xl border border-dashed border-white/12 flex flex-col items-center justify-center py-14 gap-3">
                  <Grid3X3 className="h-8 w-8 text-white/20" />
                  <p className="text-sm text-white/30">No posts yet</p>
                  {isMe && (
                    <Link
                      to="/student/upload"
                      className="mt-1 text-xs font-bold px-4 py-2 rounded-full border"
                      style={{ borderColor: `${gradFrom}40`, color: gradFrom, background: `${gradFrom}10` }}
                    >
                      Share your first workout
                    </Link>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Stats tab ── */}
          {activeTab === "Stats" && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* Athlete Specs */}
              <div className="rounded-3xl border border-white/8 bg-[#0F0F0F] p-5 space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 rounded-full" style={{ background: gradFrom }} />
                  <h2 className="text-sm font-bold text-white">Athlete Specs</h2>
                </div>
                {([
                  { label: "Day", value: `${s.currentDay ?? 1} / ${s.totalDays ?? 28}`, color: "#C9F85A", show: true },
                  { label: "Height", value: s.height ? `${s.height} cm` : null, color: "#4DD2FF", show: Boolean(s.height) },
                  { label: "Weight", value: s.weight ? `${s.weight} kg` : null, color: "#FFD36E", show: Boolean(s.weight) },
                  { label: "Goal", value: s.fitnessGoal || null, color: "#A78BFA", show: Boolean(s.fitnessGoal) },
                ] as const).filter((stat) => stat.show && stat.value).map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                    <p className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Points Activity */}
              <div className="rounded-3xl border border-white/8 bg-[#0F0F0F] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 rounded-full bg-[#C9F85A]" />
                  <h2 className="text-sm font-bold text-white">Points Activity</h2>
                </div>
                <div className="rounded-2xl border border-[#C9F85A]/15 bg-[#C9F85A]/5 px-4 py-3 flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] text-white/35 uppercase tracking-wider">Total Points</p>
                    <p className="text-xl font-black text-[#C9F85A]">{(s.totalPoints ?? 0).toLocaleString()}</p>
                  </div>
                  <Award className="h-6 w-6 text-[#C9F85A]" />
                </div>
                <div className="space-y-2">
                  {recentRewards.slice(0, 4).map((reward) => (
                    <div key={reward.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{reward.reason}</p>
                        <p className="text-[11px] text-white/30">{reward.kind.replace(/_/g, " ")}</p>
                      </div>
                      <p className={`text-sm font-black ml-3 ${reward.delta >= 0 ? "text-[#C9F85A]" : "text-[#FF7A7A]"}`}>
                        {reward.delta >= 0 ? `+${reward.delta}` : reward.delta}
                      </p>
                    </div>
                  ))}
                  {recentRewards.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/10 flex items-center justify-center py-8">
                      <p className="text-xs text-white/30">No reward activity yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Trainer Note — only shown when real data exists */}
              {(() => {
                const fp = fetchedProfile as Record<string, unknown> | null;
                const sp = fp?.studentProfile as Record<string, unknown> | undefined;
                // Check multiple possible API response shapes for trainer feedback
                const trainerFeedback = (
                  typeof fp?.latestTrainerNote === "string" ? fp.latestTrainerNote :
                  typeof sp?.latestTrainerNote === "string" ? sp.latestTrainerNote :
                  typeof fp?.trainerNote === "string" ? fp.trainerNote :
                  null
                )?.trim() || null;
                if (!trainerFeedback) return null;
                return (
                  <div className="rounded-3xl border border-white/8 bg-[#0F0F0F] p-5 relative overflow-hidden">
                    <div
                      className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 pointer-events-none"
                      style={{ background: gradFrom, transform: "translate(30%, -30%)" }}
                    />
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 rounded-full" style={{ background: gradTo }} />
                      <h2 className="text-sm font-bold text-white">Coach Feedback</h2>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-black/30 p-5 relative">
                      <span className="text-4xl leading-none absolute -top-3 left-4" style={{ color: gradFrom }}>&ldquo;</span>
                      <p className="text-sm text-white/55 leading-relaxed italic pt-1">{trainerFeedback}</p>
                      <span className="text-4xl leading-none absolute -bottom-5 right-4" style={{ color: gradFrom }}>&rdquo;</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${gradFrom}18` }}>
                        <Star className="h-3 w-3" style={{ color: gradFrom }} />
                      </div>
                      <p className="text-xs text-white/30">From your assigned trainer</p>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Social list modal ── */}
      <AnimatePresence>
        {socialOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setSocialOpen(null)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#111111] p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">
                  {socialOpen === "followers" ? "Followers" : "Following"}
                </h3>
                <button
                  onClick={() => setSocialOpen(null)}
                  className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
                >
                  ×
                </button>
              </div>
              <div className="max-h-[50vh] space-y-2 overflow-y-auto">
                {(socialOpen === "followers" ? followersList : followingList).map((entry) => (
                  <Link
                    key={entry.id}
                    to={`/student/profile/${entry.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-white/8 bg-[#181818] px-3 py-2.5 hover:border-white/20 transition-all"
                    onClick={() => setSocialOpen(null)}
                  >
                    {entry.avatar ? (
                      <img src={entry.avatar} alt={entry.name} className="h-9 w-9 rounded-xl object-cover" />
                    ) : (
                      <div
                        className="h-9 w-9 rounded-xl p-[1.5px]"
                        style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}
                      >
                        <div className="h-full w-full rounded-[10px] bg-[#171717] flex items-center justify-center text-[9px] font-bold text-white/80">
                          {getInitials(entry.name)}
                        </div>
                      </div>
                    )}
                    <span className="text-sm text-white/80 font-medium">{entry.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-white/20 ml-auto" />
                  </Link>
                ))}
                {(socialOpen === "followers" ? followersList : followingList).length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/12 flex items-center justify-center py-10">
                    <p className="text-xs text-white/35">No users to show.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
