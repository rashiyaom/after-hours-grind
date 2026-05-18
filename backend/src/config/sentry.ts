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
    // Some Sentry integration types may live in separate packages depending on version.
    // Use `any` to avoid type issues across versions while still attempting to use integrations when available.
    integrations: [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...( ((Sentry as any).Integrations && [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new (Sentry as any).Integrations.Http({ tracing: true }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new (Sentry as any).Integrations.OnUncaughtException(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new (Sentry as any).Integrations.OnUnhandledRejection(),
      ]) || [] ),
    ],
  });
}

/**
 * Setup Sentry request/error handlers in Express
 */
export function setupSentryHandlers(app: any) {
  if (env.NODE_ENV !== "production") {
    return;
  }

  // Attach handlers if available on this Sentry build
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Handlers: any = (Sentry as any).Handlers;
  if (Handlers && Handlers.requestHandler && Handlers.errorHandler) {
    app.use(Handlers.requestHandler());
    app.use(Handlers.errorHandler());
  }
}

/**
 * Capture exception to Sentry with context
 */
export function captureError(error: any, context: Record<string, any> = {}) {
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
