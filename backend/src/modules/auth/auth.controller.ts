import type { Request, Response } from "express";
import type { CookieOptions } from "express";
import { signupSchema, loginSchema } from "./auth.schema.js";
import * as authService from "./auth.service.js";
import { env } from "../../config/env.js";

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
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
};

const ACCESS_COOKIE_OPTIONS: CookieOptions = {
  ...baseCookieOptions,
  path: "/api",
  maxAge: 15 * 60 * 1000, // 15m
};

export async function signupHandler(req: Request, res: Response) {
  const data = signupSchema.parse(req.body);
  const result = await authService.signup(data);
  res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
  res.cookie("accessToken", result.accessToken, ACCESS_COOKIE_OPTIONS);
  res.status(201).json({ accessToken: result.accessToken, userId: result.userId, role: result.role });
}

export async function loginHandler(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data);
  res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
  res.cookie("accessToken", result.accessToken, ACCESS_COOKIE_OPTIONS);
  res.json({ accessToken: result.accessToken, userId: result.userId, role: result.role });
}

export async function refreshHandler(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;
  if (!token) { res.status(401).json({ error: "No refresh token" }); return; }
  const result = await authService.refresh(token);
  res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
  res.cookie("accessToken", result.accessToken, ACCESS_COOKIE_OPTIONS);
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
  res.json({ message: "Logged out" });
}
