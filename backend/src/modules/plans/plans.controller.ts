import type { Request, Response } from "express";
import { z } from "zod";
import * as svc from "./plans.service.js";

const submitSchema = z.object({
  planTaskId: z.string().min(1),
  studentNote: z.string().trim().max(500).optional(),
});

const reviewSchema = z
  .object({
    note: z.string().optional(),
    trainerNote: z.string().optional(),
  })
  .transform(({ note, trainerNote }) => ({
    note: (note ?? trainerNote ?? "").trim(),
  }));

export async function getTodayPlanHandler(req: Request, res: Response) {
  const plan = await svc.getTodayPlan(req.user!.userId);
  res.json(plan);
}

export async function createSubmissionHandler(req: Request, res: Response) {
  const data = submitSchema.parse(req.body);
  const sub = await svc.createSubmission(req.user!.userId, data);
  res.status(201).json(sub);
}

export async function generatePersonalizedPlanHandler(req: Request, res: Response) {
  const plan = await svc.generatePersonalizedPlan(req.user!.userId);
  res.status(201).json(plan);
}

export async function approveHandler(req: Request, res: Response) {
  const { note } = reviewSchema.parse(req.body);
  const sub = await svc.approveSubmission(req.user!.userId, req.user!.role, req.params.id, note);
  res.json(sub);
}

export async function rejectHandler(req: Request, res: Response) {
  const { note } = reviewSchema.parse(req.body);
  if (!note) {
    res.status(400).json({ error: "Rejection reason required" });
    return;
  }
  const sub = await svc.rejectSubmission(req.user!.userId, req.user!.role, req.params.id, note);
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

export async function submitForApprovalHandler(req: Request, res: Response) {
  const plan = await svc.submitPlanForApproval(req.user!.userId, req.params.id);
  res.json(plan);
}

export async function reviewPlanHandler(req: Request, res: Response) {
  const { action, note } = z.object({
    action: z.enum(["approve", "reject"]),
    note: z.string().optional(),
  }).parse(req.body);
  const plan = await svc.reviewPlan(req.user!.userId, req.params.id, action, note);
  res.json(plan);
}

export async function getPendingPlansHandler(req: Request, res: Response) {
  const plans = await svc.getPendingPlans(req.user!.userId);
  res.json(plans);
}

export async function assignStudentHandler(req: Request, res: Response) {
  const { studentId } = z.object({ studentId: z.string() }).parse(req.body);
  await svc.assignStudentToTrainer(req.user!.userId, studentId);
  res.status(201).json({ message: "Student assigned" });
}

export async function unassignStudentHandler(req: Request, res: Response) {
  await svc.unassignStudent(req.user!.userId, req.params.id);
  res.json({ message: "Student unassigned" });
}

export async function getStudentDetailHandler(req: Request, res: Response) {
  const detail = await svc.getStudentDetail(req.user!.userId, req.params.id);
  res.json(detail);
}
