import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ value: z.union([z.literal(1), z.literal(-1), z.literal(0)]) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid value" }, { status: 400 });

  const value = parsed.data.value;

  const post = await prisma.post.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.postVote.findUnique({
    where: { postId_userId: { postId: params.id, userId: user.id } },
  });

  let delta = 0;
  if (existing) {
    delta = value - existing.value;
    if (value === 0) {
      await prisma.postVote.delete({ where: { id: existing.id } });
    } else {
      await prisma.postVote.update({ where: { id: existing.id }, data: { value } });
    }
  } else if (value !== 0) {
    delta = value;
    await prisma.postVote.create({
      data: { postId: params.id, userId: user.id, value },
    });
  }

  if (delta !== 0) {
    await prisma.post.update({
      where: { id: params.id },
      data: { voteScore: { increment: delta } },
    });
  }

  const updated = await prisma.post.findUnique({
    where: { id: params.id },
    select: { voteScore: true },
  });
  return NextResponse.json({ voteScore: updated?.voteScore ?? 0, value });
}
