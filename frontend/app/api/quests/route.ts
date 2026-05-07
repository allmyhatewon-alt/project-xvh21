import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardXP, awardShards } from "@/lib/economy";

export const dynamic = "force-dynamic";

const QUESTS = [
  { id: "checkin",   label: "Daily check-in",       xp: 10, shards: 10, icon: "◎" },
  { id: "post",      label: "Make a post",           xp: 5,  shards: 2,  icon: "✦" },
  { id: "comment",   label: "Comment 3 times",       xp: 10, shards: 0,  icon: "◉" },
  { id: "vote",      label: "Vote on 5 posts",       xp: 5,  shards: 0,  icon: "⬥" },
  { id: "showcase",  label: "Polish your profile",   xp: 25, shards: 0,  icon: "▣" },
  { id: "space",     label: "Build your spotlight",  xp: 50, shards: 0,  icon: "⬡" },
] as const;

type QuestId = typeof QUESTS[number]["id"];

/** GET — returns each quest with { done, claimed } for today */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ quests: QUESTS.map((q) => ({ ...q, done: false, claimed: false })) });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = new Date().toISOString().slice(0, 10);

  const [checkedIn, postToday, commentsToday, votesToday, hubProfile, space, claimedToday] = await Promise.all([
    prisma.checkIn.findUnique({ where: { userId_date: { userId: user.id, date: todayStr } } }),
    prisma.post.count({ where: { authorId: user.id, createdAt: { gte: today } } }),
    prisma.comment.count({ where: { authorId: user.id, createdAt: { gte: today } } }),
    prisma.postVote.count({ where: { userId: user.id } }),
    prisma.hubProfile.findUnique({ where: { userId: user.id }, select: { showcase: true } }),
    prisma.space.findUnique({ where: { userId: user.id }, select: { published: true, blocks: true } }),
    // Check which quests were claimed today via Transaction records
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: { startsWith: "QUEST_" },
        createdAt: { gte: today },
      },
      select: { type: true },
    }),
  ]);

  const claimedIds = new Set(claimedToday.map((t) => t.type.replace("QUEST_", "").toLowerCase()));

  let showcaseBlocks = 0;
  try { showcaseBlocks = JSON.parse(hubProfile?.showcase ?? "[]").length; } catch {}
  let spaceBlocks = 0;
  try { spaceBlocks = JSON.parse(space?.blocks ?? "[]").length; } catch {}

  const doneMap: Record<QuestId, boolean> = {
    checkin:  !!checkedIn,
    post:     postToday > 0,
    comment:  commentsToday >= 3,
    vote:     votesToday >= 5,
    showcase: showcaseBlocks > 0,
    space:    !!(space?.published && spaceBlocks > 0),
  };

  const quests = QUESTS.map((q) => ({
    ...q,
    done: doneMap[q.id],
    claimed: claimedIds.has(q.id),
  }));

  return NextResponse.json({ quests });
}

/** POST — claim a completed quest reward */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { questId } = await req.json() as { questId: string };
  const quest = QUESTS.find((q) => q.id === questId);
  if (!quest) return NextResponse.json({ error: "Unknown quest" }, { status: 400 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const claimType = `QUEST_${questId.toUpperCase()}`;

  // Idempotency — already claimed today?
  const existing = await prisma.transaction.findFirst({
    where: { userId: user.id, type: claimType, createdAt: { gte: today } },
  });
  if (existing) return NextResponse.json({ error: "Already claimed today", alreadyClaimed: true }, { status: 409 });

  if (quest.xp > 0) await awardXP(user.id, quest.xp);
  if (quest.shards > 0) await awardShards(user.id, quest.shards, claimType, { questId });

  // If no shards awarded, still create a transaction so we know it was claimed
  if (quest.shards === 0) {
    const u = await prisma.user.findUnique({ where: { id: user.id }, select: { shards: true } });
    await prisma.transaction.create({
      data: { userId: user.id, type: claimType, currency: "XP", amount: quest.xp, balance: u?.shards ?? 0 },
    });
  }

  return NextResponse.json({ ok: true, xp: quest.xp, shards: quest.shards });
}
