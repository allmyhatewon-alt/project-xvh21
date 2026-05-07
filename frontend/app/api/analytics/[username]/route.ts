import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const eventSchema = z.object({
  type: z.string().trim().min(2).max(40),
  target: z.string().trim().max(160).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { username: string } }) {
  const owner = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    select: { id: true },
  });
  if (!owner) return NextResponse.json({ ok: false }, { status: 404 });

  const parsed = eventSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const viewer = await getCurrentUser();
  if (viewer?.id === owner.id && parsed.data.type === "PROFILE_VIEW") {
    return NextResponse.json({ ok: true, skipped: "owner-view" });
  }

  await prisma.profileEvent.create({
    data: {
      ownerId: owner.id,
      viewerId: viewer?.id,
      type: parsed.data.type.toUpperCase(),
      target: parsed.data.target,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(_: NextRequest, { params }: { params: { username: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owner = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    select: { id: true, username: true },
  });
  if (!owner) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  if (viewer.id !== owner.id && viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const [totalViews, linkClicks, recent] = await Promise.all([
    prisma.profileEvent.count({ where: { ownerId: owner.id, type: "PROFILE_VIEW", createdAt: { gte: since } } }),
    prisma.profileEvent.groupBy({
      by: ["target"],
      where: { ownerId: owner.id, type: "LINK_CLICK", createdAt: { gte: since } },
      _count: { target: true },
      orderBy: { _count: { target: "desc" } },
      take: 6,
    }),
    prisma.profileEvent.findMany({
      where: { ownerId: owner.id, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { type: true, target: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    views30d: totalViews,
    clicks30d: linkClicks.map((item) => ({ target: item.target ?? "unknown", count: item._count.target })),
    recent: recent.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
  });
}
