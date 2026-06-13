import { PrismaClient } from "@prisma/client";

/**
 * Instantiates a PrismaClient singleton.
 * Using a global variable in development prevents connection exhaustion
 * during hot-reloading by reusing the existing client instance.
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__liveCollabPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__liveCollabPrisma = prisma;
}

