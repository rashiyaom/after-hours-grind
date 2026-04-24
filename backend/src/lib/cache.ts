import { getRedis } from "../config/redis.js";
import { logger } from "./logger.js";

const CACHE_PREFIX = "ahg:cache";
let lastCacheWarningAt = 0;

const now = () => Date.now();

const toRedisKey = (key: string) => `${CACHE_PREFIX}:${key}`;

const shouldLogWarning = () => {
  const current = now();
  if (current - lastCacheWarningAt > 30_000) {
    lastCacheWarningAt = current;
    return true;
  }
  return false;
};

type CacheMetricContext = {
  endpoint: string;
  key: string;
  source?: string;
};

const logCacheMetric = (hit: boolean, context: CacheMetricContext): void => {
  logger.info(hit ? "cache.hit" : "cache.miss", {
    endpoint: context.endpoint,
    cacheKey: context.key,
    source: context.source ?? "redis",
  });
};

const getReadyRedis = async () => {
  const redis = getRedis();
  if (!redis) return null;

  try {
    if (redis.status === "wait") {
      await redis.connect();
    }
    if (redis.status !== "ready") {
      return null;
    }
    return redis;
  } catch (error) {
    if (shouldLogWarning()) {
      logger.warn("cache.redis_unavailable", {
        message: error instanceof Error ? error.message : "unknown",
      });
    }
    return null;
  }
};

export async function getJsonCache<T>(key: string, context?: Pick<CacheMetricContext, "endpoint">): Promise<T | null> {
  const redis = await getReadyRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get(toRedisKey(key));
    if (!raw) {
      if (context) {
        logCacheMetric(false, { endpoint: context.endpoint, key });
      }
      return null;
    }

    if (context) {
      logCacheMetric(true, { endpoint: context.endpoint, key });
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    if (shouldLogWarning()) {
      logger.warn("cache.read_failed", {
        key,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
    return null;
  }
}

export async function setJsonCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (ttlSeconds <= 0) return;

  const redis = await getReadyRedis();
  if (!redis) return;

  try {
    await redis.set(toRedisKey(key), JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    if (shouldLogWarning()) {
      logger.warn("cache.write_failed", {
        key,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}

export async function deleteCacheKey(key: string): Promise<void> {
  const redis = await getReadyRedis();
  if (!redis) return;

  try {
    await redis.del(toRedisKey(key));
  } catch (error) {
    if (shouldLogWarning()) {
      logger.warn("cache.delete_failed", {
        key,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}

export async function deleteCacheByPattern(pattern: string): Promise<void> {
  const redis = await getReadyRedis();
  if (!redis) return;

  const redisPattern = toRedisKey(pattern);
  let cursor = "0";

  try {
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", redisPattern, "COUNT", 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch (error) {
    if (shouldLogWarning()) {
      logger.warn("cache.delete_pattern_failed", {
        pattern,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}
