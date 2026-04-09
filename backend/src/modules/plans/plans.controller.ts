import type { Request, Response } from "express";
import { z } from "zod";
import * as svc from "./plans.service.js";

const submitSchema = z.object({
  planTaskId: z.string().optional(),
  mediaUrl: z.string().default(""),
});

const reviewSchema = z.object({
  note: z.string().optional().default(""),
});

export async function getTodayPlanHandler(req: Request, res: Response) {
  const plan = await svc.getTodayPlan(req.user!.userId);
  res.json(plan);
}

export async function createSubmissionHandler(req: Request, res: Response) {
  const data = submitSchema.parse(req.body);
  const sub = await svc.createSubmission(req.user!.userId, data);
  res.status(201).json(sub);
}

export async function approveHandler(req: Request, res: Response) {
  const { note } = reviewSchema.parse(req.body);
  const sub = await svc.approveSubmission(req.user!.userId, req.params.id, note);
  res.json(sub);
}

export async function rejectHandler(req: Request, res: Response) {
  const { note } = z.object({ note: z.string().min(1, "Rejection reason required") }).parse(req.body);
  const sub = await svc.rejectSubmission(req.user!.userId, req.params.id, note);
  res.json(sub);
}
