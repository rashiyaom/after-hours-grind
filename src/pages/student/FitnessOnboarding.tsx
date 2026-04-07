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
    age: 0,
    gender: "male",
    heightCm: 0,
    weightKg: 0,
    bmi: 0,
  },
  fitnessStatus: {
    activityLevel: "lightly_active",
    experience: "beginner",
  },
  goals: {
    primaryGoal: "fat_loss",
    targetMode: "weight",
    targetWeightKg: undefined,
    targetBodyType: "lean",
    weightDifferenceKg: 0,
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
    sleepHours: 0,
  },
  constraints: {
    hasInjuries: false,
    injuryTypes: [],
    restrictions: "",
  },
};

function getGoalConsistencyError(questionnaire: FitnessQuestionnaire): string | null {
  if (questionnaire.goals.targetMode !== "weight") return null;
  if (!questionnaire.goals.targetWeightKg || questionnaire.basic.weightKg <= 0) return null;

  const currentWeight = questionnaire.basic.weightKg;
  const targetWeight = questionnaire.goals.targetWeightKg;
  const delta = Number((targetWeight - currentWeight).toFixed(1));
  const maxAllowedShift = Number((currentWeight * 0.25).toFixed(1));

  if (targetWeight < 35 || targetWeight > 220) {
    return "Target weight must be between 35 kg and 220 kg.";
  }

  if (Math.abs(delta) > maxAllowedShift) {
    return `Target change is too extreme. Keep it within +/-${maxAllowedShift} kg from current weight.`;
  }

  if (questionnaire.goals.primaryGoal === "fat_loss" && delta >= 0) {
    return "Fat loss goal needs a lower target weight than current weight.";
  }

  if (questionnaire.goals.primaryGoal === "muscle_gain" && delta <= 0) {
    return "Muscle gain goal needs a higher target weight than current weight.";
  }

  if (questionnaire.goals.primaryGoal === "maintenance" && Math.abs(delta) > 2) {
    return "Maintenance goal should stay close to current weight (within 2 kg).";
  }

  if (questionnaire.goals.primaryGoal === "endurance" && Math.abs(delta) > 8) {
    return "Endurance goal target is too far from current weight.";
  }

  return null;
}

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
  const goalConsistencyError = useMemo(() => getGoalConsistencyError(questionnaire), [questionnaire]);

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
      if (!Number.isFinite(questionnaire.basic.age) || questionnaire.basic.age <= 0) return "Please enter your age.";
      if (!Number.isFinite(questionnaire.basic.heightCm) || questionnaire.basic.heightCm <= 0) return "Please enter your height.";
      if (!Number.isFinite(questionnaire.basic.weightKg) || questionnaire.basic.weightKg <= 0) return "Please enter your current weight.";
      if (questionnaire.basic.age < 13 || questionnaire.basic.age > 80) return "Age should be between 13 and 80.";
      if (questionnaire.basic.heightCm < 120 || questionnaire.basic.heightCm > 230) return "Height should be between 120 cm and 230 cm.";
      if (questionnaire.basic.weightKg < 30 || questionnaire.basic.weightKg > 250) return "Weight should be between 30 kg and 250 kg.";
    }

    if (stepNumber === 2) {
      if (questionnaire.goals.targetMode === "weight" && (!questionnaire.goals.targetWeightKg || questionnaire.goals.targetWeightKg <= 0)) {
        return "Please enter a valid target weight.";
      }
      if (goalConsistencyError) return goalConsistencyError;
      if (questionnaire.goals.targetMode === "body_type" && !questionnaire.goals.targetBodyType) {
        return "Please select a target body type.";
      }
    }

    if (stepNumber === 3) {
      const validDays = [3, 5, 6, 7];
      const validMinutes = [15, 30, 45, 60];
      if (!validDays.includes(questionnaire.commitment.daysPerWeek)) {
        return "Please choose valid days per week.";
      }
      if (!validMinutes.includes(questionnaire.commitment.timePerDayMinutes)) {
        return "Please choose valid daily workout time.";
      }
      if (questionnaire.environment.workoutType === "home" && questionnaire.environment.equipment === "full_gym") {
        return "Home workout cannot use full gym setup. Choose none/basic or switch workout type to gym.";
      }
      if (questionnaire.environment.workoutType === "gym" && questionnaire.environment.equipment === "none") {
        return "Gym mode requires at least basic equipment selection.";
      }
    }

    if (stepNumber === 4) {
      if (!Number.isFinite(questionnaire.lifestyle.sleepHours) || questionnaire.lifestyle.sleepHours <= 0) {
        return "Please enter sleep hours.";
      }
      if (questionnaire.lifestyle.sleepHours < 4 || questionnaire.lifestyle.sleepHours > 12) {
        return "Sleep hours should be between 4 and 12.";
      }
      if (questionnaire.constraints.hasInjuries && questionnaire.constraints.injuryTypes.length === 0) {
        return "Please add at least one injury type when injuries are marked as yes.";
      }
      if (
        questionnaire.constraints.hasInjuries &&
        questionnaire.constraints.restrictions.trim().length < 5
      ) {
        return "Please describe restrictions so the plan can avoid risky movements.";
      }
    }

    if (stepNumber === 5) {
      if (goalConsistencyError) return goalConsistencyError;
    }

    return null;
  };

  const validateAllSteps = (): string | null => {
    for (let s = 1; s <= 5; s += 1) {
      const error = validateStep(s);
      if (error) {
        setStep(s);
        return error;
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

    const validationError = validateAllSteps();
    if (validationError) {
      setStepError(validationError);
      toast.error(validationError);
      return;
    }

    setSubmitting(true);
    persistDraft(TOTAL_STEPS);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    completeOnboardingAndGeneratePlan(currentUser.id, questionnaire);
    setSubmitting(false);

    toast.success("Your personalized plan is ready and active.");
    navigate("/student/dashboard");
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
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 px-4 py-10 text-zinc-100 sm:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-10 top-10 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_SLOW}
        className="relative mx-auto max-w-4xl rounded-3xl border border-zinc-700/70 bg-zinc-900/90 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8"
      >
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Fitness Onboarding Flow</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white">{stepTitle}</h1>
          </div>
          <div className="rounded-full border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-100">
            Step {step} of {TOTAL_STEPS}
          </div>
        </div>

        <div className="mb-8 h-2 rounded-full bg-zinc-700">
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
                className={`rounded-xl border px-2 py-2 text-center text-[11px] font-semibold ${active ? "border-zinc-400 bg-zinc-800 text-zinc-100" : done ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-100" : "border-zinc-700 bg-zinc-900 text-zinc-400"}`}
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
            className="mb-6 rounded-2xl border border-rose-300/70 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/12 dark:text-rose-200"
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
                <Input label="Age" type="number" value={questionnaire.basic.age || ""} onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, basic: { ...prev.basic, age: Number(v) } }))} />
                <Select
                  label="Gender"
                  value={questionnaire.basic.gender}
                  onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, basic: { ...prev.basic, gender: v as FitnessQuestionnaire["basic"]["gender"] } }))}
                  options={[{ label: "Male", value: "male" }, { label: "Female", value: "female" }, { label: "Other", value: "other" }]}
                />
                <Input label="Height (cm)" type="number" value={questionnaire.basic.heightCm || ""} onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, basic: { ...prev.basic, heightCm: Number(v) } }))} />
                <Input label="Weight (kg)" type="number" value={questionnaire.basic.weightKg || ""} onChange={(v) => updateQuestionnaire((prev) => ({ ...prev, basic: { ...prev.basic, weightKg: Number(v) } }))} />
                <div className="sm:col-span-2 rounded-2xl border border-zinc-700 bg-zinc-800 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Simulated BMI</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{bmi || "-"}</p>
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
                    value={questionnaire.goals.targetWeightKg || ""}
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

                <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Weight Difference</p>
                  <p className="mt-1 text-xl font-semibold text-white">{questionnaire.goals.weightDifferenceKg ?? 0} kg</p>
                </div>

                {goalConsistencyError && (
                  <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {goalConsistencyError}
                  </div>
                )}
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
                  value={questionnaire.lifestyle.sleepHours || ""}
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
                <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4">
                  <p className="text-sm font-semibold text-white">Smart onboarding diagnostics</p>
                  <p className="mt-1 text-sm text-zinc-300">We pre-check unrealistic targets, missing inputs, injury conflicts, and low time availability.</p>
                </div>
                {issues.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                    No critical risks detected. Your plan can be generated safely.
                  </div>
                ) : (
                  issues.map((issue) => (
                    <div key={`${issue.code}-${issue.message}`} className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
                      <AlertTriangle className="mt-0.5 h-4 w-4" />
                      <div>
                        <p className="font-semibold capitalize">{issue.code.replace(/_/g, " ")}</p>
                        <p className="text-amber-100/80">{issue.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Final Review</p>
                  <p className="mt-2 text-sm text-zinc-200">
                    Goal: <strong>{questionnaire.goals.primaryGoal.replace(/_/g, " ")}</strong> | Days: <strong>{questionnaire.commitment.daysPerWeek}/week</strong> | Time: <strong>{questionnaire.commitment.timePerDayMinutes}m/day</strong>
                  </p>
                  <p className="mt-2 text-sm text-zinc-200">Environment: <strong>{questionnaire.environment.workoutType}</strong> ({questionnaire.environment.equipment.replace(/_/g, " ")})</p>
                  <p className="mt-2 text-sm text-zinc-200">BMI: <strong>{bmi || "-"}</strong></p>
                </div>

                <div className="rounded-2xl border border-zinc-700 bg-gradient-to-r from-emerald-500/15 via-zinc-900 to-indigo-500/15 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
                  <p className="text-sm font-semibold text-zinc-100">Plan Output Pipeline</p>
                  <ul className="mt-3 list-disc pl-5 text-sm text-zinc-300">
                    <li>Base template selection from 6 core templates</li>
                    <li>Intensity + schedule + constraints adaptation</li>
                    <li>Status initialized as active and ready to start</li>
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
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-100 transition-all hover:-translate-y-0.5 hover:shadow-sm disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={next}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
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
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-zinc-500 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
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
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-all focus:border-zinc-500 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
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
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-zinc-500 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
      />
    </label>
  );
}
