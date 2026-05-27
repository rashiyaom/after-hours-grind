import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { logger } from "./lib/logger.js";
import { cleanupExpiredResetTokens } from "./modules/auth/auth.service.js";
import { checkReadiness } from "./routes/readiness.js";

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

  // Wait for dependent services (DB, media) to be ready before starting HTTP server.
  const maxAttempts = 6;
  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      const ready = await checkReadiness(2000);
      if (ready.ok) break;
      logger.warn("server.deps_not_ready", { attempt, details: ready.details });
    } catch (err) {
      logger.warn("server.deps_check_error", { attempt, message: err instanceof Error ? err.message : String(err) });
    }
    const backoff = 500 * attempt; // ms
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, backoff));
  }

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
