import "./env.js";
import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaRead?: PrismaClient };

const createClient = (opts?: { datasources?: { db?: { url?: string } } }) =>
  new PrismaClient({ log: ["warn", "error"], ...(opts ?? {}) });

export const prisma = globalForPrisma.prisma ?? createClient();

const readDatasourceUrl = process.env.DATABASE_READ_URL?.trim();

export const prismaRead =
  globalForPrisma.prismaRead ?? (readDatasourceUrl ? createClient({ datasources: { db: { url: readDatasourceUrl } } }) : prisma);

// Retry middleware for transient DB errors (e.g., admin-terminated connections)
const isTransientDbError = (err: unknown): boolean => {
  if (!err) return false;
  const anyErr = err as any;
  const msg = String(anyErr?.message ?? "").toLowerCase();
  if (msg.includes("terminating connection due to administrator command")) return true;
  if (msg.includes("terminating connection")) return true;
  if (anyErr?.code === "E57P01") return true; // raw Postgres code
  // Prisma-specific transient codes
  if (anyErr instanceof Prisma.PrismaClientKnownRequestError) {
    // request errors that might be transient
    return false;
  }
  if (anyErr?.name === "PrismaClientRustPanicError" || anyErr?.name === "PrismaClientInitializationError") return true;
  return false;
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const attachRetryMiddleware = (client: PrismaClient) => {
  client.$use(async (params, next) => {
    const maxRetries = 3;
    let attempt = 0;
    while (true) {
      try {
        return await next(params);
      } catch (err) {
        attempt += 1;
        if (attempt > maxRetries || !isTransientDbError(err)) {
          throw err;
        }
        const backoff = 100 * Math.pow(2, attempt - 1);
        // eslint-disable-next-line no-console
        console.warn(`Prisma transient DB error detected, retrying (attempt ${attempt}) after ${backoff}ms:`, String((err as any)?.message ?? err));
        await wait(backoff);
        // loop to retry
      }
    }
  });
};

attachRetryMiddleware(prisma);
if (prismaRead && prismaRead !== prisma) attachRetryMiddleware(prismaRead);

// Ensure graceful shutdown disconnects Prisma to avoid orphan connections
const handleExit = async (signal?: string) => {
  try {
    // eslint-disable-next-line no-console
    console.info(`Received ${signal ?? "exit"}, disconnecting Prisma client...`);
    await prisma.$disconnect();
    if (prismaRead && prismaRead !== prisma) await prismaRead.$disconnect();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Error disconnecting Prisma client:", e);
  } finally {
    if (signal) process.exit(0);
  }
};

process.once("SIGINT", () => void handleExit("SIGINT"));
process.once("SIGTERM", () => void handleExit("SIGTERM"));

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaRead = prismaRead;
}
