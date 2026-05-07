import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ items: [] }, { status: 401 });

  const items = await prisma.inventoryItem.findMany({
    where: { userId: user.id },
    include: { item: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: items.map((entry) => ({
      id: entry.id,
      slug: entry.item.slug,
      name: entry.item.name,
      description: entry.item.description,
      type: entry.item.type,
      tier: entry.item.tier,
      price: entry.item.price,
      previewUrl: entry.item.previewUrl,
      equippedAt: entry.equippedAt?.toISOString() ?? null,
      createdAt: entry.createdAt.toISOString(),
    })),
  });
}
