import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt.js";

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next();
  }

  try {
    req.user = verifyAccessToken(header.slice(7));
  } catch {
    // Ignore invalid token in optional auth
  }
  next();
};
