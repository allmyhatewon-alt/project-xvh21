import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const gifts = {
  sparkle: { label: "spark burst", cost: 5 },
  crown: { label: "crown drop", cost: 25 },
  comet: { label: "comet raid", cost: 75 },
  peng: { label: "peng bless", cost: 150 },
} as const;

const schema = z.object({
  username: z.string().trim().min(1).max(32),
  gift: z.enum(["sparkle", "crown", "comet", "peng"]),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to gift." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pick a gift." }, { status: 400 });

  const gift = gifts[parsed.data.gift];
  const targetUsername = parsed.data.username.toLowerCase();
  if (targetUsername === user.username) return NextResponse.json({ error: "Gift somebody else, not yourself." }, { status: 400 });

  const result = await prisma.$transaction(async (tx) => {
    const sender = await tx.user.findUnique({ where: { id: user.id }, select: { id: true, username: true, gems: true } });
    const receiver = await tx.user.findUnique({ where: { username: targetUsername }, select: { id: true, username: true, gems: true } });
    if (!sender || !receiver) throw new Error("missing-user");
    if (sender.gems < gift.cost) throw new Error("low-gems");

    const nextSender = await tx.user.update({
      where: { id: sender.id },
      data: { gems: { decrement: gift.cost } },
      select: { gems: true, username: true },
    });
    const nextReceiver = await tx.user.update({
      where: { id: receiver.id },
      data: { gems: { increment: gift.cost } },
      select: { gems: true, username: true },
    });
    await tx.transaction.create({
      data: { userId: sender.id, type: "LIVE_GIFT_SENT", currency: "GEM", amount: -gift.cost, balance: nextSender.gems, metadata: JSON.stringify({ gift: parsed.data.gift, to: receiver.username }) },
    });
    await tx.transaction.create({
      data: { userId: receiver.id, type: "LIVE_GIFT_RECEIVED", currency: "GEM", amount: gift.cost, balance: nextReceiver.gems, metadata: JSON.stringify({ gift: parsed.data.gift, from: sender.username }) },
    });
    await tx.chatMessage.create({
      data: {
        authorId: sender.id,
        roomKey: `live:${receiver.username}`,
        body: `[gift] @${sender.username} sent ${gift.label} to @${receiver.username}`.slice(0, 160),
      },
    });
    return { sender: nextSender, receiver: nextReceiver };
  }).catch((error) => {
    if (error instanceof Error) return error.message;
    return "gift-failed";
  });

  if (result === "missing-user") return NextResponse.json({ error: "Creator not found." }, { status: 404 });
  if (result === "low-gems") return NextResponse.json({ error: "Not enough gems for that gift." }, { status: 400 });
  if (typeof result === "string") return NextResponse.json({ error: "Gift failed." }, { status: 400 });

  return NextResponse.json({
    ok: true,
    gift: { ...gift, slug: parsed.data.gift },
    gems: result.sender.gems,
  });
}
