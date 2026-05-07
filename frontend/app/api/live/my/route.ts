import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeStreamSource } from "@/lib/live";
import { allowedLivePlatforms, getSiteSettings } from "@/lib/site-settings";

const schema = z.object({
  title: z.string().trim().min(1).max(90),
  category: z.string().trim().min(1).max(32).default("just chatting"),
  platform: z.enum(["native", "mediamtx", "twitch", "kick", "youtube", "bunny", "hls", "custom"]),
  sourceUrl: z.string().trim().max(500).optional().nullable(),
  embedUrl: z.string().trim().max(500).optional().nullable(),
  thumbnailUrl: z.string().trim().max(500).optional().nullable(),
  widgets: z.string().trim().max(10000).optional().nullable(),
  ttsSettings: z.string().trim().max(5000).optional().nullable(),
  isLive: z.boolean(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ stream: null }, { status: 401 });

  const stream = await prisma.liveStream.findUnique({
    where: { userId: user.id },
    include: { user: { select: { username: true, displayName: true, image: true, accentColor: true, status: true } } },
  });

  const settings = await getSiteSettings();
  return NextResponse.json({ stream: stream ? serializeMine(stream) : null, settings, allowedPlatforms: allowedLivePlatforms(settings) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to go live." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the stream fields." }, { status: 400 });

  const data = parsed.data;
  const settings = await getSiteSettings();
  const allowed = allowedLivePlatforms(settings);
  if (!settings.liveEnabled) {
    return NextResponse.json({ error: "Live streaming is currently turned off by the owner." }, { status: 403 });
  }
  if (!allowed.includes(data.platform)) {
    return NextResponse.json({ error: `This stream mode is locked. Current policy: ${settings.liveMode.replace(/_/g, " ")}.` }, { status: 403 });
  }
  if (settings.liveMode === "restream_only" && data.isLive && !data.sourceUrl && !data.embedUrl) {
    return NextResponse.json({ error: "Restream-only mode needs a Twitch, Kick, YouTube, Bunny, HLS, or custom source." }, { status: 400 });
  }
  const previous = await prisma.liveStream.findUnique({ where: { userId: user.id }, select: { isLive: true, widgetKey: true } });
  const goingLive = data.isLive && !previous?.isLive;
  const endingLive = !data.isLive && previous?.isLive;
  const widgetKey = previous?.widgetKey || randomBytes(18).toString("hex");

  const stream = await prisma.liveStream.upsert({
    where: { userId: user.id },
    update: {
      title: data.title,
      category: data.category,
      platform: data.platform,
      sourceUrl: data.sourceUrl || null,
      embedUrl: data.embedUrl || null,
      thumbnailUrl: data.thumbnailUrl || null,
      widgets: data.widgets || "[]",
      widgetKey,
      ttsSettings: data.ttsSettings || "{}",
      isLive: data.isLive,
      viewerCount: data.isLive ? { increment: goingLive ? 1 : 0 } : 0,
      startedAt: goingLive ? new Date() : undefined,
      endedAt: endingLive ? new Date() : undefined,
    },
    create: {
      userId: user.id,
      title: data.title,
      category: data.category,
      platform: data.platform,
      sourceUrl: data.sourceUrl || null,
      embedUrl: data.embedUrl || null,
      thumbnailUrl: data.thumbnailUrl || null,
      widgets: data.widgets || "[]",
      widgetKey,
      ttsSettings: data.ttsSettings || "{}",
      isLive: data.isLive,
      viewerCount: data.isLive ? 1 : 0,
      startedAt: data.isLive ? new Date() : null,
    },
    include: { user: { select: { username: true, displayName: true, image: true, accentColor: true, status: true } } },
  });

  return NextResponse.json({ stream: serializeMine(stream), settings, allowedPlatforms: allowed });
}

function serializeMine(stream: any) {
  const normalized = normalizeStreamSource(stream.platform, stream.sourceUrl, stream.embedUrl);
  const username = stream.user?.username ?? "";
  return {
    id: stream.id,
    title: stream.title,
    category: stream.category,
    platform: stream.platform,
    sourceUrl: stream.sourceUrl,
    embedUrl: stream.embedUrl,
    resolvedEmbedUrl: normalized.embedUrl,
    playerKind: normalized.playerKind,
    thumbnailUrl: stream.thumbnailUrl,
    widgets: parseWidgets(stream.widgets),
    widgetUrl: username && stream.widgetKey ? `/hub/live/widgets/${username}?key=${stream.widgetKey}` : "",
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
