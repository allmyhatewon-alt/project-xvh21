import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashVerificationToken } from "@/lib/email-verification";

function appUrl() {
  return (
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.redirect(`${appUrl()}/auth/verify-email?status=missing`);
  }

  const tokenHash = hashVerificationToken(token);
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true } } },
  });

  if (!record) {
    return NextResponse.redirect(`${appUrl()}/auth/verify-email?status=invalid`);
  }

  if (record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return NextResponse.redirect(`${appUrl()}/auth/verify-email?status=expired&email=${encodeURIComponent(record.email)}`);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { tokenHash },
      data: { usedAt: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: {
        userId: record.userId,
        tokenHash: { not: tokenHash },
      },
    }),
  ]);

  return NextResponse.redirect(`${appUrl()}/auth/signin?verified=1`);
}
