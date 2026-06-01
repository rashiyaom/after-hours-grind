import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "node:path";
import { corsOrigins, env } from "./config/env.js";
import { initSentry, setupSentryHandlers } from "./config/sentry.js";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { requestContext } from "./middleware/requestContext.js";
import { createRateLimit } from "./middleware/rateLimit.js";
import { csrfProtection } from "./middleware/csrfProtection.js";

// Initialize Sentry for production error tracking
initSentry();

const apiGlobalLimiter = createRateLimit({
  key: "api-global",
  windowMs: env.API_GLOBAL_RATE_LIMIT_WINDOW_MS,
  maxRequests: env.API_GLOBAL_RATE_LIMIT_MAX_REQUESTS,
});

// Tighter limit for authenticated read traffic to protect DB pool from bursts.
const apiAuthReadLimiter = createRateLimit({
  key: "api-auth-read",
  windowMs: env.API_AUTH_READ_RATE_LIMIT_WINDOW_MS,
  maxRequests: env.API_AUTH_READ_RATE_LIMIT_MAX_REQUESTS,
});

const conditionalAuthReadLimiter: express.RequestHandler = (req, res, next) => {
  // Only throttle read-heavy non-auth API traffic.
  // Auth routes already have their own dedicated limiter.
  if (req.method !== "GET" || req.path.startsWith("/auth")) {
    next();
    return;
  }

  void apiAuthReadLimiter(req, res, next);
};

const app = express();
if (env.TRUST_PROXY) {
  app.set("trust proxy", 1);
}

// Security
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use("/media", express.static(path.resolve(process.cwd(), "uploads")));
app.use(requestContext);
app.use(csrfProtection);

// Base Route Check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to THE afterhour socials API",
    version: "1.0.0"
  });
});

// Routes — global limiter always applies; auth-read limiter only applies to
// non-auth GET routes so login/signup aren't blocked by read traffic bursts.
app.use("/api", apiGlobalLimiter, conditionalAuthReadLimiter, apiRouter);

// Setup Sentry error handlers (must be after routes, before other error handlers)
setupSentryHandlers();

// 404 + error
app.use(notFound);
app.use(errorHandler);

export default app;
