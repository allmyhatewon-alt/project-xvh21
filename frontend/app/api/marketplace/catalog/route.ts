import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FEATURED_ITEMS = [
  { slug: "spotlight-boost", name: "Spotlight Boost", description: "Boost badge and featured profile card treatment.", type: "BADGE", tier: "GEM", price: 3000 },
  { slug: "signal-landing-kit", name: "Signal Landing Kit", description: "Full deploy-style landing kit for profile pages.", type: "BLOCK", tier: "GEM", price: 2200 },
  { slug: "creator-frame", name: "Creator Frame", description: "Premium frame around profile banner and avatar.", type: "AURA", tier: "GEM", price: 1250 },
  { slug: "chat-badge", name: "Chat Badge", description: "Small live chat name badge.", type: "BADGE", tier: "GEM", price: 900 },
  { slug: "vip-chat-tag", name: "VIP Chat Tag", description: "Brighter live chat tag for active users.", type: "BADGE", tier: "GEM", price: 1100 },
  { slug: "clip-feature", name: "Clip Feature", description: "Feature one clip in rotation.", type: "BADGE", tier: "GEM", price: 1500 },
  { slug: "xp-weekend", name: "2x XP Weekend", description: "Double XP weekend token.", type: "BADGE", tier: "GEM", price: 800 },
  { slug: "theme-os-coded", name: "OS Coded Theme", description: "Terminal cards, grid glow, and system text.", type: "SKIN", tier: "SHARD", price: 450 },
  { slug: "theme-twitch", name: "Twitch Theme", description: "Purple stream-room profile pack.", type: "SKIN", tier: "SHARD", price: 500 },
  { slug: "streak-shield", name: "Streak Shield", description: "Protect one missed check-in.", type: "BADGE", tier: "GEM", price: 600 },
];

export async function GET() {
  await prisma.$transaction(FEATURED_ITEMS.map((item) =>
    prisma.catalogItem.upsert({
      where: { slug: item.slug },
      update: item,
      create: item,
    }),
  ));

  const items = await prisma.catalogItem.findMany({
    orderBy: [{ tier: "asc" }, { price: "asc" }],
    take: 40,
  });

  return NextResponse.json({ items });
}
