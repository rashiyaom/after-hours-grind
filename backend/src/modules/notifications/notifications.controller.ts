import type { Request, Response } from "express";
import * as svc from "./notifications.service.js";

export async function getNotificationsHandler(req: Request, res: Response) {
  const data = await svc.getNotifications(req.user!.userId);
  res.json(data);
}

export async function markReadHandler(req: Request, res: Response) {
  const n = await svc.markRead(req.user!.userId, req.params.id);
  res.json(n);
}
