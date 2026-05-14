import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const nodeProcess = (globalThis as { process?: { env: Record<string, string | undefined>; exit: (code: number) => never } }).process;

function parseSeedAdminPassword(): string {
  const password = nodeProcess?.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    throw new Error("SEED_ADMIN_PASSWORD is required for secure admin seeding.");
  }

  const strongEnough =
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  if (!strongEnough) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is too weak. Use at least 12 chars with upper/lowercase, number, and symbol."
    );
  }

  return password;
}

function parseSeedAdminEmail(): string {
  return (nodeProcess?.env.SEED_ADMIN_EMAIL ?? "admin@ahg.com").trim().toLowerCase();
}

function parseSeedUserPassword(): string {
  const password = nodeProcess?.env.SEED_USER_PASSWORD;
  if (!password) {
    throw new Error("SEED_USER_PASSWORD is required for seeded trainer and student accounts.");
  }
  return password;
}

function parseLoadStudentCount(): number {
  const raw = nodeProcess?.env.SEED_LOAD_STUDENT_COUNT;
  const parsed = Number(raw ?? 50);
  if (!Number.isFinite(parsed) || parsed < 1) return 50;
  return Math.floor(parsed);
}

async function seedDedicatedLoadDataset(trainerId: string, defaultHash: string): Promise<void> {
  const studentCount = parseLoadStudentCount();
  const prefix = "load.student";

  for (let i = 1; i <= studentCount; i += 1) {
    const num = String(i).padStart(2, "0");
    const email = `${prefix}${num}@ahg.com`;
    const name = `Load Student ${num}`;

    const student = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        passwordHash: defaultHash,
        role: Role.STUDENT,
      },
      create: {
        email,
        name,
        passwordHash: defaultHash,
        role: Role.STUDENT,
      },
    });

    await prisma.studentProfile.upsert({
      where: { userId: student.id },
      update: {
        trainerId,
        onboardingCompleted: true,
        fitnessGoal: "load_test",
        collegeId: `LOAD-${num}`,
      },
      create: {
        userId: student.id,
        trainerId,
        onboardingCompleted: true,
        fitnessGoal: "load_test",
        collegeId: `LOAD-${num}`,
        heightCm: 170,
        weightKg: 70,
      },
    });

    await prisma.submission.deleteMany({ where: { studentId: student.id } });
    await prisma.plan.deleteMany({ where: { studentId: student.id } });

    const plan = await prisma.plan.create({
      data: {
        name: `Load Plan ${num}`,
        trainerId,
        studentId: student.id,
        difficulty: "beginner",
        goalType: "load_test",
        status: "ACTIVE",
        days: {
          create: [
            {
              day: 1,
              tasks: {
                create: [
                  {
                    type: "workout",
                    title: `Load Task ${num}`,
                    description: "Synthetic load testing task",
                    durationMin: 20,
                    intensity: "moderate",
                    points: 10,
                  },
                ],
              },
            },
          ],
        },
      },
      select: { id: true },
    });

    await prisma.studentProfile.update({
      where: { userId: student.id },
      data: { currentPlanId: plan.id },
    });
  }

  console.log(`Load dataset ready: ${studentCount} load students with active plans.`);
}

async function main() {
  const adminEmail = parseSeedAdminEmail();
  const adminPassword = parseSeedAdminPassword();
  const defaultUserPassword = parseSeedUserPassword();
  const adminHash = await bcrypt.hash(adminPassword, 12);
  const defaultHash = await bcrypt.hash(defaultUserPassword, 12);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: "Admin User", passwordHash: adminHash, role: Role.ADMIN },
    create: { email: adminEmail, name: "Admin User", passwordHash: adminHash, role: Role.ADMIN },
  });

  // Trainer
  const trainer = await prisma.user.upsert({
    where: { email: "trainer@ahg.com" },
    update: {},
    create: {
      email: "trainer@ahg.com", name: "Coach Arjun", passwordHash: defaultHash, role: Role.TRAINER,
      avatar: "",
      trainerProfile: {
        create: {
          specialization: "Strength & Conditioning",
          whatsappNumber: "+919999999999",
          experience: 5,
          certifications: ["NSCA-CSCS", "ACE-CPT"],
          isVerified: true,
        },
      },
    },
  });

  // Students
  const s1 = await prisma.user.upsert({
    where: { email: "student1@ahg.com" },
    update: {},
    create: {
      email: "student1@ahg.com", name: "Rahul Sharma", passwordHash: defaultHash, role: Role.STUDENT,
      studentProfile: { create: { collegeId: "COL-001", heightCm: 175, weightKg: 72, fitnessGoal: "muscle_gain", streak: 12, totalPoints: 340, trainerId: trainer.id, onboardingCompleted: true } },
    },
  });

  const s2 = await prisma.user.upsert({
    where: { email: "student2@ahg.com" },
    update: {},
    create: {
      email: "student2@ahg.com", name: "Priya Patel", passwordHash: defaultHash, role: Role.STUDENT,
      studentProfile: { create: { collegeId: "COL-002", heightCm: 162, weightKg: 58, fitnessGoal: "fat_loss", streak: 7, totalPoints: 180, trainerId: trainer.id, onboardingCompleted: true } },
    },
  });

  // Plan with days & tasks
  const plan = await prisma.plan.create({
    data: {
      name: "4-Week Strength Program",
      trainerId: trainer.id,
      studentId: s1.id,
      difficulty: "intermediate",
      goalType: "muscle_gain",
      status: "ACTIVE",
      days: {
        create: Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          tasks: {
            create: [
              { type: "workout", title: `Day ${i + 1} — Upper Body Push`, description: "Bench press 4x8, OHP 3x10, Dips 3x12", durationMin: 45, intensity: "high", points: 20 },
              { type: "nutrition", title: "Hit protein target", description: "Consume 140g protein today", points: 10 },
              { type: "habit", title: "Sleep 7+ hours", description: "Track sleep quality", points: 5 },
            ],
          },
        })),
      },
    },
  });

  // Link plan to student
  await prisma.studentProfile.update({ where: { userId: s1.id }, data: { currentPlanId: plan.id } });

  // Posts
  await prisma.post.createMany({
    data: [
      { userId: s1.id, type: "image", caption: "Morning workout done! 💪", source: "task-proof", location: "University Gym" },
      { userId: s2.id, type: "image", caption: "Meal prep Sunday 🥗", source: "general", location: "Home" },
      { userId: trainer.id, type: "video", caption: "Proper deadlift form — watch this!", source: "general", location: "Training Center" },
    ],
  });

  // Follow relationships
  await prisma.follow.createMany({
    data: [
      { followerId: s1.id, followingId: s2.id },
      { followerId: s2.id, followingId: s1.id },
      { followerId: s1.id, followingId: trainer.id },
      { followerId: s2.id, followingId: trainer.id },
    ],
    skipDuplicates: true,
  });

  // Chat thread between trainer and student
  const thread = await prisma.chatThread.create({ data: {} });
  await prisma.threadParticipant.createMany({
    data: [
      { threadId: thread.id, userId: trainer.id },
      { threadId: thread.id, userId: s1.id },
    ],
  });
  await prisma.chatMessage.createMany({
    data: [
      { threadId: thread.id, senderId: trainer.id, text: "Hey Rahul, how's the new program going?" },
      { threadId: thread.id, senderId: s1.id, text: "Great coach! Feeling stronger already." },
    ],
  });

  await seedDedicatedLoadDataset(trainer.id, defaultHash);

  console.log("✅ Seed complete: admin, trainer, 2 students, plan, posts, chat");
}

function isTransientDbError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { message?: string; code?: string };
  const message = String(record.message ?? "").toLowerCase();
  return (
    record.code === "P1001" ||
    message.includes("can't reach database server") ||
    message.includes("connection")
  );
}

async function runSeedWithRetry(maxAttempts = 4) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await main();
      return;
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts || !isTransientDbError(error)) {
        throw error;
      }
      console.warn(`Database temporarily unavailable. Retry ${attempt}/${maxAttempts - 1}...`);
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
  throw lastError;
}

runSeedWithRetry()
  .catch((e) => {
    console.error(e);
    if (nodeProcess) nodeProcess.exit(1);
    throw e;
  })
  .finally(() => prisma.$disconnect());
