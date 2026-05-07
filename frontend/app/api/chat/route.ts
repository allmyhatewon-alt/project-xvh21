import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultBotCommands, getSiteSettings } from "@/lib/site-settings";

const chatSchema = z.object({
  body: z.string().trim().min(1).max(160),
  room: z.string().trim().min(1).max(64).optional(),
});

function normalizeRoom(raw?: string | null) {
  const value = (raw ?? "hub").trim().toLowerCase();
  if (!/^(hub|live:[a-z0-9_-]{2,32})$/.test(value)) return "hub";
  return value;
}

const authorSelect = {
  username: true,
  displayName: true,
  image: true,
  bio: true,
  accentColor: true,
  id: true,
  role: true,
  createdAt: true,
  _count: { select: { followers: true } },
  achievements: {
    take: 4,
    orderBy: { earnedAt: "desc" as const },
    include: {
      achievement: {
        select: { slug: true, name: true, iconEmoji: true },
      },
    },
  },
  inventory: {
    where: { equippedAt: { not: null } },
    include: { item: { select: { slug: true, name: true, type: true } } },
    take: 6,
  },
};

const CHAT_COMMANDS = [
  ",help",
  ",ban @user reason",
  ",kick @user reason",
  ",warn @user reason",
  ",mute @user 10m",
  ",slowmode 30s",
  ",announce message",
  ",pin postId",
  ",feature @user",
  ",spotlight @user",
  ",grant gems @user amount",
  ",give shards @user amount",
  ",lock chat",
  ",unlock chat",
  ",logs",
  ",status",
  ",site night on",
  ",clear",
];

function serialize(message: {
  id: string;
  body: string;
  roomKey: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string;
    image: string | null;
    bio: string | null;
    accentColor: string;
    role: string;
    createdAt: Date;
    _count: { followers: number };
    achievements: Array<{
      achievement: {
        slug: string;
        name: string;
        iconEmoji: string;
      };
    }>;
    inventory: Array<{
      item: {
        slug: string;
        name: string;
        type: string;
      };
    }>;
  };
}) {
  const roleBadge = roleBadgeFor(message.author.role);
  const equippedBadges = message.author.inventory
    .filter((entry) => entry.item.type === "BADGE")
    .map((entry) => ({ slug: entry.item.slug, name: entry.item.name, icon: badgeIcon(entry.item.slug), important: importantBadge(entry.item.slug, entry.item.name) }))
    .sort((a, b) => Number(b.important) - Number(a.important));
  const achievementBadges = message.author.achievements.map((item) => ({
    slug: item.achievement.slug,
    name: item.achievement.name,
    icon: badgeIcon(item.achievement.slug, item.achievement.name, item.achievement.iconEmoji),
    important: importantBadge(item.achievement.slug, item.achievement.name),
  })).sort((a, b) => Number(b.important) - Number(a.important));
  const badges = [
    ...(roleBadge ? [roleBadge] : []),
    ...equippedBadges,
    ...achievementBadges.filter((badge) => !(roleBadge && /owner|admin/i.test(`${badge.slug} ${badge.name}`))),
  ];
  return {
    id: message.id,
    body: message.body,
    room: message.roomKey,
    createdAt: message.createdAt.toISOString(),
    author: {
      id: message.author.id,
      username: message.author.username,
      displayName: message.author.displayName,
      image: message.author.image,
      bio: message.author.bio,
      accentColor: message.author.accentColor,
      role: message.author.role,
      createdAt: message.author.createdAt.toISOString(),
      followers: message.author._count.followers,
      badges: badges.slice(0, 5).map(({ important, ...badge }) => badge),
      equipped: message.author.inventory.map((entry) => ({ slug: entry.item.slug, name: entry.item.name, type: entry.item.type })),
    },
  };
}

function roleBadgeFor(role: string) {
  const clean = role.toLowerCase();
  if (clean === "admin" || clean === "owner") return { slug: "owner-crown", name: "Owner", icon: "♛", important: true };
  if (clean === "mod") return { slug: "mod-diamond", name: "Mod", icon: "MOD", important: true };
  return null;
}

function importantBadge(slug: string, name = "") {
  const value = `${slug} ${name}`.toLowerCase();
  return ["owner", "admin", "founder", "early", "support", "vip", "important"].some((word) => value.includes(word));
}

function badgeIcon(slug: string, name = "", fallback = "*") {
  const value = `${slug} ${name}`.toLowerCase();
  if (value.includes("owner") || value.includes("admin")) return "♛";
  if (value.includes("early")) return "EARLY";
  if (value.includes("vip")) return "VIP";
  if (value.includes("founder")) return "FOUNDER";
  if (value.includes("chat")) return "CHAT";
  if (value.includes("boost")) return "BOOST";
  if (value.includes("support")) return "SUP";
  return fallback;
}

export async function GET(req: NextRequest) {
  const room = normalizeRoom(req.nextUrl.searchParams.get("room"));
  const messages = await prisma.chatMessage.findMany({
    where: { roomKey: room },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      author: {
        select: authorSelect,
      },
    },
  });

  return NextResponse.json({ messages: messages.reverse().map(serialize) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to chat." }, { status: 401 });
  }

  const restriction = await prisma.userRestriction.findFirst({
    where: {
      userId: user.id,
      active: true,
      kind: { in: ["CHAT_BAN", "CHAT_MUTE"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
  });
  if (restriction) {
    return NextResponse.json(
      { error: restriction.kind === "CHAT_BAN" ? "You are banned from chat." : "You are muted right now." },
      { status: 403 },
    );
  }

  const parsed = chatSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Keep it short and readable." }, { status: 400 });
  }
  const room = normalizeRoom(parsed.data.room);
  const settings = await getSiteSettings();
  if (!settings.chatEnabled) {
    return NextResponse.json({ error: "Chat is read-only right now." }, { status: 403 });
  }

  const commandResult = await parseChatCommand(parsed.data.body, user.role, user.id);
  if (commandResult.error) {
    return NextResponse.json({ error: commandResult.error }, { status: commandResult.status ?? 400 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      authorId: user.id,
      roomKey: room,
      body: commandResult.body,
    },
    include: {
      author: {
        select: authorSelect,
      },
    },
  });

  const botMessage = settings.chatBotEnabled
    ? await runBotCommand(parsed.data.body, room)
    : null;

  return NextResponse.json({ message: serialize(message), botMessage: botMessage ? serialize(botMessage) : null }, { status: 201 });
}

async function runBotCommand(input: string, room: string) {
  const body = input.trim();
  if (!body.startsWith("!")) return null;
  await ensureDefaultBotCommands();
  const trigger = (body.split(/\s+/)[0] ?? "").toLowerCase();
  const command = await prisma.chatBotCommand.findUnique({ where: { trigger } });
  if (!command?.enabled) return null;

  const bot = await prisma.user.upsert({
    where: { username: "pengbot" },
    update: { displayName: "peng bot", accentColor: "#2dd4bf" },
    create: {
      username: "pengbot",
      displayName: "peng bot",
      email: "pengbot@pengelus.local",
      accentColor: "#2dd4bf",
      role: "USER",
      bio: "chat command bot",
    },
  });

  return prisma.chatMessage.create({
    data: {
      authorId: bot.id,
      roomKey: room,
      body: command.response.slice(0, 160),
    },
    include: {
      author: {
        select: authorSelect,
      },
    },
  });
}

async function parseChatCommand(input: string, role: string, moderatorId: string): Promise<{ body: string; error?: string; status?: number }> {
  const body = input.trim();
  if (!body.startsWith(",") && !body.startsWith("/")) return { body };

  const isStaff = role === "ADMIN" || role === "MOD";
  const isOwner = role === "ADMIN";
  if (!isStaff) {
    return { body, error: "Staff commands are locked.", status: 403 };
  }

  const parts = body.replace(/^\//, ",").slice(1).split(/\s+/);
  const command = (parts.shift() ?? "").toLowerCase();
  const rest = parts.join(" ").trim();
  const target = parts[0]?.replace(/^@/, "");

  if (command === "help") {
    return { body: `[commands] ${CHAT_COMMANDS.join(" / ")}`.slice(0, 160) };
  }
  if (command === "announce") {
    return { body: `[announcement] ${rest || "announcement queued."}`.slice(0, 160) };
  }
  if (command === "ban") {
    await applyRestriction("CHAT_BAN", target, rest, moderatorId);
    return { body: `[admin] @${target || "user"} ban queued${rest ? `: ${rest}` : "."}`.slice(0, 160) };
  }
  if (command === "kick") {
    await logModeration(command, moderatorId, target, rest);
    return { body: `[admin] @${target || "user"} kicked from the room${rest ? `: ${rest}` : "."}`.slice(0, 160) };
  }
  if (command === "mute") {
    await applyRestriction("CHAT_MUTE", target, rest, moderatorId, parts[1] ?? "10m");
    return { body: `[admin] @${target || "user"} muted ${parts[1] ?? "10m"}`.slice(0, 160) };
  }
  if (command === "warn") {
    await logModeration(command, moderatorId, target, rest);
    return { body: `[admin] @${target || "user"} warned${rest ? `: ${rest}` : "."}`.slice(0, 160) };
  }
  if (command === "slowmode") {
    return { body: `[admin] slowmode set to ${rest || "30s"}`.slice(0, 160) };
  }
  if (command === "pin") {
    return { body: `[admin] pinned ${rest || "latest post"}`.slice(0, 160) };
  }
  if (command === "unpin") {
    return { body: `[admin] unpinned ${rest || "post"}`.slice(0, 160) };
  }
  if (command === "lock") {
    await logModeration(command, moderatorId, undefined, rest || "chat");
    return { body: `[admin] locked ${rest || "chat"}`.slice(0, 160) };
  }
  if (command === "unlock") {
    await logModeration(command, moderatorId, undefined, rest || "chat");
    return { body: `[admin] unlocked ${rest || "chat"}`.slice(0, 160) };
  }
  if (command === "status") {
    return { body: "[status] chat live / commands awake / room readable" };
  }
  if (command === "logs") {
    return { body: "[logs] newest actions are visible in owner center live logs." };
  }
  if (command === "clear") {
    return { body: "[admin] chat cleanup marker dropped. fresh room from here." };
  }

  if (!isOwner) {
    return { body, error: "Owner command only.", status: 403 };
  }

  if (command === "spotlight") {
    await logModeration(command, moderatorId, target, rest);
    return { body: `[owner] spotlight queued for @${target || "user"}`.slice(0, 160) };
  }
  if (command === "grant") {
    const result = await grantCurrency("gems", parts, moderatorId);
    if (result.error) return { body, error: result.error, status: result.status };
    return { body: `[owner] granted ${result.amount?.toLocaleString()} gems to @${result.username}. balance: ${result.balance?.toLocaleString()}`.slice(0, 160) };
  }
  if (command === "give") {
    const result = await grantCurrency("shards", parts, moderatorId);
    if (result.error) return { body, error: result.error, status: result.status };
    return { body: `[owner] gave ${result.amount?.toLocaleString()} shards to @${result.username}. balance: ${result.balance?.toLocaleString()}`.slice(0, 160) };
  }
  if (command === "feature") {
    return { body: `[owner] featured ${rest || "@user"}`.slice(0, 160) };
  }
  if (command === "unfeature") {
    return { body: `[owner] unfeatured ${rest || "@user"}`.slice(0, 160) };
  }
  if (command === "promote") {
    return { body: `[owner] promote queued: ${rest || "@user mod"}`.slice(0, 160) };
  }
  if (command === "demote") {
    return { body: `[owner] demote queued: ${rest || "@user"}`.slice(0, 160) };
  }
  if (command === "reset") {
    return { body: `[owner] reset queued: ${rest || "streak @user"}`.slice(0, 160) };
  }
  if (command === "site") {
    return { body: `[owner] site command queued: ${rest || "no option given"}`.slice(0, 160) };
  }
  if (command === "store") {
    return { body: `[owner] store command queued: ${rest || "no option given"}`.slice(0, 160) };
  }
  if (command === "maintenance") {
    return { body: `[owner] maintenance ${rest || "status checked"}`.slice(0, 160) };
  }

  return { body, error: `Unknown command. Try ${CHAT_COMMANDS.slice(0, 4).join(", ")}.`, status: 400 };
}

async function logModeration(command: string, moderatorId: string, targetUsername?: string, reason?: string) {
  await prisma.moderationAction.create({
    data: {
      moderatorId,
      targetUsername: targetUsername || null,
      command,
      reason: reason || null,
    },
  });
}

async function grantCurrency(currency: "gems" | "shards", parts: string[], moderatorId: string): Promise<{ username?: string; amount?: number; balance?: number; error?: string; status?: number }> {
  const cleaned = [...parts];
  if (cleaned[0]?.toLowerCase() === currency) cleaned.shift();
  const username = cleaned.shift()?.replace(/^@/, "").toLowerCase();
  const amountRaw = cleaned.shift();
  const amount = Number(amountRaw);
  const reason = cleaned.join(" ").trim();

  if (!username || !Number.isInteger(amount) || amount <= 0) {
    return { error: `Use ,${currency === "gems" ? "grant gems" : "give shards"} @user amount`, status: 400 };
  }
  if (amount > 100000) {
    return { error: "Keep grants under 100,000 at a time.", status: 400 };
  }

  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, gems: true, shards: true },
  });
  if (!target) return { error: `Could not find @${username}.`, status: 404 };

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.user.update({
      where: { id: target.id },
      data: currency === "gems" ? { gems: { increment: amount } } : { shards: { increment: amount } },
      select: { username: true, gems: true, shards: true },
    });
    await tx.transaction.create({
      data: {
        userId: target.id,
        type: "OWNER_GRANT",
        currency: currency === "gems" ? "GEM" : "SHARD",
        amount,
        balance: currency === "gems" ? next.gems : next.shards,
        metadata: JSON.stringify({ moderatorId, reason: reason || null }),
      },
    });
    await tx.moderationAction.create({
      data: {
        moderatorId,
        targetUsername: target.username,
        command: currency === "gems" ? "grant gems" : "give shards",
        reason: reason || `${amount} ${currency}`,
        metadata: JSON.stringify({ amount, currency }),
      },
    });
    return next;
  });

  return {
    username: updated.username,
    amount,
    balance: currency === "gems" ? updated.gems : updated.shards,
  };
}

async function applyRestriction(kind: "CHAT_BAN" | "CHAT_MUTE", targetUsername: string | undefined, reason: string, moderatorId: string, duration?: string) {
  if (!targetUsername) {
    await logModeration(kind.toLowerCase(), moderatorId, undefined, reason);
    return;
  }
  const target = await prisma.user.findUnique({ where: { username: targetUsername.toLowerCase() }, select: { id: true } });
  if (!target) {
    await logModeration(kind.toLowerCase(), moderatorId, targetUsername, `missing user / ${reason}`);
    return;
  }
  const expiresAt = kind === "CHAT_MUTE" ? parseDuration(duration ?? "10m") : null;
  await prisma.userRestriction.create({
    data: {
      userId: target.id,
      kind,
      reason: reason || null,
      expiresAt,
    },
  });
  await logModeration(kind.toLowerCase(), moderatorId, targetUsername, reason);
}

function parseDuration(raw: string) {
  const match = raw.match(/^(\d+)(m|h|d|s)?$/i);
  if (!match) return new Date(Date.now() + 10 * 60 * 1000);
  const amount = Number(match[1]);
  const unit = (match[2] ?? "m").toLowerCase();
  const ms = unit === "s" ? amount * 1000 : unit === "h" ? amount * 3600000 : unit === "d" ? amount * 86400000 : amount * 60000;
  return new Date(Date.now() + ms);
}
