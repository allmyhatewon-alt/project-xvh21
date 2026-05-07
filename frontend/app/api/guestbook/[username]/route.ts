import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const entrySchema = z.object({
  body: z.string().trim().min(2).max(220),
  name: z.string().trim().min(1).max(32).optional(),
});

export async function GET(_: NextRequest, { params }: { params: { username: string } }) {
  const owner = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    select: { id: true },
  });
  if (!owner) return NextResponse.json({ entries: [] });

  const entries = await prisma.guestbookEntry.findMany({
    where: { ownerId: owner.id, hidden: false },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: { signer: { select: { username: true, displayName: true, image: true, accentColor: true } } },
  });

  return NextResponse.json({
    entries: entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      body: entry.body,
      createdAt: entry.createdAt.toISOString(),
      signer: entry.signer,
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: { username: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Sign in to write in the guestbook." }, { status: 401 });

  const parsed = entrySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Keep it short and readable." }, { status: 400 });
  }

  const owner = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    select: { id: true },
  });
  if (!owner) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const entry = await prisma.guestbookEntry.create({
    data: {
      ownerId: owner.id,
      signerId: viewer.id,
      name: parsed.data.name || viewer.displayName || viewer.username,
      body: parsed.data.body,
    },
    include: { signer: { select: { username: true, displayName: true, image: true, accentColor: true } } },
  });

  return NextResponse.json({
    entry: {
      id: entry.id,
      name: entry.name,
      body: entry.body,
      createdAt: entry.createdAt.toISOString(),
      signer: entry.signer,
    },
  }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: { username: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json().catch(() => ({ id: "" }));
  if (!id) return NextResponse.json({ error: "Missing entry." }, { status: 400 });

  const owner = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    select: { id: true },
  });
  if (!owner) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  if (viewer.id !== owner.id && viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the profile owner can hide this." }, { status: 403 });
  }

  await prisma.guestbookEntry.updateMany({
    where: { id, ownerId: owner.id },
    data: { hidden: true },
  });

  return NextResponse.json({ ok: true });
}
