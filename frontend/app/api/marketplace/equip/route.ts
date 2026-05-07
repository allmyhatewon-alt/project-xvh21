import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  inventoryId: z.string().optional(),
  slug: z.string().optional(),
}).refine((data) => data.inventoryId || data.slug, { message: "Missing item." });

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Missing item." }, { status: 400 });

  const inventory = await prisma.inventoryItem.findFirst({
    where: {
      userId: user.id,
      ...(parsed.data.inventoryId ? { id: parsed.data.inventoryId } : { item: { slug: parsed.data.slug } }),
    },
    include: { item: true },
  });

  if (!inventory) return NextResponse.json({ error: "You do not own this yet." }, { status: 404 });

  const itemType = inventory.item.type;
  const willUnequip = !!inventory.equippedAt;
  const nextEquippedAt = willUnequip ? null : new Date();

  await prisma.$transaction(async (tx) => {
    if (!willUnequip && (itemType === "SKIN" || itemType === "AURA")) {
      const sameType = await tx.inventoryItem.findMany({
        where: { userId: user.id, item: { type: itemType } },
        select: { id: true },
      });

      await tx.inventoryItem.updateMany({
        where: { id: { in: sameType.map((item) => item.id) } },
        data: { equippedAt: null },
      });
    }

    await tx.inventoryItem.update({
      where: { id: inventory.id },
      data: { equippedAt: nextEquippedAt },
    });

    if (itemType === "SKIN" || itemType === "AURA") {
      await tx.hubProfile.upsert({
        where: { userId: user.id },
        update: itemType === "SKIN" ? { activeSkinId: willUnequip ? null : inventory.item.slug } : { activeAuraId: willUnequip ? null : inventory.item.slug },
        create: {
          userId: user.id,
          activeSkinId: itemType === "SKIN" && !willUnequip ? inventory.item.slug : null,
          activeAuraId: itemType === "AURA" && !willUnequip ? inventory.item.slug : null,
        },
      });
    }

    await tx.transaction.create({
      data: {
        userId: user.id,
        type: "MARKET_EQUIP",
        currency: "XP",
        amount: 0,
        balance: user.xp,
        metadata: JSON.stringify({ item: inventory.item.slug, itemType, action: willUnequip ? "unequip" : "equip" }),
      },
    });
  });

  return NextResponse.json({
    ok: true,
    equipped: {
      id: inventory.id,
      slug: inventory.item.slug,
      type: itemType,
      equippedAt: nextEquippedAt?.toISOString() ?? null,
    },
  });
}
