import { guessTitleFromFile, type MusicTrack, urlForMusicFile } from "@/lib/music-config";

const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|aac|flac)$/i;

export type ListedMusicEntry = {
  key: string;
  lastModified?: Date | null;
};

export function normalizeMusicFile(input: string) {
  const trimmed = input.trim().replace(/^\/+/, "").replace(/^bg\//i, "");
  if (!trimmed || trimmed.endsWith("/") || !AUDIO_EXT.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function sortedUniqueMusicFiles(entries: ListedMusicEntry[]): string[] {
  const seen = new Set<string>();

  const normalized: Array<{ file: string; lastModified?: Date | null }> = [];
  for (const entry of entries) {
    const file = normalizeMusicFile(entry.key);
    if (!file) continue;

    const key = file.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({ file, lastModified: entry.lastModified });
  }

  return normalized
    .sort((a, b) => {
      const aTime = a.lastModified ? a.lastModified.getTime() : 0;
      const bTime = b.lastModified ? b.lastModified.getTime() : 0;
      return bTime - aTime;
    })
    .map((entry) => entry.file);
}

export function latestMusicFiles(entries: ListedMusicEntry[], limit = 16) {
  return sortedUniqueMusicFiles(entries).slice(0, limit);
}

export function olderMusicFiles(entries: ListedMusicEntry[], limit = 20, skipNewest = 16) {
  return sortedUniqueMusicFiles(entries).slice(skipNewest, skipNewest + limit);
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
