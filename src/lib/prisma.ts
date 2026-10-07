import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Point it at your Postgres instance (see .env.example).",
    );
  }
  const adapter = new PrismaPg(connectionString);
  // TEMP: reveal effective connection string's host/scheme at diagnostic time.
  try {
    const u = new URL(connectionString);
    console.error(`[prisma-probe] scheme=${u.protocol} host=${u.hostname}:${u.port} db=${u.pathname.replace('/', '')} ?sslmode=${u.searchParams.get('sslmode')}`);
  } catch {
    console.error(`[prisma-probe] connection string unparsable: ${JSON.stringify(connectionString.slice(0,60))}`);
  }
  return new PrismaClient({ adapter });
}

// Reuse the client across hot reloads in dev so we don't exhaust connections.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
