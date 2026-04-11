import type { Request, Response } from "express";
import { z } from "zod";
import * as svc from "./chat.service.js";

const createThreadSchema = z.object({ participantId: z.string().min(1) });

const sendSchema = z
  .object({
    text: z.string().trim().max(5000).optional().default(""),
    type: z.enum(["text", "reel-share", "voice-note"]).default("text"),
    voiceSeconds: z.coerce.number().int().positive().max(180).optional(),
    voiceAudioUrl: z.string().max(1_200_000).optional(),
    reelPostId: z.string().optional(),
    reelPreviewUrl: z.string().max(1_200_000).optional(),
    reelCaption: z.string().max(2000).optional(),
  })
  .refine((value) => value.type !== "text" || value.text.trim().length > 0, {
    message: "Text message cannot be empty",
    path: ["text"],
  });

export async function getThreadsHandler(req: Request, res: Response) {
  const threads = await svc.getThreads(req.user!.userId);
  res.json(threads);
}

export async function createThreadHandler(req: Request, res: Response) {
  const { participantId } = createThreadSchema.parse(req.body);
  const thread = await svc.createDirectThread(req.user!.userId, participantId);
  res.status(201).json(thread);
}

export async function getMessagesHandler(req: Request, res: Response) {
  const messages = await svc.getMessages(req.user!.userId, req.params.id);
  res.json(messages);
}

export async function sendMessageHandler(req: Request, res: Response) {
  const payload = sendSchema.parse(req.body);
  const msg = await svc.sendMessage(req.user!.userId, req.params.id, payload);
  res.status(201).json(msg);
}
