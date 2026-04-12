import Redis from "ioredis";
import { env } from "./env.js";
import { logger } from "../lib/logger.js";

let redis: Redis | null = null;
let lastRedisErrorLogAt = 0;
let redisDisabledLogged = false;

export function getRedis(): Redis | null {
  if (redis) return redis;
  if (!env.REDIS_URL) {
    if (!redisDisabledLogged) {
      redisDisabledLogged = true;
      logger.info("redis.disabled", { reason: "REDIS_URL not set; using in-memory fallback" });
    }
    return null;
  }
  try {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    redis.on("error", (err) => {
      const now = Date.now();
      if (now - lastRedisErrorLogAt > 30000) {
        lastRedisErrorLogAt = now;
        logger.warn("redis.error", { message: err.message });
      }
    });
    return redis;
  } catch {
    logger.warn("redis.disabled", { reason: "connection failed" });
    return null;
  }
}

export async function pingRedis(): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  try {
    if (client.status === "wait") {
      await client.connect();
    }
    const response = await client.ping();
    return response === "PONG";
  } catch {
    return false;
  }
}
