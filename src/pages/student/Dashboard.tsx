import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Bell,
  Calendar,
  Check,
  Flame,
  Search,
  Target,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { useCurrentUser, usePermissions, useStore } from "@/hooks/useStore";
import { Skeleton } from "@/components/ui/skeleton";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";

type DashboardTab = "Overview" | "Training" | "Nutrition" | "Progress" | "Reports";
type DashboardPill = "All" | "Workout" | "Nutrition" | "Recovery";

const DASHBOARD_TABS: DashboardTab[] = ["Overview", "Training", "Nutrition", "Progress", "Reports"];
const DASHBOARD_PILLS: DashboardPill[] = ["All", "Workout", "Nutrition", "Recovery"];

export default function StudentDashboard() {
  const { student: s, leaderboard, todayTask, completeTask, loading, setLoading, onboardingRequired, notifications } = useStore();
  const currentUser = useCurrentUser();
  const permissions = usePermissions();
  const canPostFeed = Boolean(currentUser && permissions[currentUser.role].post_feed);
  const firstName = s.name.split(" ")[0] || s.name;

  const [activeTab, setActiveTab] = useState<DashboardTab>("Overview");
  const [activePill, setActivePill] = useState<DashboardPill>("All");
  const [timeframe, setTimeframe] = useState<"Weekly" | "Monthly">("Weekly");
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [streakWindow, setStreakWindow] = useState<"5w" | "10w">("5w");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const notificationCount = notifications.filter((n) => !n.read).length;

  const activityMultiplier =
    activePill === "All" ? 1 : activePill === "Workout" ? 1.08 : activePill === "Nutrition" ? 0.96 : 0.9;

  const quickTasks = useMemo(() => {
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
  }, [todayTask, activePill]);

  const completedQuickTasks = quickTasks.filter((task) => task.completed).length;

  const streakCellCount = streakWindow === "5w" ? 35 : 70;
  const streakCells = useMemo(() => {
    return Array.from({ length: streakCellCount }).map((_, idx) => {
      const seed = (idx + s.streak + Math.floor(s.completionPercentage / 10)) % 10;
      if (seed <= 2) return 0;
      if (seed <= 4) return 1;
      if (seed <= 6) return 2;
      if (seed <= 8) return 3;
      return 4;
    });
  }, [streakCellCount, s.streak, s.completionPercentage]);

  const activeStreakDays = streakCells.filter((cell) => cell > 0).length;
  const longestStreak = Math.max(s.streak + 6, Math.round(s.streak * 1.4));

  const filteredLeaderboard = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const ranked = [...leaderboard].sort((a, b) => b.score - a.score);
    if (!q) return ranked;
    return ranked.filter((entry) => entry.name.toLowerCase().includes(q));
  }, [leaderboard, searchQuery]);

  const liveClock = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const kpiCards = [
    {
      title: "Workout Completion",
      value: `${Math.min(100, Math.round(s.completionPercentage * activityMultiplier))}%`,
      delta: "+5.4% vs last week",
      icon: Target,
      accent: "bg-[#C9F85A] text-[#121212]",
      link: "/student/progress",
      spanClass: "lg:col-span-4",
    },
    {
      title: "Calories Burned",
      value: `${Math.round(s.todaySteps * 0.045 * activityMultiplier).toLocaleString()}`,
      delta: "+3.1% vs yesterday",
      icon: Flame,
      accent: "bg-[#202020] text-white",
      link: "/student/daily-plan",
      spanClass: "lg:col-span-2",
    },
    {
      title: "Daily Steps",
      value: `${Math.round(s.todaySteps * activityMultiplier).toLocaleString()}`,
      delta: `Goal 10,000 · ${Math.round((Math.min(100, (s.todaySteps / 10000) * 100)))}% complete`,
      icon: Flame,
      accent: "bg-[#202020] text-white",
      link: "/student/daily-plan",
      spanClass: "lg:col-span-2",
    },
  ];

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [setLoading]);

  useEffect(() => {
    if (!searchOpen) return;
    const focusTimer = setTimeout(() => searchInputRef.current?.focus(), 60);
    return () => clearTimeout(focusTimer);
  }, [searchOpen]);

  const handleDownloadSummary = () => {
    const lines = [
      `After Hours Grind Dashboard Summary`,
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

  if (loading) {
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
                onClick={() => setActiveTab(tab)}
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
                  <p className="rounded-lg bg-[#232323] px-3 py-2">Workout reminder synced at {liveClock}</p>
                  <p className="rounded-lg bg-[#232323] px-3 py-2">Coach left 1 new instruction</p>
                  <p className="rounded-lg bg-[#232323] px-3 py-2">Recovery score updated</p>
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
              Download summary
            </button>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-6 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.06 }}
          className="rounded-3xl border border-white/10 bg-[#151515] p-5 lg:col-span-5"
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#C9F85A]" />
              <h2 className="text-base font-semibold text-white">Daily Plan Quick Tasks</h2>
            </div>
            <div className="rounded-full bg-[#202020] px-3 py-1 text-xs text-white/70">
              {completedQuickTasks}/{quickTasks.length} done
            </div>
          </div>

          <div className="space-y-2.5">
            {quickTasks.slice(0, 6).map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => {
                  if (!task.completed) {
                    completeTask(task.type, task.id);
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
            {quickTasks.length === 0 && (
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
          className="rounded-3xl border border-white/10 bg-[#151515] p-5 lg:col-span-4"
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-[#C9F85A]" />
              <h2 className="text-base font-semibold text-white">Daily Streak</h2>
            </div>
            <button
              type="button"
              onClick={() => setStreakWindow((v) => (v === "5w" ? "10w" : "5w"))}
              className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black"
            >
              {streakWindow === "5w" ? "5 weeks" : "10 weeks"}
            </button>
          </div>

          <div className="mb-2 flex justify-between px-1 text-[10px] text-white/40">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="grid min-w-[280px] grid-flow-col grid-rows-7 gap-1">
              {streakCells.map((level, idx) => {
                const shades = ["bg-[#232323]", "bg-[#355628]", "bg-[#5D9338]", "bg-[#9ED94F]", "bg-[#D8FF78]"];
                return <div key={idx} className={`h-4 w-4 rounded-sm ${shades[level]}`} />;
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 text-[10px] text-white/55">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => {
              const shades = ["bg-[#232323]", "bg-[#355628]", "bg-[#5D9338]", "bg-[#9ED94F]", "bg-[#D8FF78]"];
              return <div key={level} className={`h-3.5 w-3.5 rounded-sm ${shades[level]}`} />;
            })}
            <span>More</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-white/65">
            <div className="rounded-xl bg-[#1E1E1E] p-3">
              <p>Current streak</p>
              <p className="mt-1 text-lg font-semibold text-white">{s.streak} days</p>
            </div>
            <div className="rounded-xl bg-[#1E1E1E] p-3">
              <p>Longest streak</p>
              <p className="mt-1 text-lg font-semibold text-white">{longestStreak} days</p>
            </div>
            <div className="rounded-xl bg-[#1E1E1E] p-3 col-span-2">
              <p>Active days in view</p>
              <p className="mt-1 text-lg font-semibold text-white">{activeStreakDays} / {streakCellCount}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.18 }}
          className="rounded-3xl border border-white/10 bg-[#151515] p-5 lg:col-span-3"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[#C9F85A]" />
              <h2 className="text-base font-semibold text-white">Leaderboard</h2>
            </div>
            <Link to="/student/leaderboard" className="text-xs font-semibold text-[#C9F85A]">View all</Link>
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search athlete"
            className="mb-4 w-full rounded-xl border border-white/10 bg-[#1C1C1C] px-3 py-2 text-sm text-white/80 outline-none placeholder:text-white/40"
          />

          <div className="space-y-3">
            {filteredLeaderboard.slice(0, 6).map((entry) => (
              <div key={entry.userId} className="flex items-center gap-3 rounded-2xl bg-[#1B1B1B] p-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#242424] text-xs font-semibold text-white/75">
                  {entry.rank}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{entry.name}</p>
                  <p className="text-[10px] text-white/50">{entry.score.toLocaleString()} points</p>
                </div>
                <span className="rounded-full bg-[#C9F85A] px-2 py-1 text-[10px] font-semibold text-black">
                  #{entry.rank}
                </span>
              </div>
            ))}
            {filteredLeaderboard.length === 0 && (
              <p className="rounded-xl bg-[#1B1B1B] px-3 py-4 text-center text-xs text-white/55">
                No athletes match your search.
              </p>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {canPostFeed && (
              <Link
                to="/student/upload"
                className="rounded-xl bg-[#C9F85A] px-3 py-2 text-center text-xs font-semibold text-[#111]"
              >
                Upload Proof
              </Link>
            )}
            <Link
              to="/student/feed"
              className="rounded-xl bg-[#232323] px-3 py-2 text-center text-xs font-semibold text-white"
            >
              Open Feed
            </Link>
            <Link
              to="/student/daily-plan"
              className="rounded-xl bg-[#232323] px-3 py-2 text-center text-xs font-semibold text-white"
            >
              Daily Plan
            </Link>
            <Link
              to="/student/leaderboard"
              className="rounded-xl bg-[#232323] px-3 py-2 text-center text-xs font-semibold text-white"
            >
              Leaderboard
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
