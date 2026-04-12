import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../lib/httpError.js";
import { CSRF_COOKIE_NAME } from "../lib/csrf.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const CSRF_EXEMPT_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/signup",
]);

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
  const cookieToken = typeof req.cookies?.[CSRF_COOKIE_NAME] === "string" ? req.cookies[CSRF_COOKIE_NAME] : null;

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    throw HttpError.forbidden("CSRF token invalid or missing");
  }

  next();
};
