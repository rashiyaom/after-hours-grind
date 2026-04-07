import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { FitnessQuestionnaire, Student } from "@/types";
import { calculateBMI, validateQuestionnaire } from "@/lib/planGeneration";
import { useCurrentUser, useStore } from "@/hooks/useStore";
import { LUXURY_EASE, LUXURY_SPRING, LUXURY_TWEEN_MEDIUM, LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";

const TOTAL_STEPS = 6;

const defaultQuestionnaire: FitnessQuestionnaire = {
  basic: {
    age: 20,
    gender: "male",
    heightCm: 170,
    weightKg: 70,
    bmi: 24.2,
  },
  fitnessStatus: {
    activityLevel: "lightly_active",
    experience: "beginner",
  },
  goals: {
    primaryGoal: "fat_loss",
    targetMode: "weight",
    targetWeightKg: 66,
    targetBodyType: "lean",
    weightDifferenceKg: -4,
  },
  commitment: {
    daysPerWeek: 5,
    timePerDayMinutes: 45,
  },
  environment: {
    workoutType: "home",
    equipment: "basic",
  },
  lifestyle: {
    dietType: "non_veg",
    proteinAwareness: "medium",
    hydrationHabit: "moderate",
    sleepHours: 7,
  },
  constraints: {
    hasInjuries: false,
    injuryTypes: [],
    restrictions: "",
  },
};

export default function FitnessOnboardingPage() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const { saveOnboardingDraft, completeOnboardingAndGeneratePlan } = useStore();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [questionnaire, setQuestionnaire] = useState<FitnessQuestionnaire>(() => {
    if (currentUser?.role === "student" && (currentUser as Student).onboardingDraft) {
      return (currentUser as Student).onboardingDraft as FitnessQuestionnaire;
    }
    return defaultQuestionnaire;
  });

  const bmi = useMemo(
    () => calculateBMI(questionnaire.basic.heightCm, questionnaire.basic.weightKg),
    [questionnaire.basic.heightCm, questionnaire.basic.weightKg]
  );

  const issues = useMemo(() => validateQuestionnaire(questionnaire), [questionnaire]);

  const updateQuestionnaire = (updater: (prev: FitnessQuestionnaire) => FitnessQuestionnaire) => {
    setQuestionnaire((prev) => {
      setStepError(null);
      const next = updater(prev);
      next.basic.bmi = calculateBMI(next.basic.heightCm, next.basic.weightKg);
      if (next.goals.targetMode === "weight" && typeof next.goals.targetWeightKg === "number") {
        next.goals.weightDifferenceKg = Number((next.goals.targetWeightKg - next.basic.weightKg).toFixed(1));
      } else {
        next.goals.weightDifferenceKg = 0;
      }
      return { ...next };
    });
  };

  const validateStep = (stepNumber: number): string | null => {
    if (stepNumber === 1) {
      if (questionnaire.basic.age < 13 || questionnaire.basic.age > 80) return "Age should be between 13 and 80.";
      if (questionnaire.basic.heightCm < 120 || questionnaire.basic.heightCm > 230) return "Height should be between 120 cm and 230 cm.";
      if (questionnaire.basic.weightKg < 30 || questionnaire.basic.weightKg > 250) return "Weight should be between 30 kg and 250 kg.";
    }

    if (stepNumber === 2) {
      if (questionnaire.goals.targetMode === "weight" && (!questionnaire.goals.targetWeightKg || questionnaire.goals.targetWeightKg <= 0)) {
        return "Please enter a valid target weight.";
      }
    }

    if (stepNumber === 4) {
      if (questionnaire.constraints.hasInjuries && questionnaire.constraints.injuryTypes.length === 0) {
        return "Please add at least one injury type when injuries are marked as yes.";
      }
    }

    return null;
  };

  const persistDraft = (nextStep: number) => {
    if (currentUser?.role !== "student") return;
    saveOnboardingDraft(currentUser.id, questionnaire, nextStep);
  };

  const next = () => {
    if (step >= TOTAL_STEPS) return;
    const validationError = validateStep(step);
    if (validationError) {
      setStepError(validationError);
      toast.error(validationError);
      return;
    }
    persistDraft(step + 1);
    setStepError(null);
    setStep((prev) => prev + 1);
  };

  const back = () => {
    if (step <= 1) return;
    persistDraft(step - 1);
    setStepError(null);
    setStep((prev) => prev - 1);
  };

  const submit = async () => {
    if (!currentUser || currentUser.role !== "student") return;

    const criticalMissing = [
      questionnaire.basic.age,
      questionnaire.basic.heightCm,
      questionnaire.basic.weightKg,
      questionnaire.commitment.timePerDayMinutes,
    ].some((value) => !value || Number.isNaN(value));

    if (criticalMissing) {
      toast.error("Please complete all required inputs before generating a plan.");
      return;
    }

    setSubmitting(true);
    persistDraft(TOTAL_STEPS);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const plan = completeOnboardingAndGeneratePlan(currentUser.id, questionnaire);
    setSubmitting(false);

    toast.success("Your personalized plan is ready and sent for trainer approval.");
    navigate(`/student/plan-status?planId=${plan.id}`);
  };

  const stepTitle = [
    "Basic Body Metrics",
    "Current Fitness Status + Goal",
    "Commitment + Workout Environment",
    "Diet, Lifestyle & Constraints",
    "Smart Checks & Risk Flags",
    "Review and Generate",
  ][step - 1];

  const stepLabels = ["Metrics", "Status + Goal", "Time + Setup", "Lifestyle", "Safety", "Generate"];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8f6f1] px-4 py-10 text-[#101010] sm:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-[#d9ece2] blur-3xl" />
        <div className="absolute right-10 top-10 h-64 w-64 rounded-full bg-[#f3e5cf] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#dfe7fb] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_SLOW}
        className="relative mx-auto max-w-4xl rounded-3xl border border-black/10 bg-white/75 p-6 shadow-[0_25px_60px_rgba(20,20,20,0.08)] backdrop-blur-xl sm:p-8"
      >
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">Fitness Onboarding Flow</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">{stepTitle}</h1>
          </div>
          <div className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold">
            Step {step} of {TOTAL_STEPS}
          </div>
        </div>

        <div className="mb-8 h-2 rounded-full bg-black/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#86c9b4] via-[#f2c489] to-[#9eb1eb]"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={LUXURY_TWEEN_MEDIUM}
          />
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {stepLabels.map((label, index) => {
            const current = index + 1;
            const done = current < step;
            const active = current === step;
            return (
              <motion.div
                key={label}
                whileHover={{ y: -2 }}
                transition={LUXURY_SPRING}
                className={`rounded-xl border px-2 py-2 text-center text-[11px] font-semibold ${active ? "border-black/30 bg-white" : done ? "border-emerald-300/60 bg-emerald-50" : "border-black/10 bg-white/70 text-black/50"}`}
              >
                {label}
              </motion.div>
            );
          })}
        </div>

        {stepError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={LUXURY_TWEEN_MEDIUM}
            className="mb-6 rounded-2xl border border-rose-300/70 bg-rose-50 px-4 py-3 text-sm text-rose-900"
          >
            {stepError}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={LUXURY_TWEEN_MEDIUM}
            className="space-y-6"
          >
            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Age" type="number" value={questionnaire.basic.age} onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, basic: { ...prev.basic, age: Number(v) } }))} />
                <Select
                  label="Gender"
                  value={questionnaire.basic.gender}
                  onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, basic: { ...prev.basic, gender: v as FitnessQuestionnaire["basic"]["gender"] } }))}
                  options={[{ label: "Male", value: "male" }, { label: "Female", value: "female" }, { label: "Other", value: "other" }]}
                />
                <Input label="Height (cm)" type="number" value={questionnaire.basic.heightCm} onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, basic: { ...prev.basic, heightCm: Number(v) } }))} />
                <Input label="Weight (kg)" type="number" value={questionnaire.basic.weightKg} onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, basic: { ...prev.basic, weightKg: Number(v) } }))} />
                <div className="sm:col-span-2 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">Simulated BMI</p>
                  <p className="mt-1 text-2xl font-semibold">{bmi}</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Current Activity Level"
                    value={questionnaire.fitnessStatus.activityLevel}
                    onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, fitnessStatus: { ...prev.fitnessStatus, activityLevel: v as FitnessQuestionnaire["fitnessStatus"]["activityLevel"] } }))}
                    options={[
                      { label: "Sedentary", value: "sedentary" },
                      { label: "Lightly active", value: "lightly_active" },
                      { label: "Active", value: "active" },
                    ]}
                  />
                  <Select
                    label="Experience"
                    value={questionnaire.fitnessStatus.experience}
                    onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, fitnessStatus: { ...prev.fitnessStatus, experience: v as FitnessQuestionnaire["fitnessStatus"]["experience"] } }))}
                    options={[
                      { label: "Beginner", value: "beginner" },
                      { label: "Intermediate", value: "intermediate" },
                      { label: "Advanced", value: "advanced" },
                    ]}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Primary Goal"
                    value={questionnaire.goals.primaryGoal}
                    onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, goals: { ...prev.goals, primaryGoal: v as FitnessQuestionnaire["goals"]["primaryGoal"] } }))}
                    options={[
                      { label: "Fat Loss", value: "fat_loss" },
                      { label: "Muscle Gain", value: "muscle_gain" },
                      { label: "Maintenance", value: "maintenance" },
                      { label: "Endurance", value: "endurance" },
                    ]}
                  />
                  <Select
                    label="Target Type"
                    value={questionnaire.goals.targetMode}
                    onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, goals: { ...prev.goals, targetMode: v as "weight" | "body_type" } }))}
                    options={[{ label: "Target weight", value: "weight" }, { label: "Target body type", value: "body_type" }]}
                  />
                </div>

                {questionnaire.goals.targetMode === "weight" ? (
                  <Input
                    label="Target Weight (kg)"
                    type="number"
                    value={questionnaire.goals.targetWeightKg ?? ""}
                    onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, goals: { ...prev.goals, targetWeightKg: Number(v), targetBodyType: undefined } }))}
                  />
                ) : (
                  <Select
                    label="Target Body Type"
                    value={questionnaire.goals.targetBodyType ?? "lean"}
                    onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, goals: { ...prev.goals, targetBodyType: v as "lean" | "bulky" | "toned", targetWeightKg: undefined } }))}
                    options={[{ label: "Lean", value: "lean" }, { label: "Bulky", value: "bulky" }, { label: "Toned", value: "toned" }]}
                  />
                )}

                <div className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">Weight Difference</p>
                  <p className="mt-1 text-xl font-semibold">{questionnaire.goals.weightDifferenceKg ?? 0} kg</p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Days per week available"
                  value={String(questionnaire.commitment.daysPerWeek)}
                  onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, commitment: { ...prev.commitment, daysPerWeek: Number(v) as 3 | 5 | 6 | 7 } }))}
                  options={["3", "5", "6", "7"].map((value) => ({ label: value, value }))}
                />
                <Select
                  label="Time per day (minutes)"
                  value={String(questionnaire.commitment.timePerDayMinutes)}
                  onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, commitment: { ...prev.commitment, timePerDayMinutes: Number(v) as 15 | 30 | 45 | 60 } }))}
                  options={["15", "30", "45", "60"].map((value) => ({ label: value, value }))}
                />
                <Select
                  label="Workout Type"
                  value={questionnaire.environment.workoutType}
                  onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, environment: { ...prev.environment, workoutType: v as "home" | "gym" } }))}
                  options={[{ label: "Home", value: "home" }, { label: "Gym", value: "gym" }]}
                />
                <Select
                  label="Equipment Available"
                  value={questionnaire.environment.equipment}
                  onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, environment: { ...prev.environment, equipment: v as "none" | "basic" | "full_gym" } }))}
                  options={[
                    { label: "None", value: "none" },
                    { label: "Basic", value: "basic" },
                    { label: "Full gym", value: "full_gym" },
                  ]}
                />
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Diet Type"
                  value={questionnaire.lifestyle.dietType}
                  onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, lifestyle: { ...prev.lifestyle, dietType: v as "veg" | "non_veg" } }))}
                  options={[{ label: "Veg", value: "veg" }, { label: "Non-veg", value: "non_veg" }]}
                />
                <Select
                  label="Protein Intake Awareness"
                  value={questionnaire.lifestyle.proteinAwareness}
                  onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, lifestyle: { ...prev.lifestyle, proteinAwareness: v as "low" | "medium" | "high" } }))}
                  options={[{ label: "Low", value: "low" }, { label: "Medium", value: "medium" }, { label: "High", value: "high" }]}
                />
                <Select
                  label="Water Intake Habit"
                  value={questionnaire.lifestyle.hydrationHabit}
                  onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, lifestyle: { ...prev.lifestyle, hydrationHabit: v as "poor" | "moderate" | "good" } }))}
                  options={[{ label: "Poor", value: "poor" }, { label: "Moderate", value: "moderate" }, { label: "Good", value: "good" }]}
                />
                <Input
                  label="Sleep Hours"
                  type="number"
                  value={questionnaire.lifestyle.sleepHours}
                  onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, lifestyle: { ...prev.lifestyle, sleepHours: Number(v) } }))}
                />
                <Select
                  label="Injuries"
                  value={questionnaire.constraints.hasInjuries ? "yes" : "no"}
                  onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, constraints: { ...prev.constraints, hasInjuries: v === "yes" } }))}
                  options={[{ label: "No", value: "no" }, { label: "Yes", value: "yes" }]}
                />
                {questionnaire.constraints.hasInjuries && (
                  <Input
                    label="Injury Types (comma-separated)"
                    value={questionnaire.constraints.injuryTypes.join(", ")}
                    onChange={(v) =>
                      updateQuestionnaire((prev) => ({
                        ...prev,
                        constraints: {
                          ...prev.constraints,
                          injuryTypes: v
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean),
                        },
                      }))
                    }
                  />
                )}
                <div className="sm:col-span-2">
                  <TextArea
                    label="Restrictions"
                    value={questionnaire.constraints.restrictions}
                    onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, constraints: { ...prev.constraints, restrictions: v } }))}
                    placeholder="Any movement restrictions, chronic pain, dietary restrictions..."
                  />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <p className="text-sm font-semibold">Smart onboarding diagnostics</p>
                  <p className="mt-1 text-sm text-black/65">We pre-check unrealistic targets, missing inputs, injury conflicts, and low time availability.</p>
                </div>
                {issues.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-300/60 bg-emerald-50 p-4 text-sm text-emerald-800">
                    No critical risks detected. Your plan can be generated safely.
                  </div>
                ) : (
                  issues.map((issue) => (
                    <div key={`${issue.code}-${issue.message}`} className="flex items-start gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-900">
                      <AlertTriangle className="mt-0.5 h-4 w-4" />
                      <div>
                        <p className="font-semibold capitalize">{issue.code.replace(/_/g, " ")}</p>
                        <p className="text-amber-900/80">{issue.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">Final Review</p>
                  <p className="mt-2 text-sm text-black/70">
                    Goal: <strong>{questionnaire.goals.primaryGoal.replace(/_/g, " ")}</strong> | Days: <strong>{questionnaire.commitment.daysPerWeek}/week</strong> | Time: <strong>{questionnaire.commitment.timePerDayMinutes}m/day</strong>
                  </p>
                  <p className="mt-2 text-sm text-black/70">Environment: <strong>{questionnaire.environment.workoutType}</strong> ({questionnaire.environment.equipment.replace(/_/g, " ")})</p>
                  <p className="mt-2 text-sm text-black/70">BMI: <strong>{bmi}</strong></p>
                </div>

                <div className="rounded-2xl border border-black/10 bg-gradient-to-r from-[#eaf7f1] via-[#f8f2e7] to-[#eef2ff] p-5 shadow-[0_10px_30px_rgba(30,40,60,0.08)]">
                  <p className="text-sm font-semibold">Plan Output Pipeline</p>
                  <ul className="mt-3 list-disc pl-5 text-sm text-black/70">
                    <li>Base template selection from 6 core templates</li>
                    <li>Intensity + schedule + constraints adaptation</li>
                    <li>Status initialized as pending_trainer_approval</li>
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={back}
            disabled={step === 1 || submitting}
            className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-sm disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={next}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Designing your personalized plan...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate Smart Plan
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

type InputProps = {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
};

function Input({ label, value, onChange, type = "text", placeholder }: InputProps) {
  return (
    <label className="group block text-sm font-medium">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-black/45">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none transition-all placeholder:text-black/30 focus:border-black/35 focus:shadow-[0_0_0_3px_rgba(20,20,20,0.06)]"
      />
    </label>
  );
}

type SelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
};

function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <label className="group block text-sm font-medium">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-black/45">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-black/35 focus:shadow-[0_0_0_3px_rgba(20,20,20,0.06)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type TextAreaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function TextArea({ label, value, onChange, placeholder }: TextAreaProps) {
  return (
    <label className="group block text-sm font-medium">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-black/45">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none transition-all placeholder:text-black/30 focus:border-black/35 focus:shadow-[0_0_0_3px_rgba(20,20,20,0.06)]"
      />
    </label>
  );
}
