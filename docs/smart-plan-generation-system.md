# Smart Plan Generation System - THE afterhour socials

## 1) Signup Trigger Flow

### Student Signup Behavior
- On successful student signup, route goes to `/student/onboarding`.
- Student does not enter dashboard directly.
- Signup now initializes:
  - `onboardingStatus: "in_progress"`
  - `onboardingStep: 1`

### Progress-Based Onboarding UX
- Multi-step onboarding (`Step 1 of 6` ... `Step 6 of 6`) with progress bar.
- Smooth transitions with Framer Motion (`AnimatePresence`).
- Draft data persists to store on every step transition (`saveOnboardingDraft`).

### End of Onboarding
- CTA triggers loading state: `Designing your personalized plan...`
- Simulated processing delay: 1.5s.
- Engine generates plan with status `pending_trainer_approval`.
- Student is routed to `/student/plan-status` and shown:
  - `Your plan is ready and sent for trainer approval`

---

## 2) Fitness Questionnaire Structure (Detailed)

### A. Basic Body Metrics
- `age`
- `gender`
- `heightCm`
- `weightKg`
- Derived: `bmi`

### B. Current Fitness Status
- `activityLevel`: `sedentary | lightly_active | active`
- `experience`: `beginner | intermediate | advanced`

### C. Goal Definition
- `primaryGoal`: `fat_loss | muscle_gain | maintenance | endurance`
- `targetMode`: `weight | body_type`
- `targetWeightKg` or `targetBodyType`
- Derived: `weightDifferenceKg`

### D. Time & Commitment
- `daysPerWeek`: `3 | 5 | 6 | 7`
- `timePerDayMinutes`: `15 | 30 | 45 | 60`

### E. Workout Environment
- `workoutType`: `home | gym`
- `equipment`: `none | basic | full_gym`

### F. Diet & Lifestyle
- `dietType`: `veg | non_veg`
- `proteinAwareness`: `low | medium | high`
- `hydrationHabit`: `poor | moderate | good`
- `sleepHours`

### G. Constraints
- `hasInjuries`
- `injuryTypes[]`
- `restrictions`

---

## 3) Monthly Plan Template System (6 Core Templates)

All templates are 30-day structures with 4 weeks x 7 days.

1. `fat_loss`
- Focus: Cardio frequency + lean-mass preservation
- Base intensity: moderate

2. `muscle_gain`
- Focus: Progressive overload + protein-centered nutrition
- Base intensity: high

3. `general_fitness`
- Focus: Balanced strength/cardio/mobility
- Base intensity: moderate

4. `endurance`
- Focus: Aerobic capacity + pacing
- Base intensity: moderate

5. `home_workout`
- Focus: Minimal equipment adherence
- Base intensity: moderate

6. `gym_workout`
- Focus: Equipment-based progression
- Base intensity: high

### Day Task Composition (Every Day)
- Workout task:
  - Name
  - Type (`cardio | strength | mobility | conditioning`)
  - Duration
  - Intensity
- Nutrition task:
  - Meal guidance
  - Protein target metadata
- Habit task:
  - Water intake target
  - Steps target
  - Sleep target
- Points assigned per task

### Modularity
- Intensity adjustable by experience/BMI/activity.
- Frequency adjustable by availability (`daysPerWeek`).
- Volume adjustable by target gap and environment.

---

## 4) Dynamic Plan Generation Rules

### Step 1: Base Template Selection
- Goal map:
  - `fat_loss -> fat_loss`
  - `muscle_gain -> muscle_gain`
  - `maintenance -> general_fitness`
  - `endurance -> endurance`
- Environment override:
  - `home -> home_workout`
  - `gym + full_gym -> gym_workout`

### Step 2: Intensity Adaptation
- Factors:
  - Experience (`beginner` downscale, `advanced` upscale)
  - BMI-based moderation
  - Activity-level factor
- Applies to workout duration, intensity label, and points.

### Step 3: Schedule Adaptation
- For days beyond available days/week, convert to active recovery habit-only day.

### Step 4: Goal Gap Difficulty Adjustment
- Fat loss with high weight gap (`>= 8kg`): increase cardio volume.
- Muscle gain with high gap (`>= 6kg`): increase resistance volume.

### Environment Rules
- Home + no equipment: bodyweight-only substitutions.
- Gym: equipment-enabled variants.

### Constraints Rules
- Injury-aware substitutions:
  - Knee/ankle: remove impact-heavy work.
  - Shoulder/rotator: remove overhead loading.

---

## 5) Plan Output Shape

```ts
{
  id: "auto-plan-s1-...",
  type: "auto_generated",
  status: "pending_trainer_approval",
  basedOn: {
    goal: "fat_loss",
    weightKg: 78,
    level: "beginner",
    bmi: 26.8,
    activityLevel: "sedentary",
    daysPerWeek: 5,
    environment: "home",
    equipment: "none"
  },
  weeks: [
    {
      week: 1,
      days: [
        {
          day: 1,
          tasks: [
            { type: "workout", title: "Bodyweight: Interval Run", durationMinutes: 28, points: 40 },
            { type: "nutrition", title: "Follow meal template and hit protein target", points: 30 },
            { type: "habit", title: "Hydration, steps, and sleep target", points: 30 }
          ]
        }
      ]
    }
  ]
}
```

---

## 6) Trainer Integration

### Queue Visibility
- Dedicated route: `/trainer/auto-plans`
- Label: `Auto Generated Plans Queue`
- Dashboard button shows queue count.

### Trainer Actions
- Approve:
  - `status -> active`
  - Student can start plan.
- Edit:
  - Edit specific week/day tasks (`editAutoGeneratedPlanDay`).
- Reject:
  - `status -> rejected`
  - Feedback required and stored on plan.

### Student Access Restriction
- Student cannot start `/student/daily-plan` while plan status is:
  - `pending_trainer_approval`
  - `rejected`
- Redirect to `/student/plan-status`.

---

## 7) Frontend State Structure

### Student Entity Additions
- `onboardingStatus`
- `onboardingStep`
- `onboardingDraft`

### Plan Entity Additions
- `type`
- `status`
- `templateKey`
- `basedOn`
- `weeks[]`
- `generationIssues[]`
- `reviewFeedback`
- `reviewedAt`
- `reviewedByTrainerId`

### Store Actions Added
- `saveOnboardingDraft(studentId, payload, step)`
- `completeOnboardingAndGeneratePlan(studentId, payload)`
- `reviewAutoGeneratedPlan(planId, decision, feedback?)`
- `editAutoGeneratedPlanDay(planId, week, day, updates)`

---

## 8) Edge Cases Handled

1. Missing inputs
- Validation warns and blocks submit on critical fields.

2. Unrealistic goals
- `>=20kg` target difference in 30 days flagged with warning.
- Plan auto-tunes for safe progression.

3. Injury conflicts
- Injury text parsing triggers substitutions for risky movements.

4. Very low availability
- 15 minutes + 3 days/week flagged.
- Plan shifts to high-impact essentials + recovery behavior.

---

## 9) UX System

- Minimal premium cards and typography.
- Step transitions with smooth motion.
- Clear feedback states:
  - Loading generation screen
  - Success handoff
  - Pending approval wait state
- Route-level guardrails for onboarding and plan start permissions.
