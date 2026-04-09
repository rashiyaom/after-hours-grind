import { prisma } from "../../config/prisma.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";
import { HttpError } from "../../lib/httpError.js";
import type { SignupInput, LoginInput } from "./auth.schema.js";
import crypto from "crypto";

function refreshTokenExpiry(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
}

export async function signup(input: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw HttpError.conflict("Email already registered");

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      ...(input.role === "STUDENT" ? { studentProfile: { create: {} } } : {}),
      ...(input.role === "TRAINER" ? { trainerProfile: { create: {} } } : {}),
    },
  });

  return issueTokens(user.id, user.role);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw HttpError.unauthorized("Invalid credentials");

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

  const stored = await prisma.refreshToken.findUnique({ where: { token: oldToken } });
  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw HttpError.unauthorized("Refresh token expired or revoked");
  }

  // Rotate
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  return issueTokens(payload.userId, payload.role);
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}

async function issueTokens(userId: string, role: string) {
  const accessToken = signAccessToken({ userId, role });
  const rawRefresh = crypto.randomBytes(48).toString("hex");
  const refreshToken = signRefreshToken({ userId, role });

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId, expiresAt: refreshTokenExpiry() },
  });

  return { accessToken, refreshToken, userId, role };
}
