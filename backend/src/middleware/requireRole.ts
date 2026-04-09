import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../lib/httpError.js";

export const requireRole = (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw HttpError.unauthorized();
    if (!roles.includes(req.user.role)) {
      throw HttpError.forbidden(`Role '${req.user.role}' not allowed`);
    }
    next();
  };
