import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Bell,
  Calendar,
  Check,
  Flame,
  LineChart,
  ScrollText,
  Search,
  Sparkles,
  Target,
  Trophy,
  Utensils,
  Dumbbell,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { useAppStore, useCurrentUser, usePermissions, useStore } from "@/hooks/useStore";
import { Skeleton } from "@/components/ui/skeleton";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";
import { toast } from "sonner";

type DashboardTab = "Overview" | "Training" | "Nutrition" | "Progress" | "Reports";
type DashboardPill = "All" | "Workout" | "Nutrition" | "Recovery";

const DASHBOARD_TABS: DashboardTab[] = ["Overview", "Training", "Nutrition", "Progress", "Reports"];
const DASHBOARD_PILLS: DashboardPill[] = ["All", "Workout", "Nutrition", "Recovery"];

const TAB_TO_PILL: Record<DashboardTab, DashboardPill> = {
  Overview: "All",
  Training: "Workout",
  Nutrition: "Nutrition",
  Progress: "Recovery",
  Reports: "All",
};

const formatRelativeTime = (timestamp: string, nowMs: number): string => {
  const parsed = new Date(timestamp).getTime();
  if (!Number.isFinite(parsed)) return "recently";

  const diffSec = Math.max(0, Math.floor((nowMs - parsed) / 1000));
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
};

export default function StudentDashboard() {
  const {
    student: s,
    leaderboard,
    todayTask,
    getDayTask,
    loading,
    onboardingRequired,
    notifications,
    backendTodayPlan,
    progressOverview,
    progressLoading,
    planLoading,
  } = useStore();
  const refreshData = useAppStore((state) => state.refreshData);
  const users = useAppStore((state) => state.users);
  const currentUser = useCurrentUser();
  const permissions = usePermissions();
  const canPostFeed = Boolean(currentUser && permissions[currentUser.role].post_feed);
  const firstName = s.name.split(" ")[0] || s.name;
  const coach = useMemo(() => {
    if (!s.trainerId) return null;
    const trainer = users[s.trainerId];
    if (!trainer || trainer.role !== "trainer") return null;
    return trainer;
  }, [s.trainerId, users]);
  const coachName = useMemo(() => {
    if (!s.trainerId) return "Not assigned yet";
    return coach?.name ?? "Assigned coach";
  }, [coach, s.trainerId]);

  const [activeTab, setActiveTab] = useState<DashboardTab>("Overview");
  const [activePill, setActivePill] = useState<DashboardPill>("All");
  const [timeframe, setTimeframe] = useState<"Weekly" | "Monthly">("Weekly");
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [streakWindow, setStreakWindow] = useState<"5w" | "10w">("5w");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleTabSelect = (tab: DashboardTab) => {
    setActiveTab(tab);
    setActivePill(TAB_TO_PILL[tab]);
    if (tab === "Progress") {
      setTimeframe("Weekly");
    }
    if (tab === "Reports") {
      setTimeframe("Monthly");
    }
  };

  const notificationCount = notifications.filter((n) => !n.read).length;

  const activityMultiplier =
    activePill === "All" ? 1 : activePill === "Workout" ? 1.08 : activePill === "Nutrition" ? 0.96 : 0.9;

  const backendPlan = backendTodayPlan as Record<string, unknown> | null;
  const backendTodaysTasks = useMemo(() => {
    return backendPlan && Array.isArray(backendPlan.todaysTasks)
      ? (backendPlan.todaysTasks.filter((task) => task && typeof task === "object") as Record<string, unknown>[])
      : [];
  }, [backendPlan]);

  const backendDay = useMemo(() => {
    return backendPlan && Array.isArray(backendPlan.days)
      ? (backendPlan.days.find((day) => {
          if (!day || typeof day !== "object") return false;
          const record = day as Record<string, unknown>;
          return Number(record.day) === s.currentDay;
        }) as Record<string, unknown> | undefined)
      : undefined;
  }, [backendPlan, s.currentDay]);

  const quickTasks = useMemo(() => {
    const backendTasks = backendDay && Array.isArray(backendDay.tasks)
      ? (backendDay.tasks.filter((task) => task && typeof task === "object") as Record<string, unknown>[])
      : backendTodaysTasks;

    if (backendTasks.length > 0) {
      const mapped = backendTasks.map((item) => {
        const type = String(item.type ?? "workout").toLowerCase();
        const completed = String(item.submissionStatus ?? "") === "APPROVED";
        return {
          id: String(item.id ?? ""),
          type: (type === "nutrition" ? "diet" : "workout") as "workout" | "diet",
          title: String(item.title ?? "Task"),
          subtitle: String(item.description ?? "Complete this task"),
          completed,
        };
      });

      if (activePill === "Workout") return mapped.filter((task) => task.type === "workout");
      if (activePill === "Nutrition") return mapped.filter((task) => task.type === "diet");
      return mapped;
    }

    const workoutTasks = todayTask.workout.map((item) => ({
      id: item.id,
      type: "workout" as const,
      title: item.name,
      subtitle: `${item.sets} sets x ${item.reps} reps`,
      completed: item.completed,
    }));

    const nutritionTasks = todayTask.diet.map((item) => ({
      id: item.id,
      type: "diet" as const,
      title: `${item.meal} - ${item.description}`,
      subtitle: `${item.time} · ${item.calories} kcal`,
      completed: item.completed,
    }));

    if (activePill === "Workout") return workoutTasks;
    if (activePill === "Nutrition") return nutritionTasks;

    return [...workoutTasks, ...nutritionTasks];
  }, [todayTask, activePill, backendDay, backendTodaysTasks]);

  const completedQuickTasks = quickTasks.filter((task) => task.completed).length;

  const filteredQuickTasks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return quickTasks;

    return quickTasks.filter((task) => {
      return task.title.toLowerCase().includes(q) || task.subtitle.toLowerCase().includes(q);
    });
  }, [quickTasks, searchQuery]);

  const completedFilteredQuickTasks = filteredQuickTasks.filter((task) => task.completed).length;

  const streakCellCount = streakWindow === "5w" ? 35 : 70;
  const streakCells = useMemo(() => {
    const boundedCurrentDay = Math.max(1, Math.min(s.totalDays, s.currentDay));
    const startDay = Math.max(1, boundedCurrentDay - streakCellCount + 1);
    const generated = Array.from({ length: boundedCurrentDay - startDay + 1 }).map((_, idx) => {
      const day = startDay + idx;
      const dayTask = getDayTask(day);
      const total = dayTask.workout.length + dayTask.diet.length;
      if (total === 0) return 0;

      const completed =
        dayTask.workout.filter((item) => item.completed).length +
        dayTask.diet.filter((item) => item.completed).length;
      const ratio = completed / total;

      if (ratio === 0) return 0;
      if (ratio < 0.35) return 1;
      if (ratio < 0.7) return 2;
      if (ratio < 1) return 3;
      return 4;
    });

    if (generated.length >= streakCellCount) {
      return generated.slice(-streakCellCount);
    }

    return [...Array.from({ length: streakCellCount - generated.length }, () => 0), ...generated];
  }, [getDayTask, s.currentDay, s.totalDays, streakCellCount]);

  const activeStreakDays = streakCells.filter((cell) => cell > 0).length;
  const longestStreak = useMemo(() => {
    let currentRun = 0;
    let maxRun = 0;

    streakCells.forEach((cell) => {
      if (cell > 0) {
        currentRun += 1;
        maxRun = Math.max(maxRun, currentRun);
      } else {
        currentRun = 0;
      }
    });

    return maxRun;
  }, [streakCells]);

  const filteredLeaderboard = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const ranked = [...leaderboard].sort((a, b) => b.score - a.score);
    if (!q) return ranked;
    return ranked.filter((entry) => entry.name.toLowerCase().includes(q));
  }, [leaderboard, searchQuery]);

  const recentNotifications = useMemo(() => {
    return [...notifications]
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
      .slice(0, 6);
  }, [notifications]);

  const liveClock = new Date(nowMs).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== "student") return;

    const latestTrainerApproval = notifications.find(
      (notification) =>
        !notification.read &&
        notification.type === "trainer" &&
        /approved|accepted/i.test(notification.message)
    );

    if (!latestTrainerApproval) return;

    const storageKey = `ah:last-seen-approval:${currentUser.id}`;
    const lastSeenId = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    if (lastSeenId === latestTrainerApproval.id) return;

    toast.success(latestTrainerApproval.message);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, latestTrainerApproval.id);
    }
  }, [notifications, currentUser]);

  const dailySteps = progressOverview?.totalStepsLast30Days
    ? Math.round(progressOverview.totalStepsLast30Days / 30)
    : s.todaySteps;

  const kpiCards = [
    {
      title: "Workout Completion",
      value: `${Math.min(100, Math.round((progressOverview?.completionPercentage ?? s.completionPercentage) * activityMultiplier))}%`,
      delta: "+5.4% vs last week",
      icon: Target,
      accent: "bg-[#C9F85A] text-[#121212]",
      link: "/student/progress",
      spanClass: "lg:col-span-4",
    },
    {
      title: "Calories Burned",
      value: `${Math.round(dailySteps * 0.045 * activityMultiplier).toLocaleString()}`,
      delta: "+3.1% vs yesterday",
      icon: Flame,
      accent: "bg-[#202020] text-white",
      link: "/student/daily-plan",
      spanClass: "lg:col-span-2",
    },
    {
      title: "Daily Steps",
      value: `${Math.round(dailySteps * activityMultiplier).toLocaleString()}`,
      delta: `Goal 10,000 · ${Math.round((Math.min(100, (dailySteps / 10000) * 100)))}% complete`,
      icon: Flame,
      accent: "bg-[#202020] text-white",
      link: "/student/daily-plan",
      spanClass: "lg:col-span-2",
    },
  ];

  const featureTiles = [
    {
      title: "Training Engine",
      subtitle: "Open your task system and keep execution tight.",
      to: "/student/daily-plan",
      icon: Dumbbell,
      tone: "from-[#7DE3FF]/20 to-transparent",
    },
    {
      title: "Nutrition Stack",
      subtitle: "Track meal tasks and completion in one tap.",
      to: "/student/daily-plan",
      icon: Utensils,
      tone: "from-[#FFD18A]/20 to-transparent",
    },
    {
      title: "Progress Lens",
      subtitle: "Review growth with live analytics.",
      to: "/student/progress",
      icon: LineChart,
      tone: "from-[#C9F85A]/20 to-transparent",
    },
    {
      title: "Reports Hub",
      subtitle: "Generate and export your summary quickly.",
      to: "/student/features",
      icon: ScrollText,
      tone: "from-[#D1B9FF]/20 to-transparent",
    },
  ];

  useEffect(() => {
    void refreshData({ background: true, scope: "student-dashboard" });
  }, [refreshData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const focusTimer = setTimeout(() => searchInputRef.current?.focus(), 60);
    return () => clearTimeout(focusTimer);
  }, [searchOpen]);

  const handleDownloadSummary = () => {
    const lines = [
      `THE afterhour socials Dashboard Summary`,
      `Student: ${s.name}`,
      `Generated At: ${new Date().toLocaleString()}`,
      `Tab: ${activeTab}`,
      `Filter: ${activePill}`,
      `Timeframe: ${timeframe}`,
      `Completion: ${s.completionPercentage}%`,
      `Steps: ${s.todaySteps}`,
      `Streak: ${s.streak}`,
      `Plan Day: ${s.currentDay}/${s.totalDays}`,
    ];
    const file = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = href;
    a.download = `ahg-summary-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(href);
  };

  if (onboardingRequired) {
    return <Navigate to="/student/onboarding" replace />;
  }

  if (loading || progressLoading || planLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-12 rounded-full" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-[420px] rounded-3xl lg:col-span-5" />
          <Skeleton className="h-[420px] rounded-3xl lg:col-span-4" />
          <Skeleton className="h-[420px] rounded-3xl lg:col-span-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)] sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {DASHBOARD_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabSelect(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? "bg-[#C9F85A] text-[#0F0F0F]"
                    : "bg-[#1D1D1D] text-white/85 hover:bg-[#2A2A2A]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className={`grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-[#1A1A1A] text-white/80 transition-colors hover:bg-[#242424] ${
                searchOpen ? "ring-2 ring-[#C9F85A]" : ""
              }`}
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowNotifications((v) => !v)}
              className={`relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-[#1A1A1A] text-white/80 transition-colors hover:bg-[#242424] ${
                showNotifications ? "ring-2 ring-[#C9F85A]" : ""
              }`}
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#C9F85A] px-1 text-[10px] font-bold text-black">
                  {notificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 z-20 w-72 rounded-2xl border border-white/10 bg-[#1A1A1A] p-3 shadow-2xl">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Live Alerts</p>
                <div className="mt-2 space-y-2 text-xs text-white/80">
                  {recentNotifications.length === 0 ? (
                    <p className="rounded-lg bg-[#232323] px-3 py-2 text-white/55">No new alerts yet.</p>
                  ) : (
                    recentNotifications.map((notification) => (
                      <div key={notification.id} className="rounded-lg bg-[#232323] px-3 py-2">
                        <p className="line-clamp-2 text-white/90">{notification.message}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-white/45">
                          {notification.type} · {formatRelativeTime(notification.timestamp, nowMs)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {searchOpen && (
              <div className="absolute -bottom-14 right-0 z-20 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-white/10 bg-[#1B1B1B] p-2">
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search leaderboard"
                  className="w-full rounded-lg bg-[#121212] px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
                />
              </div>
            )}

            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#C9F85A] via-[#4DD2FF] to-[#FF7AE5] text-xs font-black text-[#111]">
              {firstName.slice(0, 1)}
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-12">
          <div className="rounded-3xl border border-white/10 bg-[#171717] p-6 lg:col-span-4">
            <p className="text-sm text-white/60">Welcome back,</p>
            <h1 className="mt-2 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl">
              {firstName}
            </h1>
            <div className="mt-4 inline-flex rounded-full bg-[#6F5CFF] px-3 py-1 text-xs font-semibold text-white">
              Student Pro
            </div>
            <div className="mt-3 inline-flex rounded-full border border-white/15 bg-[#202020] px-3 py-1 text-xs font-medium text-white/85">
              Coach: {coachName}
            </div>
            {coach && (
              <Link
                to={`/student/profile/${coach.id}`}
                className="mt-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-[#202020] px-3 py-1 text-xs font-medium text-white/90 transition-colors hover:bg-[#2A2A2A]"
              >
                <div className="h-6 w-6 overflow-hidden rounded-full border border-white/20 bg-[#2D2D2D]">
                  {coach.avatar ? (
                    <img src={coach.avatar} alt={coach.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-[10px] font-semibold text-white/70">
                      {(coach.name || "C").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                View coach profile
              </Link>
            )}
            <p className="mt-5 text-sm text-white/70">
              Day {s.currentDay} of {s.totalDays} with coach-approved structure.
              <span className="mt-1 block text-xs text-white/50">Live sync: {liveClock}</span>
            </p>
          </div>

          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`rounded-3xl border border-white/10 p-5 ${card.accent} ${card.spanClass}`}
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex rounded-full bg-black/15 p-2">
                    <Icon className="h-4 w-4" />
                  </div>
                  <Link to={card.link} className="rounded-full bg-black/15 p-2">
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
                <p className="mt-5 text-xs font-medium opacity-75">{card.title}</p>
                <p className="mt-1 text-4xl font-semibold leading-none">{card.value}</p>
                <p className="mt-3 text-xs font-medium opacity-75">{card.delta}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {DASHBOARD_PILLS.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => setActivePill(pill)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  activePill === pill
                    ? "bg-[#C9F85A] text-[#111]"
                    : "bg-[#1E1E1E] text-white/75 hover:bg-[#292929]"
                }`}
              >
                {pill}
              </button>
            ))}
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => setTimeframe((v) => (v === "Weekly" ? "Monthly" : "Weekly"))}
              className="rounded-full border border-white/10 bg-[#1D1D1D] px-4 py-2 text-sm font-medium text-white/80"
            >
              <Calendar className="mr-2 inline h-4 w-4" />
              {timeframe}
            </button>
            <button
              type="button"
              onClick={handleDownloadSummary}
              className="rounded-full bg-[#1D1D1D] px-4 py-2 text-sm font-semibold text-white"
            >
              {activeTab === "Reports" ? "Export monthly report" : "Download summary"}
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.12 }}
          className="mt-5 rounded-3xl border border-white/10 bg-[#131313] p-4 sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-[#7DE3FF]/30 bg-[#7DE3FF]/10 p-1.5">
                <Sparkles className="h-4 w-4 text-[#7DE3FF]" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Features</p>
                <p className="text-[11px] text-white/45">Now linked and fully interactive</p>
              </div>
            </div>
            <Link
              to="/student/features"
              className="rounded-full border border-[#7DE3FF]/35 bg-[#7DE3FF]/12 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7DE3FF] transition hover:bg-[#7DE3FF] hover:text-black"
            >
              Open Studio
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {featureTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Link
                  key={tile.title}
                  to={tile.to}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#181818] p-4 transition-colors hover:border-white/20"
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tile.tone}`} />
                  <div className="relative z-10">
                    <span className="inline-flex rounded-xl border border-white/10 bg-[#121212] p-2 text-white/80">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-white">{tile.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/55">{tile.subtitle}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#C9F85A]">
                      Launch <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </motion.section>

      <section className="grid gap-6 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.06 }}
          className="flex h-full flex-col rounded-3xl border border-white/10 bg-[#151515] p-5 lg:col-span-5 lg:h-[34rem]"
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#C9F85A]" />
              <h2 className="text-base font-semibold text-white">Daily Plan Quick Tasks</h2>
            </div>
            <div className="rounded-full bg-[#202020] px-3 py-1 text-xs text-white/70">
              {completedFilteredQuickTasks}/{filteredQuickTasks.length} done
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:#2C2C2C_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#2C2C2C] hover:[&::-webkit-scrollbar-thumb]:bg-[#3A3A3A]">
            {filteredQuickTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => {
                  if (!task.completed) {
                    toast.info("Upload proof from Daily Plan to complete this task.");
                  }
                }}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#1B1B1B] p-3 text-left transition-colors hover:bg-[#252525]"
              >
                <div
                  className={`grid h-9 w-9 place-items-center rounded-full border ${
                    task.completed ? "border-[#C9F85A] bg-[#C9F85A] text-black" : "border-white/20 text-white/60"
                  }`}
                >
                  <Check className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${task.completed ? "text-white/55 line-through" : "text-white"}`}>
                    {task.title}
                  </p>
                  <p className="text-[11px] text-white/45">{task.subtitle}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                    task.type === "workout" ? "bg-[#4DD2FF]/25 text-[#9FE7FF]" : "bg-[#FFD36E]/20 text-[#FFD36E]"
                  }`}
                >
                  {task.type}
                </span>
              </button>
            ))}
            {filteredQuickTasks.length === 0 && (
              <div className="rounded-2xl bg-[#1B1B1B] p-6 text-center text-xs text-white/55">
                No tasks available for this filter.
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/student/daily-plan"
              className="rounded-full bg-[#C9F85A] px-4 py-2 text-xs font-semibold text-black"
            >
              Open full daily plan
            </Link>
            {canPostFeed && (
              <Link
                to="/student/upload"
                className="rounded-full bg-[#232323] px-4 py-2 text-xs font-semibold text-white"
              >
                Upload proof
              </Link>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.12 }}
          className="flex h-full flex-col rounded-3xl border border-white/10 bg-[#151515] p-5 lg:col-span-4 lg:h-[34rem]"
        >
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#C9F85A]/10 border border-[#C9F85A]/20">
                <Flame className="h-3.5 w-3.5 text-[#C9F85A]" />
              </div>
              <h2 className="text-base font-semibold text-white">Daily Streak</h2>
              <span className="rounded-full bg-[#C9F85A] px-2 py-0.5 text-[10px] font-bold text-black">{s.streak}d</span>
            </div>
            <button
              type="button"
              onClick={() => setStreakWindow((v) => (v === "5w" ? "10w" : "5w"))}
              className="inline-flex items-center rounded-full bg-[#1D1D1D] border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/60 hover:text-white transition-colors"
            >
              {streakWindow === "5w" ? "5 weeks" : "10 weeks"}
            </button>
          </div>

          {/* Day labels */}
          <div className="mb-2 flex justify-between px-1 text-[10px] text-white/25">
            <span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span>
          </div>

          {/* Heatmap grid */}
          <div className="overflow-x-auto pb-1">
            <div className="grid min-w-[280px] grid-flow-col grid-rows-7 gap-1">
              {streakCells.map((level, idx) => {
                const shades = [
                  "bg-[#1A1A1A] border border-white/5",
                  "bg-[#2A4020] border border-[#C9F85A]/10",
                  "bg-[#3D6030] border border-[#C9F85A]/20",
                  "bg-[#6B9E3F] border border-[#C9F85A]/30",
                  "bg-[#C9F85A] border border-[#C9F85A]/50 shadow-[0_0_4px_rgba(201,248,90,0.3)]",
                ];
                return <div key={idx} className={`h-4 w-4 rounded-sm transition-all ${shades[level]}`} />;
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center gap-2 text-[10px] text-white/30">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => {
              const shades = ["bg-[#1A1A1A]", "bg-[#2A4020]", "bg-[#3D6030]", "bg-[#6B9E3F]", "bg-[#C9F85A]"];
              return <div key={level} className={`h-3 w-3 rounded-sm ${shades[level]}`} />;
            })}
            <span>More</span>
          </div>

          {/* Stats */}
          <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
            <div className="rounded-2xl bg-[#C9F85A]/8 border border-[#C9F85A]/20 p-3">
              <p className="text-[10px] text-[#C9F85A]/60 uppercase tracking-wider">Current streak</p>
              <p className="mt-1 text-xl font-bold text-[#C9F85A]">{s.streak} <span className="text-sm font-normal">days</span></p>
            </div>
            <div className="rounded-2xl bg-[#1D1D1D] border border-white/5 p-3">
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Longest</p>
              <p className="mt-1 text-xl font-bold text-white">{longestStreak} <span className="text-sm font-normal text-white/40">days</span></p>
            </div>
            <div className="rounded-2xl bg-[#1D1D1D] border border-white/5 p-3 col-span-2">
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Active days in view</p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xl font-bold text-white">{activeStreakDays} <span className="text-sm font-normal text-white/40">/ {streakCellCount}</span></p>
                <div className="h-1.5 w-24 bg-[#1A1A1A] rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-[#C9F85A] rounded-full transition-all" style={{ width: `${Math.round((activeStreakDays / streakCellCount) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.18 }}
          className="flex h-full flex-col rounded-3xl border border-white/10 bg-[#151515] p-5 lg:col-span-3 lg:h-[34rem]"
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#FFD36E]/10 border border-[#FFD36E]/20">
                <Trophy className="h-3.5 w-3.5 text-[#FFD36E]" />
              </div>
              <h2 className="text-base font-semibold text-white">Leaderboard</h2>
            </div>
            <Link to="/student/leaderboard" className="text-xs font-semibold text-[#C9F85A] hover:text-[#d4ff60] transition-colors">View all →</Link>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search athlete…"
              className="w-full rounded-xl border border-white/8 bg-[#1A1A1A] pl-9 pr-3 py-2.5 text-sm text-white/80 outline-none placeholder:text-white/25 focus:border-[#C9F85A]/30 transition-colors"
            />
          </div>

          {/* Entries */}
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#2C2C2C_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#2C2C2C] hover:[&::-webkit-scrollbar-thumb]:bg-[#3A3A3A]">
            {filteredLeaderboard.slice(0, 6).map((entry) => {
              const RANK_COLORS: Record<number, { bg: string; text: string; ring: string }> = {
                1: { bg: "bg-gradient-to-br from-[#FFD36E] to-[#FF9500]", text: "text-black", ring: "" },
                2: { bg: "bg-gradient-to-br from-[#C0C0C0] to-[#888]", text: "text-black", ring: "" },
                3: { bg: "bg-gradient-to-br from-[#CD7F32] to-[#8B5523]", text: "text-white", ring: "" },
              };
              const AVATAR_GRADS = ["from-[#C9F85A] to-[#4DD2FF]","from-[#FF7AE5] to-[#A78BFA]","from-[#FFD36E] to-[#FF4D00]","from-[#4DD2FF] to-[#6F5CFF]","from-[#C9F85A] to-[#FFD36E]"];
              const rankStyle = RANK_COLORS[entry.rank];
              const gradIdx = entry.userId.charCodeAt(0) % AVATAR_GRADS.length;
              const initials = entry.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={entry.userId} className="flex items-center gap-3 rounded-2xl bg-[#1B1B1B] hover:bg-[#212121] transition-colors px-3 py-2.5 group">
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl p-[1.5px] flex-shrink-0 bg-gradient-to-br ${AVATAR_GRADS[gradIdx]}`}>
                    <div className="w-full h-full rounded-[10px] bg-[#1D1D1D] flex items-center justify-center text-[10px] font-bold text-white">
                      {initials}
                    </div>
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white group-hover:text-[#C9F85A] transition-colors">{entry.name}</p>
                    <p className="text-[10px] text-white/35">{entry.score.toLocaleString()} pts</p>
                  </div>
                  {/* Rank badge */}
                  {rankStyle ? (
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${rankStyle.bg} ${rankStyle.text}`}>
                      {entry.rank}
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold bg-[#242424] text-white/55 border border-white/10">
                      {entry.rank}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredLeaderboard.length === 0 && (
              <p className="rounded-xl bg-[#1B1B1B] px-3 py-4 text-center text-xs text-white/40">
                No athletes match.
              </p>
            )}
          </div>

          {/* Quick links */}
          <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
            {canPostFeed && (
              <Link to="/student/upload" className="rounded-xl bg-[#C9F85A] px-3 py-2 text-center text-xs font-bold text-black hover:bg-[#d4ff60] transition-colors">
                Upload Proof
              </Link>
            )}
            <Link to="/student/feed" className="rounded-xl bg-[#1D1D1D] border border-white/8 px-3 py-2 text-center text-xs font-semibold text-white/70 hover:text-white hover:bg-[#252525] transition-all">
              Open Feed
            </Link>
            <Link to="/student/daily-plan" className="rounded-xl bg-[#1D1D1D] border border-white/8 px-3 py-2 text-center text-xs font-semibold text-white/70 hover:text-white hover:bg-[#252525] transition-all">
              Daily Plan
            </Link>
            <Link to="/student/leaderboard" className="rounded-xl bg-[#1D1D1D] border border-white/8 px-3 py-2 text-center text-xs font-semibold text-white/70 hover:text-white hover:bg-[#252525] transition-all">
              Leaderboard
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
