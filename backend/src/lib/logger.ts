import type { Request } from "express";

type LogLevel = "debug" | "info" | "warn" | "error";

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const resolveLevel = (raw: string | undefined): LogLevel => {
  const normalized = (raw ?? "info").toLowerCase();
  if (normalized === "debug" || normalized === "warn" || normalized === "error") {
    return normalized;
  }
  return "info";
};

const activeLevel = resolveLevel(process.env.LOG_LEVEL);

const shouldLog = (level: LogLevel): boolean => levelPriority[level] >= levelPriority[activeLevel];

type LogContext = Record<string, unknown>;

const write = (level: LogLevel, message: string, context?: LogContext): void => {
  if (!shouldLog(level)) return;

  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ? { context } : {}),
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
};

export const logger = {
  debug: (message: string, context?: LogContext) => write("debug", message, context),
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context),
};

export const getRequestLogContext = (req: Request): LogContext => ({
  requestId: req.requestId,
  method: req.method,
  path: req.originalUrl,
  ip: req.ip,
  userAgent: req.get("user-agent") ?? "unknown",
  userId: req.user?.userId,
});
