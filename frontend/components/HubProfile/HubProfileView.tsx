"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckInButton } from "@/components/Economy/CheckInButton";
import { BlockRenderer, type Block } from "@/components/BlockRenderer/BlockRenderer";
import { useAuth } from "@/app/providers";

interface Achievement {
  achievement: { slug: string; name: string; iconEmoji: string; description: string };
  earnedAt: Date;
}

interface ProfileData {
  id: string;
  username: string;
  displayName: string;
  image: string | null;
  bio: string | null;
  status: string | null;
  bannerUrl: string | null;
  accentColor: string;
  shards: number;
  gems: number;
  xp: number;
  level: number;
  streakCount: number;
  longestStreak: number;
  role: string;
  hubProfile: {
    portalEnabled: boolean;
    portalLabel: string;
    tiktokUrl: string | null;
    twitchUrl: string | null;
    youtubeUrl: string | null;
    kickUrl: string | null;
    discordUser: string | null;
    twitterUrl: string | null;
    instagramUrl: string | null;
    showStats: boolean;
    showStreak: boolean;
    activeSkinId: string | null;
    activeAuraId: string | null;
    showcase: Block[];
    interests: string[];
  } | null;
  achievements: Achievement[];
  inventory?: Array<{ id?: string; equippedAt: string | Date | null; item: { slug: string; name: string; description: string | null; type: string } }>;
  posts: any[];
  counts: { posts: number; followers: number; follows: number };
  analytics?: { views30d: number; hubViews30d: number; linkClicks30d: number } | null;
}

const TABS = ["POSTS", "COMMENTS", "ABOUT", "BLOCKS"] as const;
type Tab = (typeof TABS)[number];

export function HubProfileView({ profile, isOwn }: { profile: ProfileData; isOwn: boolean }) {
  const { user: viewer } = useAuth();
  const [tab, setTab] = useState<Tab>("POSTS");
  const [roleBadgeVisible, setRoleBadgeVisible] = useState(true);
  const [inventoryItems, setInventoryItems] = useState(profile.inventory ?? []);
  const [badgeStatus, setBadgeStatus] = useState("");
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(profile.counts.followers);
  const [followLoading, setFollowLoading] = useState(false);
  const [profileComments, setProfileComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const hp = profile.hubProfile;
  const accent = profile.accentColor || "#8b5cf6";
  const portalLabel = hp?.portalLabel === "Enter My Space" || hp?.portalLabel === "Enter My Links" ? "Enter Spotlight" : hp?.portalLabel;
  const profileBackground = hp?.showcase?.find((block) => block.type === "BACKGROUND" && block.config?.url)?.config ?? null;
  const profileFxClass = [
    hp?.activeSkinId ? `profile-skin-${hp.activeSkinId}` : "",
    hp?.activeAuraId ? `profile-aura-${hp.activeAuraId}` : "",
    ...(profile.inventory ?? []).map((entry) => entry.equippedAt ? `profile-equipped-${entry.item.slug}` : ""),
  ].filter(Boolean).join(" ");
  const latestPost = profile.posts[0];
  const equippedItems = inventoryItems.filter((entry) => entry.equippedAt);
  const ownedBadgeItems = inventoryItems.filter((entry) => entry.item.type === "BADGE");
  const roleBadge = useMemo(() => roleBadgeFor(profile.role), [profile.role]);

  useEffect(() => {
    const saved = localStorage.getItem(`peng:role-badge:${profile.username}`);
    if (saved === "off") setRoleBadgeVisible(false);
  }, [profile.username]);

  // Load follow status
  useEffect(() => {
    if (!viewer || isOwn) return;
    fetch(`/api/follow?username=${encodeURIComponent(profile.username)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setFollowing(d.following); setFollowerCount(d.followers); })
      .catch(() => {});
  }, [viewer, profile.username, isOwn]);

  // Load profile comments when that tab is selected
  useEffect(() => {
    if (tab !== "COMMENTS") return;
    setCommentsLoading(true);
    fetch(`/api/profile/comments?username=${encodeURIComponent(profile.username)}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : { comments: [] })
      .then((d) => setProfileComments(d.comments ?? []))
      .catch(() => setProfileComments([]))
      .finally(() => setCommentsLoading(false));
  }, [tab, profile.username]);

  async function toggleFollow() {
    if (!viewer || isOwn) return;
    setFollowLoading(true);
    const method = following ? "DELETE" : "POST";
    const res = await fetch("/api/follow", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: profile.username }),
    });
    const data = await res.json();
    if (res.ok) { setFollowing(data.following); setFollowerCount(data.followers); }
    setFollowLoading(false);
  }

  useEffect(() => {
    if (!isOwn) return;
    fetch("/api/marketplace/inventory", { cache: "no-store" })
      .then((res) => res.ok ? res.json() : { items: [] })
      .then((data) => {
        if (!Array.isArray(data.items)) return;
        setInventoryItems(data.items.map((entry: any) => ({
          id: entry.id,
          equippedAt: entry.equippedAt,
          item: {
            slug: entry.slug,
            name: entry.name,
            description: entry.description,
            type: entry.type,
          },
        })));
      })
      .catch(() => {});
  }, [isOwn]);

  function toggleRoleBadge() {
    setRoleBadgeVisible((current) => {
      const next = !current;
      localStorage.setItem(`peng:role-badge:${profile.username}`, next ? "on" : "off");
      return next;
    });
  }

  async function toggleInventoryBadge(slug: string) {
    setBadgeStatus("updating badge...");
    const res = await fetch("/api/marketplace/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBadgeStatus(data.error ?? "badge update failed");
      return;
    }
    setInventoryItems((items) => items.map((entry) => entry.item.slug === slug ? { ...entry, equippedAt: data.equipped?.equippedAt ?? null } : entry));
    setBadgeStatus(data.equipped?.equippedAt ? "badge on" : "badge off");
    window.setTimeout(() => setBadgeStatus(""), 1600);
  }

  return (
    <div
      className={`${profileBackground?.url ? "hub-profile-custom-bg" : ""} ${profileFxClass}`.trim() || undefined}
      style={profileBackground?.url ? {
        backgroundImage: `linear-gradient(rgba(5,8,16,${Math.min(0.9, Math.max(0, (profileBackground.dim ?? 58) / 100))}), rgba(5,8,16,${Math.min(0.9, Math.max(0, (profileBackground.dim ?? 58) / 100))})), url(${profileBackground.url})`,
        backgroundSize: profileBackground.fit ?? "cover",
        backgroundPosition: profileBackground.position ?? "center",
        backgroundAttachment: profileBackground.fixed === false ? "scroll" : "fixed",
        filter: profileBackground.blur ? `drop-shadow(0 0 0 transparent)` : undefined,
      } : undefined}
      data-testid="hub-profile-view"
    >
      <div
        className={`profile-banner-frame relative -mx-4 mb-0 overflow-hidden rounded-lg lg:-mx-0 ${profile.bannerUrl ? "has-custom-banner" : ""}`}
        style={{
          background: profile.bannerUrl
            ? `radial-gradient(circle at 20% 60%, ${accent}44, transparent 34%), radial-gradient(circle at 80% 35%, rgba(244,114,182,0.18), transparent 28%), linear-gradient(180deg, rgba(5,8,16,0.12), rgba(5,8,16,0.62)), url(${profile.bannerUrl}) center/cover`
            : `radial-gradient(circle at 14% 20%, ${accent}66, transparent 27%), radial-gradient(circle at 82% 18%, rgba(45,212,191,0.26), transparent 28%), linear-gradient(135deg, ${accent}2e 0%, rgba(18,26,42,0.9) 46%, rgba(9,14,25,0.98) 100%)`,
          borderBottom: `1px solid ${accent}33`,
        }}
        data-testid="profile-banner"
      >
        {!profile.bannerUrl && <div className="profile-banner-pattern" aria-hidden="true" />}
        <div className="profile-banner-shade" />
        {isOwn && (
          <Link href="/hub/showcase" className="profile-banner-edit" data-testid="edit-banner-link">
            edit banner
          </Link>
        )}
        <div className="profile-banner-identity">
          <div
            className="profile-avatar"
            style={{
              borderColor: accent,
              background: `linear-gradient(135deg, ${accent}55, ${accent}22)`,
              boxShadow: `0 0 30px ${accent}66`,
            }}
            data-testid="profile-avatar"
          >
            {profile.image ? (
              <img src={profile.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl">P</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {profile.status && (
              <p className="status-thought-bubble profile-status-bubble profile-status-top" data-testid="profile-status">
                {profile.status}
              </p>
            )}
            <div className="flex items-center gap-2">
              <div className="profile-name-badge-wrap">
                {roleBadge && roleBadgeVisible && (
                  <span className={`profile-role-crown profile-role-${roleBadge.key}`} data-testid="profile-role-crown" title={roleBadge.label}>
                    {roleBadge.icon}
                  </span>
                )}
                <h1 className="hub-identity-title profile-crowned-name" data-testid="profile-displayname">
                  {profile.displayName}
                </h1>
              </div>
              {roleBadge && (
                <button
                  type="button"
                  className={`profile-role-toggle ${roleBadgeVisible ? "is-on" : ""}`}
                  onClick={toggleRoleBadge}
                  disabled={!isOwn}
                  data-testid="profile-role-badge-toggle"
                  title={isOwn ? "toggle role badge" : roleBadge.label}
                >
                  {roleBadge.label}
                </button>
              )}
            </div>
            <p className="hub-identity-handle">
              {profile.username} | {profile.role.toLowerCase()}
            </p>
            {profile.bio && <p className="mt-2 text-sm text-white/70" data-testid="profile-bio">{profile.bio}</p>}
            <div className="mt-3 flex flex-wrap items-baseline gap-3 text-xs text-white/50" style={{ fontFamily: "var(--font-mono)" }}>
              <span><b className="text-white">{followerCount}</b> followers</span>
              <span><b className="text-white">{profile.counts.follows}</b> following</span>
              <span><b className="text-white">{profile.counts.posts}</b> posts</span>
              <span className="text-[var(--xp-color)]">{profile.xp} xp · lvl {profile.level}</span>
            </div>
          </div>

          <div className="profile-banner-actions">
            {isOwn ? (
              <div className="profile-action-stack">
                <Link href="/hub/showcase" className="peng-btn peng-btn-ghost w-full justify-center text-xs" data-testid="edit-profile-button">
                  edit profile
                </Link>
                <Link href={`/@${profile.username}`} className="peng-btn peng-btn-primary w-full justify-center text-xs" data-testid="my-creator-profile-button">
                  my spotlight
                </Link>
              </div>
            ) : (
              <button
                onClick={toggleFollow}
                disabled={followLoading || !viewer}
                className={`peng-btn ${following ? "peng-btn-ghost" : "peng-btn-primary"} text-xs`}
                data-testid="follow-button"
              >
                {followLoading ? "..." : following ? "✓ Following" : "+ Follow"}
              </button>
            )}
          </div>
        </div>
      </div>

      {hp?.portalEnabled && (
        <Link
          href={`/@${profile.username}`}
          className="mb-6 mt-4 block w-full py-4 text-center peng-btn peng-btn-primary"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}aa)`,
            borderColor: accent,
            fontFamily: "var(--font-bricolage)",
            fontSize: "0.9rem",
            letterSpacing: "0",
            boxShadow: `0 0 30px ${accent}55`,
          }}
          data-testid="portal-to-space-button"
        >
          {portalLabel}
        </Link>
      )}

      <section className="profile-creator-console" data-testid="profile-creator-console">
        <div className="profile-console-card profile-console-status">
          <span>current signal</span>
          <strong>{profile.status || "building quietly"}</strong>
          <small>{profile.streakCount ? `${profile.streakCount} day streak` : "fresh room"}</small>
        </div>
        <Link href={latestPost ? `/hub/post/${latestPost.id}` : "/hub/post/new"} className="profile-console-card profile-console-featured">
          <span>{latestPost ? "featured post" : "first post"}</span>
          <strong>{latestPost ? latestPost.title : isOwn ? "drop something" : "nothing posted yet"}</strong>
          <small>{latestPost ? `b/${latestPost.board.slug} / ${latestPost.commentCount ?? 0} replies` : "quiet but clean"}</small>
        </Link>
        <div className="profile-console-card profile-console-kit">
          <span>equipped kit</span>
          <strong>{equippedItems.length ? `${equippedItems.length} active` : "base kit"}</strong>
          <small>{equippedItems[0]?.item.name ?? "shop items show here"}</small>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_240px]">
        <div>
          <div className="mb-4 flex gap-1 border-b border-[var(--bg-border)]" data-testid="profile-tabs">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-[10px] tracking-widest transition-colors ${
                  tab === t ? "border-b-2 border-[var(--accent)] text-white" : "text-white/40 hover:text-white"
                }`}
                data-testid={`profile-tab-${t.toLowerCase()}`}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "POSTS" && (
            <div className="space-y-3" data-testid="profile-posts">
              {profile.posts.length === 0 ? (
                <p className="py-8 text-center text-xs italic text-white/30">no posts yet</p>
              ) : (
                profile.posts.map((p: any) => (
                  <Link key={p.id} href={`/hub/post/${p.id}`} className="block peng-card hover:border-[var(--accent)]/40">
                    <div className="mb-2 text-xs" style={{ fontFamily: "var(--font-mono)" }}>
                      <span className="text-white/60">b/{p.board.slug}</span>
                      <span className="mx-2 text-white/20">|</span>
                      <span className="text-white/40">{new Date(p.createdAt).toLocaleDateString()}</span>
                      {p.flair && <span className="ml-2 rounded border border-[var(--bg-border)] px-2 py-0.5 text-[10px]">{p.flair}</span>}
                    </div>
                    <h3 className="text-base font-bold text-white" style={{ fontFamily: "var(--font-bricolage)" }}>{p.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-white/60">{p.body}</p>
                  </Link>
                ))
              )}
            </div>
          )}

          {tab === "COMMENTS" && (
            <div className="space-y-2" data-testid="profile-comments">
              {commentsLoading && (
                <p className="py-8 text-center text-xs text-white/30" style={{ fontFamily: "var(--font-mono)" }}>loading...</p>
              )}
              {!commentsLoading && profileComments.length === 0 && (
                <p className="py-8 text-center text-xs italic text-white/30" style={{ fontFamily: "var(--font-mono)" }}>// no comments yet</p>
              )}
              {profileComments.map((c: any) => (
                <Link key={c.id} href={`/hub/post/${c.postId}`} className="block peng-card hover:border-[var(--accent)]/40">
                  <div className="mb-1 flex items-center gap-2 text-[10px] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
                    <span>b/{c.boardSlug ?? "?"}</span>
                    <span className="text-white/20">·</span>
                    <span>{c.postTitle ?? "post"}</span>
                    <span className="ml-auto">{c.ago ?? new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-white/80">{c.body}</p>
                </Link>
              ))}
            </div>
          )}

          {tab === "ABOUT" && (
            <div className="space-y-3" data-testid="profile-about">
              <div className="peng-card">
                <p className="mb-2 text-[10px] tracking-widest text-white/40" style={{ fontFamily: "var(--font-mono)" }}>BIO</p>
                <p className="text-sm text-white/80">{profile.bio ?? "no bio yet"}</p>
              </div>
              {hp && (
                <div className="peng-card">
                  <p className="mb-2 text-[10px] tracking-widest text-white/40" style={{ fontFamily: "var(--font-mono)" }}>SOCIALS</p>
                  <div className="flex flex-wrap gap-2">
                    {hp.tiktokUrl && <a href={hp.tiktokUrl} target="_blank" rel="noopener" className="peng-btn peng-btn-ghost text-xs">TikTok</a>}
                    {hp.twitchUrl && <a href={hp.twitchUrl} target="_blank" rel="noopener" className="peng-btn peng-btn-ghost text-xs">Twitch</a>}
                    {hp.youtubeUrl && <a href={hp.youtubeUrl} target="_blank" rel="noopener" className="peng-btn peng-btn-ghost text-xs">YouTube</a>}
                    {hp.kickUrl && <a href={hp.kickUrl} target="_blank" rel="noopener" className="peng-btn peng-btn-ghost text-xs">Kick</a>}
                    {hp.twitterUrl && <a href={hp.twitterUrl} target="_blank" rel="noopener" className="peng-btn peng-btn-ghost text-xs">X</a>}
                    {hp.instagramUrl && <a href={hp.instagramUrl} target="_blank" rel="noopener" className="peng-btn peng-btn-ghost text-xs">Instagram</a>}
                    {hp.discordUser && <span className="peng-btn peng-btn-ghost text-xs opacity-60">discord: {hp.discordUser}</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "BLOCKS" && (
            <div className="space-y-3" data-testid="profile-showcase">
              {(hp?.showcase ?? []).length === 0 ? (
                <div className="peng-card py-12 text-center">
                  <p className="mb-2 text-xs text-white/40" style={{ fontFamily: "var(--font-mono)" }}>// no profile blocks yet</p>
                  {isOwn && (
                    <Link href="/hub/showcase" className="peng-btn peng-btn-primary mt-2 inline-block text-xs" data-testid="add-showcase-link">
                      Customize Profile
                    </Link>
                  )}
                </div>
              ) : (
                <BlockRenderer blocks={hp!.showcase} isOwner={isOwn} gemsUnlocked={true} />
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {hp?.showStats && (
            <div className="peng-card">
              <p className="mb-3 text-[10px] tracking-widest text-white/40" style={{ fontFamily: "var(--font-mono)" }}>STATS</p>
              <Stat label="XP" value={profile.xp} color="var(--xp-color)" />
              <Stat label="LVL" value={profile.level} color={accent} />
            </div>
          )}
          {isOwn && profile.analytics && (
            <div className="peng-card profile-insights-card">
              <p className="mb-3 text-[10px] tracking-widest text-white/40" style={{ fontFamily: "var(--font-mono)" }}>INSIGHTS</p>
              <Stat label="SPOTLIGHT VIEWS" value={profile.analytics.views30d} color="var(--accent-2)" />
              <Stat label="HUB VIEWS" value={profile.analytics.hubViews30d} color={accent} />
              <Stat label="LINK CLICKS" value={profile.analytics.linkClicks30d} color="var(--gem-color)" />
              <p className="mt-3 text-[10px] text-white/32" style={{ fontFamily: "var(--font-mono)" }}>last 30 days</p>
            </div>
          )}

          {hp?.showStreak && (
            <div className="peng-card">
              <p className="mb-2 text-[10px] tracking-widest text-white/40" style={{ fontFamily: "var(--font-mono)" }}>STREAK</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-orange-400" data-testid="profile-streak">{profile.streakCount}</span>
                {isOwn && <CheckInButton />}
              </div>
              <p className="mt-1 text-[10px] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>best: {profile.longestStreak}</p>
            </div>
          )}

          <div className="peng-card">
            <p className="mb-2 text-[10px] tracking-widest text-white/40" style={{ fontFamily: "var(--font-mono)" }}>BADGES</p>
            <div className="flex flex-wrap gap-1">
              {roleBadge && roleBadgeVisible && (
                <span className="profile-shop-badge profile-role-list-badge" data-testid="profile-role-list-badge">
                  {roleBadge.icon} {roleBadge.label}
                </span>
              )}
              {profile.achievements.length === 0 && equippedItems.filter((entry) => entry.item.type === "BADGE").length === 0 && (!roleBadge || !roleBadgeVisible) && <p className="text-xs italic text-white/30">none yet</p>}
              {equippedItems.filter((entry) => entry.item.type === "BADGE").map((entry) => (
                <span
                  key={entry.item.slug}
                  className="profile-shop-badge"
                  title={entry.item.description ?? entry.item.name}
                  data-testid={`shop-badge-${entry.item.slug}`}
                >
                  {shopBadgeIcon(entry.item.slug)} {entry.item.name}
                </span>
              ))}
              {profile.achievements.map((ua) => (
                <span
                  key={ua.achievement.slug}
                  className="rounded border border-[var(--bg-border)] px-2 py-1 text-[10px] text-white/70"
                  title={ua.achievement.description}
                  data-testid={`badge-${ua.achievement.slug}`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {ua.achievement.iconEmoji} {ua.achievement.name}
                </span>
              ))}
            </div>
            {isOwn && (
              <div className="profile-badge-controls" data-testid="profile-badge-controls">
                {roleBadge && (
                  <button type="button" className={roleBadgeVisible ? "is-on" : ""} onClick={toggleRoleBadge}>
                    <span>{roleBadge.icon}</span>
                    <strong>{roleBadgeVisible ? "hide owner badge" : "show owner badge"}</strong>
                  </button>
                )}
                {ownedBadgeItems.map((entry) => (
                  <button
                    key={entry.item.slug}
                    type="button"
                    className={entry.equippedAt ? "is-on" : ""}
                    onClick={() => toggleInventoryBadge(entry.item.slug)}
                  >
                    <span>{shopBadgeIcon(entry.item.slug)}</span>
                    <strong>{entry.item.name}</strong>
                  </button>
                ))}
                {ownedBadgeItems.length === 0 && <small>buy badges in the shop and they will show here.</small>}
                {badgeStatus && <small>{badgeStatus}</small>}
              </div>
            )}
          </div>

          <div className="peng-card">
            <p className="mb-2 text-[10px] tracking-widest text-white/40" style={{ fontFamily: "var(--font-mono)" }}>INTERESTS</p>
            {(hp?.interests ?? []).length === 0 ? (
              <p className="text-xs italic text-white/30">none yet</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {hp!.interests.map((i, idx) => (
                  <span key={idx} className="rounded border border-[var(--bg-border)] px-2 py-1 text-[10px] text-white/70" style={{ fontFamily: "var(--font-mono)" }}>
                    {i}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function roleBadgeFor(role: string) {
  const key = role.toLowerCase();
  if (key === "admin" || key === "owner") return { key: "owner", label: "owner", icon: "♛" };
  if (key === "mod") return { key: "mod", label: "mod", icon: "◆" };
  return null;
}

function shopBadgeIcon(slug: string) {
  if (slug.includes("vip")) return "VIP";
  if (slug.includes("founder")) return "F";
  if (slug.includes("boost")) return "BOOST";
  if (slug.includes("support")) return "SUP";
  if (slug.includes("chat")) return "CHAT";
  return "*";
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-xs" style={{ fontFamily: "var(--font-mono)" }}>
      <span className="text-white/50" style={{ color }}>{label}</span>
      <span className="font-bold text-white">{value.toLocaleString()}</span>
    </div>
  );
}
