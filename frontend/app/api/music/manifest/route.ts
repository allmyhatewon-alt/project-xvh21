import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import path from "path";
import { FALLBACK_PLAYLIST } from "@/lib/music-config";
import { manifestTracksFromFiles } from "@/lib/music-manifest";
import { isR2Configured, listR2Keys } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadFromR2() {
  const keys = await listR2Keys("bg/");
  return manifestTracksFromFiles(keys);
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
