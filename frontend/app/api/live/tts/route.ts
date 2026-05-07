import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  username: z.string().trim().min(1).max(32),
  key: z.string().trim().min(12).max(128),
  text: z.string().trim().min(1).max(180),
  author: z.string().trim().max(32).optional(),
  isGift: z.boolean().optional(),
});

const voices = new Set(["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse", "marin", "cedar"]);

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad TTS request." }, { status: 400 });
  const username = parsed.data.username.toLowerCase();

  const stream = await prisma.liveStream.findFirst({
    where: { widgetKey: parsed.data.key, user: { username } },
    select: { ttsSettings: true },
  });
  if (!stream) return NextResponse.json({ error: "Widget link is locked." }, { status: 403 });

  const settings = parseTtsSettings(stream.ttsSettings);
  if (!settings.enabled) return NextResponse.json({ error: "TTS is off." }, { status: 400 });
  const clean = parsed.data.text
    .replace(/https?:\/\/\S+/g, "link")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, settings.maxLength);
  const prefix = parsed.data.isGift ? "Gift alert" : `${parsed.data.author || "chat"} says`;

  if (settings.provider === "kitten") {
    return playKittenTts(`${prefix}: ${clean}`, settings);
  }

  if (settings.provider !== "openai") return NextResponse.json({ error: "Generated voice is not selected." }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: settings.premiumVoice,
      input: `${prefix}: ${clean}`,
      instructions: settings.instructions,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "");
    return NextResponse.json({ error: "Premium voice failed.", detail: error.slice(0, 220) }, { status: 502 });
  }

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}

async function playKittenTts(input: string, settings: ReturnType<typeof parseTtsSettings>) {
  const serviceUrl = process.env.KITTEN_TTS_URL;
  if (!serviceUrl) {
    return NextResponse.json({ error: "KITTEN_TTS_URL is not configured." }, { status: 503 });
  }

  const response = await fetch(serviceUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: input,
      voice: settings.voice,
      rate: settings.rate,
      pitch: settings.pitch,
      format: "wav",
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "");
    return NextResponse.json({ error: "Kitten voice failed.", detail: error.slice(0, 220) }, { status: 502 });
  }

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      "Content-Type": response.headers.get("content-type") || "audio/wav",
      "Cache-Control": "no-store",
    },
  });
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
      premiumVoice: voices.has(parsed.premiumVoice) ? parsed.premiumVoice : defaults.premiumVoice,
      instructions: String(parsed.instructions || defaults.instructions).slice(0, 180),
      rate: Math.min(1.8, Math.max(0.65, Number(parsed.rate) || defaults.rate)),
      pitch: Math.min(1.8, Math.max(0.55, Number(parsed.pitch) || defaults.pitch)),
      maxLength: Math.min(160, Math.max(30, Number(parsed.maxLength) || defaults.maxLength)),
    };
  } catch {
    return defaults;
  }
}
