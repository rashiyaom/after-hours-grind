import type { Request, Response, NextFunction } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const now = (): number => Date.now();

const getClientIp = (req: Request): string =>
  (req.ip || req.headers["x-forwarded-for"] || "unknown").toString();

export const createRateLimit = ({
  key,
  windowMs,
  maxRequests,
}: {
  key: string;
  windowMs: number;
  maxRequests: number;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const bucketKey = `${key}:${getClientIp(req)}`;
    const currentTime = now();

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
