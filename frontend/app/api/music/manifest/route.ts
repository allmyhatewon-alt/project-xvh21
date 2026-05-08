import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import path from "path";
import { FALLBACK_PLAYLIST } from "@/lib/music-config";
import { latestMusicFiles, manifestTracksFromFiles, olderMusicFiles } from "@/lib/music-manifest";
import { isR2Configured, listR2Objects } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const R2_NEW_LIMIT = 16;
const R2_OLD_LIMIT = 20;
const R2_OLD_SKIP = 16;

async function loadFromR2() {
  const objects = await listR2Objects("bg/");
  const useNewest = Math.random() >= 0.5;
  const files = useNewest
    ? latestMusicFiles(objects, R2_NEW_LIMIT)
    : olderMusicFiles(objects, R2_OLD_LIMIT, R2_OLD_SKIP);

  const fallbackFiles = files.length ? files : latestMusicFiles(objects, R2_NEW_LIMIT);

  return {
    variant: useNewest ? "newest-16" : "older-20",
    tracks: manifestTracksFromFiles(fallbackFiles),
  };
}

async function loadFromLocal() {
  const dir = path.join(process.cwd(), "public", "bg");
  const files = await readdir(dir);
  return {
    variant: "local-fallback",
    tracks: manifestTracksFromFiles(files),
  };
}

export async function GET() {
  try {
    const manifest = isR2Configured() ? await loadFromR2() : await loadFromLocal();
    return NextResponse.json({
      variant: manifest.variant,
      tracks: manifest.tracks.length ? manifest.tracks : FALLBACK_PLAYLIST,
    });
  } catch (err) {
    console.error("[music-manifest]", err);
    return NextResponse.json({ variant: "fallback", tracks: FALLBACK_PLAYLIST });
  }
}
