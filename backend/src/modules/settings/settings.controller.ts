import type { Request, Response } from "express";
import { z } from "zod";
import * as svc from "./settings.service.js";

const settingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  profileVisibility: z.enum(["public", "private", "followers"]).optional(),
  showStreak: z.boolean().optional(),
  showLeaderboard: z.boolean().optional(),
  theme: z.enum(["dark", "light", "system"]).optional(),
});

export async function getSettingsHandler(req: Request, res: Response) {
  const settings = await svc.getSettings(req.user!.userId);
  res.json(settings);
}

export async function updateSettingsHandler(req: Request, res: Response) {
  const data = settingsSchema.parse(req.body);
  const settings = await svc.updateSettings(req.user!.userId, data);
  res.json(settings);
}
