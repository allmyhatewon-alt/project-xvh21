export function normalizeStreamSource(platformRaw?: string | null, sourceUrl?: string | null, embedUrl?: string | null) {
  const platform = (platformRaw ?? "custom").toLowerCase();
  const source = (sourceUrl ?? "").trim();
  const explicit = (embedUrl ?? "").trim();
  if (platform === "native") return { embedUrl: source || "pengelus-native", playerKind: "native" };
  if (explicit) return { embedUrl: explicit, playerKind: explicit.includes(".m3u8") ? "video" : "iframe" };
  if (!source) return { embedUrl: "", playerKind: "empty" };

  if (platform === "twitch") {
    const channel = extractLastPath(source) || source.replace(/^@/, "");
    return { embedUrl: `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=localhost&muted=false`, playerKind: "iframe" };
  }
  if (platform === "kick") {
    const channel = extractLastPath(source) || source.replace(/^@/, "");
    return { embedUrl: `https://player.kick.com/${encodeURIComponent(channel)}`, playerKind: "iframe" };
  }
  if (platform === "youtube") {
    const id = extractYouTubeId(source);
    return { embedUrl: id ? `https://www.youtube.com/embed/${id}` : source, playerKind: "iframe" };
  }
  if (platform === "bunny") {
    return normalizeBunnySource(source);
  }
  if (platform === "mediamtx") {
    return normalizeMediaMtxSource(source);
  }
  if (platform === "hls" || source.includes(".m3u8") || source.match(/\.(mp4|webm)(\?|$)/i)) {
    return { embedUrl: source, playerKind: "video" };
  }
  return { embedUrl: source, playerKind: "iframe" };
}

function normalizeMediaMtxSource(input: string) {
  const clean = input.trim().replace(/^\/+/, "");
  if (!clean) return { embedUrl: "", playerKind: "empty" };
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return { embedUrl: clean, playerKind: clean.includes(".m3u8") ? "video" : "iframe" };
  }
  const path = clean.replace(/\/index\.m3u8$/i, "").replace(/\/+$/, "");
  const protocol = (process.env.MEDIAMTX_PLAYBACK_PROTOCOL || "hls").toLowerCase();
  const base = protocol === "webrtc"
    ? (process.env.MEDIAMTX_WEBRTC_URL || "http://127.0.0.1:8889")
    : (process.env.MEDIAMTX_HLS_URL || "http://127.0.0.1:8888");
  return {
    embedUrl: `${base.replace(/\/$/, "")}/${encodeURIComponent(path)}?muted=false&autoplay=true&playsInline=true`,
    playerKind: "iframe",
  };
}

function normalizeBunnySource(input: string) {
  const cdnUrl = normalizeBunnyCdnPath(input);
  if (cdnUrl) return { embedUrl: cdnUrl, playerKind: "video" };
  if (input.includes(".m3u8") || input.match(/\.(mp4|webm)(\?|$)/i)) {
    return { embedUrl: input, playerKind: "video" };
  }
  const match = extractBunnyEmbedParts(input);
  if (!match) return { embedUrl: input, playerKind: "iframe" };
  const [libraryId, videoId] = match;
  return {
    embedUrl: `https://player.mediadelivery.net/embed/${encodeURIComponent(libraryId)}/${encodeURIComponent(videoId)}?autoplay=true&muted=false&preload=true&responsive=true`,
    playerKind: "iframe",
  };
}

function extractBunnyEmbedParts(input: string): [string, string] | null {
  const clean = input.trim();
  const configuredLibraryId = process.env.BUNNY_STREAM_LIBRARY_ID?.trim();
  const videoOnly = clean.match(/^([a-f0-9-]{20,})$/i);
  if (configuredLibraryId && videoOnly) return [configuredLibraryId, videoOnly[1]];
  const shorthand = clean.match(/^(\d+)\/([a-f0-9-]{20,})$/i);
  if (shorthand) return [shorthand[1], shorthand[2]];
  try {
    const url = new URL(clean.startsWith("http") ? clean : `https://${clean}`);
    const parts = url.pathname.split("/").filter(Boolean);
    const embedIndex = parts.indexOf("embed");
    if (url.hostname.includes("mediadelivery.net") && embedIndex >= 0 && parts[embedIndex + 1] && parts[embedIndex + 2]) {
      return [parts[embedIndex + 1], parts[embedIndex + 2]];
    }
    if (url.hostname.includes("mediadelivery.net") && parts[0] && parts[1]) {
      return [parts[0], parts[1]];
    }
  } catch {
    return null;
  }
  return null;
}

function normalizeBunnyCdnPath(input: string) {
  const clean = input.trim();
  const cdnHost = process.env.BUNNY_STREAM_CDN_HOSTNAME?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!cdnHost || !clean.match(/\.(m3u8|mp4|webm)(\?|$)/i)) return "";
  if (clean.startsWith("http://") || clean.startsWith("https://")) return "";
  return `https://${cdnHost}/${clean.replace(/^\/+/, "")}`;
}

function extractLastPath(input: string) {
  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    return url.pathname.split("/").filter(Boolean).pop() ?? "";
  } catch {
    return input.split("/").filter(Boolean).pop() ?? "";
  }
}

function extractYouTubeId(input: string) {
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1);
    if (url.searchParams.get("v")) return url.searchParams.get("v");
    return url.pathname.split("/").filter(Boolean).pop() ?? "";
  } catch {
    return input;
  }
}
