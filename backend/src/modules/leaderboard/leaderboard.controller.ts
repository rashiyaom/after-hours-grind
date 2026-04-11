import type { Request, Response } from "express";
import * as svc from "./leaderboard.service.js";

export async function getLeaderboardHandler(req: Request, res: Response) {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const data = await svc.getLeaderboard(limit);
  res.json(data);
}
