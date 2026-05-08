import { guessTitleFromFile, type MusicTrack, urlForMusicFile } from "@/lib/music-config";

const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|aac|flac)$/i;

export function normalizeMusicFile(input: string) {
  const trimmed = input.trim().replace(/^\/+/, "").replace(/^bg\//i, "");
  if (!trimmed || trimmed.endsWith("/") || !AUDIO_EXT.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function manifestTracksFromFiles(
  files: string[],
  urlBuilder: (file: string) => string = urlForMusicFile,
): MusicTrack[] {
  const seen = new Set<string>();

  return files
    .map(normalizeMusicFile)
    .filter((file): file is string => Boolean(file))
    .filter((file) => {
      const key = file.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map((file) => ({
      url: urlBuilder(file),
      title: guessTitleFromFile(file),
    }))
    .filter((track) => track.url);
}
