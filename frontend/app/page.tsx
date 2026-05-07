import Link from "next/link";
import { GifBackground } from "@/components/Landing/GifBackground";
import { PengLetters } from "@/components/Landing/PengLetters";
import { SnowParticles } from "@/components/Landing/SnowParticles";
import { CursorPenguins } from "@/components/Landing/CursorPenguins";
import { EnterHubButton } from "@/components/Landing/EnterHubButton";
import { prisma } from "@/lib/prisma";

export default async function LandingPage() {
  const peng = await prisma.user.findUnique({
    where: { username: "peng" },
    select: { status: true },
  });

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden page-fade-in" data-testid="landing-page">
      <GifBackground />
      <PengLetters />
      <SnowParticles />
      <CursorPenguins />

      <div
        className="pointer-events-none fixed inset-0 -z-5"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex select-none flex-col items-center px-6 text-center">
        <div className="landing-wordmark-wrap">
          {peng?.status && (
            <p className="status-thought-bubble landing-status-bubble" data-testid="landing-status">
              {peng.status}
            </p>
          )}

          <h1
            className="mb-3 text-6xl font-black tracking-tight text-white md:text-8xl"
            style={{
              fontFamily: "var(--font-syne)",
                  textShadow: "0 0 40px rgba(139,92,246,0.5), 0 0 80px rgba(45,212,191,0.18)",
            }}
          >
            peng
          </h1>
        </div>

        <p
          className="mb-10 text-xs uppercase opacity-60"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--text)",
            letterSpacing: "0.3em",
          }}
        >
          creator / streamer
        </p>

        <EnterHubButton />

        <div className="mt-4 flex items-center gap-6 opacity-50 transition-opacity hover:opacity-100">
          <SocialLink href="https://tiktok.com/@peng" label="TikTok">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9a8.19 8.19 0 0 0 4.78 1.52V7.07a4.85 4.85 0 0 1-1.01-.38z" />
            </svg>
          </SocialLink>
          <SocialLink href="https://twitch.tv/peng" label="Twitch">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
            </svg>
          </SocialLink>
          <SocialLink href="https://discord.gg/peng" label="Discord">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.12-.098.244-.196.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </SocialLink>
        </div>

        <p className="mt-10 text-xs opacity-30" style={{ fontFamily: "var(--font-mono)" }}>
          <Link href="/auth/signup" className="underline underline-offset-4 hover:opacity-80">
            create account
          </Link>
          {" / "}
          <Link href="/auth/signin" className="underline underline-offset-4 hover:opacity-80">
            sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="text-[var(--text)] transition-colors hover:text-white"
    >
      {children}
    </a>
  );
}
