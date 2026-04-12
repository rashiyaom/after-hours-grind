import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../lib/httpError.js";
import { CSRF_COOKIE_NAME } from "../lib/csrf.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const CSRF_EXEMPT_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/refresh",
]);

const getAllCookieValues = (rawCookieHeader: string | undefined, key: string): string[] => {
  if (!rawCookieHeader) return [];

  return rawCookieHeader
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const eqIndex = entry.indexOf("=");
      if (eqIndex <= 0) return [];
      const cookieKey = entry.slice(0, eqIndex).trim();
      if (cookieKey !== key) return [];
      return [decodeURIComponent(entry.slice(eqIndex + 1))];
    });
};

export const csrfProtection = (req: Request, _res: Response, next: NextFunction): void => {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }

  if (CSRF_EXEMPT_PATHS.has(req.path)) {
    next();
    return;
  }

  const hasCookieSession =
    typeof req.cookies?.accessToken === "string" || typeof req.cookies?.refreshToken === "string";

  if (!hasCookieSession) {
    next();
    return;
  }

  const headerToken = req.header("x-csrf-token");
  const cookieTokens = new Set<string>();

  if (typeof req.cookies?.[CSRF_COOKIE_NAME] === "string") {
    cookieTokens.add(req.cookies[CSRF_COOKIE_NAME]);
  }

  getAllCookieValues(req.headers.cookie, CSRF_COOKIE_NAME).forEach((value) => {
    if (value) cookieTokens.add(value);
  });

  if (!headerToken || cookieTokens.size === 0 || !cookieTokens.has(headerToken)) {
    throw HttpError.forbidden("CSRF token invalid or missing");
  }

  next();
};
