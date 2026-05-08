import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isR2Configured, uploadToR2 } from "@/lib/storage";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/x-wav",
  "audio/mp4",
]);

const IMAGE_ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
]);

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const kind = ((formData.get("kind") as string | null) ?? "audio").toLowerCase();
  const title = (formData.get("title") as string | null) ?? null;
  const artist = (formData.get("artist") as string | null) ?? null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (kind.startsWith("profile_") || kind === "space_background" || kind === "social_icon") {
    if (!IMAGE_ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported image type: ${file.type}` },
        { status: 415 }
      );
    }
  } else if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}` },
      { status: 415 }
    );
  }

  const maxBytes = parseInt(process.env.MAX_UPLOAD_BYTES ?? "52428800", 10);
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large. Max ${(maxBytes / 1024 / 1024) | 0}MB.` },
      { status: 413 }
    );
  }

  const bucket = kind === "profile_banner" ? "banners" : kind === "profile_image" ? "avatars" : kind === "space_background" ? "backgrounds" : kind === "social_icon" ? "social-icons" : "audio";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const ts = Date.now();
  const fname = `${ts}-${safeName}`;
  const storageKey = `${bucket}/${user.id}/${fname}`;
  const arrayBuffer = await file.arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  let publicUrl: string;
  if (isR2Configured()) {
    publicUrl = await uploadToR2({
      key: storageKey,
      body,
      contentType: file.type,
    });
  } else {
    const uploadDirRaw = process.env.UPLOAD_DIR ?? "./public/uploads";
    const uploadDir = path.isAbsolute(uploadDirRaw)
      ? uploadDirRaw
      : path.join(process.cwd(), uploadDirRaw);
    const userDir = path.join(uploadDir, bucket, user.id);
    await mkdir(userDir, { recursive: true });
    const filePath = path.join(userDir, fname);
    await writeFile(filePath, body);

    const publicBase = process.env.UPLOAD_PUBLIC_PATH ?? "uploads";
    publicUrl = `/${publicBase}/${bucket}/${user.id}/${fname}`;
  }

  if (kind.startsWith("profile_") || kind === "space_background" || kind === "social_icon") {
    return NextResponse.json({
      ok: true,
      url: publicUrl,
      storageKey,
    });
  }

  const upload = await prisma.audioUpload.create({
    data: {
      userId: user.id,
      filename: file.name,
      storageKey,
      url: publicUrl,
      sizeBytes: file.size,
      title: title ?? file.name,
      artist,
    },
  });

  return NextResponse.json({
    ok: true,
    upload,
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uploads = await prisma.audioUpload.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ uploads });
}

// Use Node runtime so we can write to disk (default would be edge/serverless on Vercel)
export const runtime = "nodejs";

// Disable body size limit on Next.js for large MP3 uploads (we enforce our own MAX)
export const dynamic = "force-dynamic";
