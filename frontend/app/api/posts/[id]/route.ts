import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      board: { select: { slug: true, name: true } },
      author: {
        select: { username: true, displayName: true, image: true, accentColor: true, level: true },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { username: true, displayName: true, image: true, accentColor: true } },
        },
      },
    },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { authorId: true, boardId: true },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (post.authorId !== user.id && user.role !== "ADMIN" && user.role !== "MOD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.post.delete({ where: { id: params.id } });
  await prisma.board.update({
    where: { id: post.boardId },
    data: { postCount: { decrement: 1 } },
  });
  return NextResponse.json({ ok: true });
}
