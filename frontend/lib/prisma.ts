import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to globalThis in dev to prevent
// exhausting database connections during hot-reload
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export function runtimeDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return raw;

  try {
    const url = new URL(raw);
    if (url.hostname.endsWith(".pooler.supabase.com") && url.port === "5432") {
      url.port = "6543";
      url.searchParams.set("pgbouncer", "true");
      url.searchParams.set("connection_limit", "1");
      if (!url.searchParams.has("sslmode")) {
        url.searchParams.set("sslmode", "require");
      }
      return url.toString();
    }
  } catch {
    return raw;
  }

  return raw;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: runtimeDatabaseUrl()
      ? {
          db: {
            url: runtimeDatabaseUrl(),
          },
        }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
