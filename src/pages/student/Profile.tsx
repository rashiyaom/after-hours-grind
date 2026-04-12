import { motion } from "framer-motion";
import {
  Flame, Users, Award, Calendar, Grid3X3, Settings,
  Edit2, Share2, MapPin, UserPlus, MessageCircle, Star,
  TrendingUp, CheckCircle2, ArrowUpRight,
} from "lucide-react";
import ProgressRing from "@/components/ProgressRing";
import { useAppStore, useStore } from "@/hooks/useStore";
import { useState, useMemo, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";

const POST_PALETTES = [
  { bg: "from-[#0D1117] to-[#1a1f2e]", accent: "#4DD2FF" },
  { bg: "from-[#110D17] to-[#1e1a2e]", accent: "#A78BFA" },
  { bg: "from-[#0F1710] to-[#1a2e1a]", accent: "#C9F85A" },
  { bg: "from-[#17120D] to-[#2e221a]", accent: "#FFD36E" },
  { bg: "from-[#17100D] to-[#2e1a1a]", accent: "#FF4D00" },
  { bg: "from-[#0D1117] to-[#111827]", accent: "#FF7AE5" },
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

const tabs = ["Posts", "Stats"] as const;
type Tab = typeof tabs[number];

export default function ProfilePage() {
  const { userId } = useParams();
  const { student: me, posts, students, loading, setLoading } = useStore();
  const users = useAppStore((state) => state.users);
  const [activeTab, setActiveTab] = useState<Tab>("Posts");
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [userId, setLoading]);

  const isMe = !userId || userId === me.id;

  const s = useMemo(() => {
    if (isMe) return me;

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
        };
      }
    }

    const found = students.find((l) => l.userId === userId);
    return found
      ? { ...me, id: found.userId, name: found.name, streak: found.streak, rank: found.rank, completionPercentage: found.completionPercentage, followers: 124, following: 89 }
      : me;
  }, [userId, isMe, me, students, users]);

  const gradIdx = s.id.charCodeAt(0) % AVATAR_GRADIENTS.length;

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast[isFollowing ? "info" : "success"](isFollowing ? `Unfollowed ${s.name}` : `Following ${s.name}!`);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-48 w-full rounded-[32px]" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-[24px]" />)}
        </div>
        <Skeleton className="h-12 w-full rounded-full" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6 lg:p-8 pb-10">

      {/* ── Profile hero card ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden"
      >
        {/* BG glow */}
        <div className="absolute top-0 left-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: `${AVATAR_GRADIENTS[gradIdx].includes("C9F85A") ? "#C9F85A" : "#4DD2FF"}08`, transform: "translate(-30%, -30%)" }}
        />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className={`w-24 h-24 rounded-[24px] bg-gradient-to-br ${AVATAR_GRADIENTS[gradIdx]} p-[2.5px]`}>
              <div className="w-full h-full rounded-[22px] bg-[#1A1A1A] flex items-center justify-center text-3xl font-bold text-white">
                {getInitials(s.name)}
              </div>
            </div>
            {/* streak badge */}
            <div className="absolute -bottom-2.5 -right-2.5 flex items-center gap-1 bg-[#111] border border-[#FF4D00]/40 rounded-full px-2.5 py-1 shadow-lg">
              <Flame className="h-3 w-3 text-[#FF4D00]" />
              <span className="text-[10px] font-bold text-[#FF4D00]">{s.streak}d</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left space-y-4">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">{s.name}</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#C9F85A]/10 text-[#C9F85A] border border-[#C9F85A]/20">
                  Member
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-white/40">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.collegeId || "ATH_GRP_001"}</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3 text-[#FFD36E]" />Level {Math.floor(s.completionPercentage / 20) + 1}</span>
              </div>
              <p className="mt-3 text-sm text-white/50 leading-relaxed max-w-sm mx-auto sm:mx-0">
                {isMe
                  ? "Relentless pursuit of excellence. Day by day, gram by gram."
                  : "Athlete in the After Hours programme. Committed to the grind."}
              </p>
            </div>

            {/* Social counts */}
            <div className="flex items-center justify-center sm:justify-start gap-6">
              {[
                { label: "Posts", value: posts.filter((p) => p.userId === s.id).length },
                { label: "Followers", value: s.followers, color: "#C9F85A" },
                { label: "Following", value: s.following },
              ].map((st) => (
                <div key={st.label} className="text-center cursor-default hover:scale-105 transition-transform">
                  <p className="text-xl font-bold" style={{ color: st.color ?? "white" }}>{st.value.toLocaleString()}</p>
                  <p className="text-[10px] text-white/35 uppercase tracking-wider">{st.label}</p>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {isMe ? (
                <>
                  <Link
                    to="/student/settings"
                    className="flex items-center gap-2 rounded-full bg-[#C9F85A] text-black px-5 py-2.5 text-sm font-bold hover:bg-[#d4ff60] transition-all shadow-[0_8px_32px_rgba(201,248,90,0.25)]"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit Profile
                  </Link>
                  <button
                    onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
                    className="w-10 h-10 rounded-full bg-[#1D1D1D] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-[#252525] transition-all"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFollow}
                    className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                      isFollowing
                        ? "bg-[#1D1D1D] border border-white/10 text-white/60"
                        : "bg-[#C9F85A] text-black shadow-[0_8px_32px_rgba(201,248,90,0.25)] hover:bg-[#d4ff60]"
                    }`}
                  >
                    {isFollowing ? <><CheckCircle2 className="h-3.5 w-3.5" />Following</> : <><UserPlus className="h-3.5 w-3.5" />Follow</>}
                  </motion.button>
                  <button className="w-10 h-10 rounded-full bg-[#1D1D1D] border border-white/10 flex items-center justify-center text-white/50 hover:text-[#4DD2FF] hover:border-[#4DD2FF]/30 transition-all">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
                    className="w-10 h-10 rounded-full bg-[#1D1D1D] border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stat highlight cards ─────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Streak", value: s.streak, unit: "days", color: "#FF4D00", icon: Flame, glow: "rgba(255,77,0,0.1)" },
          { label: "Day", value: s.currentDay, unit: "of plan", color: "#4DD2FF", icon: Calendar, glow: "rgba(77,210,255,0.1)" },
          { label: "Level", value: `${s.completionPercentage}%`, unit: "complete", color: "#C9F85A", icon: TrendingUp, glow: "rgba(201,248,90,0.1)" },
        ].map((st, i) => (
          <motion.div
            key={st.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.06 }}
            className="rounded-[24px] border border-white/8 bg-[#121212] p-5 text-center relative overflow-hidden group hover:border-white/15 transition-all"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-[24px]"
              style={{ background: st.glow }} />
            <st.icon className="h-5 w-5 mx-auto mb-3 relative z-10" style={{ color: st.color }} />
            <p className="text-2xl font-bold text-white relative z-10" style={{ color: st.color }}>{st.value}</p>
            <p className="text-[10px] text-white/35 mt-1 uppercase tracking-wider relative z-10">{st.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Tab switcher ─────────────────────────────────── */}
      <div className="flex gap-2 p-1 bg-[#111] border border-white/8 rounded-full w-fit mx-auto sm:mx-0">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-6 py-2.5 text-sm font-semibold rounded-full transition-all ${
              activeTab === t ? "bg-[#C9F85A] text-black" : "text-white/40 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Posts grid ───────────────────────────────────── */}
      {activeTab === "Posts" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-3 gap-2"
        >
          {Array.from({ length: isMe ? 9 : 6 }).map((_, i) => {
            const palette = POST_PALETTES[i % POST_PALETTES.length];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.92 }}
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
                {/* hover overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                  style={{ background: `${palette.accent}18`, backdropFilter: "blur(2px)" }}>
                  <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-full border border-white/10">
                    <Users className="h-3 w-3 text-white" />
                    <span className="text-[10px] font-bold text-white">{47 + i * 12}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── Stats tab ────────────────────────────────────── */}
      {activeTab === "Stats" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Biometric specs */}
          <div className="rounded-[32px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-5 rounded-full bg-[#4DD2FF]" />
              <h2 className="text-sm font-semibold text-white">Athlete Specs</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Days Completed", value: isMe ? "14" : "8", icon: CheckCircle2, color: "#C9F85A" },
                { label: "Height", value: `${s.height} cm`, icon: Grid3X3, color: "#4DD2FF" },
                { label: "Weight", value: `${s.weight} kg`, icon: Settings, color: "#FFD36E" },
                { label: "Workout Pref", value: "A.M. Session", icon: Calendar, color: "#A78BFA" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between py-3 border-b border-white/5 group">
                  <div className="flex items-center gap-2">
                    <stat.icon className="h-3.5 w-3.5" style={{ color: stat.color }} />
                    <p className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
                  </div>
                  <p className="text-sm font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Coach feedback */}
          <div className="rounded-[32px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#C9F85A]/4 translate-x-8 -translate-y-8 blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-5 rounded-full bg-[#C9F85A]" />
              <h2 className="text-sm font-semibold text-white">Coach Feedback</h2>
            </div>
            <div className="relative bg-[#0D0D0D] rounded-2xl p-6 border border-white/5">
              <span className="text-[#C9F85A] text-4xl font-serif absolute -top-3 left-5 leading-none">"</span>
              <p className="text-sm text-white/60 leading-relaxed italic pt-2">
                {isMe
                  ? "Form looks sharp. Focus on increasing protein intake by 15% next phase. Tactical readiness is high."
                  : "Consistent output detected. Maintain current intensity. Strength markers are trending upward."}
              </p>
              <span className="text-[#C9F85A] text-4xl font-serif absolute -bottom-6 right-5 leading-none">"</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#C9F85A]/10 flex items-center justify-center">
                <Star className="h-3 w-3 text-[#C9F85A]" />
              </div>
              <p className="text-xs text-white/30">From your assigned trainer</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
