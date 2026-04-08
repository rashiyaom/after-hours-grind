import { NotificationItem } from '@/types';

export type LegacyTodayTask = {
  stepTarget: number;
  hydrationGoal: string;
  workout: Array<{
    id: string;
    name: string;
    sets: number;
    reps: number;
    rest: string;
    completed: boolean;
    focus: string;
    equipmentMode: 'bodyweight_only' | 'basic' | 'full_gym';
    alternatives: string[];
  }>;
  diet: Array<{
    id: string;
    meal: string;
    description: string;
    time: string;
    calories: number;
    completed: boolean;
    foods: Array<{ item: string; grams: number }>;
    macros: { protein: number; carbs: number; fats: number };
  }>;
};

export type LegacySubmission = {
  id: string;
  studentId: string;
  studentName: string;
  trainerId?: string;
  taskName: string;
  taskType?: 'workout' | 'diet' | 'checkin';
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  mediaUrl: string;
  trainerNote: string;
  points?: number;
};

export const defaultWeeklyData = [
  { name: 'Mon', uv: 72 },
  { name: 'Tue', uv: 80 },
  { name: 'Wed', uv: 76 },
  { name: 'Thu', uv: 84 },
  { name: 'Fri', uv: 88 },
  { name: 'Sat', uv: 74 },
  { name: 'Sun', uv: 82 },
];

export const defaultTodayTask: LegacyTodayTask = {
  stepTarget: 10000,
  hydrationGoal: '3.5L',
  workout: [
    {
      id: 'w1',
      name: 'Incline Dumbbell Press',
      sets: 4,
      reps: 12,
      rest: '60s',
      completed: true,
      focus: 'Upper chest and front delts',
      equipmentMode: 'basic',
      alternatives: ['Elevated push-ups', 'Resistance-band press'],
    },
    {
      id: 'w2',
      name: 'Cable Fly',
      sets: 3,
      reps: 15,
      rest: '45s',
      completed: false,
      focus: 'Chest isolation and contraction quality',
      equipmentMode: 'full_gym',
      alternatives: ['Dumbbell fly on floor', 'Band fly'],
    },
    {
      id: 'w3',
      name: 'Overhead Triceps Extension',
      sets: 3,
      reps: 12,
      rest: '45s',
      completed: false,
      focus: 'Long-head triceps loading',
      equipmentMode: 'basic',
      alternatives: ['Chair dips', 'Close-grip push-ups'],
    },
    {
      id: 'w4',
      name: 'Push-ups',
      sets: 3,
      reps: 20,
      rest: '30s',
      completed: false,
      focus: 'Volume finisher',
      equipmentMode: 'bodyweight_only',
      alternatives: ['Knee push-ups', 'Tempo push-ups'],
    },
  ],
  diet: [
    {
      id: 'd1',
      meal: 'Breakfast',
      description: 'Oats + eggs + fruit',
      time: '08:00',
      calories: 520,
      completed: true,
      foods: [
        { item: 'Rolled oats', grams: 70 },
        { item: 'Whole eggs', grams: 100 },
        { item: 'Banana', grams: 120 },
      ],
      macros: { protein: 31, carbs: 57, fats: 16 },
    },
    {
      id: 'd2',
      meal: 'Lunch',
      description: 'Chicken + rice + salad',
      time: '13:30',
      calories: 680,
      completed: false,
      foods: [
        { item: 'Chicken breast', grams: 180 },
        { item: 'Cooked rice', grams: 220 },
        { item: 'Salad mix', grams: 120 },
      ],
      macros: { protein: 52, carbs: 64, fats: 14 },
    },
    {
      id: 'd3',
      meal: 'Snack',
      description: 'Greek yogurt + nuts',
      time: '17:00',
      calories: 320,
      completed: false,
      foods: [
        { item: 'Greek yogurt', grams: 200 },
        { item: 'Mixed nuts', grams: 25 },
      ],
      macros: { protein: 24, carbs: 18, fats: 15 },
    },
    {
      id: 'd4',
      meal: 'Dinner',
      description: 'Paneer + veggies + roti',
      time: '20:30',
      calories: 610,
      completed: false,
      foods: [
        { item: 'Paneer', grams: 160 },
        { item: 'Mixed vegetables', grams: 200 },
        { item: 'Roti', grams: 100 },
      ],
      macros: { protein: 36, carbs: 48, fats: 24 },
    },
  ],
};

export const defaultSubmissions: LegacySubmission[] = [
  {
    id: 'sub-1',
    studentId: 's1',
    studentName: 'Arjun Mehta',
    taskName: 'Workout Check-in',
    timestamp: 'Today, 8:35 AM',
    status: 'pending' as const,
    mediaUrl: '',
    trainerNote: '',
  },
  {
    id: 'sub-2',
    studentId: 's2',
    studentName: 'Priya Sharma',
    taskName: 'Nutrition Check-in',
    timestamp: 'Today, 7:10 AM',
    status: 'approved' as const,
    mediaUrl: '',
    trainerNote: 'Nice consistency',
  },
];

export const defaultAppNotifications: NotificationItem[] = [
  {
    id: 'sys-notif-1',
    message: 'Coach Vikram approved your latest check-in',
    icon: 'check-circle',
    type: 'trainer',
    userAvatar: '',
    userName: 'Coach Vikram',
    action: 'approved your latest check-in',
    timestamp: '2h ago',
    read: false,
  },
  {
    id: 'sys-notif-2',
    message: 'After Hours sent a reminder for your daily plan',
    icon: 'clipboard',
    type: 'plan',
    userAvatar: '',
    userName: 'After Hours',
    action: 'sent a reminder for your daily plan',
    timestamp: '1d ago',
    read: true,
  },
];
