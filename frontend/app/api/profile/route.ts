import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).nullable().optional(),
  status: z.string().max(90).nullable().optional(),
  image: z.string().nullable().optional(),
  bannerUrl: z.string().nullable().optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  // Account changes
  newEmail: z.string().email().optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).max(72).optional(),
});

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const { newEmail, currentPassword, newPassword, ...profileData } = parsed.data;

  // Handle email change
  if (newEmail) {
    const existing = await prisma.user.findUnique({ where: { email: newEmail.toLowerCase().trim() } });
    if (existing && existing.id !== user.id)
      return NextResponse.json({ error: "That email is already in use" }, { status: 400 });
    (profileData as any).email = newEmail.toLowerCase().trim();
  }

  // Handle password change
  if (newPassword) {
    if (!currentPassword)
      return NextResponse.json({ error: "Current password is required to set a new one" }, { status: 400 });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!dbUser?.passwordHash)
      return NextResponse.json({ error: "Account has no password set" }, { status: 400 });

    const match = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!match)
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

    (profileData as any).passwordHash = await bcrypt.hash(newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: profileData as any,
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      status: true,
      image: true,
      bannerUrl: true,
      accentColor: true,
      email: true,
    },
  });
  return NextResponse.json({ user: updated });
}
