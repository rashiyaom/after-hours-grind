import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),
  REDIS_URL: z.string().optional(),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  TRUST_PROXY: z.coerce.boolean().default(false),
  AUTH_COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  AUTH_COOKIE_DOMAIN: z.string().optional(),
  API_GLOBAL_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  API_GLOBAL_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(2_000),
  API_AUTH_READ_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  API_AUTH_READ_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(600),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(30),
  AUTH_REFRESH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  AUTH_REFRESH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(60),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  ERROR_WEBHOOK_URL: z.string().url().optional(),
  MEDIA_PROVIDER: z.enum(["local", "cloudinary"]).default("local"),
  MEDIA_PUBLIC_BASE_URL: z.string().url().optional(),
  MEDIA_CLOUDINARY_FOLDER: z.string().default("after-hours-grind"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  DEFAULT_TRAINER_WHATSAPP_NUMBER: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGINS
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
