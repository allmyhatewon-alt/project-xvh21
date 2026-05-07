import { prisma } from "@/lib/prisma";

// XP required to reach `level + 1` (cumulative)
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function checkInReward(streak: number): { shards: number; multiplier: number } {
  const BASE = 10;
  let multiplier = 1.0;
  if (streak >= 3) multiplier = 1.5;
  if (streak >= 7) multiplier = 2.0;
  if (streak >= 14) multiplier = 2.5;
  if (streak >= 30) multiplier = 3.0;
  return { shards: Math.floor(BASE * multiplier), multiplier };
}

export async function awardShards(
  userId: string,
  amount: number,
  type: string,
  metadata?: Record<string, unknown>
): Promise<{ newBalance: number }> {
  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { shards: { increment: amount } },
      select: { shards: true },
    });
    await tx.transaction.create({
      data: {
        userId,
        type,
        currency: "SHARD",
        amount,
        balance: user.shards,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
    return user;
  });
  return { newBalance: updated.shards };
}

export async function spendShards(
  userId: string,
  amount: number,
  metadata?: Record<string, unknown>
): Promise<{ newBalance: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { shards: true } });
  if (!user || user.shards < amount) throw new Error("Insufficient shards");

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: userId },
      data: { shards: { decrement: amount } },
      select: { shards: true },
    });
    await tx.transaction.create({
      data: {
        userId,
        type: "SPEND_SHARD",
        currency: "SHARD",
        amount: -amount,
        balance: u.shards,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
    return u;
  });
  return { newBalance: updated.shards };
}

export async function awardXP(
  userId: string,
  amount: number
): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true },
  });
  if (!user) throw new Error("User not found");

  const newXP = user.xp + amount;
  let newLevel = user.level;
  let leveledUp = false;
  while (newXP >= xpForLevel(newLevel)) {
    newLevel++;
    leveledUp = true;
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { xp: newXP, level: newLevel },
    });
    await tx.transaction.create({
      data: {
        userId,
        type: "XP_AWARD",
        currency: "XP",
        amount,
        balance: newXP,
      },
    });
  });

  return { newXP, newLevel, leveledUp };
}
