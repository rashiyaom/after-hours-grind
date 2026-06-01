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

async function deleteStudentSeedData(): Promise<void> {
  const students = await prisma.user.findMany({
    where: { role: Role.STUDENT },
    select: { id: true },
  });

  if (students.length === 0) return;

  const studentIds = students.map((student) => student.id);

  const planRows = await prisma.plan.findMany({
    where: { studentId: { in: studentIds } },
    select: { id: true },
  });
  const planIds = planRows.map((plan) => plan.id);

  const threadRows = await prisma.threadParticipant.findMany({
    where: { userId: { in: studentIds } },
    select: { threadId: true },
  });
  const threadIds = Array.from(new Set(threadRows.map((row) => row.threadId)));

  if (planIds.length > 0) {
    await prisma.submission.deleteMany({ where: { planTask: { planDay: { planId: { in: planIds } } } } });
    await prisma.plan.deleteMany({ where: { id: { in: planIds } } });
  }

  await prisma.follow.deleteMany({
    where: {
      OR: [
        { followerId: { in: studentIds } },
        { followingId: { in: studentIds } },
      ],
    },
  });

  await prisma.comment.deleteMany({ where: { userId: { in: studentIds } } });
  await prisma.like.deleteMany({ where: { userId: { in: studentIds } } });
  await prisma.post.deleteMany({ where: { userId: { in: studentIds } } });
  await prisma.notification.deleteMany({ where: { userId: { in: studentIds } } });
  await prisma.progressEntry.deleteMany({ where: { userId: { in: studentIds } } });
  await prisma.userAchievement.deleteMany({ where: { userId: { in: studentIds } } });
  await prisma.rewardTransaction.deleteMany({
    where: {
      OR: [
        { userId: { in: studentIds } },
        { createdById: { in: studentIds } },
      ],
    },
  });
  await prisma.stravaConnection.deleteMany({ where: { userId: { in: studentIds } } });
  await prisma.refreshToken.deleteMany({ where: { userId: { in: studentIds } } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: { in: studentIds } } });
  await prisma.submission.deleteMany({
    where: {
      OR: [
        { studentId: { in: studentIds } },
        { reviewedById: { in: studentIds } },
      ],
    },
  });

  if (threadIds.length > 0) {
    await prisma.chatMessage.deleteMany({
      where: {
        OR: [
          { senderId: { in: studentIds } },
          { threadId: { in: threadIds } },
        ],
      },
    });
    await prisma.threadParticipant.deleteMany({ where: { threadId: { in: threadIds } } });
    await prisma.chatThread.deleteMany({ where: { id: { in: threadIds } } });
  }

  await prisma.studentProfile.deleteMany({ where: { userId: { in: studentIds } } });
  await prisma.user.deleteMany({ where: { id: { in: studentIds } } });

  console.log(`Removed ${studentIds.length} seeded student accounts and related data.`);
}

async function main() {
  // SECURITY: Prevent accidental seeding in production
  if (nodeProcess?.env.NODE_ENV === "production") {
    console.error(
      "\n❌ Database seeding is DISABLED in production!\n" +
      "This script is for development/testing only and would overwrite your production data.\n" +
      "If you need to seed production data, use migration scripts instead.\n"
    );
    if (nodeProcess) nodeProcess.exit(1);
  }

  const adminEmail = parseSeedAdminEmail();
  const adminPassword = parseSeedAdminPassword();
  const adminHash = await bcrypt.hash(adminPassword, 12);

  await deleteStudentSeedData();

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: "Admin User", passwordHash: adminHash, role: Role.ADMIN },
    create: { email: adminEmail, name: "Admin User", passwordHash: adminHash, role: Role.ADMIN },
  });

  // Trainer
  const trainer = await prisma.user.upsert({
    where: { email: "trainer@ahg.com" },
    update: {
      name: "Coach Arjun",
      role: Role.TRAINER,
    },
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

  console.log("✅ Seed complete: admin and trainer only");
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
