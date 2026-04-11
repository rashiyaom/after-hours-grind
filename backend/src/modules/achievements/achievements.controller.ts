import type { Request, Response } from "express";
import * as svc from "./achievements.service.js";

export async function getAchievementsHandler(req: Request, res: Response) {
  const userId = req.user!.userId;
  const studentProfile = await svc.getAchievements(userId);
  res.json(studentProfile);
}

export async function getAchievementProgressHandler(req: Request, res: Response) {
  const userId = req.user!.userId;
  const progress = await svc.getAchievementProgress(userId);
  res.json(progress);
}

export async function earnBadgeHandler(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { badgeId } = req.params;
  const badge = await svc.earnBadge(userId, badgeId);
  res.status(201).json(badge);
}
