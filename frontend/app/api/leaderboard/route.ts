import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") ?? "all"; // all | week | month | streak

  const orderBy: any[] =
    period === "streak"
      ? [{ streakCount: "desc" }, { xp: "desc" }]
      : [{ xp: "desc" }, { level: "desc" }];

  // For week/month: filter users who have checked in recently so the board is "active users"
  let where: any = {};
  if (period === "week") {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    where = { lastCheckIn: { gte: since } };
  } else if (period === "month") {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    where = { lastCheckIn: { gte: since } };
  }

  const top = await prisma.user.findMany({
    where,
    orderBy,
    take: 50,
    select: {
      id: true,
      username: true,
      displayName: true,
      image: true,
      accentColor: true,
      xp: true,
      level: true,
      shards: true,
      streakCount: true,
      liveStream: { select: { isLive: true } },
    },
  });

  return NextResponse.json({ users: top.map((u) => ({ ...u, isLive: u.liveStream?.isLive ?? false, liveStream: undefined })) });
}
