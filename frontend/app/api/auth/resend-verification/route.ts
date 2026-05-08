import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueAndSendVerification } from "@/lib/email-verification";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, username: true, email: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ ok: true });
    }

    if (user.emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    await issueAndSendVerification(user.id, user.email, user.username);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[resend-verification]", err);
    return NextResponse.json({ error: "Could not resend the verification email." }, { status: 500 });
  }
}
