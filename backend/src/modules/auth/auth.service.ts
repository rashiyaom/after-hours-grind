import { prisma } from "../../config/prisma.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";
import { HttpError } from "../../lib/httpError.js";
import { env } from "../../config/env.js";
import { parseDurationToMs } from "../../lib/duration.js";
import type { SignupInput, LoginInput } from "./auth.schema.js";
import crypto from "crypto";
import { sendPasswordResetCodeEmail, sendPasswordResetEmail, isMailerConfigured, sendLoginAlertEmail, sendWelcomeEmail } from "../../lib/mailer.js";
import { deleteCacheKey, getJsonCache, setJsonCache } from "../../lib/cache.js";

const DEFAULT_REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = parseDurationToMs(env.REFRESH_TOKEN_TTL, DEFAULT_REFRESH_TTL_MS);
const PASSWORD_RESET_TTL_MS = env.RESET_PASSWORD_TTL_MINUTES * 60 * 1000;
const FORGOT_PASSWORD_CODE_TTL_SECONDS = 10 * 60;
const FORGOT_PASSWORD_CODE_TTL_MS = FORGOT_PASSWORD_CODE_TTL_SECONDS * 1000;
const FORGOT_PASSWORD_MAX_VERIFY_ATTEMPTS = 5;

function refreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}

const hashRefreshToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const hashResetToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const normalizePhoneNumber = (value: string): string => value.replace(/[\s\-()]/g, "");

const hashEmail = (email: string): string =>
  crypto.createHash("sha256").update(email.toLowerCase()).digest("hex");

const generateVerificationCode = (): string => String(crypto.randomInt(100000, 1000000));

type ForgotPasswordCodeCache = {
  userId: string;
  email: string;
  codeHash: string;
  attempts: number;
  expiresAtMs: number;
};

const forgotPasswordCodeKey = (email: string): string =>
  `auth:forgot-password:code:${hashEmail(email)}`;

const codeHashForEmail = (email: string, code: string): string =>
  hashResetToken(`${email.toLowerCase()}:${code}`);

const isBannedUser = (user: unknown): boolean => {
  if (!user || typeof user !== "object") return false;
  if (!("isBanned" in user)) return false;
  return user.isBanned === true;
};

export async function signup(input: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw HttpError.conflict("Email already registered");

  const normalizedPhone = input.phoneNumber ? normalizePhoneNumber(input.phoneNumber) : undefined;
  if (normalizedPhone) {
    const existingPhone = await prisma.user.findUnique({ where: { phoneNumber: normalizedPhone } });
    if (existingPhone) throw HttpError.conflict("Phone number already registered");
  }

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
      phoneNumber: normalizedPhone,
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

  if (isMailerConfigured) {
    void sendWelcomeEmail(user.email, user.name).catch(() => {});
  }

  return issueTokens(user.id, user.role);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email.trim().toLowerCase() } });
  if (!user) throw HttpError.unauthorized("Invalid credentials");
  if (isBannedUser(user)) throw HttpError.forbidden("Account is banned");

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw HttpError.unauthorized("Invalid credentials");

  const result = await issueTokens(user.id, user.role);
  const shouldSendLoginAlert = isMailerConfigured && !user.lastLoginAt;
  if (shouldSendLoginAlert) {
    void sendLoginAlertEmail(user.email, user.name).catch(() => {});
  }

  await prisma.user
    .update({
      where: { id: user.id },
      data: { lastLoginAt: user.lastLoginAt ?? new Date() },
    })
    .catch(() => {});

  return result;
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

export async function forgotPassword(email: string) {
  if (!isMailerConfigured) {
    throw new HttpError(500, "Email service is not configured");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return;

  const code = generateVerificationCode();
  const key = forgotPasswordCodeKey(normalizedEmail);

  await setJsonCache(
    key,
    {
      userId: user.id,
      email: normalizedEmail,
      codeHash: codeHashForEmail(normalizedEmail, code),
      attempts: 0,
      expiresAtMs: Date.now() + FORGOT_PASSWORD_CODE_TTL_MS,
    } satisfies ForgotPasswordCodeCache,
    FORGOT_PASSWORD_CODE_TTL_SECONDS
  );

  await sendPasswordResetCodeEmail(user.email, code);
}

export async function verifyForgotPasswordCode(email: string, code: string) {
  if (!isMailerConfigured) {
    throw new HttpError(500, "Email service is not configured");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const key = forgotPasswordCodeKey(normalizedEmail);
  const cached = await getJsonCache<ForgotPasswordCodeCache>(key);
  if (!cached || cached.expiresAtMs < Date.now()) {
    await deleteCacheKey(key);
    throw HttpError.badRequest("Verification code is invalid or expired");
  }

  const incomingHash = codeHashForEmail(normalizedEmail, code.trim());
  if (incomingHash !== cached.codeHash) {
    const nextAttempts = (cached.attempts ?? 0) + 1;
    if (nextAttempts >= FORGOT_PASSWORD_MAX_VERIFY_ATTEMPTS) {
      await deleteCacheKey(key);
      throw HttpError.badRequest("Too many invalid attempts. Request a new code.");
    }

    await setJsonCache(
      key,
      {
        ...cached,
        attempts: nextAttempts,
      } satisfies ForgotPasswordCodeCache,
      Math.max(1, Math.floor((cached.expiresAtMs - Date.now()) / 1000))
    );
    throw HttpError.badRequest("Verification code is invalid or expired");
  }

  await deleteCacheKey(key);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      userId: cached.userId,
      expiresAt,
    },
  });

  const resetLink = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;
  await sendPasswordResetEmail(cached.email, resetLink);
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashResetToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw HttpError.badRequest("Reset token is invalid or expired");
  }

  const newHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash: newHash } }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.refreshToken.deleteMany({ where: { userId: resetToken.userId } }),
  ]);
}

export async function cleanupExpiredResetTokens() {
  const now = new Date();
  const usedBefore = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        { usedAt: { not: null, lt: usedBefore } },
      ],
    },
  });
}

async function issueTokens(userId: string, role: string) {
  const accessToken = signAccessToken({ userId, role });
  const refreshToken = signRefreshToken({ userId, role });

  await prisma.refreshToken.create({
    data: { token: hashRefreshToken(refreshToken), userId, expiresAt: refreshTokenExpiry() },
  });

  return { accessToken, refreshToken, userId, role };
}
