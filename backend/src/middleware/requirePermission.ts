import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../lib/httpError.js";

// Permission matrix — matches frontend PermissionKey
const PERMISSIONS: Record<string, Record<string, boolean>> = {
  ADMIN:   { view_dashboard: true, manage_users: true, moderate_content: true, build_plans: true, post_feed: true, view_analytics: true },
  TRAINER: { view_dashboard: true, manage_users: false, moderate_content: false, build_plans: true, post_feed: true, view_analytics: true },
  STUDENT: { view_dashboard: true, manage_users: false, moderate_content: false, build_plans: false, post_feed: true, view_analytics: false },
};

export const requirePermission = (permission: string) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw HttpError.unauthorized();
    const rolePerms = PERMISSIONS[req.user.role];
    if (!rolePerms?.[permission]) {
      throw HttpError.forbidden(`Missing permission: ${permission}`);
    }
    next();
  };
