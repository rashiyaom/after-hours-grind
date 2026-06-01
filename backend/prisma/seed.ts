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

  await prisma.chatMessage.deleteMany();
  await prisma.threadParticipant.deleteMany();
  await prisma.chatThread.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.planTask.deleteMany();
  await prisma.planDay.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.progressEntry.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.rewardTransaction.deleteMany();
  await prisma.stravaConnection.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.studentProfile.deleteMany();
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
      passwordHash: adminHash,
    },
    create: {
      email: "trainer@ahg.com", name: "Coach Arjun", passwordHash: adminHash, role: Role.TRAINER,
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
