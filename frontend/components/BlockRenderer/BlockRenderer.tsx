"use client";
import { useEffect, useRef, useState } from "react";

export interface Block {
  id: string;
  type: string; // BACKGROUND | TEXT | IMAGE | VIDEO_EMBED | MUSIC_PLAYER | SOCIAL_LINKS | PORTAL | CUSTOM_HTML | STATS_CARD | GUESTBOOK | COUNTDOWN | SPOTIFY_EMBED | TIKTOK_FEED | MP3_UPLOAD | BEST_FRIENDS | NOW_STATUS | MARQUEE | QUOTE_CARD | PHOTO_GRID | ABOUT_ME | INTEREST_TAGS | ACHIEVEMENTS | SIGNAL_LANDING | SIGNAL_LANDING
  order: number;
  config: Record<string, any>;
  gemsRequired?: boolean;
}

interface Props { blocks: Block[]; isOwner?: boolean; gemsUnlocked?: boolean }

export function BlockRenderer({ blocks, isOwner, gemsUnlocked }: Props) {
  const sorted = [...blocks].sort((a, b) => a.order - b.order).filter((b) => b.type !== "BACKGROUND" && b.type !== "GUESTBOOK");
  return (
    <div className="flex flex-col gap-4 w-full" data-testid="block-renderer">
      {sorted.map((block) => {
        if (block.gemsRequired && !gemsUnlocked) {
          return (
            <div key={block.id} className="peng-card opacity-40 text-center text-xs" data-testid={`gem-locked-${block.id}`} style={{ fontFamily: "var(--font-mono)" }}>
              ◆ gems required to view this block
            </div>
          );
        }
        return <BlockItem key={block.id} block={block} />;
      })}
    </div>
  );
}

function BlockItem({ block }: { block: Block }) {
  switch (block.type) {
    case "BACKGROUND": return null;
    case "TEXT": return <TextBlock config={block.config} />;
    case "IMAGE": return <ImageBlock config={block.config} />;
    case "VIDEO_EMBED": return <VideoBlock config={block.config} />;
    case "MUSIC_PLAYER": return <EnhancedMusicPlayerBlock config={block.config} />;
    case "SOCIAL_LINKS": return <RichSocialLinksBlock config={block.config} />;
    case "PORTAL": return <PortalBlock config={block.config} />;
    case "STATS_CARD": return <StatsCardBlock config={block.config} />;
    case "COUNTDOWN": return <CountdownBlock config={block.config} />;
    case "SPOTIFY_EMBED": return <SpotifyBlock config={block.config} />;
    case "TIKTOK_FEED": return <TikTokBlock config={block.config} />;
    case "MP3_UPLOAD": return <MP3Block config={block.config} />;
    case "CUSTOM_HTML": return <CustomHtmlBlock config={block.config} />;
    case "GUESTBOOK": return <GuestbookBlock config={block.config} />;
    case "BEST_FRIENDS": return <BestFriendsBlock config={block.config} />;
    case "NOW_STATUS": return <NowStatusBlock config={block.config} />;
    case "MARQUEE": return <MarqueeBlock config={block.config} />;
    case "QUOTE_CARD": return <QuoteCardBlock config={block.config} />;
    case "PHOTO_GRID": return <PhotoGridBlock config={block.config} />;
    case "ABOUT_ME": return <AboutMeBlock config={block.config} />;
    case "INTEREST_TAGS": return <InterestTagsBlock config={block.config} />;
    case "ACHIEVEMENTS": return <AchievementsBlock config={block.config} />;
    case "SIGNAL_LANDING": return <SignalLandingBlock config={block.config} />;
    default: return null;
  }
}

// ─── TEXT ─────────────────────────────────────────────────────────────────────
function TextBlock({ config }: { config: any }) {
  const effect = config.effect ?? "none";
  const size = config.size ?? "normal";
  const align = config.align ?? "left";
  const accent = config.accent ?? "var(--accent)";
  return (
    <div
      className={`peng-card text-gfx-card text-gfx-${effect} text-gfx-size-${size}`}
      style={{ textAlign: align, ["--text-gfx-accent" as any]: accent }}
    >
      {config.heading && <h2 className="text-gfx-heading mb-2" style={{ fontFamily: "var(--font-syne)" }}>{config.heading}</h2>}
      {config.body && <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{config.body}</p>}
    </div>
  );
}

// ─── IMAGE ────────────────────────────────────────────────────────────────────
function ImageBlock({ config }: { config: any }) {
  if (!config.url) return null;
  const frame = config.frame ?? "none";
  const neonColor = config.neonColor ?? "#f472b6";

  const wrapStyle: React.CSSProperties =
    frame === "polaroid"
      ? { background: "#fff", padding: "10px 10px 36px 10px", boxShadow: "0 6px 32px rgba(0,0,0,0.6)", transform: `rotate(${config.tilt ?? -1.5}deg)`, borderRadius: "2px" }
      : frame === "vhs"
      ? { border: "3px solid #00ff41", boxShadow: "0 0 14px #00ff4155, inset 0 0 10px #00ff4110" }
      : frame === "neon"
      ? { border: `3px solid ${neonColor}`, boxShadow: `0 0 22px ${neonColor}66, inset 0 0 12px ${neonColor}18` }
      : {};

  const imgFilter =
    frame === "vhs" ? "saturate(1.3) contrast(1.1)" : undefined;

  return (
    <div className={`${frame === "none" ? "peng-card !p-0" : ""} overflow-hidden`} style={frame !== "none" ? wrapStyle : {}}>
      <img
        src={config.url}
        alt={config.alt ?? ""}
        className="w-full object-cover"
        style={{ maxHeight: config.maxHeight ?? "400px", display: "block", filter: imgFilter }}
      />
      {config.caption && (
        <p
          className="text-xs text-white/40 px-4 py-2"
          style={{ fontFamily: frame === "polaroid" ? "cursive" : "var(--font-mono)", color: frame === "polaroid" ? "#333" : undefined }}
        >
          {config.caption}
        </p>
      )}
    </div>
  );
}

// ─── VIDEO ────────────────────────────────────────────────────────────────────
function VideoBlock({ config }: { config: any }) {
  if (!config.embedUrl) return null;
  return (
    <div className="peng-card !p-0 overflow-hidden aspect-video">
      <iframe src={config.embedUrl} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
    </div>
  );
}

// ─── MUSIC PLAYER ─────────────────────────────────────────────────────────────
function EnhancedMusicPlayerBlock({ config }: { config: any }) {
  const playerType = config.playerType ?? (config.embedUrl ? "spotify" : "direct");
  const audioSrc = config.audioUrl || config.url;
  const embedSrc = normalizeMusicEmbed(config.embedUrl, playerType);
  const cover = config.coverUrl;
  const style = config.playerStyle ?? "spotlight";
  const accent = config.accent ?? "#8b5cf6";
  const caption = config.caption ?? "now playing";

  if (playerType === "direct") {
    return <DirectSpotlightMusicPlayer config={config} audioSrc={audioSrc} accent={accent} caption={caption} cover={cover} styleName={style} />;
  }

  if (playerType !== "direct") {
    return (
      <div className={`peng-card music-embed-card spotlight-music-card music-style-${style}`} style={{ ["--music-accent" as any]: accent }}>
        <div className="spotlight-music-head">
          <div className="flex min-w-0 items-center gap-3">
            {cover ? <img src={cover} alt="" className="music-cover-thumb" /> : <span className="spotlight-music-disc" />}
            <div className="min-w-0">
              <span>{caption}</span>
              <p>{config.title ?? labelForMusicPlayer(playerType)}</p>
              {config.artist && <small>{config.artist}</small>}
            </div>
          </div>
          <span className="music-player-pill">{labelForMusicPlayer(playerType)}</span>
        </div>
        {embedSrc ? (
          <iframe src={embedSrc} className={`music-embed-frame music-embed-${playerType}`} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
        ) : (
          <p className="text-xs text-white/35" style={{ fontFamily: "var(--font-mono)" }}>add an embed URL to wake this player up</p>
        )}
      </div>
    );
  }

  return (
    <div className={`peng-card music-direct-card music-style-${style} flex items-center gap-4`}>
      <span className="music-direct-icon">{"♪"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{config.title ?? "Track"}</p>
        {config.artist && <p className="text-xs text-white/40 truncate">{config.artist}</p>}
        <div className="music-wave" aria-hidden="true"><span /><span /><span /><span /><span /></div>
      </div>
      {audioSrc ? (
        <audio controls src={audioSrc} className="w-48" style={{ height: "32px" }} />
      ) : (
        <span className="text-[11px] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>no audio yet</span>
      )}
    </div>
  );
}

function labelForMusicPlayer(type: string) {
  const map: Record<string, string> = { soundcloud: "SoundCloud", youtube: "YouTube", bandcamp: "Bandcamp", spotify: "Spotify" };
  return map[type] ?? "Audio";
}

function DirectSpotlightMusicPlayer({
  config,
  audioSrc,
  accent,
  caption,
  cover,
  styleName,
}: {
  config: any;
  audioSrc: string;
  accent: string;
  caption: string;
  cover?: string;
  styleName: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const tick = () => {
      setProgress(audio.currentTime);
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const ended = () => setPlaying(false);
    audio.addEventListener("timeupdate", tick);
    audio.addEventListener("loadedmetadata", tick);
    audio.addEventListener("ended", ended);
    return () => {
      audio.removeEventListener("timeupdate", tick);
      audio.removeEventListener("loadedmetadata", tick);
      audio.removeEventListener("ended", ended);
    };
  }, [audioSrc]);

  // Autoplay guard — only fire once per session per track so navigating
  // back to hub (or any page that re-mounts this component) doesn't
  // re-trigger playback every time.
  useEffect(() => {
    if (!config.autoPlay || !audioSrc) return;
    const key = `peng_ap_${audioSrc}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;
    const audio = audioRef.current;
    if (!audio) return;
    const tryPlay = () => {
      audio.play().then(() => {
        setPlaying(true);
        if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, "1");
      }).catch(() => {});
    };
    if (audio.readyState >= 2) {
      tryPlay();
    } else {
      audio.addEventListener("canplay", tryPlay, { once: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSrc]);

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    await audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setProgress(value);
  }

  const pct = duration ? Math.min(100, Math.max(0, (progress / duration) * 100)) : 0;

  return (
    <div className={`peng-card spotlight-music-card music-direct-card music-style-${styleName} ${playing ? "is-playing" : ""}`} style={{ ["--music-accent" as any]: accent, ["--music-progress" as any]: `${pct}%` }}>
      <div className="spotlight-music-cover">
        {cover ? <img src={cover} alt="" /> : <span>{"♫"}</span>}
      </div>
      <div className="spotlight-music-body">
        <div className="spotlight-music-head">
          <div className="min-w-0">
            <span>{caption}</span>
            <p>{config.title ?? "Track"}</p>
            {config.artist && <small>{config.artist}</small>}
          </div>
          <button type="button" onClick={togglePlay} className="spotlight-music-play" disabled={!audioSrc}>
            {playing ? "pause" : "play"}
          </button>
        </div>
        <div className="music-wave" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5, 6].map((bar) => <span key={bar} style={{ animationDelay: `${bar * 0.08}s` }} />)}
        </div>
        <div className="spotlight-music-progress">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={progress}
            onChange={(event) => seek(Number(event.target.value))}
            disabled={!duration}
            aria-label="track progress"
          />
        </div>
        <div className="spotlight-music-time">
          <span>{formatMusicTime(progress)}</span>
          <span>{duration ? formatMusicTime(duration) : "--:--"}</span>
        </div>
      </div>
      {audioSrc ? (
        <audio ref={audioRef} src={audioSrc} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      ) : (
        <span className="spotlight-music-empty">no audio yet</span>
      )}
    </div>
  );
}

function formatMusicTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function normalizeMusicEmbed(raw: string | undefined, type: string) {
  if (!raw) return "";
  const iframeSrc = raw.match(/src=["']([^"']+)["']/i)?.[1];
  if (iframeSrc) raw = iframeSrc;
  try {
    const url = new URL(raw);
    if (type === "youtube") {
      const id = url.hostname.includes("youtu.be") ? url.pathname.slice(1) : url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : raw;
    }
    if (type === "spotify" && url.hostname.endsWith("open.spotify.com")) {
      if (url.pathname.startsWith("/embed/")) return `${url.origin}${url.pathname}`;
      const parts = url.pathname.split("/").filter(Boolean);
      const start = ["track", "album", "playlist", "artist", "episode", "show"].includes(parts[0]) ? 0 : 1;
      const kind = parts[start];
      const id = parts[start + 1];
      return kind && id ? `https://open.spotify.com/embed/${kind}/${id}` : raw;
    }
    if (type === "soundcloud" && !raw.includes("/player/?url=")) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(raw)}&color=%238b5cf6&auto_play=false&show_user=true`;
    }
    return raw;
  } catch {
    return raw;
  }
}

// ─── SOCIAL LINKS ─────────────────────────────────────────────────────────────
function RichSocialLinksBlock({ config }: { config: any }) {
  const links = config.links ?? [];
  const mode = config.displayMode ?? "grid";
  if (!links.length) return null;

  if (mode === "stack") {
    return (
      <div className="peng-card space-y-2">
        {links.map((l: any, i: number) => (
          <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white transition hover:bg-white/[0.07] hover:border-white/20"
            data-testid={`social-link-${i}`}
            onClick={() => trackSpaceEvent("LINK_CLICK", cleanSocialLabel(l.label) || platformFromLink(l).label)}
          >
            <SocialIcon link={l} />
            <span className="flex-1 min-w-0 truncate">{cleanSocialLabel(l.label) || platformFromLink(l).label}</span>
            <span className="text-white/30 text-xs">→</span>
          </a>
        ))}
      </div>
    );
  }

  if (mode === "pills") {
    return (
      <div className="peng-card">
        <div className="flex flex-wrap gap-2">
          {links.map((l: any, i: number) => (
            <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/[0.1] hover:text-white hover:border-[var(--accent)]/50"
              data-testid={`social-link-${i}`}
              onClick={() => trackSpaceEvent("LINK_CLICK", cleanSocialLabel(l.label) || platformFromLink(l).label)}
            >
              <SocialIcon link={l} />
              <span>{cleanSocialLabel(l.label) || platformFromLink(l).label}</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "minimal") {
    return (
      <div className="peng-card">
        <div className="flex flex-wrap gap-4">
          {links.map((l: any, i: number) => (
            <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-white/50 hover:text-[var(--accent)] transition-colors hover:underline underline-offset-2"
              data-testid={`social-link-${i}`}
              style={{ fontFamily: "var(--font-mono)" }}
              onClick={() => trackSpaceEvent("LINK_CLICK", cleanSocialLabel(l.label) || platformFromLink(l).label)}
            >
              {cleanSocialLabel(l.label) || platformFromLink(l).label} ↗
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="peng-card">
      <div className="grid gap-2 sm:grid-cols-2">
        {links.map((l: any, i: number) => (
          <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="social-link-card" data-testid={`social-link-${i}`} onClick={() => trackSpaceEvent("LINK_CLICK", cleanSocialLabel(l.label) || platformFromLink(l).label)}>
            <SocialIcon link={l} />
            <span className="min-w-0 flex-1 truncate">{cleanSocialLabel(l.label) || platformFromLink(l).label}</span>
            <span className="social-link-open">open</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function trackSpaceEvent(type: string, target?: string) {
  if (typeof window === "undefined") return;
  const match = window.location.pathname.match(/^\/@([^/]+)/);
  if (!match) return;
  navigator.sendBeacon?.(
    `/api/analytics/${encodeURIComponent(match[1])}`,
    new Blob([JSON.stringify({ type, target })], { type: "application/json" })
  ) || fetch(`/api/analytics/${encodeURIComponent(match[1])}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, target }),
    keepalive: true,
  }).catch(() => undefined);
}

function cleanSocialLabel(label?: string) {
  return (label ?? "").replace(/[↗â†—]+/g, "").trim();
}

function platformFromLink(link: any) {
  const raw = `${link.label ?? ""} ${link.url ?? ""}`.toLowerCase();
  if (raw.includes("twitch")) return { key: "twitch", label: "Twitch", color: "#9146ff" };
  if (raw.includes("discord")) return { key: "discord", label: "Discord", color: "#5865f2" };
  if (raw.includes("tiktok")) return { key: "tiktok", label: "TikTok", color: "#00f2ea" };
  if (raw.includes("youtube") || raw.includes("youtu.be")) return { key: "youtube", label: "YouTube", color: "#ff0033" };
  if (raw.includes("instagram")) return { key: "instagram", label: "Instagram", color: "#f472b6" };
  if (raw.includes("twitter") || raw.includes("x.com")) return { key: "x", label: "X", color: "#e5e7eb" };
  if (raw.includes("kick")) return { key: "kick", label: "Kick", color: "#53fc18" };
  return { key: "link", label: "Link", color: "var(--accent-2)" };
}

function SocialIcon({ link }: { link: any }) {
  const platform = platformFromLink(link);
  if (link.iconUrl) return <img src={link.iconUrl} alt="" className="social-link-icon" />;
  const glyph: Record<string, string> = { youtube: "▶", instagram: "◎", tiktok: "♪", discord: "D", twitch: "T", kick: "K", x: "X" };
  return (
    <span className={`social-link-icon social-link-icon-${platform.key}`} style={{ ["--social-color" as any]: platform.color }}>
      {glyph[platform.key] ?? "↗"}
    </span>
  );
}

// ─── PORTAL ───────────────────────────────────────────────────────────────────
function PortalBlock({ config }: { config: any }) {
  const variant = config.variant ?? "glow";
  const label = config.label ?? "Enter";
  const href = config.href ?? "#";

  const styles: Record<string, React.CSSProperties> = {
    glow: { fontFamily: "var(--font-press-start)", fontSize: "0.65rem", letterSpacing: "0.15em", boxShadow: "0 0 30px var(--accent-glow)" },
    neon: { background: "transparent", border: "2px solid #f472b6", color: "#f472b6", boxShadow: "0 0 20px #f472b655, inset 0 0 20px #f472b610", fontFamily: "var(--font-mono)", letterSpacing: "0.2em" },
    arcade: { background: "#000", border: "3px solid #00ff41", color: "#00ff41", boxShadow: "0 0 0 1px #000, 0 0 0 4px #00ff41, 0 0 24px #00ff4155", fontFamily: "var(--font-press-start)", fontSize: "0.6rem", textShadow: "0 0 10px #00ff41" },
    glass: { background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)", boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)", fontFamily: "var(--font-mono)", letterSpacing: "0.15em" },
    ghost: { background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em" },
    holographic: { background: "linear-gradient(135deg, #f472b611, #8b5cf611, #2dd4bf11)", border: "1px solid rgba(255,255,255,0.2)", fontFamily: "var(--font-mono)", letterSpacing: "0.15em", boxShadow: "0 0 40px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)" },
  };

  return (
    <a
      href={href}
      className="block peng-btn peng-btn-primary text-center py-5 text-sm w-full transition-transform hover:scale-[1.02] active:scale-[0.98]"
      style={styles[variant] ?? styles.glow}
    >
      {label}
    </a>
  );
}

// ─── STATS CARD ───────────────────────────────────────────────────────────────
function StatsCardBlock({ config }: { config: any }) {
  const layout = config.layout ?? "grid";
  const stats = config.stats ?? [];

  if (layout === "horizontal") {
    return (
      <div className="peng-card flex flex-wrap gap-6 justify-around text-center">
        {stats.map((s: any, i: number) => (
          <div key={i} className="flex flex-col items-center min-w-[60px]">
            <p className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-mono)" }}>{s.value}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    );
  }

  if (layout === "bars") {
    return (
      <div className="peng-card space-y-3">
        {stats.map((s: any, i: number) => {
          const pct = s.max ? Math.min(100, Math.round((parseFloat(s.value) / parseFloat(s.max)) * 100)) : null;
          return (
            <div key={i}>
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wide text-white/50" style={{ fontFamily: "var(--font-mono)" }}>{s.label}</span>
                <span className="text-xs font-bold text-white" style={{ fontFamily: "var(--font-mono)" }}>{s.value}</span>
              </div>
              {pct != null && (
                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent)", boxShadow: "0 0 8px var(--accent-glow)" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (layout === "minimal") {
    return (
      <div className="peng-card flex flex-wrap gap-5">
        {stats.map((s: any, i: number) => (
          <div key={i} className="flex items-baseline gap-2">
            <span className="text-xl font-black text-[var(--accent)]" style={{ fontFamily: "var(--font-mono)" }}>{s.value}</span>
            <span className="text-[10px] text-white/40 uppercase tracking-wide">{s.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="peng-card grid grid-cols-3 gap-4 text-center">
      {stats.map((s: any, i: number) => (
        <div key={i}>
          <p className="text-xl font-black text-white" style={{ fontFamily: "var(--font-mono)" }}>{s.value}</p>
          <p className="text-xs text-white/40 uppercase tracking-wider mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── COUNTDOWN ────────────────────────────────────────────────────────────────
function CountdownBlock({ config }: { config: any }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = config.targetDate ? new Date(config.targetDate) : null;
  const diff = target ? Math.max(0, target.getTime() - now) : 0;
  const parts = [
    { v: Math.floor(diff / 86400000), u: "days" },
    { v: Math.floor((diff % 86400000) / 3600000), u: "hrs" },
    { v: Math.floor((diff % 3600000) / 60000), u: "min" },
    { v: Math.floor((diff % 60000) / 1000), u: "sec" },
  ];
  const clockStyle = config.clockStyle ?? "default";

  if (clockStyle === "neon") {
    return (
      <div className="peng-card text-center" style={{ background: "#050008", border: "1px solid #f472b633" }}>
        {config.label && <p className="text-[10px] uppercase tracking-widest mb-4" style={{ fontFamily: "var(--font-mono)", color: "#f472b6" }}>{config.label}</p>}
        <div className="flex justify-center gap-5">
          {parts.map((x) => (
            <div key={x.u} className="flex flex-col items-center">
              <span className="text-3xl font-black" style={{ fontFamily: "var(--font-mono)", color: "#f472b6", textShadow: "0 0 20px #f472b6bb" }}>{String(x.v).padStart(2, "0")}</span>
              <span className="text-[9px] mt-1" style={{ color: "#f472b666", fontFamily: "var(--font-mono)" }}>{x.u}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (clockStyle === "minimal") {
    return (
      <div className="peng-card text-center py-6">
        {config.label && <p className="text-[10px] uppercase tracking-widest text-white/35 mb-3" style={{ fontFamily: "var(--font-mono)" }}>{config.label}</p>}
        <p className="text-4xl font-black text-white" style={{ fontFamily: "var(--font-mono)" }}>
          {parts.map((x) => String(x.v).padStart(2, "0")).join(":")}
        </p>
      </div>
    );
  }

  if (clockStyle === "digital") {
    return (
      <div className="peng-card text-center" style={{ background: "#050a05" }}>
        {config.label && <p className="text-[10px] uppercase tracking-widest text-green-400/50 mb-4" style={{ fontFamily: "var(--font-mono)" }}>{config.label}</p>}
        <div className="flex justify-center gap-2">
          {parts.map((x, i) => (
            <div key={x.u} className="flex items-center gap-2">
              {i > 0 && <span className="text-green-400/40 text-xl" style={{ fontFamily: "var(--font-mono)" }}>:</span>}
              <div className="flex flex-col items-center">
                <div className="rounded border border-green-400/25 bg-black px-3 py-2" style={{ boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8)" }}>
                  <span className="text-2xl font-black text-green-400" style={{ fontFamily: "var(--font-mono)", textShadow: "0 0 10px rgba(74,222,128,0.55)" }}>{String(x.v).padStart(2, "0")}</span>
                </div>
                <span className="text-[9px] text-green-400/35 mt-1" style={{ fontFamily: "var(--font-mono)" }}>{x.u.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="peng-card text-center">
      {config.label && <p className="text-xs uppercase tracking-widest text-white/50 mb-3" style={{ fontFamily: "var(--font-mono)" }}>{config.label}</p>}
      <div className="flex justify-center gap-4">
        {parts.map((x) => (
          <div key={x.u} className="flex flex-col items-center">
            <span className="text-3xl font-black text-white" style={{ fontFamily: "var(--font-mono)" }}>{String(x.v).padStart(2, "0")}</span>
            <span className="text-xs text-white/40 uppercase mt-1">{x.u}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpotifyBlock({ config }: { config: any }) {
  if (!config.embedUrl) return null;
  return (
    <div className="peng-card !p-0 overflow-hidden">
      <iframe src={config.embedUrl} width="100%" height={config.height ?? 152} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style={{ border: "none" }} />
    </div>
  );
}

function TikTokBlock({ config }: { config: any }) {
  return (
    <div className="peng-card text-center">
      <a href={`https://tiktok.com/@${config.username ?? ""}`} target="_blank" rel="noopener noreferrer" className="peng-btn peng-btn-ghost">
        @{config.username ?? "username"} on TikTok ↗
      </a>
    </div>
  );
}

function MP3Block({ config }: { config: any }) {
  return (
    <div className="peng-card">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xl">🎧</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{config.title ?? "Audio"}</p>
          {config.artist && <p className="text-xs text-white/40 truncate">{config.artist}</p>}
        </div>
      </div>
      {config.url && <audio controls src={config.url} className="w-full" style={{ height: "40px" }} />}
    </div>
  );
}

function CustomHtmlBlock({ config }: { config: any }) {
  return (
    <div className="peng-card !p-0 overflow-hidden">
      <iframe srcDoc={config.html ?? ""} sandbox="allow-scripts allow-same-origin" className="w-full border-0" style={{ height: config.height ?? "200px", background: "transparent" }} />
    </div>
  );
}

function GuestbookBlock({ config }: { config: any }) {
  const [entries, setEntries] = useState<Array<{ name: string; message: string; createdAt: string }>>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const style = config.style ?? "clean";

  const cardStyle: React.CSSProperties =
    style === "terminal"
      ? { background: "#050a05", border: "1px solid #00ff4122" }
      : style === "retro"
      ? { borderRadius: "4px", border: "2px solid #9a8060" }
      : {};

  const headerStyle: React.CSSProperties =
    style === "retro"
      ? { background: "linear-gradient(180deg,#3b6fce,#2a5aad)", padding: "6px 14px", borderBottom: "2px solid #1e4390", marginBottom: 12 }
      : {};

  async function sign() {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "anonymous", message: message.trim() }),
      });
      if (res.ok) {
        const entry = await res.json();
        setEntries((e) => [entry, ...e]);
        setName(""); setMessage(""); setDone(true);
        setTimeout(() => setDone(false), 3000);
      }
    } finally {
      setSending(false);
    }
  }

  const inputCls = style === "terminal"
    ? "w-full bg-black/60 border border-green-400/20 rounded px-3 py-2 text-xs text-green-300 outline-none focus:border-green-400/50"
    : "w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)] transition";

  return (
    <div className="peng-card overflow-hidden" style={cardStyle}>
      {style === "retro" && (
        <div style={headerStyle}>
          <p className="text-white font-bold text-sm" style={{ fontFamily: "Arial, sans-serif", textShadow: "1px 1px 0 #0a2a6a" }}>{config.title ?? "Guestbook"}</p>
        </div>
      )}
      {style !== "retro" && (
        <p className="text-xs font-semibold text-white mb-3" style={{ fontFamily: style === "terminal" ? "var(--font-mono)" : "var(--font-syne)", color: style === "terminal" ? "#4ade80" : undefined }}>
          {style === "terminal" ? `$ cat ${(config.title ?? "guestbook").replace(/\s+/g, "_")}` : (config.title ?? "Guestbook")}
        </p>
      )}

      {entries.length > 0 && (
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {entries.map((e, i) => (
            <div key={i} className="rounded border border-white/[0.07] bg-white/[0.03] px-3 py-2">
              <p className="text-[11px] font-semibold text-white/70">{e.name}</p>
              <p className="text-xs text-white/50 mt-0.5">{e.message}</p>
            </div>
          ))}
        </div>
      )}

      {done ? (
        <p className="text-xs text-green-400 py-2" style={{ fontFamily: "var(--font-mono)" }}>✓ signed</p>
      ) : (
        <div className="space-y-2">
          <input className={inputCls} placeholder="your name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea className={inputCls} rows={2} placeholder="leave a message..." value={message} onChange={(e) => setMessage(e.target.value)} />
          <button
            onClick={sign}
            disabled={sending || !message.trim()}
            className="peng-btn peng-btn-ghost text-xs disabled:opacity-40"
            style={style === "terminal" ? { color: "#4ade80", borderColor: "#4ade8033" } : {}}
          >
            {sending ? "signing..." : "sign"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── BEST FRIENDS ─────────────────────────────────────────────────────────────
type Friend = { username: string; displayName?: string; avatarUrl?: string; accentColor?: string; note?: string; href?: string };

function BestFriendsBlock({ config }: { config: any }) {
  const friends = (config.friends ?? []).slice(0, 8) as Friend[];
  const style = config.style ?? "cards";
  const title = config.title ?? "top friends";
  const cols = Math.min(4, Math.max(2, config.cols ?? 4));

  if (!friends.length) {
    return (
      <div className="peng-card text-center py-10">
        <p className="text-3xl mb-2">👥</p>
        <p className="text-white/35 text-xs" style={{ fontFamily: "var(--font-mono)" }}>no friends added yet</p>
      </div>
    );
  }

  const gridCols = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } as React.CSSProperties;

  if (style === "spotlight") {
    return (
      <div className="overflow-hidden" style={{ borderRadius: "6px", border: "2px solid #9a8060" }}>
        <div className="px-4 py-2.5" style={{ background: "linear-gradient(180deg, #3b6fce 0%, #2a5aad 100%)", borderBottom: "2px solid #1e4390" }}>
          <p className="text-white font-bold text-sm" style={{ fontFamily: "Arial, sans-serif", textShadow: "1px 1px 0 #0a2a6a" }}>{title}</p>
          <p className="text-[11px] text-blue-200" style={{ fontFamily: "Arial, sans-serif" }}>{friends.length} friend{friends.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="p-3" style={{ background: "#ece7de" }}>
          <div className="grid gap-2" style={gridCols}>
            {friends.map((f, i) => (
              <a key={i} href={f.href || `/hub/user/${f.username}`}
                className="flex flex-col items-center gap-1 p-2 text-center transition hover:opacity-80"
                style={{ background: "#fff", border: "1px solid #c0b090", borderRadius: "3px" }}
              >
                <div className="w-14 h-14 overflow-hidden flex items-center justify-center text-base font-bold flex-shrink-0" style={{ background: `${f.accentColor ?? "#8b5cf6"}22`, border: "2px solid #9a8060" }}>
                  {f.avatarUrl ? <img src={f.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span style={{ color: "#4a3020" }}>{(f.displayName || f.username).slice(0, 1).toUpperCase()}</span>}
                </div>
                <p className="text-[11px] font-bold text-[#3b6fce] truncate w-full hover:underline" style={{ fontFamily: "Arial, sans-serif" }}>{f.displayName || f.username}</p>
                {f.note && <p className="text-[10px] text-[#666] truncate w-full italic" style={{ fontFamily: "Arial, sans-serif" }}>{f.note}</p>}
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (style === "polaroid") {
    const tilts = [-2.5, 1.8, -1.2, 2.1, -0.8, 2.5, -1.9, 1.1];
    return (
      <div className="peng-card">
        <p className="text-[10px] tracking-widest text-white/30 mb-5" style={{ fontFamily: "var(--font-mono)" }}>{title.toUpperCase()}</p>
        <div className="grid gap-5" style={gridCols}>
          {friends.map((f, i) => (
            <a key={i} href={f.href || `/hub/user/${f.username}`}
              className="flex flex-col items-center transition hover:scale-105 hover:z-10"
              style={{ transform: `rotate(${tilts[i % tilts.length]}deg)` }}
            >
              <div style={{ background: "#fff", padding: "8px 8px 30px 8px", boxShadow: "0 8px 30px rgba(0,0,0,0.65)", borderRadius: "2px" }}>
                <div className="w-full aspect-square overflow-hidden flex items-center justify-center text-2xl font-bold" style={{ background: `${f.accentColor ?? "#8b5cf6"}33`, minHeight: "60px" }}>
                  {f.avatarUrl ? <img src={f.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span style={{ color: f.accentColor ?? "#8b5cf6" }}>{(f.displayName || f.username).slice(0, 1).toUpperCase()}</span>}
                </div>
                <p className="text-[11px] text-center text-[#222] mt-2 truncate leading-tight" style={{ fontFamily: "cursive" }}>{f.displayName || f.username}</p>
                {f.note && <p className="text-[9px] text-center text-[#666] mt-0.5 truncate italic" style={{ fontFamily: "cursive" }}>{f.note}</p>}
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (style === "neon") {
    return (
      <div className="peng-card">
        <p className="text-[10px] tracking-widest mb-4" style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{title.toUpperCase()}</p>
        <div className="grid gap-3" style={gridCols}>
          {friends.map((f, i) => {
            const c = f.accentColor ?? "#8b5cf6";
            return (
              <a key={i} href={f.href || `/hub/user/${f.username}`}
                className="flex flex-col items-center gap-2 rounded-xl p-3 text-center transition hover:scale-105"
                style={{ background: "#06080f", border: `1.5px solid ${c}77`, boxShadow: `0 0 14px ${c}22, inset 0 0 14px ${c}07` }}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ border: `2px solid ${c}`, boxShadow: `0 0 12px ${c}99` }}>
                  {f.avatarUrl ? <img src={f.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span style={{ color: c }}>{(f.displayName || f.username).slice(0, 1).toUpperCase()}</span>}
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-xs font-semibold truncate" style={{ color: c, textShadow: `0 0 8px ${c}` }}>{f.displayName || f.username}</p>
                  {f.note && <p className="text-[10px] text-white/35 truncate mt-0.5">{f.note}</p>}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  // cards (default)
  return (
    <div className="peng-card">
      <p className="text-[10px] tracking-widest text-white/30 mb-3" style={{ fontFamily: "var(--font-mono)" }}>{title.toUpperCase()}</p>
      <div className="grid gap-3" style={gridCols}>
        {friends.map((f, i) => (
          <a key={i} href={f.href || `/hub/user/${f.username}`}
            className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center transition hover:border-[var(--accent)]/50 hover:bg-white/[0.06] hover:scale-105"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: `${f.accentColor ?? "#8b5cf6"}33`, border: `2px solid ${f.accentColor ?? "#8b5cf6"}55` }}>
              {f.avatarUrl ? <img src={f.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span style={{ color: f.accentColor ?? "#8b5cf6" }}>{(f.displayName || f.username).slice(0, 1).toUpperCase()}</span>}
            </div>
            <div className="min-w-0 w-full">
              <p className="text-xs font-semibold text-white truncate">{f.displayName || f.username}</p>
              {f.note && <p className="text-[10px] text-white/40 truncate mt-0.5">{f.note}</p>}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── NOW STATUS ───────────────────────────────────────────────────────────────
const ACTIVITIES = [
  { key: "listening", icon: "♪", label: "listening to" },
  { key: "watching", icon: "◉", label: "watching" },
  { key: "playing", icon: "▷", label: "playing" },
  { key: "reading", icon: "▤", label: "reading" },
  { key: "vibing", icon: "～", label: "vibing to" },
  { key: "working", icon: "⌘", label: "working on" },
];

function NowStatusBlock({ config }: { config: any }) {
  const act = ACTIVITIES.find((a) => a.key === (config.activity ?? "listening")) ?? ACTIVITIES[0];
  const style = config.style ?? "card";

  if (style === "pill") {
    return (
      <div className="peng-card">
        <div className="flex flex-wrap items-center gap-3">
          {config.mood && <span className="text-xl">{config.mood}</span>}
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
            <span className="text-white/45 text-xs" style={{ fontFamily: "var(--font-mono)" }}>{act.icon}</span>
            <span className="text-xs text-white/55" style={{ fontFamily: "var(--font-mono)" }}>{act.label}</span>
            <span className="text-xs font-semibold text-white truncate max-w-[160px]">{config.what || "..."}</span>
          </div>
          {config.note && <span className="text-xs text-white/35 italic">{config.note}</span>}
        </div>
      </div>
    );
  }

  if (style === "minimal") {
    return (
      <div className="peng-card py-3">
        <p className="text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          {config.mood && <span className="mr-2">{config.mood}</span>}
          <span className="text-white/35">{act.label} </span>
          <span className="text-white">{config.what || "..."}</span>
          {config.note && <span className="text-white/30 text-xs ml-2">— {config.note}</span>}
        </p>
      </div>
    );
  }

  return (
    <div className="peng-card">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl bg-white/[0.05] border border-white/10">
          {config.mood || act.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] tracking-widest text-white/25 mb-0.5" style={{ fontFamily: "var(--font-mono)" }}>{act.label.toUpperCase()}</p>
          <p className="text-sm font-semibold text-white truncate">{config.what || "..."}</p>
          {config.note && <p className="text-xs text-white/35 mt-1 italic">{config.note}</p>}
        </div>
        <span className="flex-shrink-0 text-xl text-white/20" style={{ fontFamily: "var(--font-mono)" }}>{act.icon}</span>
      </div>
    </div>
  );
}

// ─── MARQUEE ──────────────────────────────────────────────────────────────────
function MarqueeBlock({ config }: { config: any }) {
  const text = config.text ?? "✦ add your message ✦";
  const speed = config.speed ?? 20;
  const color = config.color ?? "var(--accent)";
  const sep = config.separator ?? " ✦ ";
  const sizes: Record<string, string> = { xs: "0.65rem", sm: "0.8rem", md: "1rem", lg: "1.3rem", xl: "1.7rem" };
  const fs = sizes[config.textSize ?? "sm"] ?? "0.8rem";
  const repeated = Array.from({ length: 5 }, () => text).join(sep);

  return (
    <div className="peng-card !px-0 !py-3 overflow-hidden" style={{ border: `1px solid ${color}33` }}>
      <style>{`@keyframes peng-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}.peng-marquee-inner{display:flex;width:max-content;animation:peng-marquee ${speed}s linear infinite;}`}</style>
      <div className="overflow-hidden">
        <div className="peng-marquee-inner" style={{ color, fontSize: fs, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
          <span className="px-6">{repeated}</span>
          <span className="px-6">{repeated}</span>
        </div>
      </div>
    </div>
  );
}

// ─── QUOTE CARD ───────────────────────────────────────────────────────────────
function QuoteCardBlock({ config }: { config: any }) {
  const quote = config.quote ?? "add your quote";
  const attribution = config.attribution ?? "";
  const style = config.style ?? "minimal";
  const accent = config.accent ?? "var(--accent)";

  if (style === "big") {
    return (
      <div className="peng-card text-center py-8">
        <p className="text-2xl font-black text-white leading-snug mb-4" style={{ fontFamily: "var(--font-syne)" }}>"{quote}"</p>
        {attribution && <p className="text-xs text-white/35" style={{ fontFamily: "var(--font-mono)" }}>— {attribution}</p>}
      </div>
    );
  }

  if (style === "bubble") {
    return (
      <div className="peng-card" style={{ borderLeft: `4px solid ${accent}` }}>
        <p className="text-sm text-white/80 italic leading-relaxed">"{quote}"</p>
        {attribution && <p className="text-[10px] text-white/35 mt-2" style={{ fontFamily: "var(--font-mono)" }}>— {attribution}</p>}
      </div>
    );
  }

  if (style === "neon") {
    return (
      <div className="peng-card text-center py-6" style={{ border: `1px solid ${accent}44`, boxShadow: `0 0 20px ${accent}18, inset 0 0 20px ${accent}07` }}>
        <p className="text-lg font-semibold italic leading-relaxed mb-3" style={{ color: accent, textShadow: `0 0 14px ${accent}88` }}>"{quote}"</p>
        {attribution && <p className="text-[10px] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>— {attribution}</p>}
      </div>
    );
  }

  if (style === "scrawl") {
    return (
      <div style={{ background: "#fffef0", border: "1px solid #d4c9a8", borderRadius: "4px", padding: "20px", transform: "rotate(-0.5deg)" }}>
        <p className="text-base leading-relaxed mb-2" style={{ fontFamily: "cursive", color: "#2a1a0a" }}>"{quote}"</p>
        {attribution && <p className="text-xs italic" style={{ fontFamily: "cursive", color: "#7a6040" }}>— {attribution}</p>}
      </div>
    );
  }

  return (
    <div className="peng-card" style={{ borderLeft: `3px solid ${accent}` }}>
      <p className="text-sm text-white/75 italic leading-relaxed">"{quote}"</p>
      {attribution && <p className="text-[10px] text-white/35 mt-2" style={{ fontFamily: "var(--font-mono)" }}>— {attribution}</p>}
    </div>
  );
}

// ─── PHOTO GRID ───────────────────────────────────────────────────────────────
function PhotoGridBlock({ config }: { config: any }) {
  const photos = config.photos ?? [];
  const layout = config.layout ?? "grid";
  const cols = config.cols ?? 3;
  const filterMap: Record<string, string> = {
    none: "none",
    grainy: "contrast(1.1) brightness(0.95)",
    vhs: "saturate(1.4) contrast(1.2) brightness(0.9)",
    warm: "sepia(0.35) saturate(1.2) brightness(1.05)",
    cold: "saturate(0.75) hue-rotate(10deg)",
    noir: "grayscale(0.9) contrast(1.2)",
  };
  const imgFilter = filterMap[config.filter ?? "none"] ?? "none";

  if (!photos.length) {
    return (
      <div className="peng-card text-center py-8 text-white/30 text-xs" style={{ fontFamily: "var(--font-mono)" }}>
        no photos added yet
      </div>
    );
  }

  if (layout === "polaroid") {
    const tilts = [-2, 1.5, -1, 2.2, -0.7, 1.8, -2.5, 1, -1.5, 2];
    return (
      <div className="peng-card">
        <div className="flex flex-wrap justify-center gap-5">
          {photos.map((p: any, i: number) => (
            <div key={i} style={{ background: "#fff", padding: "8px 8px 32px 8px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", transform: `rotate(${tilts[i % tilts.length]}deg)`, maxWidth: "140px", borderRadius: "2px" }}>
              <img src={p.url} alt={p.caption ?? ""} className="w-full object-cover" style={{ display: "block", filter: imgFilter, maxHeight: "120px" }} />
              {p.caption && <p className="text-[11px] text-center text-[#333] mt-2 leading-tight" style={{ fontFamily: "cursive" }}>{p.caption}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layout === "strips") {
    return (
      <div className="peng-card !p-0 overflow-hidden" style={{ background: "#000" }}>
        <div className="flex gap-0.5">
          {photos.slice(0, 6).map((p: any, i: number) => (
            <div key={i} className="flex-1 relative overflow-hidden" style={{ aspectRatio: "2/3" }}>
              <img src={p.url} alt={p.caption ?? ""} className="w-full h-full object-cover" style={{ filter: imgFilter }} />
              {i === 0 && <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />}
              {i === photos.slice(0, 6).length - 1 && <div className="absolute inset-0 bg-gradient-to-l from-black/60 to-transparent" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="peng-card !p-0 overflow-hidden">
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {photos.map((p: any, i: number) => (
          <div key={i} className="overflow-hidden aspect-square">
            <img src={p.url} alt={p.caption ?? ""} className="w-full h-full object-cover transition hover:scale-105" style={{ filter: imgFilter }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ABOUT ME ─────────────────────────────────────────────────────────────────
function AboutMeBlock({ config }: { config: any }) {
  const fields = config.fields ?? [];
  const style = config.style ?? "clean";
  const title = config.title ?? "about me";

  if (style === "retro") {
    return (
      <div style={{ borderRadius: "4px", border: "2px solid #9a8060", overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(180deg, #3b6fce 0%, #2a5aad 100%)", padding: "6px 14px", borderBottom: "2px solid #1e4390" }}>
          <p className="text-white font-bold text-sm" style={{ fontFamily: "Arial, sans-serif", textShadow: "1px 1px 0 #0a2a6a" }}>{title}</p>
        </div>
        <div style={{ background: "#ece7de", padding: "12px 14px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {fields.map((f: any, i: number) => (
                <tr key={i} style={{ borderBottom: i < fields.length - 1 ? "1px solid #c0b090" : undefined }}>
                  <td style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", fontWeight: "bold", color: "#3b6fce", padding: "4px 10px 4px 0", whiteSpace: "nowrap", verticalAlign: "top" }}>{f.label}:</td>
                  <td style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#222", padding: "4px 0", verticalAlign: "top" }}>{f.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (style === "terminal") {
    return (
      <div className="peng-card" style={{ background: "#050a05", border: "1px solid #00ff4122" }}>
        <p className="text-green-400/60 text-xs mb-3" style={{ fontFamily: "var(--font-mono)" }}>
          $ cat {title.replace(/\s+/g, "_")}.txt
        </p>
        <div className="space-y-1.5">
          {fields.map((f: any, i: number) => (
            <p key={i} className="text-xs" style={{ fontFamily: "var(--font-mono)" }}>
              <span className="text-green-400/55">{f.label.toLowerCase().replace(/\s+/g, "_")}</span>
              <span className="text-white/25"> = </span>
              <span className="text-green-300">{f.value}</span>
            </p>
          ))}
        </div>
        <p className="text-green-400/25 text-xs mt-3" style={{ fontFamily: "var(--font-mono)" }}>█</p>
      </div>
    );
  }

  return (
    <div className="peng-card">
      <p className="text-[10px] tracking-widest text-white/25 mb-3" style={{ fontFamily: "var(--font-mono)" }}>{title.toUpperCase()}</p>
      <div className="space-y-2.5">
        {fields.map((f: any, i: number) => (
          <div key={i} className="flex gap-3 items-baseline">
            <span className="text-[10px] uppercase tracking-wide text-white/30 shrink-0 w-24" style={{ fontFamily: "var(--font-mono)" }}>{f.label}</span>
            <span className="text-xs text-white/75">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── INTEREST TAGS ────────────────────────────────────────────────────────────
const TAG_COLORS = ["#8b5cf6", "#f472b6", "#2dd4bf", "#4ade80", "#fb923c", "#60a5fa", "#f87171", "#a78bfa", "#34d399", "#fbbf24"];

function InterestTagsBlock({ config }: { config: any }) {
  const tags: Array<string | { label: string; color?: string }> = config.tags ?? [];
  const style = config.style ?? "default";
  const title = config.title ?? "";

  if (!tags.length) {
    return (
      <div className="peng-card text-center py-6 text-white/30 text-xs" style={{ fontFamily: "var(--font-mono)" }}>no tags added yet</div>
    );
  }

  return (
    <div className="peng-card">
      {title && <p className="text-[10px] tracking-widest text-white/25 mb-3" style={{ fontFamily: "var(--font-mono)" }}>{title.toUpperCase()}</p>}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, i) => {
          const label = typeof tag === "string" ? tag : tag.label;
          const color = (typeof tag === "object" && tag.color) ? tag.color : TAG_COLORS[i % TAG_COLORS.length];

          if (style === "neon") {
            return (
              <span key={i} className="rounded-md px-3 py-1.5 text-xs font-semibold" style={{ color, border: `1px solid ${color}55`, background: `${color}11`, boxShadow: `0 0 8px ${color}33`, fontFamily: "var(--font-mono)" }}>
                {label}
              </span>
            );
          }
          if (style === "bubble") {
            return (
              <span key={i} className="rounded-full px-3 py-1.5 text-xs font-semibold text-black" style={{ background: color }}>
                {label}
              </span>
            );
          }
          return (
            <span key={i} className="rounded border px-2.5 py-1 text-xs text-white/60 transition hover:text-white" style={{ borderColor: `${color}44`, background: `${color}0e`, fontFamily: "var(--font-mono)" }}>
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────
type Badge = { icon: string; name: string; description?: string };

function AchievementsBlock({ config }: { config: any }) {
  const badges = (config.badges ?? []) as Badge[];
  const title = config.title ?? "achievements";
  const style = config.style ?? "cards";

  if (!badges.length) {
    return (
      <div className="peng-card text-center py-8">
        <p className="text-2xl mb-2">★</p>
        <p className="text-white/30 text-xs" style={{ fontFamily: "var(--font-mono)" }}>no badges yet</p>
      </div>
    );
  }

  if (style === "compact") {
    return (
      <div className="peng-card">
        <p className="text-[10px] tracking-widest text-white/25 mb-3" style={{ fontFamily: "var(--font-mono)" }}>{title.toUpperCase()}</p>
        <div className="flex flex-wrap gap-2">
          {badges.map((b, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5" title={b.description}>
              <span className="text-sm">{b.icon}</span>
              <span className="text-xs text-white/70">{b.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (style === "neon") {
    return (
      <div className="peng-card">
        <p className="text-[10px] tracking-widest mb-4" style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{title.toUpperCase()}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {badges.map((b, i) => {
            const c = TAG_COLORS[i % TAG_COLORS.length];
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-center"
                style={{ border: `1.5px solid ${c}55`, background: `${c}08`, boxShadow: `0 0 12px ${c}18` }}>
                <span className="text-2xl">{b.icon}</span>
                <p className="text-xs font-semibold" style={{ color: c, textShadow: `0 0 8px ${c}` }}>{b.name}</p>
                {b.description && <p className="text-[10px] text-white/30 leading-tight">{b.description}</p>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // cards (default)
  return (
    <div className="peng-card">
      <p className="text-[10px] tracking-widest text-white/25 mb-3" style={{ fontFamily: "var(--font-mono)" }}>{title.toUpperCase()}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {badges.map((b, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 transition hover:bg-white/[0.06]">
            <span className="text-xl shrink-0">{b.icon}</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{b.name}</p>
              {b.description && <p className="text-[10px] text-white/35 mt-0.5 truncate">{b.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SIGNAL LANDING ───────────────────────────────────────────────────────────
function SignalLandingBlock({ config }: { config: any }) {
  const name = config.name ?? "peng";
  const title = config.title ?? "creator · streamer";
  const caption = config.caption ?? "";
  const signalLabel = config.signalLabel ?? "tonight's signal";
  const stats: Array<{ label: string; value: string }> = config.stats ?? [
    { label: "broadcast", value: "offline" },
    { label: "signal", value: "0%" },
  ];
  const links: Array<{ label: string; sub?: string; badge?: string; url?: string }> = config.links ?? [];
  const portalLabel = config.portalLabel ?? "Enter Hub";
  const portalSub = config.portalSub ?? "links · community · drops";
  const portalUrl = config.portalUrl ?? "/hub";
  const signalPct = Math.min(100, Math.max(0, Number(config.signalPct ?? 11)));

  const badgeGlyphs: Record<string, string> = {
    watch: "▶", join: "D", open: "↗", chat: "✉", follow: "♥", sub: "★",
  };

  return (
    <div
      className="signal-landing-block"
      style={{ "--signal-name": `"${name.toUpperCase()}"` } as React.CSSProperties}
    >
      {/* top-left: signal stats board */}
      <div className="signal-board">
        <p className="signal-kicker">{signalLabel}</p>
        {stats.map((s, i) => (
          <div key={i} className="signal-row">
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
        <div className="signal-meter">
          <span style={{ width: `${signalPct}%` }} />
        </div>
        {links.length > 0 && (
          <div className="signal-actions">
            {links.slice(0, 2).map((l, i) => (
              <a key={i} href={l.url ?? "#"}>{l.badge ?? l.label?.slice(0, 6) ?? "link"}</a>
            ))}
          </div>
        )}
      </div>

      {/* center: main identity */}
      <div className="signal-main-card">
        <span className="signal-ready">
          <b>●</b>&nbsp;signal active
        </span>
        <h2>{name}</h2>
        <p className="signal-title">{title}</p>
        {caption && <em>{caption}</em>}
        {links.length > 0 && (
          <div className="signal-social-pill">
            {links.slice(0, 6).map((l, i) => (
              <a
                key={i}
                href={l.url ?? "#"}
                title={l.label}
                data-label={l.label}
                aria-label={l.label ?? "profile link"}
                target={(l.url ?? "").startsWith("http") ? "_blank" : undefined}
                rel={(l.url ?? "").startsWith("http") ? "noopener noreferrer" : undefined}
                className={`signal-social-action signal-social-${signalPlatform(l)}`}
              >
                <SignalSocialIcon link={l} />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* bottom center: link cards */}
      {links.length > 0 && (
        <div className="signal-link-row">
          {links.slice(0, 4).map((l, i) => (
            <a key={i} href={l.url ?? "#"} className="signal-link-card">
              <span>{l.badge ?? "link"}</span>
              <strong>{l.label}</strong>
              {l.sub && <small>{l.sub}</small>}
            </a>
          ))}
        </div>
      )}

      {/* top-right: portal card */}
      <div className="signal-portal">
        <span className="signal-kicker">portal</span>
        <strong>{portalLabel}</strong>
        {portalSub && <p>{portalSub}</p>}
        <a href={portalUrl}>enter →</a>
      </div>
    </div>
  );
}

function signalPlatform(link: { label?: string; badge?: string; url?: string }) {
  const raw = `${link.label ?? ""} ${link.badge ?? ""} ${link.url ?? ""}`.toLowerCase();
  if (raw.includes("discord")) return "discord";
  if (raw.includes("twitch")) return "twitch";
  if (raw.includes("tiktok") || raw.includes("watch")) return "tiktok";
  if (raw.includes("message") || raw.includes("chat") || raw.includes("mail")) return "message";
  if (raw.includes("youtube")) return "youtube";
  return "link";
}

function SignalSocialIcon({ link }: { link: { label?: string; badge?: string; url?: string } }) {
  const platform = signalPlatform(link);
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (platform === "discord") {
    return <svg {...common}><path d="M8.5 8.5c2.2-.7 4.8-.7 7 0" /><path d="M7 17c3.2 1.3 6.8 1.3 10 0" /><path d="M8 6.2 7.1 4.5C5.5 5 4.2 5.8 3.1 6.8 2.4 10 2.7 13 4 16c1.2.8 2.5 1.4 4 1.8l.9-1.8" /><path d="m16 6.2.9-1.7c1.6.5 2.9 1.3 4 2.3.7 3.2.4 6.2-.9 9.2-1.2.8-2.5 1.4-4 1.8l-.9-1.8" /><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" /></svg>;
  }
  if (platform === "twitch") {
    return <svg {...common}><path d="M5 4h15v10l-4 4h-4l-3 3v-3H5z" /><path d="M9 8v5" /><path d="M14 8v5" /></svg>;
  }
  if (platform === "message") {
    return <svg {...common}><path d="M4 5h16v12H7l-3 3z" /><path d="m7 9 5 4 5-4" /></svg>;
  }
  if (platform === "youtube") {
    return <svg {...common}><rect x="3" y="6" width="18" height="12" rx="4" /><path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none" /></svg>;
  }
  if (platform === "tiktok") {
    return <svg {...common}><path d="M14 4v10.2a3.8 3.8 0 1 1-3.8-3.8" /><path d="M14 6.5c1.2 1.8 2.8 2.8 5 3" /></svg>;
  }
  return <svg {...common}><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg>;
}
