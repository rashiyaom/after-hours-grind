import type { Request } from "express";
import { env } from "../config/env.js";
import { getRequestLogContext, logger } from "./logger.js";

type TrackErrorInput = {
  error: Error;
  request?: Request;
};

export const trackError = async ({ error, request }: TrackErrorInput): Promise<void> => {
  if (!env.ERROR_WEBHOOK_URL) return;

  const payload = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    request: request ? getRequestLogContext(request) : undefined,
  };

  try {
    await fetch(env.ERROR_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (trackingError) {
    logger.warn("error_tracking.failed", {
      message: trackingError instanceof Error ? trackingError.message : "unknown",
    });
  }
};
