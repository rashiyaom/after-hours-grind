import type { Request, Response } from "express";
import * as svc from "./feed.service.js";
import { createPostSchema, createCommentSchema, feedQuerySchema } from "./feed.schema.js";

export async function getFeedHandler(req: Request, res: Response) {
  const { cursor, limit } = feedQuerySchema.parse(req.query);
  const result = await svc.getFeed(req.user?.userId, cursor, limit);
  res.json(result);
}

export async function createPostHandler(req: Request, res: Response) {
  const data = createPostSchema.parse(req.body);
  const post = await svc.createPost(req.user!.userId, data);
  res.status(201).json(post);
}

export async function addCommentHandler(req: Request, res: Response) {
  const { text } = createCommentSchema.parse(req.body);
  const comment = await svc.addComment(req.user!.userId, req.params.id, text);
  res.status(201).json(comment);
}

export async function likeHandler(req: Request, res: Response) {
  await svc.likePost(req.user!.userId, req.params.id);
  res.status(201).json({ message: "Liked" });
}

export async function unlikeHandler(req: Request, res: Response) {
  await svc.unlikePost(req.user!.userId, req.params.id);
  res.json({ message: "Unliked" });
}

export async function getCommentsHandler(req: Request, res: Response) {
  const comments = await svc.getComments(req.params.id);
  res.json(comments);
}
