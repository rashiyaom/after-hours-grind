import { Student, Plan, PlanDay } from '@/types';
import { defaultTodayTask, type LegacyTodayTask } from '@/data/legacy-data';

export const cloneTodayTask = (): LegacyTodayTask => ({
  ...defaultTodayTask,
  workout: defaultTodayTask.workout.map((item) => ({ ...item, alternatives: [...item.alternatives] })),
  diet: defaultTodayTask.diet.map((item) => ({
    ...item,
    foods: item.foods.map((food) => ({ ...food })),
    macros: { ...item.macros },
  })),
});

export const adaptTodayTaskForProfile = (baseTask: LegacyTodayTask, student: Student): LegacyTodayTask => {
  const draft = student.onboardingDraft;
  if (!draft) return cloneTodayTask();

  const equipment = draft.environment.equipment;
  const workoutType = draft.environment.workoutType;
  const isVeg = draft.lifestyle.dietType === 'veg';
  const primaryGoal = draft.goals.primaryGoal;

  let workout = baseTask.workout.map((item) => ({ ...item, alternatives: [...item.alternatives] }));

  if (workoutType === 'home' && equipment === 'none') {
    workout = workout.map((item) => {
      const fallback = item.alternatives[0] ?? item.name;
      return {
        ...item,
        name: `Bodyweight - ${fallback}`,
        focus: `${item.focus} (home adaptation)`,
        equipmentMode: 'bodyweight_only',
      };
    });
  } else if (equipment === 'basic') {
    workout = workout.map((item) => ({
      ...item,
      name: item.equipmentMode === 'full_gym' ? item.alternatives[0] ?? item.name : item.name,
      equipmentMode: item.equipmentMode === 'full_gym' ? 'basic' : item.equipmentMode,
    }));
  } else if (workoutType === 'gym' && equipment === 'full_gym') {
    workout = workout.map((item) => ({
      ...item,
      focus: `${item.focus} (machine-enabled progression)`,
      equipmentMode: 'full_gym',
    }));
  }

  let diet = baseTask.diet.map((item) => ({
    ...item,
    foods: item.foods.map((food) => ({ ...food })),
    macros: { ...item.macros },
  }));

  if (isVeg) {
    diet = diet.map((meal) => {
      const mappedFoods = meal.foods.map((food) => {
        if (/chicken|egg/i.test(food.item)) {
          return { item: 'Paneer/Tofu', grams: Math.max(120, Math.round(food.grams * 0.9)) };
        }
        return food;
      });
      return {
        ...meal,
        description: meal.description.replace(/eggs?/gi, 'tofu').replace(/chicken/gi, 'paneer/tofu'),
        foods: mappedFoods,
      };
    });
  }

  if (primaryGoal === 'fat_loss') {
    diet = diet.map((meal) => ({
      ...meal,
      calories: Math.max(220, Math.round(meal.calories * 0.9)),
      macros: {
        protein: meal.macros.protein,
        carbs: Math.max(20, Math.round(meal.macros.carbs * 0.85)),
        fats: Math.max(8, Math.round(meal.macros.fats * 0.9)),
      },
    }));
  }

  if (primaryGoal === 'muscle_gain') {
    diet = diet.map((meal) => ({
      ...meal,
      calories: Math.round(meal.calories * 1.12),
      macros: {
        protein: Math.round(meal.macros.protein * 1.15),
        carbs: Math.round(meal.macros.carbs * 1.12),
        fats: meal.macros.fats,
      },
    }));
  }

  return {
    ...baseTask,
    workout,
    diet,
    hydrationGoal: draft.lifestyle.hydrationHabit === 'poor' ? '3.8L' : baseTask.hydrationGoal,
    stepTarget: primaryGoal === 'fat_loss' ? 11000 : primaryGoal === 'muscle_gain' ? 9000 : baseTask.stepTarget,
  };
};

export const getRecordKey = (planId: string, dayNumber: number) => `${planId}:day:${dayNumber}`;

export const getPlanDay = (plan: Plan, dayNumber: number): PlanDay | null => {
  if (!plan.weeks || dayNumber < 1) return null;
  const zeroBased = dayNumber - 1;
  const weekNumber = Math.floor(zeroBased / 7) + 1;
  const dayOfWeek = (zeroBased % 7) + 1;
  const week = plan.weeks.find((w) => w.week === weekNumber);
  if (!week) return null;
  return week.days.find((d) => d.day === dayOfWeek) ?? null;
};

const deriveDietFromTask = (
  student: Student,
  dayNumber: number,
  nutritionTask: { description?: string; meta?: Record<string, string | number | boolean> },
  completedKeys: Set<string>
): LegacyTodayTask['diet'] => {
  const draft = student.onboardingDraft;
  const isVeg = draft?.lifestyle.dietType === 'veg';
  const goal = draft?.goals.primaryGoal ?? 'maintenance';
  const proteinGoal = Number(nutritionTask.meta?.proteinGoalGrams ?? 110);
  const caloriesByGoal = goal === 'fat_loss' ? [430, 560, 260, 520] : goal === 'muscle_gain' ? [620, 780, 420, 760] : [520, 680, 320, 610];

  const templates = isVeg
    ? [
        {
          meal: 'Breakfast',
          description: nutritionTask.description ?? 'Oats + tofu scramble + fruit',
          foods: [
            { item: 'Rolled oats', grams: 70 },
            { item: 'Tofu', grams: 140 },
            { item: 'Banana', grams: 120 },
          ],
        },
        {
          meal: 'Lunch',
          description: 'Paneer/tofu bowl + rice + salad',
          foods: [
            { item: 'Paneer/Tofu', grams: 180 },
            { item: 'Cooked rice', grams: 220 },
            { item: 'Salad mix', grams: 120 },
          ],
        },
        {
          meal: 'Snack',
          description: 'Greek yogurt + nuts',
          foods: [
            { item: 'Greek yogurt', grams: 200 },
            { item: 'Mixed nuts', grams: 25 },
          ],
        },
        {
          meal: 'Dinner',
          description: 'Dal + roti + sauteed vegetables',
          foods: [
            { item: 'Dal', grams: 220 },
            { item: 'Roti', grams: 110 },
            { item: 'Vegetables', grams: 200 },
          ],
        },
      ]
    : [
        {
          meal: 'Breakfast',
          description: nutritionTask.description ?? 'Oats + eggs + fruit',
          foods: [
            { item: 'Rolled oats', grams: 70 },
            { item: 'Whole eggs', grams: 100 },
            { item: 'Banana', grams: 120 },
          ],
        },
        {
          meal: 'Lunch',
          description: 'Chicken + rice + salad',
          foods: [
            { item: 'Chicken breast', grams: 180 },
            { item: 'Cooked rice', grams: 220 },
            { item: 'Salad mix', grams: 120 },
          ],
        },
        {
          meal: 'Snack',
          description: 'Greek yogurt + nuts',
          foods: [
            { item: 'Greek yogurt', grams: 200 },
            { item: 'Mixed nuts', grams: 25 },
          ],
        },
        {
          meal: 'Dinner',
          description: 'Fish/paneer + vegetables + roti',
          foods: [
            { item: 'Fish/Paneer', grams: 170 },
            { item: 'Mixed vegetables', grams: 200 },
            { item: 'Roti', grams: 100 },
          ],
        },
      ];

  const times = ['08:00', '13:30', '17:00', '20:30'];
  return templates.map((entry, idx) => {
    const id = `d-${dayNumber}-${idx + 1}`;
    const protein = Math.max(18, Math.round((proteinGoal / 4) * (idx === 2 ? 0.8 : 1)));
    const carbs = goal === 'fat_loss' ? [45, 55, 18, 42][idx] : goal === 'muscle_gain' ? [72, 84, 34, 78][idx] : [57, 64, 18, 48][idx];
    const fats = goal === 'fat_loss' ? [12, 13, 11, 14][idx] : goal === 'muscle_gain' ? [18, 20, 14, 22][idx] : [16, 14, 15, 24][idx];
    return {
      id,
      meal: entry.meal,
      description: entry.description,
      time: times[idx],
      calories: caloriesByGoal[idx],
      completed: completedKeys.has(id),
      foods: entry.foods,
      macros: { protein, carbs, fats },
    };
  });
};

export const buildTodayTaskFromPlan = (student: Student, plan: Plan | null, dayNumber: number): LegacyTodayTask => {
  if (!plan || !plan.id) {
    return adaptTodayTaskForProfile(cloneTodayTask(), student);
  }

  const dayData = getPlanDay(plan, dayNumber);
  if (!dayData) {
    return adaptTodayTaskForProfile(cloneTodayTask(), student);
  }

  const completedSet = new Set(student.taskCompletions?.[getRecordKey(plan.id, dayNumber)] ?? []);
  const workoutTasks = dayData.tasks.filter((task) => task.type === 'workout' || task.type === 'habit');
  const nutritionTask = dayData.tasks.find((task) => task.type === 'nutrition');

  const workout = workoutTasks.map((task, idx) => {
    const id = `w-${dayNumber}-${idx + 1}`;
    const setCount = task.intensity === 'high' ? 4 : task.intensity === 'low' ? 2 : 3;
    const repCount = task.intensity === 'high' ? 8 : task.intensity === 'low' ? 16 : 12;
    const equipmentMode = String(task.meta?.equipmentMode ?? (student.onboardingDraft?.environment.equipment ?? 'basic'));
    return {
      id,
      name: task.title,
      sets: setCount,
      reps: repCount,
      rest: task.intensity === 'high' ? '75s' : '45s',
      completed: completedSet.has(id),
      focus: task.description ?? 'Execute with strict form and controlled tempo.',
      equipmentMode:
        equipmentMode === 'bodyweight_only' ? 'bodyweight_only' : equipmentMode === 'full_gym' ? 'full_gym' : 'basic',
      alternatives: ['Tempo variation', 'Range-of-motion regression'],
    } as LegacyTodayTask['workout'][number];
  });

  const diet = nutritionTask
    ? deriveDietFromTask(student, dayNumber, nutritionTask, completedSet)
    : adaptTodayTaskForProfile(cloneTodayTask(), student).diet;

  const stepTarget = Number(dayData.tasks.find((task) => task.type === 'habit')?.meta?.stepsGoal ?? 9000);
  const hydrationGoal = `${Number(dayData.tasks.find((task) => task.type === 'habit')?.meta?.waterLiters ?? 3)}L`;

  return {
    stepTarget,
    hydrationGoal,
    workout,
    diet,
  };
};
