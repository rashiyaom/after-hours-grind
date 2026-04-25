import { prisma } from "../../config/prisma.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";
import { HttpError } from "../../lib/httpError.js";
import { env } from "../../config/env.js";
import { parseDurationToMs } from "../../lib/duration.js";
import type { SignupInput, LoginInput } from "./auth.schema.js";
import crypto from "crypto";

const DEFAULT_REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = parseDurationToMs(env.REFRESH_TOKEN_TTL, DEFAULT_REFRESH_TTL_MS);

function refreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}

const hashRefreshToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const isBannedUser = (user: unknown): boolean => {
  if (!user || typeof user !== "object") return false;
  if (!("isBanned" in user)) return false;
  return user.isBanned === true;
};

export async function signup(input: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw HttpError.conflict("Email already registered");

  const certifications = Array.isArray(input.certifications)
    ? input.certifications.map((cert) => cert.trim()).filter(Boolean)
    : (input.certifications ?? "")
        .split(",")
        .map((cert) => cert.trim())
        .filter(Boolean);

  const passwordHash = await hashPassword(input.password);
  
  if (input.role !== "STUDENT") {
    throw HttpError.badRequest("Public signup is restricted to student accounts only.");
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      ...(input.role === "STUDENT"
        ? {
            studentProfile: {
              create: {
                collegeId: input.collegeId ?? "",
                heightCm: input.height ?? 170,
                weightKg: input.weight ?? 70,
                fitnessGoal: input.fitnessGoal ?? "",
              },
            },
          }
        : {}),
    },
  });

  return issueTokens(user.id, user.role);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw HttpError.unauthorized("Invalid credentials");
  if (isBannedUser(user)) throw HttpError.forbidden("Account is banned");

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw HttpError.unauthorized("Invalid credentials");

  return issueTokens(user.id, user.role);
}

export async function refresh(oldToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(oldToken);
  } catch {
    throw HttpError.unauthorized("Invalid refresh token");
  }

  const tokenHash = hashRefreshToken(oldToken);
  const stored = await prisma.refreshToken.findUnique({ where: { token: tokenHash } });
  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw HttpError.unauthorized("Refresh token expired or revoked");
  }

  // Rotate
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || isBannedUser(user)) throw HttpError.unauthorized("Invalid user session");

  await prisma.refreshToken.delete({ where: { id: stored.id } });
  return issueTokens(user.id, user.role);
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.deleteMany({ where: { token: hashRefreshToken(refreshToken) } });
}

async function issueTokens(userId: string, role: string) {
  const accessToken = signAccessToken({ userId, role });
  const refreshToken = signRefreshToken({ userId, role });

  await prisma.refreshToken.create({
    data: { token: hashRefreshToken(refreshToken), userId, expiresAt: refreshTokenExpiry() },
  });

  return { accessToken, refreshToken, userId, role };
}
