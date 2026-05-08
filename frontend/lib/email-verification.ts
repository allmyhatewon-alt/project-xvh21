import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const VERIFY_TTL_HOURS = 24;

function getAppUrl() {
  return (
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

function getEmailFrom() {
  return process.env.EMAIL_FROM?.trim() || "Pengelus <noreply@pengelus.me>";
}

function getResendKey() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return key;
}

export function hashVerificationToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createEmailVerification(userId: string, email: string) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashVerificationToken(rawToken);
  const expiresAt = new Date(Date.now() + VERIFY_TTL_HOURS * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      email,
      tokenHash,
      expiresAt,
    },
  });

  return {
    rawToken,
    expiresAt,
    verifyUrl: `${getAppUrl()}/api/auth/verify-email?token=${rawToken}`,
  };
}

export async function sendVerificationEmail(input: {
  email: string;
  username: string;
  verifyUrl: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getResendKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: [input.email],
      subject: "Verify your Pengelus account",
      html: `
        <div style="font-family:Arial,sans-serif;background:#0b1120;color:#f8fafc;padding:32px">
          <div style="max-width:560px;margin:0 auto;background:#111827;border:1px solid rgba(148,163,184,0.18);border-radius:18px;padding:28px">
            <p style="margin:0 0 12px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#2dd4bf">Pengelus</p>
            <h1 style="margin:0 0 12px;font-size:28px;line-height:1.1">Verify your email</h1>
            <p style="margin:0 0 20px;color:#cbd5e1;font-size:15px;line-height:1.6">
              Hey ${escapeHtml(input.username)}, click the button below to verify your account and unlock posting, chat, and the rest of the site.
            </p>
            <a href="${input.verifyUrl}" style="display:inline-block;background:#8b5cf6;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">Verify email</a>
            <p style="margin:20px 0 0;color:#94a3b8;font-size:13px;line-height:1.6">
              If the button acts weird, paste this into your browser:<br />
              <a href="${input.verifyUrl}" style="color:#5eead4;word-break:break-all">${input.verifyUrl}</a>
            </p>
          </div>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function issueAndSendVerification(userId: string, email: string, username: string) {
  await prisma.emailVerificationToken.deleteMany({ where: { userId, usedAt: null } });
  const payload = await createEmailVerification(userId, email);
  await sendVerificationEmail({
    email,
    username,
    verifyUrl: payload.verifyUrl,
  });
  return payload;
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
