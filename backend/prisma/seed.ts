import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("password123", 12);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@ahg.com" },
    update: {},
    create: { email: "admin@ahg.com", name: "Admin User", passwordHash: hash, role: Role.ADMIN },
  });

  // Trainer
  const trainer = await prisma.user.upsert({
    where: { email: "trainer@ahg.com" },
    update: {},
    create: {
      email: "trainer@ahg.com", name: "Coach Arjun", passwordHash: hash, role: Role.TRAINER,
      avatar: "",
      trainerProfile: { create: { specialization: "Strength & Conditioning", experience: 5, certifications: ["NSCA-CSCS", "ACE-CPT"], isVerified: true } },
    },
  });

  // Students
  const s1 = await prisma.user.upsert({
    where: { email: "student1@ahg.com" },
    update: {},
    create: {
      email: "student1@ahg.com", name: "Rahul Sharma", passwordHash: hash, role: Role.STUDENT,
      studentProfile: { create: { collegeId: "COL-001", heightCm: 175, weightKg: 72, fitnessGoal: "muscle_gain", streak: 12, totalPoints: 340, trainerId: trainer.id, onboardingCompleted: true } },
    },
  });

  const s2 = await prisma.user.upsert({
    where: { email: "student2@ahg.com" },
    update: {},
    create: {
      email: "student2@ahg.com", name: "Priya Patel", passwordHash: hash, role: Role.STUDENT,
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

  console.log("✅ Seed complete: admin, trainer, 2 students, plan, posts, chat");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
