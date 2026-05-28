import { motion } from "framer-motion";
import { Plus, Trash2, Dumbbell, Utensils, Target, Users, ChevronRight, Calendar, Bell } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SectionHeader from "@/components/SectionHeader";
import { useAppStore, useCurrentUser } from "@/hooks/useStore";
import { Student, Trainer } from "@/types";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";

interface TaskFormData {
  title: string;
  youtubeUrl: string;
}

interface DayFormData {
  exercises: TaskFormData[];
  meals: TaskFormData[];
  activity: string;
}

const createEmptyTask = (): TaskFormData => ({
  title: "",
  youtubeUrl: "",
});

const createEmptyDayForm = (): DayFormData => ({
  exercises: [createEmptyTask()],
  meals: [createEmptyTask()],
  activity: "",
});

export default function PlanBuilder() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const users = useAppStore((s) => s.users);
  const createPlan = useAppStore((s) => s.createPlan);

  const trainer = currentUser?.role === "trainer" ? (currentUser as Trainer) : null;

  // Strictly show only students assigned to this trainer
  const assignedStudents = Object.values(users)
    .filter((u): u is Student => {
      if (u.role !== "student") return false;
      const s = u as Student;
      return s.trainerId === trainer?.id;
    });

  const [publishing, setPublishing] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [cycleDuration, setCycleDuration] = useState(28);
  const [primaryGoal, setPrimaryGoal] = useState("Strength & Conditioning");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [dayForms, setDayForms] = useState<Record<number, DayFormData>>({
    1: createEmptyDayForm(),
  });

  const days = Object.keys(dayForms).map(Number).sort((a, b) => a - b);

  const toggleStudent = (studentId: string, checked: boolean) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(studentId); else next.delete(studentId);
      return next;
    });
  };

  const updateDayActivity = (day: number, value: string) => {
    setDayForms((prev) => ({
      ...prev,
      [day]: { ...prev[day], activity: value },
    }));
  };

  const updateTaskField = (day: number, section: "exercises" | "meals", index: number, field: keyof TaskFormData, value: string) => {
    setDayForms((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [section]: prev[day][section].map((task, taskIndex) => (taskIndex === index ? { ...task, [field]: value } : task)),
      },
    }));
  };

  const addTaskRow = (day: number, section: "exercises" | "meals") => {
    setDayForms((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [section]: [...prev[day][section], createEmptyTask()],
      },
    }));
  };

  const removeTaskRow = (day: number, section: "exercises" | "meals", index: number) => {
    setDayForms((prev) => {
      if ((prev[day]?.[section].length ?? 0) <= 1) return prev;
      return {
        ...prev,
        [day]: {
          ...prev[day],
          [section]: prev[day][section].filter((_, taskIndex) => taskIndex !== index),
        },
      };
    }));
  };

  const addDay = () => {
    const nextDay = days.length > 0 ? Math.max(...days) + 1 : 1;
    setDayForms((prev) => ({ ...prev, [nextDay]: createEmptyDayForm() }));
  };

  const removeDay = (day: number) => {
    if (days.length <= 1) return;
    setDayForms((prev) => {
      const next = { ...prev };
      delete next[day];
      return next;
    });
  };

  const handlePublish = async () => {
    if (!planTitle.trim()) {
      toast.error("Plan name is required.");
      return;
    }
    if (selectedStudentIds.size === 0) {
      toast.error("Please select at least one student.");
      return;
    }
    setPublishing(true);

    const planDays = days.map((day) => ({
      day,
      activity: dayForms[day]?.activity.trim() ?? "",
      exercises: (dayForms[day]?.exercises ?? []).map((exercise) => ({
        title: exercise.title.trim(),
        youtubeUrl: exercise.youtubeUrl.trim() || null,
      })),
      meals: (dayForms[day]?.meals ?? []).map((meal) => ({
        title: meal.title.trim(),
        youtubeUrl: meal.youtubeUrl.trim() || null,
      })),
    }));

    try {
      await createPlan({
        title: planTitle.trim(),
        duration: Math.max(1, cycleDuration),
        goalType: primaryGoal,
        difficulty,
        studentIds: Array.from(selectedStudentIds),
        days: planDays,
      });
      toast.success(`Plan assigned to ${selectedStudentIds.size} student${selectedStudentIds.size > 1 ? "s" : ""}!`);
      navigate("/trainer/dashboard");
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : "Could not assign plan right now.";
      toast.error(message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8 pb-24">

      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="rounded-[32px] border border-white/10 bg-[#121212] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9F85A]">Trainer Console</p>
            <h1 className="mt-2 text-4xl font-semibold text-white tracking-tight">Plan Builder</h1>
            <p className="text-sm text-white/50 mt-1">Create custom training plans for your students.</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-[#1A1A1A] border border-white/8 px-4 py-3">
            <Calendar className="h-4 w-4 text-[#C9F85A]" />
            <p className="text-xs font-semibold text-white/60">Plans are auto-activated for students</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-5">

          {/* Plan Details */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-[#151515] p-6 space-y-6">
            <SectionHeader title="Plan Details" subtitle="Core parameters for the training programme" />

            <div className="grid sm:grid-cols-2 gap-5 pt-2">
              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Plan Name</label>
                <input
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="e.g., 4-Week Strength Program"
                  className="w-full bg-[#1A1A1A] border border-white/8 rounded-xl px-4 py-3 text-sm font-medium text-white placeholder:text-white/25 focus:outline-none focus:border-[#C9F85A]/30 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Duration (Days)</label>
                <input
                  type="number"
                  min={1}
                  value={cycleDuration}
                  onChange={(e) => setCycleDuration(Number(e.target.value) || 1)}
                  className="w-full bg-[#1A1A1A] border border-white/8 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-[#C9F85A]/30 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Primary Goal</label>
                <select
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/8 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-[#C9F85A]/30 transition-all cursor-pointer"
                >
                  <option>Strength & Conditioning</option>
                  <option>Endurance</option>
                  <option>Fat Loss</option>
                  <option>Muscle Gain</option>
                  <option>General Fitness</option>
                  <option>Flexibility & Mobility</option>
                </select>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Difficulty</label>
                <div className="flex gap-2">
                  {(["beginner", "intermediate", "advanced"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all border ${
                        difficulty === level
                          ? "bg-[#C9F85A] text-black border-[#C9F85A]"
                          : "bg-[#1A1A1A] border-white/8 text-white/50 hover:text-white"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Daily Templates */}
          <div className="space-y-4">
            {days.map((day, i) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...LUXURY_TWEEN_MEDIUM, delay: i * 0.08 }}
                className="rounded-3xl border border-white/10 bg-[#151515] p-6 space-y-5 group relative"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">Day {String(day).padStart(2, "0")} Template</h3>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      {days.length < cycleDuration ? `Cycles across ${cycleDuration} days` : "Set tasks for this day"}
                    </p>
                  </div>
                  {days.length > 1 && (
                    <button
                      onClick={() => removeDay(day)}
                      className="p-2 rounded-xl text-white/30 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-3 rounded-2xl border border-white/5 bg-[#1A1A1A]/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="h-3.5 w-3.5 text-[#C9F85A]" />
                        <label className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Exercises</label>
                      </div>
                      <button
                        onClick={() => addTaskRow(day, "exercises")}
                        className="text-[10px] font-semibold uppercase tracking-wider text-[#C9F85A] hover:text-[#d4ff60]"
                      >
                        + Add Exercise
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(dayForms[day]?.exercises ?? []).map((exercise, index) => (
                        <div key={`day-${day}-exercise-${index}`} className="rounded-xl border border-white/6 bg-[#151515] p-3 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Exercise {index + 1}</p>
                            {(dayForms[day]?.exercises.length ?? 0) > 1 && (
                              <button
                                onClick={() => removeTaskRow(day, "exercises", index)}
                                className="text-[10px] font-semibold uppercase tracking-wider text-white/30 hover:text-red-400"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <input
                            value={exercise.title}
                            onChange={(e) => updateTaskField(day, "exercises", index, "title", e.target.value)}
                            placeholder="Incline Dumbbell Press"
                            className="w-full bg-[#1A1A1A] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9F85A]/30 transition-all"
                          />
                          <input
                            type="url"
                            value={exercise.youtubeUrl}
                            onChange={(e) => updateTaskField(day, "exercises", index, "youtubeUrl", e.target.value)}
                            placeholder="YouTube video link"
                            className="w-full bg-[#1A1A1A] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9F85A]/30 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-white/5 bg-[#1A1A1A]/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Utensils className="h-3.5 w-3.5 text-[#4DD2FF]" />
                        <label className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Meals</label>
                      </div>
                      <button
                        onClick={() => addTaskRow(day, "meals")}
                        className="text-[10px] font-semibold uppercase tracking-wider text-[#4DD2FF] hover:text-[#8fe3ff]"
                      >
                        + Add Meal
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(dayForms[day]?.meals ?? []).map((meal, index) => (
                        <div key={`day-${day}-meal-${index}`} className="rounded-xl border border-white/6 bg-[#151515] p-3 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Meal {index + 1}</p>
                            {(dayForms[day]?.meals.length ?? 0) > 1 && (
                              <button
                                onClick={() => removeTaskRow(day, "meals", index)}
                                className="text-[10px] font-semibold uppercase tracking-wider text-white/30 hover:text-red-400"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <input
                            value={meal.title}
                            onChange={(e) => updateTaskField(day, "meals", index, "title", e.target.value)}
                            placeholder="Meal 1: High Protein Breakfast"
                            className="w-full bg-[#1A1A1A] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4DD2FF]/30 transition-all"
                          />
                          <input
                            type="url"
                            value={meal.youtubeUrl}
                            onChange={(e) => updateTaskField(day, "meals", index, "youtubeUrl", e.target.value)}
                            placeholder="Recipe or prep video link"
                            className="w-full bg-[#1A1A1A] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4DD2FF]/30 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-3.5 w-3.5 text-[#A78BFA]" />
                      <label className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Activity Goal</label>
                    </div>
                    <textarea
                      value={dayForms[day]?.activity ?? ""}
                      onChange={(e) => updateDayActivity(day, e.target.value)}
                      placeholder="10k steps + 7h sleep"
                      rows={2}
                      className="w-full bg-[#1A1A1A] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#A78BFA]/30 transition-all resize-none font-mono text-xs"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <button
            onClick={addDay}
            className="w-full flex items-center justify-center gap-3 p-6 rounded-3xl border-2 border-dashed border-white/10 text-white/30 hover:text-[#C9F85A] hover:border-[#C9F85A]/25 hover:bg-[#C9F85A]/5 transition-all text-xs font-semibold uppercase tracking-wider group"
          >
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90 duration-300" />
            Add Day Template
          </button>
        </div>

        {/* Sidebar - Student selector */}
        <div className="lg:col-span-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-3xl border border-white/10 bg-[#151515] p-6 sticky top-6 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#C9F85A]/10 border border-[#C9F85A]/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-[#C9F85A]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Assign To</h3>
                <p className="text-[10px] text-white/30">{selectedStudentIds.size} / {assignedStudents.length} selected</p>
              </div>
            </div>

            <div className="space-y-2">
              {assignedStudents.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-6">No students assigned to you yet.</p>
              ) : (
                assignedStudents.map((student) => (
                  <label
                    key={student.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedStudentIds.has(student.id)
                        ? "bg-[#C9F85A]/10 border-[#C9F85A]/30"
                        : "bg-[#1A1A1A] border-white/8 hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold transition-colors ${
                        selectedStudentIds.has(student.id) ? "bg-[#C9F85A]/20 text-[#C9F85A]" : "bg-[#252525] text-white/50"
                      }`}>
                        {student.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{student.name}</p>
                        <p className="text-[9px] text-white/30 uppercase tracking-wider">
                          {student.currentPlanId ? "Has active plan" : "No plan"}
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.has(student.id)}
                      onChange={(e) => toggleStudent(student.id, e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-[#1A1A1A] text-[#C9F85A] focus:ring-0 cursor-pointer"
                    />
                  </label>
                ))
              )}
            </div>

            {/* Summary */}
            <div className="pt-4 border-t border-white/5 space-y-3">
              {[
                { label: "Duration", value: `${cycleDuration} days` },
                { label: "Day templates", value: days.length.toString() },
                { label: "Exercises", value: days.reduce((total, day) => total + (dayForms[day]?.exercises.length ?? 0), 0).toString() },
                { label: "Meals", value: days.reduce((total, day) => total + (dayForms[day]?.meals.length ?? 0), 0).toString() },
                { label: "Students", value: selectedStudentIds.size.toString() },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs">
                  <span className="text-white/30">{row.label}</span>
                  <span className="font-semibold text-white">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-[#1A1A1A] border border-[#C9F85A]/15 p-3">
              <div className="flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-[#C9F85A]" />
                <p className="text-[10px] text-[#C9F85A] font-semibold">Students are notified on assignment</p>
              </div>
            </div>

            <button
              onClick={handlePublish}
              disabled={publishing}
              className="w-full bg-[#C9F85A] text-black py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#d4ff60] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_4px_20px_rgba(201,248,90,0.2)]"
            >
              {publishing ? (
                "Assigning Plan..."
              ) : (
                <>Assign Plan <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
