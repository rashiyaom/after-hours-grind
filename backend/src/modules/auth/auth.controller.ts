import type { Request, Response } from "express";
import type { CookieOptions } from "express";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  forgotPasswordVerifyCodeSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "./auth.schema.js";
import * as authService from "./auth.service.js";
import { env } from "../../config/env.js";
import { parseDurationToMs } from "../../lib/duration.js";
import { createCsrfToken, CSRF_COOKIE_NAME } from "../../lib/csrf.js";
import { HttpError } from "../../lib/httpError.js";

const DEFAULT_REFRESH_COOKIE_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_ACCESS_COOKIE_MS = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE_MS = parseDurationToMs(env.REFRESH_TOKEN_TTL, DEFAULT_REFRESH_COOKIE_MS);
const ACCESS_COOKIE_MAX_AGE_MS = parseDurationToMs(env.ACCESS_TOKEN_TTL, DEFAULT_ACCESS_COOKIE_MS);

const sameSitePolicy: CookieOptions["sameSite"] = env.AUTH_COOKIE_SAME_SITE;
const baseCookieOptions: Pick<CookieOptions, "httpOnly" | "secure" | "sameSite" | "domain"> = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: sameSitePolicy,
  ...(env.AUTH_COOKIE_DOMAIN ? { domain: env.AUTH_COOKIE_DOMAIN } : {}),
};

const COOKIE_OPTIONS: CookieOptions = {
  ...baseCookieOptions,
  path: "/api/auth",
  maxAge: REFRESH_COOKIE_MAX_AGE_MS,
};

const ACCESS_COOKIE_OPTIONS: CookieOptions = {
  ...baseCookieOptions,
  path: "/api",
  maxAge: ACCESS_COOKIE_MAX_AGE_MS,
};

const CSRF_COOKIE_OPTIONS: CookieOptions = {
  ...baseCookieOptions,
  httpOnly: false,
  path: "/",
  maxAge: REFRESH_COOKIE_MAX_AGE_MS,
};

const LEGACY_CSRF_COOKIE_OPTIONS: CookieOptions = {
  ...baseCookieOptions,
  httpOnly: false,
  path: "/api",
};

const setCsrfCookie = (res: Response, token: string): void => {
  // Remove legacy path-scoped cookie so only one csrfToken exists in the browser.
  res.clearCookie(CSRF_COOKIE_NAME, LEGACY_CSRF_COOKIE_OPTIONS);
  res.cookie(CSRF_COOKIE_NAME, token, CSRF_COOKIE_OPTIONS);
};

export async function signupHandler(req: Request, res: Response) {
  const data = signupSchema.parse(req.body);
  await authService.signup(data);
  throw HttpError.forbidden("Public signup is disabled. Ask an admin for an account.");
}

export async function loginHandler(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data);
  const csrfToken = createCsrfToken();
  res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
  res.cookie("accessToken", result.accessToken, ACCESS_COOKIE_OPTIONS);
  setCsrfCookie(res, csrfToken);
  res.json({ accessToken: result.accessToken, userId: result.userId, role: result.role });
}

export async function refreshHandler(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;
  if (!token) { res.status(401).json({ error: "No refresh token" }); return; }
  const result = await authService.refresh(token);
  const csrfToken = createCsrfToken();
  res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
  res.cookie("accessToken", result.accessToken, ACCESS_COOKIE_OPTIONS);
  setCsrfCookie(res, csrfToken);
  res.json({ accessToken: result.accessToken, userId: result.userId, role: result.role });
}

export async function logoutHandler(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;
  if (token) await authService.logout(token);
  res.clearCookie("refreshToken", {
    ...baseCookieOptions,
    path: "/api/auth",
  });
  res.clearCookie("accessToken", {
    ...baseCookieOptions,
    path: "/api",
  });
  res.clearCookie(CSRF_COOKIE_NAME, {
    ...baseCookieOptions,
    httpOnly: false,
    path: "/",
  });
  res.clearCookie(CSRF_COOKIE_NAME, LEGACY_CSRF_COOKIE_OPTIONS);
  res.json({ message: "Logged out" });
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  const data = forgotPasswordSchema.parse(req.body);
  await authService.forgotPassword(data.email);
  res.json({ message: "If the email exists, a verification code has been sent." });
}

export async function verifyForgotPasswordCodeHandler(req: Request, res: Response) {
  const data = forgotPasswordVerifyCodeSchema.parse(req.body);
  await authService.verifyForgotPasswordCode(data.email, data.code);
  res.json({ message: "Code verified. Reset instructions have been sent." });
}

export async function resetPasswordHandler(req: Request, res: Response) {
  const data = resetPasswordSchema.parse(req.body);
  await authService.resetPassword(data.token, data.newPassword);
  res.json({ message: "Password reset successful. Please sign in." });
}

export async function changePasswordHandler(req: Request, res: Response) {
  const data = changePasswordSchema.parse(req.body);
  const result = await authService.changePassword(req.user!.userId, data.currentPassword, data.newPassword);
  const csrfToken = createCsrfToken();
  res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
  res.cookie("accessToken", result.accessToken, ACCESS_COOKIE_OPTIONS);
  setCsrfCookie(res, csrfToken);
  res.json({ accessToken: result.accessToken, userId: result.userId, role: result.role });
}
