import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("user")?.trim().toLowerCase();
  const key = req.nextUrl.searchParams.get("key")?.trim();
  if (!username || !key) return NextResponse.json({ error: "Missing widget link." }, { status: 400 });

  const stream = await prisma.liveStream.findFirst({
    where: { widgetKey: key, user: { username } },
    include: { user: { select: { username: true, displayName: true, image: true, accentColor: true, status: true } } },
  });
  if (!stream) return NextResponse.json({ error: "Widget link is locked." }, { status: 403 });

  const messages = await prisma.chatMessage.findMany({
    where: { roomKey: `live:${username}` },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { author: { select: { username: true, displayName: true, image: true, accentColor: true, role: true } } },
  });

  return NextResponse.json({
    stream: {
      id: stream.id,
      title: stream.title,
      category: stream.category,
      widgets: parseWidgets(stream.widgets),
      ttsSettings: parseTtsSettings(stream.ttsSettings),
      isLive: stream.isLive,
      user: stream.user,
    },
    messages: messages.reverse().map((message) => ({
      id: message.id,
      body: message.body,
      room: message.roomKey,
      createdAt: message.createdAt.toISOString(),
      author: message.author,
    })),
  });
}

function parseWidgets(raw?: string | null) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseTtsSettings(raw?: string | null) {
  const defaults = { enabled: false, readChat: false, readGifts: true, provider: "browser", voice: "peng pulse", premiumVoice: "marin", instructions: "Speak like a high-energy livestream alert.", rate: 1, pitch: 1, maxLength: 90 };
  try {
    const parsed = JSON.parse(raw || "{}");
    if (!parsed || typeof parsed !== "object") return defaults;
    return {
      enabled: Boolean(parsed.enabled),
      readChat: Boolean(parsed.readChat),
      readGifts: parsed.readGifts !== false,
      provider: ["browser", "openai", "kitten"].includes(parsed.provider) ? parsed.provider : defaults.provider,
      voice: String(parsed.voice || defaults.voice).slice(0, 40),
      premiumVoice: ["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse", "marin", "cedar"].includes(parsed.premiumVoice) ? parsed.premiumVoice : defaults.premiumVoice,
      instructions: String(parsed.instructions || defaults.instructions).slice(0, 180),
      rate: Math.min(1.8, Math.max(0.65, Number(parsed.rate) || defaults.rate)),
      pitch: Math.min(1.8, Math.max(0.55, Number(parsed.pitch) || defaults.pitch)),
      maxLength: Math.min(160, Math.max(30, Number(parsed.maxLength) || defaults.maxLength)),
    };
  } catch {
    return defaults;
  }
}
