import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardShards, awardXP, checkInReward } from "@/lib/economy";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;
  const today = new Date().toISOString().slice(0, 10);

  const existing = await prisma.checkIn.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Already checked in today", alreadyDone: true },
      { status: 409 }
    );
  }

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakCount: true, longestStreak: true, lastCheckIn: true },
  });
  if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const lastCheckInDate = u.lastCheckIn ? u.lastCheckIn.toISOString().slice(0, 10) : null;
  const newStreak = lastCheckInDate === yesterdayStr ? u.streakCount + 1 : 1;
  const newLongest = Math.max(newStreak, u.longestStreak);
  const { shards, multiplier } = checkInReward(newStreak);

  await prisma.$transaction(async (tx) => {
    await tx.checkIn.create({
      data: { userId, date: today, streak: newStreak, multiplier, shardsEarned: shards },
    });
    await tx.user.update({
      where: { id: userId },
      data: { streakCount: newStreak, longestStreak: newLongest, lastCheckIn: new Date() },
    });
  });

  const shardsResult = await awardShards(userId, shards, "CHECK_IN_REWARD", {
    streak: newStreak,
    multiplier,
    date: today,
  });
  await awardXP(userId, Math.floor(shards / 2));

  const milestones = [3, 7, 14, 30, 60, 100];
  const hitMilestone = milestones.find((m) => m === newStreak) ?? null;
  if (hitMilestone) {
    const a = await prisma.achievement.findUnique({ where: { slug: `streak_${hitMilestone}` } });
    if (a) {
      await prisma.userAchievement.upsert({
        where: { userId_achievementId: { userId, achievementId: a.id } },
        create: { userId, achievementId: a.id },
        update: {},
      });
    }
  }

  return NextResponse.json({
    streak: newStreak,
    multiplier,
    shardsEarned: shards,
    newBalance: shardsResult.newBalance,
    longestStreak: newLongest,
    milestone: hitMilestone,
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const today = new Date().toISOString().slice(0, 10);
  const [existing, u] = await Promise.all([
    prisma.checkIn.findUnique({ where: { userId_date: { userId: user.id, date: today } } }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { streakCount: true, longestStreak: true, shards: true },
    }),
  ]);
  return NextResponse.json({
    canCheckIn: !existing,
    streak: u?.streakCount ?? 0,
    longestStreak: u?.longestStreak ?? 0,
    shards: u?.shards ?? 0,
    lastCheckIn: existing ? today : null,
  });
}
