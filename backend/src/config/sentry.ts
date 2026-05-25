import * as Sentry from "@sentry/node";
import { env } from "./env.js";

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Only active in production with SENTRY_DSN env var set
 */
export function initSentry() {
  if (env.NODE_ENV !== "production" || !process.env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

/**
 * Setup Sentry request/error handlers in Express
 */
export function setupSentryHandlers() {
}

/**
 * Capture exception to Sentry with context
 */
export function captureError(error: unknown, context: Record<string, unknown> = {}) {
  if (env.NODE_ENV === "production") {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

/**
 * Capture message to Sentry
 */
export function captureMessage(message: string, level: "fatal" | "error" | "warning" | "info" | "debug" = "error") {
  if (env.NODE_ENV === "production") {
    Sentry.captureMessage(message, level);
  }
}
