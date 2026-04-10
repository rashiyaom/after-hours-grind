import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { pingRedis } from "../config/redis.js";

const router = Router();

router.get("/health", async (_req, res) => {
  const [dbCheck, redisCheck] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    pingRedis(),
  ]);

  const database = dbCheck.status === "fulfilled" ? "up" : "down";
  const redis = redisCheck.status === "fulfilled" && redisCheck.value ? "up" : "down";
  const status = database === "up" ? "ok" : "degraded";

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
