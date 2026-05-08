import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getSiteSettings } from "@/lib/site-settings";
import { issueAndSendVerification } from "@/lib/email-verification";

const schema = z.object({
  username: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, underscores"),
  displayName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const settings = await getSiteSettings();
    if (!settings.publicSignupEnabled) {
      return NextResponse.json({ error: "Signups are closed right now." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { username, displayName, email, password } = parsed.data;
    const usernameLc = username.toLowerCase();
    const emailLc = email.toLowerCase().trim();

    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email: emailLc }, select: { id: true } }),
      prisma.user.findUnique({ where: { username: usernameLc }, select: { id: true } }),
    ]);

    if (existingEmail) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    if (existingUsername) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          username: usernameLc,
          displayName,
          email: emailLc,
          passwordHash,
          emailVerified: null,
        },
        select: { id: true, username: true, email: true },
      });
      await tx.hubProfile.create({
        data: { userId: u.id, portalLabel: "Enter My Links" },
      });
      await tx.space.create({ data: { userId: u.id, blocks: "[]" } });
      return u;
    });

    try {
      await issueAndSendVerification(user.id, user.email, user.username);
    } catch (mailErr) {
      console.error("[register:verification-email]", mailErr);
      return NextResponse.json(
        { error: "Your account was made, but we could not send the verification email. Try again from sign in." },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true, username: user.username, requiresVerification: true });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
