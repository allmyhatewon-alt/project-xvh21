import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 48);
  if (q.length < 2) return NextResponse.json({ users: [], boards: [], posts: [] });

  const [users, boards, posts] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { displayName: { contains: q } },
          { bio: { contains: q } },
          { status: { contains: q } },
        ],
      },
      select: {
        username: true,
        displayName: true,
        image: true,
        accentColor: true,
        status: true,
        role: true,
        _count: { select: { followers: true, posts: true } },
      },
      take: 6,
      orderBy: [{ role: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.board.findMany({
      where: {
        OR: [
          { slug: { contains: q } },
          { name: { contains: q } },
          { description: { contains: q } },
        ],
      },
      select: { slug: true, name: true, description: true, postCount: true, icon: true },
      take: 5,
      orderBy: { postCount: "desc" },
    }),
    prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { body: { contains: q } },
          { flair: { contains: q } },
        ],
      },
      select: {
        id: true,
        title: true,
        body: true,
        flair: true,
        voteScore: true,
        commentCount: true,
        createdAt: true,
        board: { select: { slug: true, name: true } },
        author: { select: { username: true, displayName: true } },
      },
      take: 7,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return NextResponse.json({
    users: users.map((user) => ({
      type: "creator",
      href: `/hub/user/${user.username}`,
      title: user.displayName,
      subtitle: `@${user.username}${user.status ? ` / ${user.status}` : ""}`,
      meta: `${user._count.followers} followers / ${user._count.posts} posts`,
      image: user.image,
      accentColor: user.accentColor,
      badge: user.role !== "USER" ? user.role : null,
    })),
    boards: boards.map((board) => ({
      type: "board",
      href: `/hub/board/${board.slug}`,
      title: board.name,
      subtitle: `b/${board.slug}`,
      meta: `${board.postCount} posts`,
      icon: board.icon ?? "#",
    })),
    posts: posts.map((post) => ({
      type: "post",
      href: `/hub/post/${post.id}`,
      title: post.title,
      subtitle: `${post.author.displayName} in b/${post.board.slug}`,
      meta: `${post.voteScore} score / ${post.commentCount} comments`,
      flair: post.flair,
      body: post.body.slice(0, 120),
    })),
  });
}
