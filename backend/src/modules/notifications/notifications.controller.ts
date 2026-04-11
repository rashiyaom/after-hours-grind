import type { Request, Response } from "express";
import { z } from "zod";
import * as svc from "./notifications.service.js";

const notificationsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function getNotificationsHandler(req: Request, res: Response) {
  const { cursor, limit } = notificationsQuerySchema.parse(req.query);
  const data = await svc.getNotifications(req.user!.userId, cursor, limit);
  res.json(data);
}

export async function markReadHandler(req: Request, res: Response) {
  const n = await svc.markRead(req.user!.userId, req.params.id);
  res.json(n);
}
