import { useMemo, useState, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Flame, Dumbbell, Utensils, Footprints, Droplets,
  Upload, ChevronRight, ChevronLeft, ChevronRight as ChevRight,
  Play, Info, Clock, X, Activity, Zap, ArrowUpRight, Target,
  ChevronDown
} from "lucide-react";
import { useCurrentUser, usePermissions, useStore } from "@/hooks/useStore";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { LUXURY_TWEEN_MEDIUM, LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";

const dayTypes = [
  "Push Day — Chest & Triceps",
  "Pull Day — Back & Biceps",
  "Legs Day — Quads & Hamstrings",
  "Rest & Recovery",
  "Push Day — Shoulders",
  "Pull Day — Back",
  "Cardio & Core",
];

/* ─── Meal timing colors ─────────────────────────────── */
const mealTimeColor = (time: string) => {
  const t = time.toLowerCase();
  if (t.includes("morning") || t.includes("7") || t.includes("8")) return "#FFD36E";
  if (t.includes("lunch") || t.includes("12") || t.includes("1")) return "#4DD2FF";
  if (t.includes("evening") || t.includes("5") || t.includes("6")) return "#C9F85A";
  if (t.includes("night") || t.includes("9") || t.includes("10")) return "#A78BFA";
  return "#C9F85A";
};

const macroBarVariants = {
  hidden: { scaleX: 0 },
  visible: (pct: number) => ({
    scaleX: Math.min(1, pct / 100),
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.2 },
  }),
};

const extractYouTubeUrl = (input: string) => {
  const match = input.match(/(?:video:\s*)?(https?:\/\/[^\s|]+(?:youtube\.com|youtu\.be)[^\s|]*)/i);
  return match ? match[1] : null;
};

const toYouTubeEmbedUrl = (url: string | null) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace("/", "").trim();
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    return null;
  } catch {
    return null;
  }
};

const removeVideoMeta = (input: string) =>
  input
    .replace(/\|?\s*video:\s*https?:\/\/[^\s|]+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

export default function DailyPlanPage() {
  const { student: s, getDayTask, submitTaskProof, canStartCurrentPlan, currentStudentPlan, backendTodayPlan } = useStore();
  const currentUser = useCurrentUser();
  const permissions = usePermissions();
  const canPostFeed = Boolean(currentUser && permissions[currentUser.role].post_feed);
  const backendPlanRecord = backendTodayPlan as Record<string, unknown> | null;
  const backendCurrentDay =
    backendPlanRecord && typeof backendPlanRecord.currentDay === "number" ? backendPlanRecord.currentDay : s.currentDay;
  const [selectedDay, setSelectedDay] = useState(backendCurrentDay);
  const fallbackTask = getDayTask(selectedDay);
  const dayTasks = useMemo(() => {
    if (!backendPlanRecord || !Array.isArray(backendPlanRecord.days)) return [] as Array<Record<string, unknown>>;
    const dayRecord = backendPlanRecord.days.find((item) => {
      if (!item || typeof item !== "object") return false;
      const record = item as Record<string, unknown>;
      return typeof record.day === "number" && record.day === selectedDay;
    }) as Record<string, unknown> | undefined;
    if (!dayRecord || !Array.isArray(dayRecord.tasks)) return [] as Array<Record<string, unknown>>;
    return dayRecord.tasks.filter((task) => task && typeof task === "object") as Array<Record<string, unknown>>;
  }, [backendPlanRecord, selectedDay]);

  const todayTask = dayTasks.length
    ? {
        stepTarget: 9000,
        hydrationGoal: "3L",
        workout: dayTasks
          .filter((task) => {
            const type = String(task.type ?? "").toLowerCase();
            return type === "workout" || type === "habit";
          })
          .map((task) => ({
            videoUrl: extractYouTubeUrl(String(task.description ?? "")),
            id: String(task.id ?? ""),
            name: String(task.title ?? "Task"),
            sets: String(task.intensity ?? "moderate") === "high" ? 4 : 3,
            reps: String(task.intensity ?? "moderate") === "high" ? 8 : 12,
            rest: String(task.intensity ?? "moderate") === "high" ? "75s" : "45s",
            completed: String(task.submissionStatus ?? "") === "APPROVED",
            focus: removeVideoMeta(String(task.description ?? "Execute with clean form and controlled tempo.")),
            equipmentMode: "basic" as const,
            alternatives: ["Regression variant", "Tempo variant"],
            videoEmbedUrl: toYouTubeEmbedUrl(extractYouTubeUrl(String(task.description ?? ""))),
          })),
        diet: dayTasks
          .filter((task) => String(task.type ?? "").toLowerCase() === "nutrition")
          .map((task, index) => {
            const title = String(task.title ?? "Nutrition Task");
            const normalizedTitle = title.toLowerCase();
            const resolvedTime =
              normalizedTitle.includes("breakfast")
                ? "08:00 AM"
                : normalizedTitle.includes("lunch")
                  ? "01:00 PM"
                  : normalizedTitle.includes("dinner")
                    ? "08:00 PM"
                    : "Anytime";

            return {
              id: String(task.id ?? `nutrition-${index}`),
              meal: title,
              description: String(task.description ?? "Complete your nutrition target for the day."),
              time: resolvedTime,
            calories: 0,
            completed: String(task.submissionStatus ?? "") === "APPROVED",
            foods: [],
            macros: { protein: 0, carbs: 0, fats: 0 },
            };
          }),
      }
    : fallbackTask;
  const [selectedExercise, setSelectedExercise] = useState<typeof todayTask.workout[0] | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"workout" | "diet">("workout");
  const [proofModal, setProofModal] = useState<{
    taskId: string;
    taskType: "workout" | "diet";
    taskName: string;
  } | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofMediaDataUrl, setProofMediaDataUrl] = useState<string | null>(null);
  const [proofCaption, setProofCaption] = useState("");
  const [submittingProof, setSubmittingProof] = useState(false);

  const workouts = todayTask.workout;
  const meals = todayTask.diet;
  const pendingTaskIds = new Set(
    dayTasks
      .filter((task) => String(task.submissionStatus ?? "") === "PENDING")
      .map((task) => String(task.id ?? ""))
  );

  const openProofModal = (taskId: string, taskType: "workout" | "diet", taskName: string) => {
    if (!isToday) {
      toast.info("Proof can only be submitted for today's tasks.");
      return;
    }
    setProofModal({ taskId, taskType, taskName });
    setProofFile(null);
    setProofPreview(null);
    setProofMediaDataUrl(null);
    setProofCaption("");
  };

  const closeProofModal = () => {
    setProofModal(null);
    setProofFile(null);
    if (proofPreview) {
      URL.revokeObjectURL(proofPreview);
    }
    setProofPreview(null);
    setProofMediaDataUrl(null);
    setProofCaption("");
    setSubmittingProof(false);
  };

  const handleProofFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      toast.error("Please upload an image as proof.");
      return;
    }

    if (proofPreview) {
      URL.revokeObjectURL(proofPreview);
    }

    setProofFile(selected);
    setProofPreview(URL.createObjectURL(selected));

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setProofMediaDataUrl(reader.result);
      } else {
        setProofMediaDataUrl(null);
        toast.error("Could not process image file. Please try another photo.");
      }
    };
    reader.onerror = () => {
      setProofMediaDataUrl(null);
      toast.error("Could not process image file. Please try another photo.");
    };
    reader.readAsDataURL(selected);
  };

  const submitProof = async () => {
    if (!proofModal) return;
    if (!proofFile || !proofPreview || !proofMediaDataUrl) {
      toast.error("Proof photo is required to complete this task.");
      return;
    }

    setSubmittingProof(true);

    submitTaskProof({
      taskId: proofModal.taskId,
      taskType: proofModal.taskType,
      dayNumber: selectedDay,
      taskName: proofModal.taskName,
      mediaUrl: proofMediaDataUrl,
      caption:
        proofCaption.trim() ||
        `${proofModal.taskType === "workout" ? "Workout" : "Meal"} proof · Day ${selectedDay} · ${proofModal.taskName}`,
      location: "Campus",
    });

    setSubmittingProof(false);
    closeProofModal();
    toast.success("Proof uploaded. Waiting for trainer/admin approval before completion.");
  };

  const toggleWorkout = (id: string) => {
    const task = workouts.find((w) => w.id === id);
    if (!task || task.completed) return;
    if (pendingTaskIds.has(id)) {
      toast.info("This task is already submitted and pending review.");
      return;
    }
    openProofModal(id, "workout", task.name);
  };

  const toggleMeal = (id: string) => {
    const task = meals.find((m) => m.id === id);
    if (!task || task.completed) return;
    if (pendingTaskIds.has(id)) {
      toast.info("This task is already submitted and pending review.");
      return;
    }
    openProofModal(id, "diet", task.meal);
  };

  const totalTasks = workouts.length + meals.length;
  const completedTasks = workouts.filter((w) => w.completed).length + meals.filter((m) => m.completed).length;
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const workoutDone = workouts.filter((w) => w.completed).length;
  const mealsDone = meals.filter((m) => m.completed).length;
  const totalCalories = meals.reduce((acc, m) => acc + Number(m.calories || 0), 0);
  const doneCalories = meals.filter((m) => m.completed).reduce((acc, m) => acc + Number(m.calories || 0), 0);
  const totalDays =
    backendPlanRecord && typeof backendPlanRecord.totalDays === "number" ? backendPlanRecord.totalDays : s.totalDays;

  const dayType = dayTypes[(selectedDay - 1) % 7];
  const isToday = selectedDay === backendCurrentDay;
  const isPast = selectedDay < backendCurrentDay;

  if (!canStartCurrentPlan) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="rounded-[32px] border border-white/10 bg-[#121212] p-8 space-y-5 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#6F5CFF]/20 px-3 py-1.5 border border-[#6F5CFF]/30">
            <Clock className="h-3.5 w-3.5 text-[#6F5CFF]" />
            <span className="text-xs font-semibold text-[#6F5CFF]">Plan Access</span>
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Waiting for trainer approval</h1>
          <p className="text-sm text-white/60 leading-relaxed">
            Your auto-generated plan status is{" "}
            <span className="text-white font-semibold">{currentStudentPlan?.status}</span>. You cannot start daily tasks until the plan becomes active.
          </p>
          <Link
            to="/student/plan-status"
            className="inline-flex items-center gap-2 rounded-full bg-[#C9F85A] px-5 py-2.5 text-sm font-semibold text-black"
          >
            View plan status
            <ChevRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">

      {/* ── Exercise Detail Modal ─────────────────────────── */}
      <AnimatePresence>
        {selectedExercise && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[100]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExercise(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-lg relative z-10 rounded-[32px] overflow-hidden max-h-[90vh] flex flex-col border border-white/10 bg-[#111111] shadow-[0_40px_120px_rgba(0,0,0,0.7)]"
            >
              {/* video */}
              <div className="aspect-video relative flex items-center justify-center bg-[#080808] flex-shrink-0 overflow-hidden">
                {selectedExercise.videoEmbedUrl ? (
                  <iframe
                    src={selectedExercise.videoEmbedUrl}
                    title={`${selectedExercise.name} demo`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#C9F85A]/5 via-transparent to-[#4DD2FF]/5" />
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                      }}
                    />
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      className="w-16 h-16 rounded-full bg-[#C9F85A]/15 flex items-center justify-center border border-[#C9F85A]/30 cursor-pointer z-10"
                    >
                      <Play className="h-6 w-6 text-[#C9F85A] fill-[#C9F85A]/20 ml-0.5" />
                    </motion.div>
                  </>
                )}
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all z-20"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-4 left-4 z-10">
                  <span className="rounded-full bg-[#C9F85A] px-2.5 py-0.5 text-[10px] font-bold text-black uppercase tracking-wider">
                    Exercise Guide
                  </span>
                </div>
              </div>

              {/* content */}
              <div className="p-7 space-y-6 overflow-y-auto">
                <div>
                  <h3 className="text-2xl font-semibold text-white tracking-tight">{selectedExercise.name}</h3>
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-[#C9F85A]" /> Primary Goal: Hypertrophy
                  </p>
                </div>

                {/* stats grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Sets", value: selectedExercise.sets, color: "#C9F85A" },
                    { label: "Reps", value: selectedExercise.reps, color: "#4DD2FF" },
                    { label: "Rest", value: selectedExercise.rest, color: "#A78BFA" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-[#1A1A1A] border border-white/5 p-4 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">{item.label}</p>
                      <p className="text-xl font-bold" style={{ color: item.color }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* coach notes */}
                <div className="rounded-2xl bg-[#141414] border border-[#C9F85A]/15 p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#C9F85A] rounded-l-2xl" />
                  <p className="text-[10px] font-bold text-[#C9F85A] uppercase tracking-widest flex items-center gap-1.5 mb-3 pl-2">
                    <Info className="h-3.5 w-3.5" /> Coach Notes
                  </p>
                  <p className="text-sm text-white/70 leading-relaxed pl-2">
                    {selectedExercise.focus || "Execute with controlled tempo and safe form."}
                  </p>
                </div>

                {selectedExercise.videoUrl && (
                  <a
                    href={selectedExercise.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl border border-[#4DD2FF]/30 bg-[#4DD2FF]/10 px-3 py-2 text-xs font-semibold text-[#4DD2FF]"
                  >
                    Open demo video in new tab
                  </a>
                )}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setSelectedExercise(null); toggleWorkout(selectedExercise.id); }}
                  className="w-full bg-[#C9F85A] text-[#0F0F0F] py-4 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-[0_8px_32px_rgba(201,248,90,0.25)] hover:shadow-[0_8px_40px_rgba(201,248,90,0.35)] hover:bg-[#d4ff60]"
                >
                  Submit Proof for Approval
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {proofModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeProofModal}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={LUXURY_TWEEN_MEDIUM}
              className="relative z-10 w-full max-w-lg rounded-[28px] border border-white/10 bg-[#111111] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.7)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4DD2FF]">Proof Required</p>
                  <h3 className="mt-1 text-xl font-semibold text-white tracking-tight">Submit task proof photo</h3>
                  <p className="mt-1 text-xs text-white/45">
                    {proofModal.taskType === "workout" ? "Workout" : "Meal"} will be marked complete only after trainer/admin approval.
                  </p>
                </div>
                <button onClick={closeProofModal} className="rounded-xl bg-white/5 p-2 text-white/60 hover:bg-white/10 hover:text-white transition-all">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block rounded-2xl border border-dashed border-[#4DD2FF]/35 bg-[#4DD2FF]/5 p-5 text-center cursor-pointer hover:bg-[#4DD2FF]/10 transition-all">
                  <Upload className="mx-auto h-5 w-5 text-[#4DD2FF]" />
                  <p className="mt-2 text-xs font-semibold text-[#4DD2FF]">Upload Photo Proof</p>
                  <p className="text-[11px] text-white/35 mt-1">Image is mandatory for completion request.</p>
                  <input type="file" accept="image/*" className="hidden" onChange={handleProofFileChange} />
                </label>

                {proofPreview && (
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0D0D0D]">
                    <img src={proofPreview} alt="Task proof preview" className="w-full h-52 object-cover" />
                  </div>
                )}

                <textarea
                  value={proofCaption}
                  onChange={(e) => setProofCaption(e.target.value)}
                  rows={3}
                  placeholder="Optional caption for this proof..."
                  className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#4DD2FF]/40"
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={closeProofModal}
                  className="rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-semibold text-white/70 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={submitProof}
                  disabled={!proofFile || submittingProof}
                  className="rounded-xl bg-[#4DD2FF] py-3 text-xs font-bold text-black hover:bg-[#61d9ff] transition-all disabled:opacity-50"
                >
                  {submittingProof ? "Submitting..." : "Submit For Approval"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Top Summary Bar ───────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
      >
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FF4D00]/15 border border-[#FF4D00]/25 px-3 py-1.5">
                <Flame className="h-3.5 w-3.5 text-[#FF4D00]" />
                <span className="text-xs font-bold text-[#FF4D00]">{s.streak} Day Streak</span>
              </div>
              {isToday && (
                <span className="text-[10px] px-2.5 py-1.5 rounded-full bg-[#C9F85A] text-black font-bold uppercase tracking-widest">
                  Today
                </span>
              )}
              {isPast && (
                <span className="text-[10px] px-2.5 py-1.5 rounded-full bg-white/10 text-white/60 font-semibold uppercase tracking-wider">
                  Past Day
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Current Plan</p>
              <h1 className="text-4xl font-bold text-white tracking-tight leading-none">
                Day {selectedDay}
                <span className="text-white/30 text-2xl font-medium ml-2">/ {totalDays}</span>
              </h1>
              <p className="text-sm text-white/50 mt-1.5">{dayType}</p>
            </div>
          </div>

          {/* Day nav arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDay((d) => Math.max(1, d - 1))}
              disabled={selectedDay <= 1}
              className="p-2.5 rounded-full bg-[#1D1D1D] border border-white/10 text-white/60 hover:text-white hover:bg-[#282828] disabled:opacity-25 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSelectedDay((d) => Math.min(totalDays, d + 1))}
              disabled={selectedDay >= totalDays}
              className="p-2.5 rounded-full bg-[#1D1D1D] border border-white/10 text-white/60 hover:text-white hover:bg-[#282828] disabled:opacity-25 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Day Progress", value: `${pct}%`, sub: `${completedTasks}/${totalTasks} tasks`, color: "#C9F85A", bg: "bg-[#C9F85A]", dark: true },
            { label: "Workouts Done", value: `${workoutDone}/${workouts.length}`, sub: "exercises logged", color: "#4DD2FF", bg: "bg-[#1A1A1A]", dark: false },
            { label: "Meals Logged", value: `${mealsDone}/${meals.length}`, sub: "nutrition tracked", color: "#FFD36E", bg: "bg-[#1A1A1A]", dark: false },
            { label: "Calories", value: `${doneCalories}`, sub: `of ${totalCalories} kcal`, color: "#A78BFA", bg: "bg-[#1A1A1A]", dark: false },
          ].map((kpi) => (
            <div key={kpi.label} className={`${kpi.bg} rounded-2xl border border-white/5 p-4 relative overflow-hidden`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${kpi.dark ? "text-black/60" : "text-white/40"}`}>{kpi.label}</p>
              <p className={`text-2xl font-bold tracking-tight leading-none ${kpi.dark ? "text-black" : ""}`} style={!kpi.dark ? { color: kpi.color } : {}}>{kpi.value}</p>
              <p className={`text-[10px] mt-1.5 ${kpi.dark ? "text-black/50" : "text-white/35"}`}>{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Daily Completion</span>
            <span className="text-xs font-bold text-[#C9F85A]">{pct}%</span>
          </div>
          <div className="h-2 bg-[#1D1D1D] rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #C9F85A, #4DD2FF)" }}
            />
          </div>
        </div>
      </motion.section>

      {/* ── 28-Day Timeline ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.06 }}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#C9F85A]" />
            <p className="text-sm font-semibold text-white">Plan Timeline</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDay((d) => Math.max(1, d - 7))}
              disabled={selectedDay <= 7}
              className="p-1.5 rounded-lg bg-[#1D1D1D] hover:bg-[#282828] text-white/60 hover:text-white disabled:opacity-25 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-white/40 font-medium px-1">Week {Math.ceil(selectedDay / 7)}</span>
            <button
              onClick={() => setSelectedDay((d) => Math.min(totalDays, d + 7))}
              disabled={selectedDay > totalDays - 7}
              className="p-1.5 rounded-lg bg-[#1D1D1D] hover:bg-[#282828] text-white/60 hover:text-white disabled:opacity-25 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
          {Array.from({ length: totalDays }, (_, i) => {
            const day = i + 1;
            const isSelected = day === selectedDay;
            const isDone = day < backendCurrentDay;
            const isTodayDay = day === backendCurrentDay;
            return (
              <motion.button
                key={day}
                whileTap={{ scale: 0.92 }}
                onClick={() => setSelectedDay(day)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all text-xs font-bold border ${
                  isSelected
                    ? "bg-[#C9F85A] border-[#C9F85A] text-black shadow-[0_4px_20px_rgba(201,248,90,0.3)]"
                    : isTodayDay
                    ? "bg-[#C9F85A]/10 border-[#C9F85A]/30 text-[#C9F85A]"
                    : isDone
                    ? "bg-[#1A1A1A] border-white/5 text-white/30"
                    : "bg-transparent border-white/5 text-white/20 hover:border-white/15 hover:text-white/40"
                }`}
              >
                {day}
                {isDone && !isSelected && (
                  <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#C9F85A] rounded-full" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] text-white/35">
          {[
            { dot: "bg-[#C9F85A]", label: "Today" },
            { dot: "bg-[#C9F85A]", label: "Selected", small: true },
            { dot: "bg-white/20", label: "Completed" },
            { dot: "bg-white/10", label: "Upcoming" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${item.dot}`} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Tab switcher: Workout / Diet ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.1 }}
        className="flex gap-2"
      >
        {(["workout", "diet"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all ${
              activeTab === tab
                ? tab === "workout"
                  ? "bg-[#C9F85A] text-black"
                  : "bg-[#4DD2FF] text-black"
                : "bg-[#1A1A1A] border border-white/10 text-white/60 hover:bg-[#222]"
            }`}
          >
            {tab === "workout" ? <Dumbbell className="h-4 w-4" /> : <Utensils className="h-4 w-4" />}
            {tab === "workout" ? "Workout" : "Nutrition"}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              activeTab === tab ? "bg-black/15" : "bg-white/10 text-white/50"
            }`}>
              {tab === "workout"
                ? `${workoutDone}/${workouts.length}`
                : `${mealsDone}/${meals.length}`}
            </span>
          </button>
        ))}
      </motion.div>

      {/* ── Workout Panel ─────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === "workout" && (
          <motion.section
            key="workout"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3"
          >
            {workouts.map((w, idx) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: idx * 0.06 }}
                className={`rounded-[24px] border transition-all overflow-hidden group ${
                  w.completed
                    ? "bg-[#141E0F] border-[#C9F85A]/25"
                    : "bg-[#121212] border-white/8 hover:border-white/15"
                }`}
              >
                <div className="flex items-center gap-4 p-5">
                  {/* complete toggle */}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => isToday && toggleWorkout(w.id)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      w.completed
                        ? "bg-[#C9F85A] border-[#C9F85A]"
                        : "border-white/20 hover:border-[#C9F85A]/60"
                    }`}
                  >
                    {w.completed && <Check className="h-4 w-4 text-black" strokeWidth={3} />}
                  </motion.button>

                  {/* exercise number */}
                  <div className="w-8 h-8 rounded-xl bg-[#1D1D1D] border border-white/5 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-white/40">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold tracking-tight ${w.completed ? "text-white/50 line-through" : "text-white"}`}>
                      {w.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="text-xs text-white/40">{w.sets} sets × {w.reps} reps</span>
                      <span className="text-xs text-white/30">·</span>
                      <span className="text-xs text-white/40">{w.focus}</span>
                    </div>
                  </div>

                  {/* tags */}
                  <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/40">
                      {w.equipmentMode.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* play button */}
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setSelectedExercise(w)}
                    className="w-9 h-9 rounded-full bg-[#1D1D1D] border border-white/10 flex items-center justify-center text-white/50 hover:text-[#C9F85A] hover:border-[#C9F85A]/30 hover:bg-[#C9F85A]/10 transition-all flex-shrink-0"
                  >
                    <Play className="h-3.5 w-3.5 ml-0.5" />
                  </motion.button>
                </div>

                {/* Bottom bar: alternatives */}
                {w.alternatives.length > 0 && (
                  <div className="px-5 pb-4 flex flex-wrap gap-1.5">
                    {w.alternatives.slice(0, 3).map((alt) => (
                      <span key={alt} className="rounded-full border border-[#4DD2FF]/20 bg-[#4DD2FF]/8 px-2.5 py-0.5 text-[10px] text-[#4DD2FF]/80">
                        Alt: {alt}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}

            {/* Workout summary footer */}
            <div className="rounded-2xl bg-[#1A1A1A] border border-white/5 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-[#C9F85A]" />
                <span className="text-sm font-semibold text-white">{workoutDone} of {workouts.length} workouts complete</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-32 bg-[#111] rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${workouts.length > 0 ? (workoutDone / workouts.length) * 100 : 0}%` }}
                    transition={LUXURY_TWEEN_SLOW}
                    className="h-full bg-[#C9F85A] rounded-full"
                  />
                </div>
                <span className="text-xs font-bold text-[#C9F85A]">
                  {workouts.length > 0 ? Math.round((workoutDone / workouts.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </motion.section>
        )}

        {/* ── Diet/Nutrition Panel ──────────────────────── */}
        {activeTab === "diet" && (
          <motion.section
            key="diet"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3"
          >
            {meals.map((m, idx) => {
              const isExpanded = expandedMeal === m.id;
              const accentColor = mealTimeColor(m.time);
              const totalMacros = m.macros.protein + m.macros.carbs + m.macros.fats;

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: idx * 0.07 }}
                  className={`rounded-[24px] border transition-all overflow-hidden ${
                    m.completed
                      ? "bg-[#0D1A0D] border-emerald-500/25"
                      : "bg-[#121212] border-white/8"
                  }`}
                >
                  {/* Main row */}
                  <div className="flex items-center gap-4 p-5">
                    {/* check */}
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => isToday && toggleMeal(m.id)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        m.completed
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-white/20 hover:border-emerald-500/60"
                      }`}
                    >
                      {m.completed && <Check className="h-4 w-4 text-black" strokeWidth={3} />}
                    </motion.button>

                    {/* time color dot */}
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}60` }}
                    />

                    {/* info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold tracking-tight ${m.completed ? "text-white/50 line-through" : "text-white"}`}>
                        {m.meal}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-xs text-white/40">{m.time}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${accentColor}18`, color: accentColor }}>
                          {m.calories} kcal
                        </span>
                      </div>
                    </div>

                    {/* expand toggle */}
                    <motion.button
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.22 }}
                      onClick={() => setExpandedMeal(isExpanded ? null : m.id)}
                      className="w-8 h-8 rounded-full bg-[#1D1D1D] border border-white/8 flex items-center justify-center text-white/40 hover:text-white hover:bg-[#252525] transition-all flex-shrink-0"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.button>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 space-y-5 border-t border-white/5 pt-4">
                          {/* description */}
                          <p className="text-xs text-white/50 leading-relaxed">{m.description}</p>

                          {/* Food items */}
                          <div className="flex flex-wrap gap-2">
                            {m.foods.map((f) => (
                              <div
                                key={`${m.id}-${f.item}`}
                                className="rounded-full px-3 py-1 text-[10px] font-semibold border"
                                style={{
                                  background: `${accentColor}12`,
                                  borderColor: `${accentColor}30`,
                                  color: accentColor,
                                }}
                              >
                                {f.item}: {f.grams}g
                              </div>
                            ))}
                          </div>

                          {/* Macro bars */}
                          <div className="space-y-3">
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Macronutrients</p>
                            {[
                              { label: "Protein", value: m.macros.protein, color: "#4DD2FF", pct: totalMacros > 0 ? (m.macros.protein / totalMacros) * 100 : 0 },
                              { label: "Carbs", value: m.macros.carbs, color: "#FFD36E", pct: totalMacros > 0 ? (m.macros.carbs / totalMacros) * 100 : 0 },
                              { label: "Fats", value: m.macros.fats, color: "#FF7AE5", pct: totalMacros > 0 ? (m.macros.fats / totalMacros) * 100 : 0 },
                            ].map((macro) => (
                              <div key={macro.label}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-semibold text-white/40">{macro.label}</span>
                                  <span className="text-[10px] font-bold" style={{ color: macro.color }}>{macro.value}g</span>
                                </div>
                                <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: macro.pct / 100 }}
                                    transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                                    style={{ background: macro.color, transformOrigin: "left" }}
                                    className="h-full rounded-full"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Log button */}
                          {isToday && !m.completed && (
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => toggleMeal(m.id)}
                              className="w-full py-3 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all tracking-wide"
                            >
                              Submit Meal Proof
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Nutrition summary footer */}
            <div className="rounded-2xl bg-[#1A1A1A] border border-white/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">Nutrition Summary</span>
                </div>
                <span className="text-xs font-bold text-emerald-400">{doneCalories} / {totalCalories} kcal</span>
              </div>
              <div className="h-1.5 bg-[#111] rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${totalCalories > 0 ? (doneCalories / totalCalories) * 100 : 0}%` }}
                  transition={LUXURY_TWEEN_SLOW}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Activity Stats ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.25 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {/* Steps */}
        <div className="rounded-[24px] bg-[#121212] border border-white/8 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#C9F85A]/4 translate-x-8 -translate-y-8 blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#C9F85A]/10 border border-[#C9F85A]/20 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-[#C9F85A]" />
                </div>
                <span className="text-sm font-semibold text-white">Steps</span>
              </div>
              <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Daily Target</span>
            </div>
            <p className="text-4xl font-bold text-white tracking-tight">{s.todaySteps.toLocaleString()}</p>
            <p className="text-xs text-white/40 mt-1">Target: {todayTask.stepTarget.toLocaleString()}</p>
            <div className="mt-4 h-1.5 bg-[#1D1D1D] rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (s.todaySteps / todayTask.stepTarget) * 100)}%` }}
                transition={LUXURY_TWEEN_SLOW}
                className="h-full bg-[#C9F85A] rounded-full"
              />
            </div>
            <p className="text-[10px] text-[#C9F85A] font-bold mt-2">
              {Math.round(Math.min(100, (s.todaySteps / todayTask.stepTarget) * 100))}% of goal
            </p>
          </div>
        </div>

        {/* Hydration */}
        <div className="rounded-[24px] bg-[#121212] border border-white/8 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#4DD2FF]/4 translate-x-8 -translate-y-8 blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#4DD2FF]/10 border border-[#4DD2FF]/20 flex items-center justify-center">
                  <Droplets className="h-4 w-4 text-[#4DD2FF]" />
                </div>
                <span className="text-sm font-semibold text-white">Hydration</span>
              </div>
              <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Daily Goal</span>
            </div>
            <p className="text-4xl font-bold text-white tracking-tight">2.4<span className="text-2xl text-white/40 font-medium">L</span></p>
            <p className="text-xs text-white/40 mt-1">Goal: {todayTask.hydrationGoal}</p>
            <div className="mt-4 h-1.5 bg-[#1D1D1D] rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "65%" }}
                transition={LUXURY_TWEEN_SLOW}
                className="h-full bg-[#4DD2FF] rounded-full"
              />
            </div>
            <p className="text-[10px] text-[#4DD2FF] font-bold mt-2">65% of goal</p>
          </div>
        </div>
      </motion.div>

      {/* ── Daily Check-In CTA ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.35 }}
        className="rounded-[32px] border border-white/10 bg-[#121212] relative overflow-hidden"
      >
        {/* Bg decoration */}
        <div className="absolute inset-0 opacity-40"
          style={{ backgroundImage: "linear-gradient(rgba(201,248,90,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,248,90,0.03) 1px, transparent 1px)", backgroundSize: "32px 32px" }}
        />
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-[#C9F85A]/5 translate-x-16 -translate-y-16 blur-3xl" />

        <div className="relative z-10 p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] border border-white/10 flex items-center justify-center flex-shrink-0 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <Upload className="h-7 w-7 text-white/70" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-[#C9F85A] uppercase tracking-widest mb-2">Daily Accountability</p>
            <h2 className="text-2xl font-bold text-white tracking-tight">Submit Your Check-In</h2>
            <p className="text-sm text-white/50 mt-2 leading-relaxed max-w-md">
              Upload your daily progress photos and notes for your trainer to review. Consistency is proof.
            </p>
          </div>
          {canPostFeed && (
            <Link
              to="/student/upload"
              className="inline-flex items-center gap-2.5 bg-[#C9F85A] text-black px-7 py-3.5 rounded-full font-bold text-sm transition-all hover:bg-[#d4ff60] shadow-[0_8px_32px_rgba(201,248,90,0.25)] hover:shadow-[0_8px_40px_rgba(201,248,90,0.35)] flex-shrink-0"
            >
              <Upload className="h-4 w-4" />
              Submit Check-in
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </motion.div>

    </div>
  );
}
