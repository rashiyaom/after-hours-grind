/**
 * create-week1-template.ts
 *
 * Creates a Week 1 cycle of exercise templates (Field Workout • No Equipment • Athletic Base Phase)
 * and optionally assigns them to students.
 *
 * Usage:
 *   - Create templates only:
 *       STUDENT_IDS=none tsx scripts/create-week1-template.ts
 *   - Assign to specific students:
 *       STUDENT_IDS="id1,id2" tsx scripts/create-week1-template.ts
 *   - Assign to all students:
 *       STUDENT_IDS=ALL tsx scripts/create-week1-template.ts
 */

import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createExerciseTemplate, assignExerciseTemplateBulk } from "../src/modules/admin/admin.service.js";
import { PrismaClient } from "@prisma/client";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(scriptDir, "..");
dotenv.config({ path: path.resolve(backendRoot, ".env") });

const prisma = new PrismaClient();

async function main() {
  const studentEnv = (process.env.STUDENT_IDS ?? "").trim();
  const doAssign = studentEnv && studentEnv.toLowerCase() !== "none";

  console.log("Creating Week 1 templates (Field Workout • No Equipment • Athletic Base Phase)");

  // Define template metadata for all distinct exercises referenced in the week plan
  const templates = [
    { name: 'Walking Lunges', description: 'Alternating walking lunges. Keep chest tall and step through.', category: 'workout', sets: 4, reps: 20, restSeconds: 60, durationMinutes: 5, difficulty: 'moderate' },
    { name: 'Jump Squats', description: 'Explosive squats, land softly.', category: 'workout', sets: 4, reps: 15, restSeconds: 90, durationMinutes: 5, difficulty: 'high' },
    { name: 'Reverse Lunges', description: 'Step back into a lunge, control the descent.', category: 'workout', sets: 3, reps: 12, restSeconds: 60, durationMinutes: 4, difficulty: 'moderate' },
    { name: 'Broad Jumps', description: 'Explosive horizontal jumps for power.', category: 'workout', sets: 4, reps: 8, restSeconds: 90, durationMinutes: 6, difficulty: 'high' },
    { name: 'Wall Sit', description: 'Isometric wall sit. Maintain knee angle ~90°.', category: 'workout', sets: 3, reps: null, restSeconds: 60, durationMinutes: 3, difficulty: 'low' },
    { name: 'Calf Raises', description: 'Slow controlled raises on toes.', category: 'workout', sets: 4, reps: 20, restSeconds: 30, durationMinutes: 4, difficulty: 'low' },
    { name: '100m Run (Finisher)', description: 'Sprint 100m then walk back recovery. 8 rounds.', category: 'conditioning', sets: null, reps: 8, restSeconds: 90, durationMinutes: 20, difficulty: 'high' },
    { name: 'Plank', description: 'Standard forearm plank. Keep body straight.', category: 'workout', sets: 3, reps: null, restSeconds: 60, durationMinutes: 3, difficulty: 'low' },
    { name: 'Leg Raises', description: 'Hanging or lying leg raises for core.', category: 'workout', sets: 3, reps: 15, restSeconds: 45, durationMinutes: 4, difficulty: 'moderate' },

    // Day 2
    { name: 'Pushups', description: 'Full range pushups. Chest to floor.', category: 'workout', sets: 3, reps: 15, restSeconds: 60, durationMinutes: 5, difficulty: 'moderate' },
    { name: 'Wide Pushups', description: 'Hands wider than shoulders for chest emphasis.', category: 'workout', sets: 3, reps: 12, restSeconds: 60, durationMinutes: 4, difficulty: 'moderate' },
    { name: 'Diamond Pushups', description: 'Hands close forming diamond for triceps focus.', category: 'workout', sets: 3, reps: 10, restSeconds: 60, durationMinutes: 4, difficulty: 'high' },
    { name: 'Pike Pushups', description: 'Shoulder-dominant pushups, hips high.', category: 'workout', sets: 3, reps: 10, restSeconds: 60, durationMinutes: 4, difficulty: 'high' },
    { name: 'Burpees', description: 'Full body burpees with jump and optional pushup.', category: 'workout', sets: 4, reps: 12, restSeconds: 90, durationMinutes: 6, difficulty: 'high' },
    { name: 'Mountain Climbers', description: 'Rapid alternating knees to chest.', category: 'workout', sets: null, reps: null, restSeconds: 30, durationMinutes: 1, difficulty: 'moderate' },
    { name: 'Russian Twists', description: 'Seated oblique twists. Use bodyweight.', category: 'workout', sets: null, reps: 20, restSeconds: 30, durationMinutes: 2, difficulty: 'low' },
    { name: 'Flutter Kicks', description: 'Core flutter kicks on back.', category: 'workout', sets: null, reps: 20, restSeconds: 30, durationMinutes: 2, difficulty: 'low' },

    // Day 3
    { name: '50m Sprint', description: 'Max effort 50m sprint.', category: 'conditioning', sets: null, reps: 10, restSeconds: 45, durationMinutes: 8, difficulty: 'high' },
    { name: 'Shuttle Run', description: 'Agility shuttle runs.', category: 'conditioning', sets: null, reps: 6, restSeconds: 60, durationMinutes: 6, difficulty: 'high' },
    { name: 'Side Shuffle Sprint', description: 'Lateral shuffle with sprint finish.', category: 'conditioning', sets: null, reps: 5, restSeconds: 45, durationMinutes: 6, difficulty: 'high' },
    { name: 'Jump Lunges', description: 'Alternating jump lunges for power.', category: 'workout', sets: null, reps: 20, restSeconds: 60, durationMinutes: 4, difficulty: 'high' },
    { name: 'Plank Shoulder Taps', description: 'Plank with alternating shoulder taps.', category: 'workout', sets: null, reps: 20, restSeconds: 30, durationMinutes: 2, difficulty: 'moderate' },
    { name: 'Squat Pulses', description: 'Small range pulses at bottom of squat.', category: 'workout', sets: null, reps: 25, restSeconds: 30, durationMinutes: 2, difficulty: 'low' },

    // Day 5 & 6 extras
    { name: '800m Run', description: '800m continuous run (or 10 min steady jog option).', category: 'conditioning', sets: null, reps: null, restSeconds: null, durationMinutes: 8, difficulty: 'moderate' },
    { name: 'Endurance Run 2-4km', description: 'Moderate pace 2-4 km run.', category: 'conditioning', sets: null, reps: null, restSeconds: null, durationMinutes: 20, difficulty: 'moderate' },
    { name: 'Side Plank', description: 'Side plank hold per side.', category: 'workout', sets: 3, reps: null, restSeconds: 30, durationMinutes: 3, difficulty: 'low' },
    { name: 'Bicycle Crunches', description: 'Alternating elbow to knee bicycle crunches.', category: 'workout', sets: 3, reps: 20, restSeconds: 30, durationMinutes: 3, difficulty: 'moderate' },
    { name: 'Hollow Hold', description: 'Hollow body hold for core stability.', category: 'workout', sets: 3, reps: null, restSeconds: 30, durationMinutes: 3, difficulty: 'moderate' },
    { name: 'Jumping Jacks', description: 'Full body jumping jacks finisher.', category: 'conditioning', sets: null, reps: 100, restSeconds: 30, durationMinutes: 3, difficulty: 'low' },
  ];

  // Create or upsert templates and capture ids (we'll create new ones unconditionally)
  const createdMap: Record<string, string> = {};

  for (const t of templates) {
    const created = await createExerciseTemplate({
      name: t.name,
      description: t.description,
      category: t.category,
      sets: t.sets ?? null,
      reps: t.reps ?? null,
      restSeconds: t.restSeconds ?? null,
      durationMinutes: t.durationMinutes ?? null,
      difficulty: t.difficulty ?? 'moderate',
      equipment: 'bodyweight',
      youtubeUrl: null,
    });
    createdMap[t.name] = (created as any).id as string;
    console.log(`Created template: ${t.name} -> ${createdMap[t.name]}`);
  }

  // Map week days to template names (Day 1..7)
  const dayPlans = [
    { dayNumber: 1, templateNames: ['Walking Lunges','Jump Squats','Reverse Lunges','Broad Jumps','Wall Sit','Calf Raises','100m Run (Finisher)','Plank','Leg Raises'] },
    { dayNumber: 2, templateNames: ['Pushups','Wide Pushups','Diamond Pushups','Pike Pushups','Burpees','Plank','Mountain Climbers','Russian Twists','Flutter Kicks'] },
    { dayNumber: 3, templateNames: ['50m Sprint','Shuttle Run','Side Shuffle Sprint','Burpees','Jump Lunges','Pushups','Plank Shoulder Taps','Squat Pulses'] },
    { dayNumber: 4, templateNames: [] },
    { dayNumber: 5, templateNames: ['Burpees','Pushups','Walking Lunges','Jump Squats','Mountain Climbers','Plank','800m Run'] },
    { dayNumber: 6, templateNames: ['Endurance Run 2-4km','Plank','Side Plank','Leg Raises','Bicycle Crunches','Hollow Hold','Jumping Jacks'] },
    { dayNumber: 7, templateNames: [] },
  ];

  const normalizedDayPlans = dayPlans
    .map((dp) => ({ dayNumber: dp.dayNumber, templateIds: dp.templateNames.map((n) => createdMap[n]).filter(Boolean) }))
    .filter((dp) => dp.templateIds.length > 0);

  console.log(`Prepared ${normalizedDayPlans.length} day plans for Week 1.`);

  if (doAssign) {
    let studentIds: string[] = [];
    if (studentEnv.toUpperCase() === 'ALL') {
      const students = await prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true } });
      studentIds = students.map((s) => s.id);
      console.log(`Assigning to ALL students (${studentIds.length})`);
    } else {
      studentIds = studentEnv.split(',').map((s) => s.trim()).filter(Boolean);
      console.log(`Assigning to ${studentIds.length} provided student ids`);
    }

    if (studentIds.length === 0) {
      console.log('No students found for assignment. Exiting.');
      process.exit(0);
    }

    const result = await assignExerciseTemplateBulk({ studentIds, dayPlans: normalizedDayPlans });
    console.log('Assignment result:', result);
  } else {
    console.log('STUDENT_IDS not provided or set to "none" — templates created but not assigned.');
  }

  console.log('Week 1 template creation complete.');
}

main()
  .catch((err) => {
    console.error('Fatal error creating week1 templates:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
