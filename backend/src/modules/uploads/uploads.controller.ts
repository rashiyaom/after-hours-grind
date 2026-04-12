import type { Request, Response } from "express";
import { HttpError } from "../../lib/httpError.js";
import { storeMediaFile } from "../../lib/mediaStorage.js";
import { env } from "../../config/env.js";

const normalizeBase = (base: string): string => base.replace(/\/$/, "");

export async function uploadMediaHandler(req: Request, res: Response) {
  const file = req.file;
  if (!file) {
    throw HttpError.badRequest("file is required");
  }

  const stored = await storeMediaFile(file);
  const localBase = env.MEDIA_PUBLIC_BASE_URL
    ? normalizeBase(env.MEDIA_PUBLIC_BASE_URL)
    : `${req.protocol}://${req.get("host") ?? "localhost:4000"}`;

  const url = stored.provider === "local" ? `${localBase}/media/${stored.storagePath}` : stored.url;

  res.status(201).json({
    url,
    provider: stored.provider,
    bytes: stored.bytes,
    contentType: stored.contentType,
  });
}
