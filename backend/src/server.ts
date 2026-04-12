import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { pingRedis } from "./config/redis.js";
import { logger } from "./lib/logger.js";

const startServer = async () => {
  if (env.NODE_ENV === "production") {
    const redisHealthy = await pingRedis();
    if (!redisHealthy) {
      logger.error("server.startup_failed", {
        reason: "Redis is required in production but unavailable",
      });
      process.exit(1);
    }
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
