/**
 * ensure-admin.ts
 *
 * Creates the seeded admin user if they don't already exist in the database.
 * Safe to run on every deploy — it is a no-op when the account is already present.
 *
 * Required environment variables:
 *   SEED_ADMIN_EMAIL    – the admin's email address
 *   SEED_ADMIN_PASSWORD – a strong password (≥12 chars, upper+lower+digit+symbol)
 *
 * This script is intentionally separate from prisma/seed.ts, which is
 * disabled in production. It is called by the `start:guarded` npm script
 * immediately after `prisma migrate deploy`.
 */

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(scriptDir, "..");
dotenv.config({ path: path.resolve(backendRoot, ".env") });

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`[ensure-admin] ${name} environment variable is required.`);
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
      "[ensure-admin] SEED_ADMIN_PASSWORD is too weak. " +
        "Use at least 12 characters with uppercase, lowercase, a digit, and a symbol."
    );
  }
}

async function main(): Promise<void> {
  const email = requireEnv("SEED_ADMIN_EMAIL").toLowerCase();
  const password = requireEnv("SEED_ADMIN_PASSWORD");
  assertStrongPassword(password);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`[ensure-admin] Admin user already exists (id=${existing.id}). Nothing to do.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name: "Admin User",
      passwordHash,
      role: Role.ADMIN,
      isBanned: false,
    },
    select: { id: true, email: true, role: true },
  });

  console.log(`[ensure-admin] Admin user created successfully.`);
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch((error) => {
    console.error("[ensure-admin] Fatal error:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
