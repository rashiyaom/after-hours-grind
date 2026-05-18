import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

/**
 * Initialize Sentry for frontend error tracking
 * Only active in production with VITE_SENTRY_DSN env var set
 */
export function initSentryFrontend() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  
  if (!dsn || import.meta.env.MODE !== "production") {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          window.history
        ),
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

/**
 * Capture exception to Sentry
 */
export function captureError(error: unknown, context: Record<string, unknown> = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message to Sentry
 */
export function captureMessage(message: string, level: "fatal" | "error" | "warning" | "info" | "debug" = "error") {
  Sentry.captureMessage(message, level);
}
