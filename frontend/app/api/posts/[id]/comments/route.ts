import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardXP } from "@/lib/economy";
import { z } from "zod";

const schema = z.object({ body: z.string().min(1).max(2000) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { postId: params.id, authorId: user.id, body: parsed.data.body },
    include: {
      author: { select: { username: true, displayName: true, image: true, accentColor: true } },
    },
  });
  await prisma.post.update({
    where: { id: params.id },
    data: { commentCount: { increment: 1 } },
  });
  await awardXP(user.id, 2);
  return NextResponse.json({ comment });
}
