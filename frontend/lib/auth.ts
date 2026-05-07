// Custom JWT cookie auth — replaces NextAuth.
// HttpOnly cookie holds a signed JWT containing { sub: userId }.
// Session data is fetched fresh from DB on each request to ensure balances/levels are current.

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "peng_session";
const ALG = "HS256";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(userId: string): Promise<string> {
  return await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  image: string | null;
  bio: string | null;
  status: string | null;
  bannerUrl: string | null;
  accentColor: string;
  role: string;
  shards: number;
  gems: number;
  xp: number;
  level: number;
  streakCount: number;
  longestStreak: number;
  gemsUnlocked: boolean;
  onboarded: boolean;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const userId = await verifySessionToken(token);
  if (!userId) return null;

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      image: true,
      bio: true,
      status: true,
      bannerUrl: true,
      accentColor: true,
      role: true,
      shards: true,
      gems: true,
      xp: true,
      level: true,
      streakCount: true,
      longestStreak: true,
      gemsUnlocked: true,
      onboarded: true,
    },
  });
  return u;
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

// Compatibility wrapper for old code expecting NextAuth's `auth()`
export async function auth() {
  const u = await getCurrentUser();
  return u ? { user: u } : null;
}
