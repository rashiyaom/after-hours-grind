import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type TokenPayload } from "../lib/jwt.js";
import { HttpError } from "../lib/httpError.js";

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const cookieToken = typeof req.cookies?.accessToken === "string" ? req.cookies.accessToken : null;
  const queryToken = typeof req.query?.accessToken === "string" ? req.query.accessToken : null;
  const token = bearerToken ?? cookieToken ?? queryToken;

  if (!token) {
    throw HttpError.unauthorized("Missing authentication token");
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw HttpError.unauthorized("Invalid or expired token");
  }
};
