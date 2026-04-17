import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaRead?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ["warn", "error"] });

const readDatasourceUrl = process.env.DATABASE_READ_URL?.trim();

export const prismaRead =
  globalForPrisma.prismaRead ??
  (readDatasourceUrl
    ? new PrismaClient({
        log: ["warn", "error"],
        datasources: {
          db: { url: readDatasourceUrl },
        },
      })
    : prisma);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaRead = prismaRead;
}
