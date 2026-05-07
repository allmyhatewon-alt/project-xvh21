import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { BlockRenderer } from "@/components/BlockRenderer/BlockRenderer";
import { GuestbookWidget } from "@/components/Space/GuestbookWidget";
import { ProfileViewPing } from "@/components/Analytics/ProfileViewPing";
import type { Block } from "@/components/BlockRenderer/BlockRenderer";
import Link from "next/link";
import type { Metadata } from "next";

interface Props { params: { username: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    select: { displayName: true, space: true },
  });
  if (!user || !user.space) return { title: "Not Found" };
  return {
    title: user.space.metaTitle ?? `${user.displayName}'s Links`,
    description: user.space.metaDescription ?? `Welcome to ${user.displayName}'s links`,
  };
}

export default async function SpacePage({ params }: Props) {
  const viewer = await getCurrentUser();
  const userRow = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    select: {
      id: true,
      username: true,
      displayName: true,
      accentColor: true,
      gemsUnlocked: true,
      bio: true,
      status: true,
      image: true,
      bannerUrl: true,
      space: true,
    },
  });
  if (!userRow || !userRow.space) notFound();

  const space = userRow.space;
  const isOwner = viewer?.username === userRow.username;
  if (!space.published && !isOwner) notFound();

  const blocks = (JSON.parse(space.blocks || "[]") || []) as Block[];
    const background = blocks.find((block) => block.type === "BACKGROUND")?.config ?? null;
  const themePreset = background?.themePreset ?? "clean";
  const hasGuestbook = blocks.some((block) => block.type === "GUESTBOOK");
  const isSignalSpotlight = blocks.some((block) => block.type === "SIGNAL_LANDING");

  const cssVars = {
    "--user-accent": userRow.accentColor,
    "--user-accent-glow": `${userRow.accentColor}33`,
    "--profile-name-glow": `0 0 ${Math.round((background?.nameGlow ?? 35) / 2)}px ${userRow.accentColor}`,
    "--profile-banner-glow": `0 0 ${Math.round((background?.bannerGlow ?? 45) / 2)}px ${userRow.accentColor}${Math.round((background?.bannerGlow ?? 45) * 1.6).toString(16).padStart(2, "0")}`,
  } as React.CSSProperties;

  const bgLayers = (
    <>
      {background?.url ? (
        <>
          <div
            className="space-background-layer"
            style={{
              backgroundImage: `url(${background.url})`,
              backgroundSize: background.fit ?? "cover",
              backgroundPosition: background.position ?? "center",
              backgroundAttachment: background.fixed === false ? "scroll" : "fixed",
              filter: `blur(${background.blur ?? 0}px)`,
              transform: (background.blur ?? 0) > 0 ? "scale(1.03)" : undefined,
            }}
            data-testid="space-background-layer"
          />
          <div
            className="space-background-dim"
            style={{ background: `rgba(5,8,16,${Math.min(0.9, Math.max(0, (background.dim ?? 58) / 100))})` }}
          />
        </>
      ) : (
        <>
          <div className="space-background-layer theme-background-layer" data-testid="space-theme-background" />
          <div className="space-background-dim" style={{ background: "rgba(5,8,16,0.45)" }} />
        </>
      )}
    </>
  );

  // ── SIGNAL / full-bleed layout ──────────────────────────────────────────
  if (isSignalSpotlight) {
    return (
      <div
        className={`relative min-h-screen overflow-x-hidden space-theme-${themePreset}`}
        style={cssVars}
        data-testid="personal-space"
      >
        {bgLayers}
        {space.customCss && (
          <style dangerouslySetInnerHTML={{ __html: space.customCss.replace(/<\/?style[^>]*>/gi, "") }} />
        )}
        {!isOwner && <ProfileViewPing username={userRow.username} />}

        {/* Floating nav — sits above the full-bleed block */}
        <div className="absolute top-4 left-5 right-5 z-30 flex items-center justify-between pointer-events-none">
          <Link href="/hub" className="pointer-events-auto text-xs text-white/40 hover:text-white transition-colors" data-testid="back-to-hub-link" style={{ fontFamily: "var(--font-mono)" }}>{"<-"} pengelus</Link>
          {isOwner && (
            <div className="flex gap-2 pointer-events-auto">
              <Link href="/hub/space/edit" className="peng-btn peng-btn-ghost text-xs" data-testid="edit-space-link">Edit Space</Link>
              {!space.published && (
                <span className="peng-btn peng-btn-ghost text-xs opacity-40" style={{ cursor: "default" }}>DRAFT</span>
              )}
            </div>
          )}
        </div>

        {/* Full-bleed blocks — no container, no padding */}
        <div className="relative z-10">
          <BlockRenderer blocks={blocks} isOwner={isOwner} gemsUnlocked={isOwner ? userRow.gemsUnlocked : true} />
          {hasGuestbook && <div className="mx-auto max-w-2xl px-4 mt-4"><GuestbookWidget username={userRow.username} /></div>}
        </div>
      </div>
    );
  }

  // ── Standard layout ─────────────────────────────────────────────────────
  return (
    <div
      className={`relative min-h-screen overflow-hidden pb-24 pt-12 space-theme-${themePreset}`}
      style={cssVars}
      data-testid="personal-space"
    >
      {bgLayers}
      {space.customCss && (
        <style dangerouslySetInnerHTML={{ __html: space.customCss.replace(/<\/?style[^>]*>/gi, "") }} />
      )}
      {!isOwner && <ProfileViewPing username={userRow.username} />}

      <div className="relative z-10 mx-auto px-4 max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/hub" className="text-xs text-white/40 hover:text-white" data-testid="back-to-hub-link" style={{ fontFamily: "var(--font-mono)" }}>{"<-"} pengelus</Link>
          {isOwner && (
            <div className="flex gap-2">
              <Link href="/hub/space/edit" className="peng-btn peng-btn-ghost text-xs" data-testid="edit-space-link">Edit Space</Link>
              {!space.published && (
                <span className="peng-btn peng-btn-ghost text-xs opacity-40" style={{ cursor: "default" }}>DRAFT</span>
              )}
            </div>
          )}
        </div>

        <div className="personal-site-head mb-10">
          <div
            className={`personal-site-banner ${userRow.bannerUrl ? "has-custom-banner" : ""}`}
            style={{
              background: userRow.bannerUrl
                ? `radial-gradient(circle at 20% 60%, ${userRow.accentColor}44, transparent 34%), radial-gradient(circle at 80% 35%, rgba(244,114,182,0.18), transparent 28%), linear-gradient(180deg, rgba(5,8,16,0.1), rgba(5,8,16,0.62)), url(${userRow.bannerUrl}) center/cover`
                : `radial-gradient(circle at 16% 22%, ${userRow.accentColor}66, transparent 30%), radial-gradient(circle at 84% 14%, rgba(45,212,191,0.24), transparent 28%), linear-gradient(135deg, ${userRow.accentColor}2e, rgba(18,26,42,0.88) 48%, rgba(8,12,22,0.98))`,
              boxShadow: "var(--profile-banner-glow), inset 0 -64px 74px rgba(0,0,0,0.46)",
            }}
            data-testid="space-banner"
          >
            {!userRow.bannerUrl && <div className="profile-banner-pattern" aria-hidden="true" />}
            <div className="profile-banner-shade" />
            <div className="personal-site-identity">
              <div className="inline-flex w-20 h-20 rounded-full overflow-hidden border-2 mb-3 relative z-10" style={{ borderColor: userRow.accentColor, boxShadow: `0 0 30px ${userRow.accentColor}55` }}>
                {userRow.image ? <img src={userRow.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl" style={{ background: `${userRow.accentColor}33` }}>P</div>}
              </div>
              {userRow.status && (
                <p className="status-thought-bubble personal-status-bubble" data-testid="space-status">
                  {userRow.status}
                </p>
              )}
              <h1 className="hub-identity-title" data-testid="space-displayname" style={{ textShadow: "var(--profile-name-glow)" }}>{userRow.displayName}</h1>
              <p className="text-xs text-white/50 mt-1" style={{ fontFamily: "var(--font-mono)" }}>@{userRow.username}</p>
            </div>
          </div>
          {userRow.bio && <p className="text-sm text-white/60 mt-3 max-w-md mx-auto">{userRow.bio}</p>}
        </div>

        {blocks.length === 0 ? (
          <div className="text-center py-24 opacity-30" style={{ fontFamily: "var(--font-mono)" }}>
            <p className="text-4xl mb-4"></p>
            <p className="text-sm">this space is empty</p>
            {isOwner && (
              <Link href="/hub/space/edit" className="peng-btn peng-btn-primary text-xs mt-4 inline-flex" data-testid="build-space-link">
                Build Your Space
              </Link>
            )}
          </div>
        ) : (
          <>
            <BlockRenderer blocks={blocks} isOwner={isOwner} gemsUnlocked={isOwner ? userRow.gemsUnlocked : true} />
            {hasGuestbook && <div className="mt-4"><GuestbookWidget username={userRow.username} /></div>}
          </>
        )}
      </div>
    </div>
  );
}
