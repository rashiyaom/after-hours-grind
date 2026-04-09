import type { ErrorRequestHandler } from "express";
import { HttpError } from "../lib/httpError.js";
import { env } from "../config/env.js";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
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

  console.error("Unhandled error:", err);
  res.status(500).json({
    error: env.NODE_ENV === "production" ? "Internal server error" : (err as Error).message,
  });
};
