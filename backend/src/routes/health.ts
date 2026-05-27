import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { pingRedis } from "../config/redis.js";
import { env } from "../config/env.js";
import { v2 as cloudinary } from "cloudinary";

const router = Router();

router.get("/health", async (_req, res) => {
  const [dbCheck, redisCheck] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    pingRedis(),
  ]);

  const database = dbCheck.status === "fulfilled" ? "up" : "down";
  const redisConfigured = Boolean(env.REDIS_URL);
  const redis = redisConfigured
    ? redisCheck.status === "fulfilled" && redisCheck.value
      ? "up"
      : "down"
    : "disabled";
  const redisRequired = redisConfigured;
  const status = database === "up" && (!redisRequired || redis === "up") ? "ok" : "degraded";

  // Media/storage check (Cloudinary configuration)
  const mediaProvider = env.MEDIA_PROVIDER;
  let media: { provider: string; status: string; message?: string } | null = null;
  if (mediaProvider === "cloudinary") {
    const configured = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
    media = {
      provider: "cloudinary",
      status: configured ? "configured" : "misconfigured",
      ...(configured ? {} : { message: "Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET" }),
    };

    // If configured, attempt a lightweight Cloudinary API call to verify connectivity.
    if (configured) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
      });

      const timeoutMs = 2500;
      const pingPromise = cloudinary.api
        .resources({ max_results: 1 })
        .then(() => ({ ok: true }))
        .catch((err) => ({ ok: false, error: String(err?.message ?? err) }));

      const timedRes = (await Promise.race([
        pingPromise,
        new Promise((resolve) => setTimeout(() => resolve({ ok: false, error: `timeout after ${timeoutMs}ms` }), timeoutMs)),
      ])) as { ok: boolean; error?: string };

      if (timedRes?.ok) {
        media.status = "up";
      } else {
        media.status = "down";
        media.message = timedRes?.error ?? "Cloudinary API ping failed";
      }
    }
  } else {
    media = { provider: String(mediaProvider ?? "local"), status: "disabled" };
  }

  // Treat media misconfiguration as degraded
  const effectiveStatus = status === "ok" && media.status !== "misconfigured" ? "ok" : "degraded";

  res.status(effectiveStatus === "ok" ? 200 : 503).json({
    status: effectiveStatus,
    timestamp: new Date().toISOString(),
    checks: {
      database,
      redis,
      media,
    },
  });
});

export default router;
