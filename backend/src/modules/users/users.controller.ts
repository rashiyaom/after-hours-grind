import type { Request, Response } from "express";
import * as svc from "./users.service.js";
import { updateProfileSchema } from "./users.schema.js";

export async function getMeHandler(req: Request, res: Response) {
  const user = await svc.getMe(req.user!.userId);
  res.json(user);
}

export async function updateMeHandler(req: Request, res: Response) {
  const data = updateProfileSchema.parse(req.body);
  const updated = await svc.updateMe(req.user!.userId, req.user!.role, data);
  res.json(updated);
}

export async function getUserHandler(req: Request, res: Response) {
  const user = await svc.getUser(req.params.id);
  res.json(user);
}

export async function followHandler(req: Request, res: Response) {
  await svc.followUser(req.user!.userId, req.params.id);
  res.status(201).json({ message: "Followed" });
}

export async function unfollowHandler(req: Request, res: Response) {
  await svc.unfollowUser(req.user!.userId, req.params.id);
  res.json({ message: "Unfollowed" });
}

export async function getFeaturedAthletesHandler(req: Request, res: Response) {
  const athletes = await svc.getFeaturedAthletes();
  res.json(athletes);
}
