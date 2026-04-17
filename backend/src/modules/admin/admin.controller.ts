import type { Request, Response } from "express";
import { z } from "zod";
import * as svc from "./admin.service.js";

export async function getAllUsersHandler(req: Request, res: Response) {
    const users = await svc.getAllUsersAdmin();
    res.json(users);
}

export async function toggleUserBanHandler(req: Request, res: Response) {
    const user = await svc.toggleUserBan(req.params.userId);
    res.json(user);
}

export async function changeUserRoleHandler(req: Request, res: Response) {
    const { role } = z.object({ role: z.enum(["STUDENT", "TRAINER", "ADMIN"]) }).parse(req.body);
    const user = await svc.changeUserRole(req.params.userId, role);
    res.json(user);
}

export async function verifyTrainerHandler(req: Request, res: Response) {
    const verified = await svc.verifyTrainer(req.params.userId);
    res.json(verified);
}

export async function assignStudentTrainerHandler(req: Request, res: Response) {
    const { trainerId } = z.object({ trainerId: z.string().nullable() }).parse(req.body);
    const result = await svc.assignTrainerToStudent(req.params.userId, trainerId);
    res.json(result);
}

export async function updatePostModerationHandler(req: Request, res: Response) {
    const { status } = z
      .object({ status: z.enum(["visible", "hidden", "under-review"]) })
      .parse(req.body);
    const post = await svc.updatePostModeration(req.params.postId, status);
    res.json(post);
}

export async function deletePostHandler(req: Request, res: Response) {
    await svc.deletePostAdmin(req.params.postId);
    res.json({ message: "Post deleted" });
}

export async function getFlaggedContentHandler(req: Request, res: Response) {
    const content = await svc.getFlaggedContent();
    res.json(content);
}

export async function getActivityLogsHandler(req: Request, res: Response) {
    const logs = await svc.getActivityLogs();
    res.json(logs);
}

export async function getAdminStatsHandler(req: Request, res: Response) {
    const stats = await svc.getAdminStats();
    res.json(stats);
}

export async function getPermissionsHandler(_req: Request, res: Response) {
    const matrix = await svc.getPermissionMatrix();
    res.json(matrix);
}

export async function setPermissionHandler(req: Request, res: Response) {
    const payload = z.object({
        role: z.enum(["STUDENT", "TRAINER", "ADMIN"]),
        permission: z.enum([
            "view_dashboard",
            "manage_users",
            "moderate_content",
            "build_plans",
            "post_feed",
            "view_analytics",
        ]),
        allowed: z.boolean(),
    }).parse(req.body);

    const matrix = await svc.setRolePermission(payload.role, payload.permission, payload.allowed);
    res.json(matrix);
}

export async function resetPermissionsHandler(_req: Request, res: Response) {
    const matrix = await svc.resetRolePermissions();
    res.json(matrix);
}

export async function getExerciseTemplatesHandler(req: Request, res: Response) {
    const query = z.object({
        q: z.string().trim().min(1).optional(),
        category: z.string().trim().min(1).optional(),
        activeOnly: z.coerce.boolean().optional(),
    }).parse(req.query);

    const templates = await svc.getExerciseTemplates(query);
    res.json(templates);
}

export async function createExerciseTemplateHandler(req: Request, res: Response) {
    const payload = z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        category: z.string().optional(),
        sets: z.coerce.number().int().min(1).max(20).nullable().optional(),
        reps: z.coerce.number().int().min(1).max(200).nullable().optional(),
        restSeconds: z.coerce.number().int().min(0).max(1200).nullable().optional(),
        durationMinutes: z.coerce.number().int().min(1).max(240).nullable().optional(),
        difficulty: z.string().optional(),
        equipment: z.string().optional(),
        youtubeUrl: z.string().url().nullable().optional(),
        proteinGrams: z.coerce.number().int().min(0).max(400).nullable().optional(),
        calories: z.coerce.number().int().min(0).max(5000).nullable().optional(),
        mealTiming: z.string().max(80).nullable().optional(),
        isActive: z.boolean().optional(),
    }).parse(req.body);

    const created = await svc.createExerciseTemplate(payload);
    res.status(201).json(created);
}

export async function updateExerciseTemplateHandler(req: Request, res: Response) {
    const payload = z.object({
        name: z.string().min(2).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        sets: z.coerce.number().int().min(1).max(20).nullable().optional(),
        reps: z.coerce.number().int().min(1).max(200).nullable().optional(),
        restSeconds: z.coerce.number().int().min(0).max(1200).nullable().optional(),
        durationMinutes: z.coerce.number().int().min(1).max(240).nullable().optional(),
        difficulty: z.string().optional(),
        equipment: z.string().optional(),
        youtubeUrl: z.string().url().nullable().optional(),
        proteinGrams: z.coerce.number().int().min(0).max(400).nullable().optional(),
        calories: z.coerce.number().int().min(0).max(5000).nullable().optional(),
        mealTiming: z.string().max(80).nullable().optional(),
        isActive: z.boolean().optional(),
    }).parse(req.body);

    const updated = await svc.updateExerciseTemplate(req.params.templateId, payload);
    res.json(updated);
}

export async function deleteExerciseTemplateHandler(req: Request, res: Response) {
    const result = await svc.deleteExerciseTemplate(req.params.templateId);
    res.json(result);
}

export async function getExerciseTemplateAssignmentsHandler(_req: Request, res: Response) {
    const assignments = await svc.getExerciseTemplateAssignments();
    res.json(assignments);
}

export async function assignExerciseTemplateHandler(req: Request, res: Response) {
    const payload = z.object({
        templateId: z.string().min(1),
        studentIds: z.array(z.string().min(1)).min(1),
        dayNumber: z.coerce.number().int().min(1).max(60),
        sortOrder: z.coerce.number().int().min(1).max(100).optional(),
    }).parse(req.body);

    const result = await svc.assignExerciseTemplate(payload);
    res.json(result);
}

export async function assignExerciseTemplateBulkHandler(req: Request, res: Response) {
    const payload = z.object({
        studentIds: z.array(z.string().min(1)).min(1),
        dayPlans: z.array(
            z.object({
                dayNumber: z.coerce.number().int().min(1).max(60),
                templateIds: z.array(z.string().min(1)),
            })
        ).min(1),
    }).parse(req.body);

    const result = await svc.assignExerciseTemplateBulk(payload);
    res.json(result);
}

export async function bulkDeleteUsersHandler(req: Request, res: Response) {
    const { userIds } = z.object({ userIds: z.array(z.string().min(1)).min(1) }).parse(req.body);
    const result = await svc.bulkDeleteUsersAdmin(userIds);
    res.json(result);
}

