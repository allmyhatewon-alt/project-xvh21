import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeStreamSource } from "@/lib/live";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("user")?.toLowerCase();

  if (username) {
    const stream = await prisma.liveStream.findFirst({
      where: { user: { username } },
      include: { user: { select: publicUserSelect } },
    });
    return NextResponse.json({ stream: stream ? serializeStream(stream) : null });
  }

  const streams = await prisma.liveStream.findMany({
    where: { isLive: true },
    orderBy: [{ viewerCount: "desc" }, { startedAt: "desc" }],
    take: 24,
    include: { user: { select: publicUserSelect } },
  });

  return NextResponse.json({ streams: streams.map(serializeStream) });
}

const publicUserSelect = {
  username: true,
  displayName: true,
  image: true,
  accentColor: true,
  status: true,
} as const;

function serializeStream(stream: any) {
  const normalized = normalizeStreamSource(stream.platform, stream.sourceUrl, stream.embedUrl);
  return {
    id: stream.id,
    title: stream.title,
    category: stream.category,
    platform: stream.platform,
    sourceUrl: stream.sourceUrl,
    embedUrl: normalized.embedUrl,
    playerKind: normalized.playerKind,
    thumbnailUrl: stream.thumbnailUrl,
    widgets: parseWidgets(stream.widgets),
    ttsSettings: parseTtsSettings(stream.ttsSettings),
    isLive: stream.isLive,
    viewerCount: stream.viewerCount,
    startedAt: stream.startedAt?.toISOString() ?? null,
    endedAt: stream.endedAt?.toISOString() ?? null,
    user: stream.user,
  };
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
