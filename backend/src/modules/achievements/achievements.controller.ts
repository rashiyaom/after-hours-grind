import type { Request, Response } from "express";
import * as svc from "./achievements.service.js";

export async function getMyAchievementsHandler(req: Request, res: Response) {
  const achievements = await svc.getUserAchievements(req.user!.userId);
  res.json(achievements);
}

export async function checkAchievementsHandler(req: Request, res: Response) {
  const awarded = await svc.checkAndAwardAchievements(req.user!.userId);
  res.json({ awarded });
}

export async function getAllDefsHandler(_req: Request, res: Response) {
  const defs = await svc.getAllAchievementDefs();
  res.json(defs);
}
