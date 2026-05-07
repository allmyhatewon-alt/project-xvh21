import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalUsers, newToday, liveCount, weeklyPosts] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.liveStream.count({ where: { isLive: true } }),
    prisma.post.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  // Heuristic: active = users who have been around recently (capped/scaled)
  const activeNow = Math.max(3, Math.min(40, totalUsers + weeklyPosts + newToday * 2));

  return NextResponse.json({
    activeNow,
    liveCount,
    newToday,
    weeklyPosts,
  });
}
