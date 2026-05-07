import { prisma } from "@/lib/prisma";

export type LiveMode = "all" | "restream_only" | "native_only" | "obs_only";

export type SiteSettings = {
  liveEnabled: boolean;
  liveMode: LiveMode;
  chatEnabled: boolean;
  chatBotEnabled: boolean;
  clipsEnabled: boolean;
  storeEnabled: boolean;
  profileEffectsEnabled: boolean;
  publicSignupEnabled: boolean;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  liveEnabled: true,
  liveMode: "all",
  chatEnabled: true,
  chatBotEnabled: true,
  clipsEnabled: true,
  storeEnabled: true,
  profileEffectsEnabled: true,
  publicSignupEnabled: true,
};

const SETTINGS_KEY = "site:control";

export const DEFAULT_BOT_COMMANDS = [
  { trigger: "!commands", response: "Commands: !rules, !discord, !live, !song, !profile" },
  { trigger: "!rules", response: "Keep it clean, no spam, no doxxing, and respect the room." },
  { trigger: "!discord", response: "Join the server: https://discord.gg/peng" },
  { trigger: "!live", response: "Live rooms are on /hub/live. Follow creators to catch them faster." },
  { trigger: "!song", response: "Check the landing page now-playing bar for the current track." },
  { trigger: "!profile", response: "Click a username to peek their profile, followers, badges, and join date." },
];

export function sanitizeSettings(input: unknown): SiteSettings {
  const raw = input && typeof input === "object" ? input as Partial<SiteSettings> : {};
  return {
    liveEnabled: raw.liveEnabled !== false,
    liveMode: ["all", "restream_only", "native_only", "obs_only"].includes(String(raw.liveMode)) ? raw.liveMode as LiveMode : DEFAULT_SITE_SETTINGS.liveMode,
    chatEnabled: raw.chatEnabled !== false,
    chatBotEnabled: raw.chatBotEnabled !== false,
    clipsEnabled: raw.clipsEnabled !== false,
    storeEnabled: raw.storeEnabled !== false,
    profileEffectsEnabled: raw.profileEffectsEnabled !== false,
    publicSignupEnabled: raw.publicSignupEnabled !== false,
  };
}

export async function getSiteSettings() {
  const row = await prisma.siteSetting.findUnique({ where: { key: SETTINGS_KEY } }).catch(() => null);
  if (!row) return DEFAULT_SITE_SETTINGS;
  try {
    return sanitizeSettings(JSON.parse(row.value));
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function saveSiteSettings(settings: SiteSettings) {
  const clean = sanitizeSettings(settings);
  await prisma.siteSetting.upsert({
    where: { key: SETTINGS_KEY },
    update: { value: JSON.stringify(clean) },
    create: { key: SETTINGS_KEY, value: JSON.stringify(clean) },
  });
  return clean;
}

export function allowedLivePlatforms(settings: SiteSettings) {
  if (!settings.liveEnabled) return [];
  if (settings.liveMode === "restream_only") return ["twitch", "kick", "youtube", "bunny", "hls", "custom"];
  if (settings.liveMode === "native_only") return ["native"];
  if (settings.liveMode === "obs_only") return ["mediamtx"];
  return ["native", "mediamtx", "twitch", "kick", "youtube", "bunny", "hls", "custom"];
}

export async function ensureDefaultBotCommands() {
  await Promise.all(DEFAULT_BOT_COMMANDS.map((command) =>
    prisma.chatBotCommand.upsert({
      where: { trigger: command.trigger },
      update: {},
      create: command,
    }),
  ));
}
