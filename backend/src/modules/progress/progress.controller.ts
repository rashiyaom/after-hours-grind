import type { Request, Response } from "express";
import { z } from "zod";
import * as svc from "./progress.service.js";

const progressSchema = z.object({
  date: z.string().optional(),
  weightKg: z.coerce.number().positive().optional(),
  bodyFatPct: z.coerce.number().min(0).max(100).optional(),
  stepCount: z.coerce.number().int().min(0).optional(),
  workoutMinutes: z.coerce.number().int().min(0).optional(),
  caloriesBurned: z.coerce.number().int().min(0).optional(),
  sleepHours: z.coerce.number().min(0).max(24).optional(),
  waterLiters: z.coerce.number().min(0).optional(),
  mood: z.enum(["great", "good", "okay", "bad", "terrible"]).optional(),
  notes: z.string().max(500).optional(),
});

export async function logProgressHandler(req: Request, res: Response) {
  const data = progressSchema.parse(req.body);
  const entry = await svc.upsertProgress(req.user!.userId, data);
  res.status(201).json(entry);
}

export async function getHistoryHandler(req: Request, res: Response) {
  const days = Math.min(Number(req.query.days) || 30, 365);
  const entries = await svc.getProgressHistory(req.user!.userId, days);
  res.json(entries);
}

export async function getSummaryHandler(req: Request, res: Response) {
  const summary = await svc.getProgressSummary(req.user!.userId);
  res.json(summary);
}

export async function getOverallHandler(req: Request, res: Response) {
  const stats = await svc.getOverallProgress(req.user!.userId);
  res.json(stats);
}

export async function getWeeklyHandler(req: Request, res: Response) {
  const weekly = await svc.getWeeklyBreakdown(req.user!.userId);
  res.json(weekly);
}

export async function getMonthlyHandler(req: Request, res: Response) {
  const params = z.object({ planId: z.string().min(1) }).parse(req.params);
  const monthly = await svc.getMonthlyAdherence(req.user!.userId, params.planId);
  res.json(monthly);
}

export async function getHeatmapHandler(req: Request, res: Response) {
  const heatmap = await svc.getActivityHeatmap(req.user!.userId);
  res.json(heatmap);
}
