import Redis from "ioredis";
import { env } from "./env.js";

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;
  if (!env.REDIS_URL) {
    console.warn("⚠ REDIS_URL not set — Redis features disabled");
    return null;
  }
  try {
    redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3, lazyConnect: true });
    redis.on("error", (err) => console.error("Redis error:", err.message));
    return redis;
  } catch {
    console.warn("⚠ Redis connection failed — running without cache");
    return null;
  }
}
