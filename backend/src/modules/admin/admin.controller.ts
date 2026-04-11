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
