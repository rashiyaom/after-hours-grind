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
