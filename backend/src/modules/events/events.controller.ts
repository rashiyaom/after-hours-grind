import type { Request, Response } from "express";
import { z } from "zod";
import * as svc from "./events.service.js";

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string(),
  location: z.string().min(1),
  category: z.string().default("General"),
  mediaType: z.string().default("image"),
  mediaUrl: z.string().default(""),
  registrationOpen: z.boolean().default(true),
  formFields: z.array(z.any()).default([])
});

export async function getAllEventsHandler(req: Request, res: Response) {
  const events = await svc.getAllEvents();
  res.json(events);
}

export async function createEventHandler(req: Request, res: Response) {
  const data = eventSchema.parse(req.body);
  const event = await svc.createEvent(req.user!.userId, data);
  res.status(201).json(event);
}

export async function registerForEventHandler(req: Request, res: Response) {
  const { entries } = z.object({ entries: z.any() }).parse(req.body);
  const result = await svc.registerForEvent(req.user?.userId || null, req.params.id, entries);
  res.status(201).json(result);
}

export async function updateEventHandler(req: Request, res: Response) {
  const data = eventSchema.partial().parse(req.body);
  const event = await svc.updateEvent(req.params.id, data);
  res.json(event);
}

export async function deleteEventHandler(req: Request, res: Response) {
  await svc.deleteEvent(req.params.id);
  res.status(204).end();
}
