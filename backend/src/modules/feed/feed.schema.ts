import { z } from "zod";

export const createPostSchema = z.object({
  type: z.enum(["image", "video", "reel"]).default("image"),
  mediaUrl: z.string().default(""),
  caption: z.string().max(2000).default(""),
  source: z.enum(["general", "task-proof"]).default("general"),
  location: z.string().max(200).default(""),
  steps: z.coerce.number().int().positive().optional(),
});

export const createCommentSchema = z.object({
  text: z.string().trim().min(1).max(1000),
});

export const feedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
