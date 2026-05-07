import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** POST /api/follow  body: { username }  → follow */
export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await req.json() as { username: string };
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === me.id) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: me.id, followingId: target.id } },
    create: { followerId: me.id, followingId: target.id },
    update: {},
  });

  const counts = await prisma.follow.count({ where: { followingId: target.id } });
  return NextResponse.json({ following: true, followers: counts });
}

/** DELETE /api/follow  body: { username }  → unfollow */
export async function DELETE(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await req.json() as { username: string };
  const target = await prisma.user.findUnique({ where: { username: username?.toLowerCase() }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.follow.deleteMany({ where: { followerId: me.id, followingId: target.id } });

  const counts = await prisma.follow.count({ where: { followingId: target.id } });
  return NextResponse.json({ following: false, followers: counts });
}

/** GET /api/follow?username=x  → is the current user following x? */
export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  const username = req.nextUrl.searchParams.get("username")?.toLowerCase();
  if (!username) return NextResponse.json({ following: false, followers: 0 });

  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return NextResponse.json({ following: false, followers: 0 });

  const [followRecord, followers] = await Promise.all([
    me ? prisma.follow.findUnique({ where: { followerId_followingId: { followerId: me.id, followingId: target.id } } }) : null,
    prisma.follow.count({ where: { followingId: target.id } }),
  ]);

  return NextResponse.json({ following: !!followRecord, followers });
}
