import { useState, useMemo } from "react";
import {
  Award, Plus, Trash2, Edit3, Save, X, Flame, Footprints, Trophy,
  Star, Sun, Leaf, Zap, Shield, Crown, Target, Heart, Camera,
  Users, TrendingUp, ChevronDown, ChevronUp, Sparkles, CheckCircle2,
  AlertCircle, Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";
import { toast } from "sonner";

/* ── Icon options for badge creation ─────────────────── */
const ICON_OPTIONS: { key: string; label: string; component: React.ElementType }[] = [
  { key: "flame", label: "Flame", component: Flame },
  { key: "footprints", label: "Steps", component: Footprints },
  { key: "trophy", label: "Trophy", component: Trophy },
  { key: "star", label: "Star", component: Star },
  { key: "sunrise", label: "Sunrise", component: Sun },
  { key: "salad", label: "Nutrition", component: Leaf },
  { key: "award", label: "Award", component: Award },
  { key: "zap", label: "Energy", component: Zap },
  { key: "shield", label: "Shield", component: Shield },
  { key: "crown", label: "Crown", component: Crown },
  { key: "target", label: "Target", component: Target },
  { key: "heart", label: "Heart", component: Heart },
  { key: "camera", label: "Camera", component: Camera },
  { key: "users", label: "Social", component: Users },
  { key: "trending", label: "Trending", component: TrendingUp },
];

const ICON_MAP: Record<string, React.ElementType> = Object.fromEntries(
  ICON_OPTIONS.map((opt) => [opt.key, opt.component])
);

/* ── Achievement metric targets ──────────────────────── */
type AchievementMetric =
  | "streak_days"
  | "total_steps"
  | "steps_per_day"
  | "completion_pct"
  | "total_uploads"
  | "total_followers"
  | "total_following"
  | "total_plans_completed"
  | "total_points"
  | "login_days"
  | "early_workout"
  | "leaderboard_rank"
  | "consecutive_meals"
  | "custom";

const METRIC_OPTIONS: { value: AchievementMetric; label: string; description: string }[] = [
  { value: "streak_days", label: "Streak (Days)", description: "Number of consecutive active days" },
  { value: "total_steps", label: "Total Steps", description: "Cumulative steps across all time" },
  { value: "steps_per_day", label: "Steps Per Day", description: "Steps in a single day" },
  { value: "completion_pct", label: "Completion %", description: "Overall plan completion percentage" },
  { value: "total_uploads", label: "Total Uploads", description: "Number of proof uploads submitted" },
  { value: "total_followers", label: "Followers Count", description: "Total followers on profile" },
  { value: "total_following", label: "Following Count", description: "Total users being followed" },
  { value: "total_plans_completed", label: "Plans Completed", description: "Number of full plans finished" },
  { value: "total_points", label: "Total Points", description: "Cumulative score points earned" },
  { value: "login_days", label: "Login Days", description: "Total days logged in to platform" },
  { value: "early_workout", label: "Early Workout", description: "Complete a workout before a certain hour" },
  { value: "leaderboard_rank", label: "Leaderboard Rank", description: "Reach a specific rank on leaderboard" },
  { value: "consecutive_meals", label: "Consecutive Meal Logs", description: "Log meals for N consecutive days" },
  { value: "custom", label: "Custom / Manual", description: "Manually awarded by admin" },
];

type ComparisonOp = "gte" | "lte" | "eq";

const COMPARISON_OPTIONS: { value: ComparisonOp; label: string }[] = [
  { value: "gte", label: "≥ (at least)" },
  { value: "lte", label: "≤ (at most)" },
  { value: "eq", label: "= (exactly)" },
];

/* ── Achievement Definition ──────────────────────────── */
interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  metric: AchievementMetric;
  comparison: ComparisonOp;
  threshold: number;
  active: boolean;
  createdAt: string;
}

/* ── Default 10 achievements ─────────────────────────── */
const DEFAULT_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "ach-1",
    name: "Consistency Machine",
    description: "Maintain a 14-day active streak without breaking",
    icon: "flame",
    metric: "streak_days",
    comparison: "gte",
    threshold: 14,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ach-2",
    name: "Proof Master",
    description: "Submit 50 verified workout/meal proof uploads",
    icon: "camera",
    metric: "total_uploads",
    comparison: "gte",
    threshold: 50,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ach-3",
    name: "10K Club",
    description: "Walk 10,000+ steps in a single day for 10 days total",
    icon: "footprints",
    metric: "steps_per_day",
    comparison: "gte",
    threshold: 10000,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ach-4",
    name: "Iron Will",
    description: "Complete an entire 30-day plan without missing a single day",
    icon: "shield",
    metric: "total_plans_completed",
    comparison: "gte",
    threshold: 1,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ach-5",
    name: "Community Anchor",
    description: "Build your network by following 20 fellow athletes",
    icon: "users",
    metric: "total_following",
    comparison: "gte",
    threshold: 20,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ach-6",
    name: "Early Riser",
    description: "Complete a workout before 7:00 AM",
    icon: "sunrise",
    metric: "early_workout",
    comparison: "lte",
    threshold: 7,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ach-7",
    name: "Peak Performer",
    description: "Reach #1 on any leaderboard category",
    icon: "crown",
    metric: "leaderboard_rank",
    comparison: "eq",
    threshold: 1,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ach-8",
    name: "Nutrition Ninja",
    description: "Log all meals for 21 consecutive days",
    icon: "salad",
    metric: "consecutive_meals",
    comparison: "gte",
    threshold: 21,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ach-9",
    name: "Streak Legend",
    description: "Achieve and maintain a 30-day unbroken streak",
    icon: "flame",
    metric: "streak_days",
    comparison: "gte",
    threshold: 30,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ach-10",
    name: "Social Butterfly",
    description: "Receive 50 likes on your uploaded posts",
    icon: "heart",
    metric: "total_points",
    comparison: "gte",
    threshold: 5000,
    active: true,
    createdAt: new Date().toISOString(),
  },
];

const ACCENT = "#C9F85A";

const PALETTE = [
  "#C9F85A", "#4DD2FF", "#FFD36E", "#A78BFA", "#FF7AE5",
  "#FF4D00", "#10B981", "#F472B6", "#FBBF24", "#6F5CFF",
];

export default function AchievementsManagerPage() {
  const [achievements, setAchievements] = useState<AchievementDef[]>(DEFAULT_ACHIEVEMENTS);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  /* ── Form state ───── */
  const emptyForm: Omit<AchievementDef, "id" | "createdAt"> = {
    name: "",
    description: "",
    icon: "trophy",
    metric: "streak_days",
    comparison: "gte",
    threshold: 7,
    active: true,
  };
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return achievements;
    return achievements.filter(
      (a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    );
  }, [achievements, searchQuery]);

  const handleCreate = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!form.description.trim()) { toast.error("Description is required"); return; }
    if (form.threshold <= 0 && form.metric !== "custom") { toast.error("Threshold must be > 0"); return; }

    const newAch: AchievementDef = {
      ...form,
      id: `ach-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAchievements((prev) => [...prev, newAch]);
    setForm(emptyForm);
    setShowCreateForm(false);
    toast.success(`Achievement "${newAch.name}" created!`);
  };

  const handleUpdate = (id: string) => {
    setAchievements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...form, id: a.id, createdAt: a.createdAt } : a))
    );
    setEditingId(null);
    setForm(emptyForm);
    toast.success("Achievement updated!");
  };

  const handleDelete = (id: string) => {
    setAchievements((prev) => prev.filter((a) => a.id !== id));
    toast.success("Achievement removed.");
  };

  const handleToggleActive = (id: string) => {
    setAchievements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const startEdit = (ach: AchievementDef) => {
    setForm({
      name: ach.name,
      description: ach.description,
      icon: ach.icon,
      metric: ach.metric,
      comparison: ach.comparison,
      threshold: ach.threshold,
      active: ach.active,
    });
    setEditingId(ach.id);
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  /* ── Evaluation logic description ──────────────────── */
  const getLogicDescription = (ach: AchievementDef) => {
    const metricLabel = METRIC_OPTIONS.find((m) => m.value === ach.metric)?.label || ach.metric;
    const opLabel = COMPARISON_OPTIONS.find((c) => c.value === ach.comparison)?.label || ach.comparison;
    if (ach.metric === "custom") return "Manually awarded by admin – no automatic evaluation";
    return `Award when ${metricLabel} ${opLabel} ${ach.threshold.toLocaleString()}`;
  };

  /* ── Form component ────────────────────────────────── */
  const renderForm = (onSubmit: () => void, submitLabel: string) => (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="text-[10px] text-white/30 uppercase tracking-[0.12em] block mb-1.5">Achievement Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Streak Legend"
          className="w-full rounded-xl border border-white/10 bg-[#0D0D0D] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#C9F85A]/40 transition-colors"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] text-white/30 uppercase tracking-[0.12em] block mb-1.5">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="What does the student need to do?"
          rows={2}
          className="w-full rounded-xl border border-white/10 bg-[#0D0D0D] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#C9F85A]/40 transition-colors resize-none"
        />
      </div>

      {/* Icon picker */}
      <div>
        <label className="text-[10px] text-white/30 uppercase tracking-[0.12em] block mb-2">Icon</label>
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map((opt) => {
            const Ic = opt.component;
            const selected = form.icon === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setForm((f) => ({ ...f, icon: opt.key }))}
                title={opt.label}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
                  selected
                    ? "bg-[#C9F85A]/15 border-[#C9F85A]/40 text-[#C9F85A]"
                    : "bg-[#1A1A1A] border-white/5 text-white/30 hover:text-white/60 hover:border-white/15"
                }`}
              >
                <Ic className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Metric + Comparison + Threshold */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] text-white/30 uppercase tracking-[0.12em] block mb-1.5">Metric</label>
          <select
            value={form.metric}
            onChange={(e) => setForm((f) => ({ ...f, metric: e.target.value as AchievementMetric }))}
            className="w-full rounded-xl border border-white/10 bg-[#0D0D0D] px-3 py-3 text-sm text-white outline-none focus:border-[#C9F85A]/40 transition-colors appearance-none"
          >
            {METRIC_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-white/30 uppercase tracking-[0.12em] block mb-1.5">Comparison</label>
          <select
            value={form.comparison}
            onChange={(e) => setForm((f) => ({ ...f, comparison: e.target.value as ComparisonOp }))}
            className="w-full rounded-xl border border-white/10 bg-[#0D0D0D] px-3 py-3 text-sm text-white outline-none focus:border-[#C9F85A]/40 transition-colors appearance-none"
          >
            {COMPARISON_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-white/30 uppercase tracking-[0.12em] block mb-1.5">Threshold</label>
          <input
            type="number"
            min={0}
            value={form.threshold}
            onChange={(e) => setForm((f) => ({ ...f, threshold: Number(e.target.value) }))}
            className="w-full rounded-xl border border-white/10 bg-[#0D0D0D] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#C9F85A]/40 transition-colors"
          />
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
          className={`w-10 h-6 rounded-full transition-colors relative ${
            form.active ? "bg-[#C9F85A]" : "bg-[#2A2A2A] border border-white/10"
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${
              form.active ? "left-5" : "left-1"
            }`}
          />
        </button>
        <span className="text-xs text-white/50">{form.active ? "Active" : "Inactive"}</span>
      </div>

      {/* Logic preview */}
      <div className="rounded-xl bg-[#0D0D0D] border border-white/5 p-3">
        <p className="text-[10px] text-white/25 uppercase tracking-[0.12em] mb-1">Evaluation Logic</p>
        <p className="text-xs text-[#4DD2FF]">
          {getLogicDescription({ ...form, id: "", createdAt: "" })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={() => { setShowCreateForm(false); cancelEdit(); }}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white/50 bg-[#1A1A1A] border border-white/8 hover:bg-[#222] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-[#C9F85A] hover:bg-[#d4ff60] transition-colors shadow-[0_4px_16px_rgba(201,248,90,0.3)]"
        >
          <Save className="h-3.5 w-3.5 inline mr-1.5" />
          {submitLabel}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

      {/* ── Header ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#C9F85A]/[0.04] blur-[80px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#C9F85A]/10 border border-[#C9F85A]/20 px-3 py-1.5 mb-3">
              <Shield className="h-3.5 w-3.5 text-[#C9F85A]" />
              <span className="text-[11px] font-bold text-[#C9F85A] uppercase tracking-[0.15em]">Admin</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Achievement Manager</h1>
            <p className="text-sm text-white/35 mt-1">
              Create, edit, and manage achievement definitions · <span className="text-[#C9F85A] font-semibold">{achievements.length}</span> configured
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setShowCreateForm(!showCreateForm); cancelEdit(); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
              showCreateForm
                ? "bg-[#2A2A2A] text-white/70 border border-white/10"
                : "bg-[#C9F85A] text-black shadow-[0_4px_20px_rgba(201,248,90,0.3)] hover:shadow-[0_4px_28px_rgba(201,248,90,0.45)]"
            }`}
          >
            {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showCreateForm ? "Close" : "New Achievement"}
          </button>
        </div>
      </motion.div>

      {/* ── Create form ──────────────────────────────── */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={LUXURY_TWEEN_MEDIUM}
            className="overflow-hidden"
          >
            <div className="rounded-[24px] border border-[#C9F85A]/20 bg-[#121212] p-6 shadow-[0_0_40px_rgba(201,248,90,0.08)]">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="h-4 w-4 text-[#C9F85A]" />
                <h2 className="text-base font-semibold text-white">Create New Achievement</h2>
              </div>
              {renderForm(handleCreate, "Create Achievement")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search ───────────────────────────────────── */}
      <div className="relative">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search achievements..."
          className="w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#C9F85A]/30 transition-colors"
        />
      </div>

      {/* ── Achievement list ─────────────────────────── */}
      <div className="space-y-3">
        {filtered.map((ach, idx) => {
          const Icon = ICON_MAP[ach.icon] || Award;
          const color = PALETTE[idx % PALETTE.length];
          const isExpanded = expandedId === ach.id;
          const isEditing = editingId === ach.id;

          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...LUXURY_TWEEN_MEDIUM, delay: idx * 0.03 }}
              className={`rounded-[20px] border bg-[#121212] transition-all ${
                isEditing ? "border-[#C9F85A]/30 shadow-[0_0_30px_rgba(201,248,90,0.08)]" : "border-white/8 hover:border-white/15"
              }`}
            >
              {/* Row header */}
              <div className="flex items-center gap-4 p-4">
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}15`, border: `1.5px solid ${color}30` }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate">{ach.name}</p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        ach.active
                          ? "bg-[#C9F85A]/10 text-[#C9F85A] border border-[#C9F85A]/20"
                          : "bg-white/5 text-white/25 border border-white/8"
                      }`}
                    >
                      {ach.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/35 mt-0.5 truncate">{ach.description}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(ach.id)}
                    title={ach.active ? "Deactivate" : "Activate"}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border ${
                      ach.active
                        ? "border-[#C9F85A]/20 text-[#C9F85A] hover:bg-[#C9F85A]/10"
                        : "border-white/10 text-white/25 hover:bg-white/5"
                    }`}
                  >
                    {ach.active ? <Eye className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => isEditing ? cancelEdit() : startEdit(ach)}
                    title="Edit"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors border border-white/10 text-white/30 hover:bg-[#4DD2FF]/10 hover:text-[#4DD2FF] hover:border-[#4DD2FF]/20"
                  >
                    {isEditing ? <X className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ach.id)}
                    title="Delete"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors border border-white/10 text-white/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : ach.id)}
                    title="Details"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors border border-white/10 text-white/30 hover:bg-white/5"
                  >
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expanded details / editing */}
              <AnimatePresence>
                {(isExpanded || isEditing) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={LUXURY_TWEEN_MEDIUM}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/5 p-5">
                      {isEditing ? (
                        renderForm(() => handleUpdate(ach.id), "Save Changes")
                      ) : (
                        <div className="space-y-3">
                          {/* Logic description */}
                          <div className="rounded-xl bg-[#0D0D0D] border border-white/5 p-3">
                            <p className="text-[10px] text-white/25 uppercase tracking-[0.12em] mb-1">Evaluation Logic</p>
                            <p className="text-xs text-[#4DD2FF] font-medium">{getLogicDescription(ach)}</p>
                          </div>

                          {/* Meta */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="rounded-xl bg-[#0D0D0D] border border-white/5 p-3">
                              <p className="text-[10px] text-white/25 uppercase tracking-[0.12em]">Metric</p>
                              <p className="text-xs text-white/70 font-semibold mt-1">
                                {METRIC_OPTIONS.find((m) => m.value === ach.metric)?.label}
                              </p>
                            </div>
                            <div className="rounded-xl bg-[#0D0D0D] border border-white/5 p-3">
                              <p className="text-[10px] text-white/25 uppercase tracking-[0.12em]">Comparison</p>
                              <p className="text-xs text-white/70 font-semibold mt-1">
                                {COMPARISON_OPTIONS.find((c) => c.value === ach.comparison)?.label}
                              </p>
                            </div>
                            <div className="rounded-xl bg-[#0D0D0D] border border-white/5 p-3">
                              <p className="text-[10px] text-white/25 uppercase tracking-[0.12em]">Threshold</p>
                              <p className="text-xs font-semibold mt-1" style={{ color }}>{ach.threshold.toLocaleString()}</p>
                            </div>
                            <div className="rounded-xl bg-[#0D0D0D] border border-white/5 p-3">
                              <p className="text-[10px] text-white/25 uppercase tracking-[0.12em]">Created</p>
                              <p className="text-xs text-white/70 font-semibold mt-1">
                                {new Date(ach.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {/* Pseudocode */}
                          <div className="rounded-xl bg-[#0D0D0D] border border-white/5 p-3">
                            <p className="text-[10px] text-white/25 uppercase tracking-[0.12em] mb-2">Calculation Pseudocode</p>
                            <pre className="text-[11px] text-white/50 font-mono leading-relaxed whitespace-pre-wrap">
{ach.metric === "custom"
  ? `// Manually awarded by admin\nif (admin.awards(student, "${ach.id}")) {\n  unlock("${ach.name}");\n}`
  : `// Auto-evaluated on data refresh\nconst value = student.${ach.metric};\nif (value ${ach.comparison === "gte" ? ">=" : ach.comparison === "lte" ? "<=" : "==="} ${ach.threshold}) {\n  unlock("${ach.name}");\n}`
}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-white/25 text-sm">
            {searchQuery ? "No achievements match your search." : "No achievements configured. Create one above!"}
          </div>
        )}
      </div>
    </div>
  );
}
