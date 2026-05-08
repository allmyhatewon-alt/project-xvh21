import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import path from "path";
import { FALLBACK_PLAYLIST } from "@/lib/music-config";
import { latestMusicFiles, manifestTracksFromFiles } from "@/lib/music-manifest";
import { isR2Configured, listR2Objects } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const R2_LATEST_LIMIT = 16;

async function loadFromR2() {
  const objects = await listR2Objects("bg/");
  return manifestTracksFromFiles(latestMusicFiles(objects, R2_LATEST_LIMIT));
}

async function loadFromLocal() {
  const dir = path.join(process.cwd(), "public", "bg");
  const files = await readdir(dir);
  return manifestTracksFromFiles(files);
}

export async function GET() {
  try {
    const tracks = isR2Configured() ? await loadFromR2() : await loadFromLocal();
    return NextResponse.json({ tracks: tracks.length ? tracks : FALLBACK_PLAYLIST });
  } catch (err) {
    console.error("[music-manifest]", err);
    return NextResponse.json({ tracks: FALLBACK_PLAYLIST });
  }
}
