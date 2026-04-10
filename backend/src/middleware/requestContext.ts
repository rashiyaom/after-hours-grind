import type { RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { getRequestLogContext, logger } from "../lib/logger.js";

const now = (): bigint => process.hrtime.bigint();
const msFrom = (start: bigint): number => Number(process.hrtime.bigint() - start) / 1_000_000;

export const requestContext: RequestHandler = (req, res, next) => {
  const requestId = req.get("x-request-id") || randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  const start = now();
  res.on("finish", () => {
    logger.info("request.completed", {
      ...getRequestLogContext(req),
      statusCode: res.statusCode,
      durationMs: Number(msFrom(start).toFixed(2)),
    });
  });

  next();
};
