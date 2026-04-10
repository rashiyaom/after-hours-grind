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

export async function createPlanHandler(req: Request, res: Response) {
    const schema = z.object({
        name: z.string().min(1),
        duration: z.number().min(1).max(100),
        goalType: z.string().default("General"),
        difficulty: z.string().default("beginner"),
        studentIds: z.array(z.string())
    });
    const data = schema.parse(req.body);
    const plan = await svc.createPlan(req.user!.userId, data);
    res.status(201).json(plan);
}

export async function getTrainerStudentsHandler(req: Request, res: Response) {
    const students = await svc.getTrainerStudents(req.user!.userId);
    res.json(students);
}

export async function getSubmissionsHandler(req: Request, res: Response) {
  const subs = await svc.getSubmissions(req.user!.userId, req.user!.role);
  res.json(subs);
}
