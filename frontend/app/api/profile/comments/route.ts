import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")?.toLowerCase();
  if (!username) return NextResponse.json({ comments: [] });

  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) return NextResponse.json({ comments: [] });

  const raw = await prisma.comment.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      body: true,
      createdAt: true,
      postId: true,
      post: {
        select: {
          title: true,
          board: { select: { slug: true } },
        },
      },
    },
  });

  const comments = raw.map((c) => ({
    id: c.id,
    body: c.body,
    postId: c.postId,
    postTitle: c.post.title,
    boardSlug: c.post.board.slug,
    createdAt: c.createdAt.toISOString(),
    ago: timeAgo(c.createdAt),
  }));

  return NextResponse.json({ comments });
}
