import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { v2 as cloudinary } from "cloudinary";

const router = Router();

export async function checkReadiness(timeoutMs = 2000): Promise<{ ok: boolean; details?: Record<string, unknown> }> {
  // DB check
  try {
    const dbPromise = prisma.$queryRaw`SELECT 1`;
    const dbRes = await Promise.race([dbPromise, new Promise((_, r) => setTimeout(() => r(new Error("timeout")), timeoutMs))]);
    // if no exception, DB is responsive
  } catch (err) {
    return { ok: false, details: { database: String((err as any)?.message ?? err) } };
  }

  // Cloudinary (if configured)
  if (env.MEDIA_PROVIDER === "cloudinary") {
    const configured = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
    if (!configured) {
      return { ok: false, details: { media: "cloudinary_misconfigured" } };
    }
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
    try {
      // lightweight API call with timeout
      const timed = (await Promise.race([
        cloudinary.api.resources({ max_results: 1 as any }),
        new Promise((_, r) => setTimeout(() => r(new Error("timeout")), timeoutMs)),
      ])) as unknown;
      // if timed throws, it'll be caught below
      void timed;
    } catch (err) {
      return { ok: false, details: { media: String((err as any)?.message ?? err) } };
    }
  }

  return { ok: true };
}

router.get("/ready", async (_req, res) => {
  const result = await checkReadiness();
  if (result.ok) return res.status(200).json({ status: "ok" });
  return res.status(503).json({ status: "unready", details: result.details });
});

export default router;
