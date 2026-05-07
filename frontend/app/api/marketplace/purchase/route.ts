import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  itemId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to buy this." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Missing item." }, { status: 400 });

  const item = await prisma.catalogItem.upsert({
    where: { slug: parsed.data.itemId },
    update: {},
    create: starterCatalogItem(parsed.data.itemId),
  });

  const owned = await prisma.inventoryItem.findUnique({
    where: { userId_itemId: { userId: user.id, itemId: item.id } },
  });
  if (owned) return NextResponse.json({ ok: true, owned: true, message: "already owned" });

  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { gems: true, shards: true },
  });
  if (!current) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const currency = item.tier === "GEM" ? "GEM" : "SHARD";
  const balance = currency === "GEM" ? current.gems : current.shards;
  if (balance < item.price) {
    return NextResponse.json({ error: `Need ${item.price.toLocaleString()} ${currency.toLowerCase()}s.` }, { status: 402 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: currency === "GEM" ? { gems: { decrement: item.price } } : { shards: { decrement: item.price } },
      select: { gems: true, shards: true },
    });
    const inventory = await tx.inventoryItem.create({
      data: { userId: user.id, itemId: item.id },
    });
    await tx.transaction.create({
      data: {
        userId: user.id,
        type: "MARKET_PURCHASE",
        currency,
        amount: -item.price,
        balance: currency === "GEM" ? updatedUser.gems : updatedUser.shards,
        metadata: JSON.stringify({ item: item.slug }),
      },
    });
    return { updatedUser, inventory };
  });

  return NextResponse.json({
    ok: true,
    item,
    inventory: result.inventory,
    balance: result.updatedUser,
  });
}

function starterCatalogItem(slug: string) {
  const catalog: Record<string, { name: string; description: string; type: string; tier: string; price: number }> = {
    "theme-os-coded": { name: "OS Coded Theme", description: "Terminal cards, grid glow, and system text.", type: "SKIN", tier: "SHARD", price: 450 },
    "theme-anime": { name: "Anime Theme", description: "Soft glow, episode energy, and sticker text.", type: "SKIN", tier: "SHARD", price: 450 },
    "theme-twitch": { name: "Twitch Theme", description: "Purple stream-room profile pack.", type: "SKIN", tier: "SHARD", price: 500 },
    "signal-board": { name: "Signal Board Skin", description: "Broadcast-board styling for spotlight panels.", type: "SKIN", tier: "GEM", price: 450 },
    "portal-ring": { name: "Portal Ring", description: "Animated portal trim for profile cards.", type: "AURA", tier: "GEM", price: 475 },
    "text-chrome": { name: "Chrome Text GFX", description: "Unlocks shiny chrome text styling.", type: "AURA", tier: "GEM", price: 125 },
    "text-glitch": { name: "Glitch Text GFX", description: "Unlocks glitchy cyber title styling.", type: "AURA", tier: "GEM", price: 125 },
    "name-glow": { name: "Name Glow", description: "Clean glow on your name.", type: "AURA", tier: "GEM", price: 200 },
    "custom-accent": { name: "Custom Accent", description: "Pick a custom profile color.", type: "SKIN", tier: "GEM", price: 350 },
    "post-pin": { name: "Post Pin", description: "Pin one post for 48 hours.", type: "BADGE", tier: "GEM", price: 500 },
    "streak-shield": { name: "Streak Shield", description: "Protect one missed check-in.", type: "BADGE", tier: "GEM", price: 600 },
    "status-bubble-plus": { name: "Status Bubble+", description: "Upgraded thinking bubble styling.", type: "AURA", tier: "GEM", price: 650 },
    "xp-weekend": { name: "2x XP Weekend", description: "Double XP weekend token.", type: "BADGE", tier: "GEM", price: 800 },
    "chat-badge": { name: "Chat Badge", description: "Small live chat name badge.", type: "BADGE", tier: "GEM", price: 900 },
    "vip-chat-tag": { name: "VIP Chat Tag", description: "Brighter live chat tag for active users.", type: "BADGE", tier: "GEM", price: 1100 },
    "creator-frame": { name: "Creator Frame", description: "Premium frame around profile banner and avatar.", type: "AURA", tier: "GEM", price: 1250 },
    "hologram-name": { name: "Hologram Name", description: "Hologram glow treatment for profile identity.", type: "AURA", tier: "GEM", price: 1350 },
    "custom-cursor": { name: "Custom Cursor", description: "Custom profile cursor item.", type: "AURA", tier: "GEM", price: 1200 },
    "profile-particles": { name: "Profile Particles", description: "Floating particles for your spotlight.", type: "AURA", tier: "GEM", price: 1400 },
    "midnight-room": { name: "Midnight Room Skin", description: "Premium dark profile skin with teal edges.", type: "SKIN", tier: "GEM", price: 1600 },
    "rainbow-trail": { name: "Rainbow Trail", description: "Soft animated accent trail for profile cards.", type: "AURA", tier: "GEM", price: 1750 },
    "clip-feature": { name: "Clip Feature", description: "Feature one clip in rotation.", type: "BADGE", tier: "GEM", price: 1500 },
    "founder-mark": { name: "Founder Mark", description: "Early-supporter profile and chat badge.", type: "BADGE", tier: "GEM", price: 2500 },
    "spotlight-boost": { name: "Spotlight Boost", description: "Boost badge and featured profile card treatment.", type: "BADGE", tier: "GEM", price: 3000 },
    "signal-landing-kit": { name: "Signal Landing Kit", description: "Full deploy-style landing kit.", type: "BLOCK", tier: "GEM", price: 2200 },
    "own-board": { name: "Spin Up A Board", description: "Create a custom board.", type: "BADGE", tier: "GEM", price: 5000 },
  };
  const item = catalog[slug] ?? { name: slug, description: "Profile marketplace item.", type: "BADGE", tier: "GEM", price: 100 };
  return {
    slug,
    name: item.name,
    description: item.description,
    type: item.type,
    tier: item.tier,
    price: item.price,
  };
}
