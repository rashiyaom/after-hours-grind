import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(scriptDir, "..");
dotenv.config({ path: path.resolve(backendRoot, ".env") });

const prisma = new PrismaClient();

const nodeProcess = (globalThis as {
  process?: { env: Record<string, string | undefined>; exit: (code: number) => never };
}).process;

function requireEnv(name: string): string {
  const value = nodeProcess?.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function assertStrongPassword(password: string): void {
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
}

async function main(): Promise<void> {
  const confirm = requireEnv("CONFIRM_RESYNC_SEEDED_ADMIN");
  if (confirm !== "YES") {
    throw new Error("Set CONFIRM_RESYNC_SEEDED_ADMIN=YES to run this script.");
  }

  const email = requireEnv("SEED_ADMIN_EMAIL").toLowerCase();
  const password = requireEnv("SEED_ADMIN_PASSWORD");
  assertStrongPassword(password);

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Admin User",
      passwordHash,
      role: Role.ADMIN,
      isBanned: false,
    },
    create: {
      email,
      name: "Admin User",
      passwordHash,
      role: Role.ADMIN,
      isBanned: false,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isBanned: true,
      updatedAt: true,
    },
  });

  console.log("Seeded admin credentials resynced successfully.");
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    if (nodeProcess) nodeProcess.exit(1);
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });