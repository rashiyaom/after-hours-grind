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

export async function updatePostModerationHandler(req: Request, res: Response) {
    const { status } = z
      .object({ status: z.enum(["visible", "hidden", "under-review"]) })
      .parse(req.body);
    const post = await svc.updatePostModeration(req.params.postId, status);
    res.json(post);
}

export async function getActivityLogsHandler(req: Request, res: Response) {
    const logs = await svc.getActivityLogs();
    res.json(logs);
}
