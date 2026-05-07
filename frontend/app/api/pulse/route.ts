import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);

  const [recentPosts, creators, boards, totalPosts, totalUsers] = await Promise.all([
    prisma.post.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        flair: true,
        voteScore: true,
        commentCount: true,
        createdAt: true,
        board: { select: { slug: true, name: true } },
        author: { select: { username: true, displayName: true, image: true, accentColor: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: [{ xp: "desc" }, { streakCount: "desc" }],
      take: 5,
      select: {
        username: true,
        displayName: true,
        image: true,
        accentColor: true,
        status: true,
        level: true,
        xp: true,
        streakCount: true,
        _count: { select: { followers: true, posts: true } },
        liveStream: { select: { isLive: true } },
      },
    }),
    prisma.board.findMany({
      orderBy: { postCount: "desc" },
      take: 4,
      select: { slug: true, name: true, description: true, postCount: true, icon: true },
    }),
    prisma.post.count({ where: { createdAt: { gte: since } } }),
    prisma.user.count(),
  ]);

  const activeNow = Math.max(7, Math.min(24, totalUsers + recentPosts.length + Math.floor(totalPosts / 2)));

  return NextResponse.json({
    activeNow,
    weeklyPosts: totalPosts,
    signal: signalLine(totalPosts, activeNow),
    recentPosts: recentPosts.map((post) => ({
      id: post.id,
      title: post.title,
      flair: post.flair,
      href: `/hub/post/${post.id}`,
      board: post.board,
      author: post.author,
      score: post.voteScore,
      comments: post.commentCount,
      createdAt: post.createdAt.toISOString(),
    })),
    creators: creators.map((creator) => ({
      username: creator.username,
      displayName: creator.displayName,
      image: creator.image,
      accentColor: creator.accentColor,
      status: creator.status,
      level: creator.level,
      xp: creator.xp,
      levelTitle: creatorLevelTitle(creator.level),
      levelProgress: creatorLevelProgress(creator.level, creator.xp),
      nextLevelXp: Math.max(100, creator.level * 100),
      streakCount: creator.streakCount,
      followers: creator._count.followers,
      posts: creator._count.posts,
      isLive: creator.liveStream?.isLive ?? false,
      href: `/hub/user/${creator.username}`,
    })),
    boards: boards.map((board) => ({
      ...board,
      href: `/hub/board/${board.slug}`,
    })),
  });
}

function signalLine(weeklyPosts: number, activeNow: number) {
  if (weeklyPosts <= 0) return "quiet room. perfect time to be first.";
  if (activeNow >= 18) return "room is warm. clips and replies are moving.";
  if (weeklyPosts >= 8) return "feed has motion. keep feeding the signal.";
  return "small room energy. every post actually matters.";
}

function creatorLevelTitle(level: number) {
  if (level >= 25) return "site legend";
  if (level >= 18) return "headliner";
  if (level >= 12) return "signal pro";
  if (level >= 6) return "rising creator";
  return "new signal";
}

function creatorLevelProgress(level: number, xp: number) {
  const needed = Math.max(100, level * 100);
  return Math.min(99, Math.round(((xp % needed) / needed) * 100));
}
