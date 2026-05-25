import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { logger } from "./lib/logger.js";
import { cleanupExpiredResetTokens } from "./modules/auth/auth.service.js";

const startServer = async () => {
  const cleanupInterval = setInterval(() => {
    void cleanupExpiredResetTokens().catch((error) => {
      logger.warn("auth.reset_token_cleanup_failed", {
        message: error instanceof Error ? error.message : "unknown",
      });
    });
  }, 30 * 60 * 1000);

  void cleanupExpiredResetTokens().catch((error) => {
    logger.warn("auth.reset_token_cleanup_startup_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
  });

  const server = app.listen(env.PORT, () => {
    logger.info("server.started", {
      url: `http://localhost:${env.PORT}`,
      environment: env.NODE_ENV,
    });
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info("server.shutdown_requested", { signal });
    clearInterval(cleanupInterval);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info("server.stopped");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

void startServer();
