import type { Request, Response } from "express";
import { z } from "zod";
import * as svc from "./chat.service.js";

const sendSchema = z.object({ text: z.string().trim().min(1).max(5000) });

export async function getThreadsHandler(req: Request, res: Response) {
  const threads = await svc.getThreads(req.user!.userId);
  res.json(threads);
}

export async function getMessagesHandler(req: Request, res: Response) {
  const messages = await svc.getMessages(req.user!.userId, req.params.id);
  res.json(messages);
}

export async function sendMessageHandler(req: Request, res: Response) {
  const { text } = sendSchema.parse(req.body);
  const msg = await svc.sendMessage(req.user!.userId, req.params.id, text);
  res.status(201).json(msg);
}
