import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type TokenPayload } from "../lib/jwt.js";
import { HttpError } from "../lib/httpError.js";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw HttpError.unauthorized("Missing or invalid Authorization header");
  }

  try {
    req.user = verifyAccessToken(header.slice(7));
    next();
  } catch {
    throw HttpError.unauthorized("Invalid or expired token");
  }
};
