import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  if (!username) return NextResponse.json({ available: false });
  if (username.length < 2 || username.length > 30 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return NextResponse.json({ available: false, reason: "Invalid format" });
  }
  const existing = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  });
  return NextResponse.json({ available: !existing });
}
