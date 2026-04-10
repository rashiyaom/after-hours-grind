import type { ErrorRequestHandler } from "express";
import { HttpError } from "../lib/httpError.js";
import { env } from "../config/env.js";
import { ZodError } from "zod";
import { getRequestLogContext, logger } from "../lib/logger.js";
import { trackError } from "../lib/errorTracker.js";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.flatten().fieldErrors,
    });
    return;
  }

  const normalizedError = err instanceof Error ? err : new Error(String(err));
  logger.error("request.unhandled_error", {
    ...getRequestLogContext(req),
    message: normalizedError.message,
    stack: normalizedError.stack,
  });
  void trackError({ error: normalizedError, request: req });

  res.status(500).json({
    error: env.NODE_ENV === "production" ? "Internal server error" : normalizedError.message,
  });
};
