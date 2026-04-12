import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { pingRedis } from "../config/redis.js";
import { env } from "../config/env.js";

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

  res.status(status === "ok" ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    checks: {
      database,
      redis,
    },
  });
});

export default router;
