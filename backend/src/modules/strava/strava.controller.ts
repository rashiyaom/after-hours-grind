import type { Request, Response } from "express";
import { stravaExchangeSchema } from "./strava.schema.js";
import * as svc from "./strava.service.js";

export async function getStatusHandler(req: Request, res: Response) {
  const status = await svc.getStravaStatus(req.user!.userId);
  res.json(status);
}

export async function getConnectUrlHandler(req: Request, res: Response) {
  const payload = await svc.getStravaConnectUrl(req.user!.userId);
  res.json(payload);
}

export async function exchangeCodeHandler(req: Request, res: Response) {
  const data = stravaExchangeSchema.parse(req.body);
  const result = await svc.exchangeStravaCode(req.user!.userId, data);
  res.status(201).json(result);
}

export async function syncHandler(req: Request, res: Response) {
  const result = await svc.syncStravaActivities(req.user!.userId);
  res.json(result);
}

export async function disconnectHandler(req: Request, res: Response) {
  const result = await svc.disconnectStrava(req.user!.userId);
  res.json(result);
}
