import { NextResponse } from "next/server";
import { prisma, runtimeDatabaseUrl } from "@/lib/prisma";
import { getR2Endpoint, isR2Configured, listR2Objects } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function present(name: string) {
  return Boolean(process.env[name]?.trim());
}

function errorShape(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message.replace(/postgresql:\/\/[^@\s]+@/g, "postgresql://***@").slice(0, 240),
    };
  }
  return { name: "UnknownError", message: "Unknown error" };
}

function hostFromUrl(value: string | undefined) {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return "invalid-url";
  }
}

export async function GET() {
  const db = {
    envPresent: present("DATABASE_URL"),
    host: hostFromUrl(process.env.DATABASE_URL),
    runtimeHost: hostFromUrl(runtimeDatabaseUrl()),
    ok: false,
    error: null as ReturnType<typeof errorShape> | null,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    db.ok = true;
  } catch (error) {
    db.error = errorShape(error);
  }

  const r2 = {
    configured: isR2Configured(),
    envPresent: {
      accountId: present("R2_ACCOUNT_ID"),
      accessKeyId: present("R2_ACCESS_KEY_ID"),
      secretAccessKey: present("R2_SECRET_ACCESS_KEY"),
      bucketName: present("R2_BUCKET_NAME"),
      publicUrl: present("R2_PUBLIC_URL") || present("NEXT_PUBLIC_R2_PUBLIC_URL"),
    },
    endpointHost: hostFromUrl(getR2Endpoint()),
    ok: false,
    count: 0,
    error: null as ReturnType<typeof errorShape> | null,
  };

  try {
    const objects = await listR2Objects("bg/");
    r2.ok = true;
    r2.count = objects.length;
  } catch (error) {
    r2.error = errorShape(error);
  }

  return NextResponse.json({
    ok: db.ok && r2.ok,
    db,
    r2,
    auth: {
      jwtSecretPresent: present("JWT_SECRET"),
      nextAuthSecretPresent: present("NEXTAUTH_SECRET"),
    },
    site: {
      siteUrl: process.env.SITE_URL ?? null,
      nextAuthUrl: process.env.NEXTAUTH_URL ?? null,
      vercelUrl: process.env.VERCEL_URL ?? null,
    },
  });
}
