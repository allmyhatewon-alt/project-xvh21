import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signSessionToken, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }
    const { identifier, password } = parsed.data;
    const normalized = identifier.toLowerCase().trim();
    const lookup = normalized.includes("@")
      ? { email: normalized }
      : { username: normalized };

    const user = await prisma.user.findUnique({
      where: lookup,
      select: { id: true, passwordHash: true, username: true, emailVerified: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ error: "Verify your email before signing in." }, { status: 403 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signSessionToken(user.id);
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, username: user.username });
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
