import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardXP, awardShards } from "@/lib/economy";
import { z } from "zod";

const createSchema = z.object({
  boardSlug: z.string().min(1),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  flair: z.string().max(40).optional(),
});

export async function GET(req: NextRequest) {
  const sort = req.nextUrl.searchParams.get("sort") ?? "hot"; // hot | new | rising
  const boardSlug = req.nextUrl.searchParams.get("board");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10), 50);
  const followingMode = req.nextUrl.searchParams.get("following") === "1";
  const savedMode = req.nextUrl.searchParams.get("saved") === "1";
  const forYouMode = req.nextUrl.searchParams.get("foryou") === "1";
  const idsParam = req.nextUrl.searchParams.get("ids");

  // Batch fetch by IDs (for saved posts)
  if (idsParam) {
    const ids = idsParam.split(",").filter(Boolean).slice(0, 50);
    if (ids.length === 0) return NextResponse.json({ posts: [] });
    const posts = await prisma.post.findMany({
      where: { id: { in: ids } },
      include: {
        board: { select: { slug: true, name: true } },
        author: { select: { username: true, displayName: true, image: true, accentColor: true } },
      },
    });
    // Return in same order as requested IDs
    const sorted = ids.map((id) => posts.find((p) => p.id === id)).filter(Boolean);
    return NextResponse.json({ posts: sorted });
  }

  const where: any = {};
  if (boardSlug) where.board = { slug: boardSlug };

  const me = (followingMode || savedMode || forYouMode) ? await getCurrentUser() : null;

  if (followingMode) {
    if (!me) return NextResponse.json({ posts: [] });
    const follows = await prisma.follow.findMany({
      where: { followerId: me.id },
      select: { followingId: true },
    });
    where.authorId = { in: follows.map((f) => f.followingId).concat(me.id) };
  }

  if (forYouMode && me) {
    // Personalized: blend posts from followed users (last 14 days) with top-voted recent content
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const follows = await prisma.follow.findMany({
      where: { followerId: me.id },
      select: { followingId: true },
    });
    const followedIds = follows.map((f) => f.followingId);
    if (followedIds.length > 0) {
      where.OR = [
        { authorId: { in: followedIds }, createdAt: { gte: since } },
        { voteScore: { gte: 3 }, createdAt: { gte: since } },
      ];
    } else {
      where.createdAt = { gte: since };
    }
  }

  const orderBy =
    sort === "new"
      ? { createdAt: "desc" as const }
      : sort === "rising"
      ? { createdAt: "desc" as const }
      : forYouMode
      ? { voteScore: "desc" as const }
      : { voteScore: "desc" as const };

  const posts = await prisma.post.findMany({
    where,
    orderBy: [{ isPinned: "desc" }, orderBy],
    take: limit,
    include: {
      board: { select: { slug: true, name: true } },
      author: { select: { username: true, displayName: true, image: true, accentColor: true } },
    },
  });

  // authorId is a scalar field on Post — Prisma include returns it automatically.
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const board = await prisma.board.findUnique({ where: { slug: parsed.data.boardSlug } });
  if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

  const post = await prisma.post.create({
    data: {
      boardId: board.id,
      authorId: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      flair: parsed.data.flair ?? null,
    },
    include: {
      board: { select: { slug: true, name: true } },
      author: { select: { username: true, displayName: true, image: true, accentColor: true } },
    },
  });

  await prisma.board.update({ where: { id: board.id }, data: { postCount: { increment: 1 } } });
  await awardXP(user.id, 5);
  await awardShards(user.id, 2, "POST_REWARD", { postId: post.id });

  // Award "First Post" achievement
  const first = await prisma.achievement.findUnique({ where: { slug: "first_post" } });
  if (first) {
    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId: user.id, achievementId: first.id } },
      create: { userId: user.id, achievementId: first.id },
      update: {},
    });
  }

  return NextResponse.json({ post });
}
