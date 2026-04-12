import type { Request, Response, NextFunction } from "express";
import { getRedis } from "../config/redis.js";
import { logger } from "../lib/logger.js";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastRedisWarningAt = 0;

const now = (): number => Date.now();

const getClientIp = (req: Request): string =>
  (req.ip || (Array.isArray(req.headers["x-forwarded-for"]) ? req.headers["x-forwarded-for"][0] : req.headers["x-forwarded-for"]) || "unknown").toString();

const hitRedisBucket = async (
  bucketKey: string,
  windowMs: number
): Promise<{ count: number; resetAt: number } | null> => {
  const redis = getRedis();
  if (!redis) return null;

  try {
    if (redis.status === "wait") {
      await redis.connect();
    }

    if (redis.status !== "ready") {
      return null;
    }

    const count = await redis.incr(bucketKey);
    if (count === 1) {
      await redis.pexpire(bucketKey, windowMs);
    }
    const ttlMs = await redis.pttl(bucketKey);
    const effectiveTtlMs = ttlMs > 0 ? ttlMs : windowMs;
    return { count, resetAt: now() + effectiveTtlMs };
  } catch (error) {
    const nowTs = now();
    if (nowTs - lastRedisWarningAt > 30000) {
      lastRedisWarningAt = nowTs;
      logger.warn("rate_limit.redis_unavailable", {
        message: error instanceof Error ? error.message : "unknown",
      });
    }
    return null;
  }
};

export const createRateLimit = ({
  key,
  windowMs,
  maxRequests,
}: {
  key: string;
  windowMs: number;
  maxRequests: number;
}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const bucketKey = `${key}:${getClientIp(req)}`;
    const currentTime = now();

    const redisBucket = await hitRedisBucket(bucketKey, windowMs);
    if (redisBucket) {
      if (redisBucket.count > maxRequests) {
        const retryAfterSeconds = Math.max(1, Math.ceil((redisBucket.resetAt - currentTime) / 1000));
        res.setHeader("Retry-After", retryAfterSeconds.toString());
        res.status(429).json({ error: "Too many requests. Please try again later." });
        return;
      }

      next();
      return;
    }

    const bucket = buckets.get(bucketKey);
    if (!bucket || currentTime >= bucket.resetAt) {
      buckets.set(bucketKey, { count: 1, resetAt: currentTime + windowMs });
      next();
      return;
    }

    if (bucket.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - currentTime) / 1000));
      res.setHeader("Retry-After", retryAfterSeconds.toString());
      res.status(429).json({ error: "Too many requests. Please try again later." });
      return;
    }

    bucket.count += 1;
    next();
  };
};
