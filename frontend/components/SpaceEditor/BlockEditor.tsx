"use client";
import { useState, useRef, useEffect } from "react";
import type { Block } from "@/components/BlockRenderer/BlockRenderer";

// ─── PIECE CATALOGUE ──────────────────────────────────────────────────────────
type PieceDef = { type: string; icon: string; label: string; tagline: string; gems?: boolean };
type CategoryDef = { key: string; label: string; icon: string; pieces: PieceDef[] };

const CATEGORIES: CategoryDef[] = [
  {
    key: "links",
    label: "Links",
    icon: "↗",
    pieces: [
      { type: "SOCIAL_LINKS", icon: "◈", label: "Socials", tagline: "Twitch, TikTok, Discord, etc." },
      { type: "PORTAL", icon: "▣", label: "Button", tagline: "Big call-to-action link" },
      { type: "MARQUEE", icon: "≈", label: "Ticker", tagline: "Scrolling text banner" },
      { type: "TIKTOK_FEED", icon: "♪", label: "TikTok", tagline: "Link to your TikTok profile" },
    ],
  },
  {
    key: "about",
    label: "About",
    icon: "◎",
    pieces: [
      { type: "SIGNAL_LANDING", icon: "◈", label: "Hero Landing", tagline: "Full signal-style landing page block" },
      { type: "TEXT", icon: "T", label: "Text", tagline: "Words with glow, neon, glitch effects" },
      { type: "ABOUT_ME", icon: "◉", label: "About Me", tagline: "Label/value field list" },
      { type: "INTEREST_TAGS", icon: "◆", label: "Interests", tagline: "Tag cloud of what you're into" },
      { type: "QUOTE_CARD", icon: "❝", label: "Quote", tagline: "A line you live by" },
      { type: "BEST_FRIENDS", icon: "✦", label: "Top People", tagline: "Spotlight your crew" },
    ],
  },
  {
    key: "media",
    label: "Media",
    icon: "▶",
    pieces: [
      { type: "IMAGE", icon: "◻", label: "Image", tagline: "Photo or graphic with frame options" },
      { type: "PHOTO_GRID", icon: "⊞", label: "Photos", tagline: "Grid, polaroid wall, or film strips" },
      { type: "VIDEO_EMBED", icon: "▷", label: "Video", tagline: "YouTube, Vimeo, or stream" },
      { type: "MUSIC_PLAYER", icon: "♫", label: "Music", tagline: "Spotify, SoundCloud, or direct link" },
      { type: "MP3_UPLOAD", icon: "⏏", label: "Upload Track", tagline: "Upload your own audio file", gems: true },
    ],
  },
  {
    key: "widgets",
    label: "Widgets",
    icon: "⊡",
    pieces: [
      { type: "NOW_STATUS", icon: "●", label: "Now", tagline: "What you're listening to / doing" },
      { type: "COUNTDOWN", icon: "◷", label: "Countdown", tagline: "Hype timer for a date" },
      { type: "STATS_CARD", icon: "▲", label: "Stats", tagline: "Numbers that hit different" },
      { type: "GUESTBOOK", icon: "✉", label: "Guestbook", tagline: "Let people leave notes" },
      { type: "ACHIEVEMENTS", icon: "★", label: "Achievements", tagline: "Show off your unlocked badges" },
    ],
  },
  {
    key: "vibes",
    label: "Vibes",
    icon: "✺",
    pieces: [
      { type: "BACKGROUND", icon: "◌", label: "Background", tagline: "Set the whole page mood" },
      { type: "SIGNAL_LANDING", icon: "P", label: "Signal Landing", tagline: "Full Pengelus deploy-style spotlight" },
      { type: "SPOTIFY_EMBED", icon: "◍", label: "Spotify", tagline: "Embed a track or playlist" },
      { type: "CUSTOM_HTML", icon: "◧", label: "Custom Code", tagline: "Advanced: raw HTML embed", gems: true },
    ],
  },
];

const ALL_PIECES = CATEGORIES.flatMap((c) => c.pieces);

function pieceLabel(type: string) {
  return ALL_PIECES.find((p) => p.type === type)?.label ?? type;
}
function pieceIcon(type: string) {
  return ALL_PIECES.find((p) => p.type === type)?.icon ?? "◻";
}

function newBlock(type: string): Block {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const defaults: Record<string, any> = {
    TEXT: { heading: "Heading", body: "your text here", effect: "none", size: "normal", align: "left", accent: "#8b5cf6" },
    BACKGROUND: { mode: "image", url: "", fit: "cover", position: "center", dim: 58, blur: 0, fixed: true },
    IMAGE: { url: "", alt: "", frame: "none", caption: "" },
    VIDEO_EMBED: { embedUrl: "", title: "" },
    MUSIC_PLAYER: { playerType: "direct", title: "Track", artist: "", audioUrl: "", embedUrl: "", coverUrl: "", playerStyle: "spotlight", accent: "#8b5cf6", caption: "now playing", autoPlay: false },
    MP3_UPLOAD: { title: "Audio", artist: "", url: "" },
    SOCIAL_LINKS: { links: [{ label: "TikTok", url: "https://tiktok.com/@" }], displayMode: "grid" },
    PORTAL: { label: "ENTER", href: "/", variant: "glow" },
    STATS_CARD: { stats: [{ label: "FANS", value: "0" }, { label: "STREAMS", value: "0" }, { label: "DAYS", value: "0" }], layout: "grid" },
    COUNTDOWN: { label: "Until next stream", targetDate: new Date(Date.now() + 86400000).toISOString(), clockStyle: "default" },
    SPOTIFY_EMBED: { embedUrl: "https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC", height: 152 },
    TIKTOK_FEED: { username: "peng" },
    GUESTBOOK: { title: "Guestbook" },
    CUSTOM_HTML: { html: "<div style='color:white'>your html</div>", height: 200 },
    BEST_FRIENDS: { title: "top people", style: "cards", cols: 4, friends: [] },
    SIGNAL_LANDING: {
      name: "peng",
      title: "creator · streamer",
      caption: "",
      signalLabel: "tonight's signal",
      signalPct: 11,
      stats: [{ label: "broadcast", value: "offline" }, { label: "signal", value: "11%" }],
      links: [
        { label: "tiktok", sub: "clips, edits", badge: "watch", url: "https://tiktok.com/@" },
        { label: "discord", sub: "server, community", badge: "join", url: "https://discord.gg/" },
        { label: "twitch", sub: "live streams", badge: "open", url: "https://twitch.tv/" },
        { label: "message", sub: "login and reach out", badge: "chat", url: "/hub" },
      ],
      portalLabel: "Enter Hub",
      portalSub: "links · community · drops",
      portalUrl: "/hub",
    },
    NOW_STATUS: { activity: "listening", what: "", mood: "", note: "", style: "card" },
    MARQUEE: { text: "✦ your vibe here ✦", speed: 20, color: "#8b5cf6", textSize: "sm", separator: " ✦ " },
    QUOTE_CARD: { quote: "add your quote", attribution: "", style: "minimal", accent: "#8b5cf6" },
    PHOTO_GRID: { photos: [], layout: "grid", cols: 3, filter: "none" },
    ABOUT_ME: { title: "about me", style: "clean", fields: [{ label: "age", value: "" }, { label: "location", value: "" }, { label: "mood", value: "" }] },
    INTEREST_TAGS: { title: "", style: "default", tags: ["music", "art", "gaming"] },
    ACHIEVEMENTS: { title: "achievements", style: "cards", badges: [] },
  };
  return { id, type: type as any, order: 0, config: defaults[type] ?? {} };
}

// ─── EDITOR ───────────────────────────────────────────────────────────────────
export function BlockEditor({
  blocks,
  onChange,
  gemsUnlocked = false,
  autoEditId,
  onAutoEditConsumed,
}: {
  blocks: Block[];
  onChange: (b: Block[]) => void;
  gemsUnlocked?: boolean;
  autoEditId?: string | null;
  onAutoEditConsumed?: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [activeCategory, setActiveCategory] = useState("links");
  const [dragging, setDragging] = useState<string | null>(null);

  // Auto-open edit panel when a template is applied
  useEffect(() => {
    if (autoEditId) {
      setEditing(autoEditId);
      onAutoEditConsumed?.();
    }
  }, [autoEditId]); // eslint-disable-line react-hooks/exhaustive-deps

  function addBlock(type: string) {
    const b = newBlock(type);
    b.order = blocks.length;
    onChange([...blocks, b]);
    setAdding(false);
    setEditing(b.id);
  }

  function updateBlock(id: string, config: any) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, config } : b)));
  }

  function removeBlock(id: string) {
    onChange(blocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i })));
  }

  function move(id: string, dir: -1 | 1) {
    const idx = blocks.findIndex((b) => b.id === id);
    const next = idx + dir;
    if (next < 0 || next >= blocks.length) return;
    const arr = [...blocks];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    onChange(arr.map((b, i) => ({ ...b, order: i })));
  }

  function dropOn(targetId: string) {
    if (!dragging || dragging === targetId) return;
    const from = blocks.findIndex((b) => b.id === dragging);
    const to = blocks.findIndex((b) => b.id === targetId);
    if (from < 0 || to < 0) return;
    const arr = [...blocks];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    onChange(arr.map((b, i) => ({ ...b, order: i })));
    setDragging(null);
  }

  const catPieces = CATEGORIES.find((c) => c.key === activeCategory)?.pieces ?? [];

  return (
    <div className="space-y-2" data-testid="block-editor">
      {blocks.map((b) => (
        <div
          key={b.id}
          className={`rounded-xl border border-[var(--bg-border)] bg-white/[0.03] ${dragging === b.id ? "opacity-40" : ""}`}
          draggable
          onDragStart={() => setDragging(b.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => dropOn(b.id)}
          onDragEnd={() => setDragging(null)}
          data-testid={`block-${b.id}`}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-white/25 text-xs cursor-grab select-none" title="drag to reorder">⠿</span>
            <span className="text-sm text-white/30 w-5 text-center shrink-0" style={{ fontFamily: "var(--font-mono)" }}>{pieceIcon(b.type)}</span>
            <span className="flex-1 text-xs text-white/70 font-medium">{pieceLabel(b.type)}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => move(b.id, -1)} className="w-6 h-6 flex items-center justify-center rounded text-white/30 hover:text-white hover:bg-white/[0.06] text-xs" data-testid={`block-up-${b.id}`}>↑</button>
              <button onClick={() => move(b.id, 1)} className="w-6 h-6 flex items-center justify-center rounded text-white/30 hover:text-white hover:bg-white/[0.06] text-xs" data-testid={`block-down-${b.id}`}>↓</button>
              <button
                onClick={() => setEditing(editing === b.id ? null : b.id)}
                className={`px-3 py-1 rounded text-xs transition ${editing === b.id ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "text-white/40 hover:text-white hover:bg-white/[0.06]"}`}
                data-testid={`block-edit-${b.id}`}
              >
                {editing === b.id ? "done" : "edit"}
              </button>
              <button onClick={() => removeBlock(b.id)} className="w-6 h-6 flex items-center justify-center rounded text-red-400/40 hover:text-red-300 hover:bg-red-400/[0.08] text-xs" data-testid={`block-remove-${b.id}`}>✕</button>
            </div>
          </div>
          {editing === b.id && (
            <div className="border-t border-[var(--bg-border)] px-4 pb-4 pt-3">
              <BlockConfig block={b} onChange={(cfg) => updateBlock(b.id, cfg)} />
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <div className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-white">Add a piece</p>
            <button onClick={() => setAdding(false)} className="text-xs text-white/35 hover:text-white" data-testid="cancel-add-block">cancel</button>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeCategory === cat.key
                    ? "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30"
                    : "text-white/45 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <span className="text-[11px]" style={{ fontFamily: "var(--font-mono)" }}>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Piece grid */}
          <div className="grid grid-cols-2 gap-2">
            {catPieces.map((piece) => {
              const locked = piece.gems && !gemsUnlocked;
              return (
                <button
                  key={piece.type}
                  onClick={() => !locked && addBlock(piece.type)}
                  disabled={locked}
                  data-testid={`add-block-type-${piece.type}`}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
                    locked
                      ? "cursor-not-allowed border-[var(--bg-border)] opacity-30"
                      : "border-[var(--bg-border)] bg-white/[0.02] hover:border-[var(--accent)]/50 hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="text-lg w-7 h-7 flex items-center justify-center rounded-md bg-white/[0.06] shrink-0 text-white/60" style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                    {piece.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white leading-tight">
                      {piece.label}
                      {locked && <span className="ml-1.5 text-[10px] text-amber-400">◆ gem</span>}
                    </p>
                    <p className="text-[10px] text-white/35 mt-0.5 leading-tight truncate">{piece.tagline}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full rounded-xl border border-dashed border-[var(--bg-border)] py-3 text-xs text-white/35 hover:text-white/60 hover:border-white/20 transition"
          data-testid="add-block-button"
        >
          + add a piece
        </button>
      )}
    </div>
  );
}

// ─── CONFIG ROUTER ────────────────────────────────────────────────────────────
function BlockConfig({ block, onChange }: { block: Block; onChange: (cfg: any) => void }) {
  const cfg = block.config;
  const set = (k: string, v: any) => onChange({ ...cfg, [k]: v });
  const inputCls = "w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)] transition";

  switch (block.type as string) {
    case "BACKGROUND": return <BackgroundConfig cfg={cfg} set={set} />;
    case "SIGNAL_LANDING": return <SignalLandingConfig cfg={cfg} set={set} inputCls={inputCls} />;
    case "TEXT": return <TextGfxConfig cfg={cfg} set={set} inputCls={inputCls} />;
    case "IMAGE": return <ImageConfig cfg={cfg} set={set} inputCls={inputCls} />;
    case "VIDEO_EMBED":
      return (
        <div className="space-y-2">
          <input className={inputCls} placeholder="paste YouTube, Vimeo or stream URL" value={cfg.embedUrl ?? ""} onChange={(e) => set("embedUrl", e.target.value)} data-testid="video-embed-input" />
          <p className="text-[10px] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>YouTube: https://youtu.be/... &nbsp;|&nbsp; Vimeo: https://vimeo.com/...</p>
        </div>
      );
    case "MUSIC_PLAYER": return <MusicPlayerConfig cfg={cfg} set={set} setMany={(patch) => onChange({ ...cfg, ...patch })} inputCls={inputCls} />;
    case "SOCIAL_LINKS": return <SocialLinksConfig cfg={cfg} set={set} inputCls={inputCls} />;
    case "MP3_UPLOAD": return <Mp3UploadConfig cfg={cfg} set={set} />;
    case "PORTAL": return <PortalConfig cfg={cfg} set={set} inputCls={inputCls} />;
    case "STATS_CARD": return <StatsCardConfig cfg={cfg} set={set} inputCls={inputCls} />;
    case "COUNTDOWN": return <CountdownConfig cfg={cfg} set={set} inputCls={inputCls} />;
    case "SPOTIFY_EMBED":
      return (
        <div className="space-y-2">
          <input className={inputCls} placeholder="Spotify track or playlist URL" value={cfg.embedUrl ?? ""} onChange={(e) => set("embedUrl", e.target.value)} />
          <p className="text-[10px] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>e.g. https://open.spotify.com/track/...</p>
        </div>
      );
    case "TIKTOK_FEED":
      return <input className={inputCls} placeholder="TikTok username (without @)" value={cfg.username ?? ""} onChange={(e) => set("username", e.target.value)} />;
    case "CUSTOM_HTML":
      return <textarea className={inputCls} rows={6} placeholder="<your html>" value={cfg.html ?? ""} onChange={(e) => set("html", e.target.value)} />;
    case "GUESTBOOK":
      return (
        <div className="space-y-2">
          <input className={inputCls} placeholder="title (e.g. Guestbook, Leave a note)" value={cfg.title ?? ""} onChange={(e) => set("title", e.target.value)} />
          <StyleRow label="look" value={cfg.style ?? "clean"} onChange={(v) => set("style", v)} inputCls={inputCls} options={[["clean","clean"],["retro","retro"],["terminal","terminal"]]} />
        </div>
      );
    case "BEST_FRIENDS": return <BestFriendsConfig cfg={cfg} set={set} inputCls={inputCls} />;
    case "NOW_STATUS": return <NowStatusConfig cfg={cfg} set={set} inputCls={inputCls} />;
    case "MARQUEE": return <MarqueeConfig cfg={cfg} set={set} inputCls={inputCls} />;
    case "QUOTE_CARD": return <QuoteCardConfig cfg={cfg} set={set} inputCls={inputCls} />;
    case "PHOTO_GRID": return <PhotoGridConfig cfg={cfg} set={set} inputCls={inputCls} />;
    case "ABOUT_ME": return <AboutMeConfig cfg={cfg} set={set} inputCls={inputCls} />;
    case "INTEREST_TAGS": return <InterestTagsConfig cfg={cfg} set={set} inputCls={inputCls} />;
    case "ACHIEVEMENTS": return <AchievementsConfig cfg={cfg} set={set} inputCls={inputCls} />;
    case "SIGNAL_LANDING": return <SignalLandingConfig cfg={cfg} set={set} inputCls={inputCls} />;
    default: return null;
  }
}

// ─── SHARED HELPERS ───────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] uppercase tracking-wider text-white/30" style={{ fontFamily: "var(--font-mono)" }}>{label}</span>
      {children}
    </label>
  );
}

function StyleRow({ label, value, onChange, inputCls, options }: {
  label: string; value: string; onChange: (v: string) => void; inputCls: string;
  options: [string, string][];
}) {
  return (
    <Field label={label}>
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </Field>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="flex-1 h-px bg-white/[0.07]" />
      <span className="text-[10px] uppercase tracking-widest text-white/25" style={{ fontFamily: "var(--font-mono)" }}>{label}</span>
      <div className="flex-1 h-px bg-white/[0.07]" />
    </div>
  );
}

// ─── CONFIGS ──────────────────────────────────────────────────────────────────

function TextGfxConfig({ cfg, set, inputCls }: { cfg: any; set: (k: string, v: any) => void; inputCls: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <input className={inputCls} placeholder="heading (optional)" value={cfg.heading ?? ""} onChange={(e) => set("heading", e.target.value)} data-testid="text-heading-input" />
      <textarea className={inputCls} placeholder="body text" rows={3} value={cfg.body ?? ""} onChange={(e) => set("body", e.target.value)} data-testid="text-body-input" />
      <button type="button" onClick={() => setOpen(!open)} className="text-[10px] text-white/35 hover:text-white/70 transition flex items-center gap-1">
        <span className="text-[8px]">{open ? "▼" : "▶"}</span> effects & style
      </button>
      {open && (
        <div className="grid gap-2 md:grid-cols-2 pl-3 border-l border-white/[0.06]">
          <StyleRow label="effect" value={cfg.effect ?? "none"} onChange={(v) => set("effect", v)} inputCls={inputCls}
            options={[["none","clean"],["glow","soft glow"],["neon","neon sign"],["chrome","chrome"],["glitch","glitch"],["sticker","sticker"]]} />
          <StyleRow label="size" value={cfg.size ?? "normal"} onChange={(v) => set("size", v)} inputCls={inputCls}
            options={[["small","small"],["normal","normal"],["big","big"],["hero","hero"]]} />
          <StyleRow label="align" value={cfg.align ?? "left"} onChange={(v) => set("align", v)} inputCls={inputCls}
            options={[["left","left"],["center","center"],["right","right"]]} />
          <Field label="color">
            <input className={inputCls} type="color" value={cfg.accent ?? "#8b5cf6"} onChange={(e) => set("accent", e.target.value)} />
          </Field>
        </div>
      )}
    </div>
  );
}

function ImageConfig({ cfg, set, inputCls }: { cfg: any; set: (k: string, v: any) => void; inputCls: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <input className={inputCls} placeholder="image URL" value={cfg.url ?? ""} onChange={(e) => set("url", e.target.value)} data-testid="image-url-input" />
      <input className={inputCls} placeholder="caption (optional)" value={cfg.caption ?? ""} onChange={(e) => set("caption", e.target.value)} />
      <button type="button" onClick={() => setOpen(!open)} className="text-[10px] text-white/35 hover:text-white/70 transition flex items-center gap-1">
        <span className="text-[8px]">{open ? "▼" : "▶"}</span> frame style
      </button>
      {open && (
        <div className="space-y-2 pl-3 border-l border-white/[0.06]">
          <StyleRow label="frame" value={cfg.frame ?? "none"} onChange={(v) => set("frame", v)} inputCls={inputCls}
            options={[["none","none"],["polaroid","polaroid"],["vhs","VHS scan"],["neon","neon border"]]} />
          {cfg.frame === "polaroid" && (
            <Field label={`tilt: ${cfg.tilt ?? -1.5}°`}>
              <input type="range" min={-5} max={5} step={0.5} value={cfg.tilt ?? -1.5} onChange={(e) => set("tilt", parseFloat(e.target.value))} className="w-full" />
            </Field>
          )}
          {cfg.frame === "neon" && (
            <Field label="neon color">
              <input className={inputCls} type="color" value={cfg.neonColor ?? "#f472b6"} onChange={(e) => set("neonColor", e.target.value)} />
            </Field>
          )}
        </div>
      )}
    </div>
  );
}

function detectMusicType(raw: string) {
  const value = raw.toLowerCase();
  if (value.includes("open.spotify.com")) return "spotify";
  if (value.includes("soundcloud.com")) return "soundcloud";
  if (value.includes("youtube.com") || value.includes("youtu.be")) return "youtube";
  if (value.includes("bandcamp.com")) return "bandcamp";
  if (value.match(/\.(mp3|wav|ogg|m4a|aac)(\?|#|$)/)) return "direct";
  return "direct";
}

function musicSample(type: string) {
  if (type === "spotify") return "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC";
  if (type === "soundcloud") return "https://soundcloud.com/forss/flickermood";
  if (type === "youtube") return "https://youtu.be/dQw4w9WgXcQ";
  if (type === "bandcamp") return "https://bandcamp.com/EmbeddedPlayer/album=3060924043/size=large/bgcol=0f172a/linkcol=2dd4bf/tracklist=false/transparent=true/";
  return "/uploads/audio/example.mp3";
}

function MusicPlayerConfig({ cfg, set, setMany, inputCls }: { cfg: any; set: (k: string, v: any) => void; setMany: (patch: Record<string, any>) => void; inputCls: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const type = cfg.playerType ?? (cfg.embedUrl ? detectMusicType(cfg.embedUrl) : "direct");
  const mainUrl = type === "direct" ? (cfg.audioUrl ?? cfg.url ?? "") : (cfg.embedUrl ?? "");

  function setSource(raw: string) {
    const detected = detectMusicType(raw);
    if (detected === "direct") {
      setMany({ playerType: detected, audioUrl: raw, embedUrl: cfg.embedUrl ?? "" });
      return;
    }
    setMany({ playerType: detected, embedUrl: raw, audioUrl: cfg.audioUrl ?? "" });
  }

  async function uploadTrack(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "audio");
      fd.append("title", cfg.title || file.name.replace(/\.[^.]+$/, ""));
      if (cfg.artist) fd.append("artist", cfg.artist);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "audio upload failed");
        return;
      }
      setMany({
        playerType: "direct",
        audioUrl: data.upload.url,
        title: data.upload.title,
        artist: data.upload.artist ?? cfg.artist ?? "",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="music-config-panel">
        <div>
          <span>smart music source</span>
          <strong>{type === "direct" ? "direct audio" : type}</strong>
        </div>
        <button type="button" onClick={() => setSource(musicSample(type))}>try example</button>
      </div>
      <Field label="paste link">
        <input
          className={inputCls}
          placeholder="Spotify, SoundCloud, YouTube, Bandcamp, or .mp3/.wav/.ogg URL"
          value={mainUrl}
          onChange={(e) => setSource(e.target.value)}
          data-testid="music-smart-url"
        />
      </Field>
      <div className="grid gap-2 md:grid-cols-2">
        <Field label="track title">
          <input className={inputCls} placeholder="Track title" value={cfg.title ?? ""} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="artist">
          <input className={inputCls} placeholder="Artist / playlist name" value={cfg.artist ?? ""} onChange={(e) => set("artist", e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        <Field label="caption">
          <input className={inputCls} placeholder="now playing" value={cfg.caption ?? ""} onChange={(e) => set("caption", e.target.value)} />
        </Field>
        <Field label="cover art">
          <input className={inputCls} placeholder="cover image URL" value={cfg.coverUrl ?? ""} onChange={(e) => set("coverUrl", e.target.value)} />
        </Field>
        <Field label="accent">
          <input className={inputCls} type="color" value={cfg.accent ?? "#8b5cf6"} onChange={(e) => set("accent", e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <StyleRow label="look" value={cfg.playerStyle ?? "spotlight"} onChange={(v) => set("playerStyle", v)} inputCls={inputCls}
          options={[["spotlight","landing-style"],["clean","clean"],["studio","studio"],["vinyl","vinyl"],["neon","neon"],["compact","compact"]]}
        />
        <StyleRow label="source mode" value={type} onChange={(v) => set("playerType", v)} inputCls={inputCls}
          options={[["direct","direct audio"],["spotify","Spotify"],["soundcloud","SoundCloud"],["youtube","YouTube"],["bandcamp","Bandcamp"]]}
        />
      </div>
      <label className="peng-btn peng-btn-ghost w-full cursor-pointer text-xs">
        {uploading ? "uploading..." : "upload audio file"}
        <input type="file" accept="audio/*" className="hidden" onChange={(e) => uploadTrack(e.target.files?.[0] ?? null)} />
      </label>
      <label className="flex items-center gap-2 text-[10px] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
        <input type="checkbox" checked={!!cfg.autoPlay} onChange={(e) => set("autoPlay", e.target.checked)} />
        try autoplay where browsers allow it
      </label>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <p className="text-[10px] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>
        Normal Spotify links, SoundCloud links, YouTube links, iframe code, and direct audio URLs are auto-converted.
      </p>
    </div>
  );
}

function SocialLinksConfig({ cfg, set, inputCls }: { cfg: any; set: (k: string, v: any) => void; inputCls: string }) {
  const [uploading, setUploading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const links = cfg.links ?? [];

  function updateLink(i: number, patch: Record<string, any>) {
    const next = [...links];
    next[i] = { ...next[i], ...patch };
    set("links", next);
  }

  async function uploadIcon(i: number, file: File | null) {
    if (!file) return;
    setUploading(i);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "social_icon");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "icon upload failed"); return; }
      updateLink(i, { iconUrl: data.url });
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="space-y-3">
      <StyleRow label="layout" value={cfg.displayMode ?? "grid"} onChange={(v) => set("displayMode", v)} inputCls={inputCls}
        options={[["grid","grid"],["stack","stacked"],["pills","pills"],["minimal","minimal"]]} />
      {links.map((l: any, i: number) => (
        <div key={i} className="rounded-lg border border-[var(--bg-border)] bg-white/[0.02] p-3 space-y-2">
          <div className="grid gap-2 md:grid-cols-2">
            <input className={inputCls} placeholder="name (e.g. Twitch)" value={l.label ?? ""} onChange={(e) => updateLink(i, { label: e.target.value })} />
            <input className={inputCls} placeholder="URL" value={l.url ?? ""} onChange={(e) => updateLink(i, { url: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <input className={inputCls} placeholder="custom icon URL (optional)" value={l.iconUrl ?? ""} onChange={(e) => updateLink(i, { iconUrl: e.target.value })} />
            <label className="peng-btn peng-btn-ghost cursor-pointer text-xs shrink-0">
              {uploading === i ? "..." : "icon"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadIcon(i, e.target.files?.[0] ?? null)} />
            </label>
            <button onClick={() => set("links", links.filter((_: any, j: number) => j !== i))} className="peng-btn peng-btn-ghost text-xs text-red-300 shrink-0">✕</button>
          </div>
        </div>
      ))}
      <button onClick={() => set("links", [...links, { label: "", url: "" }])} className="peng-btn peng-btn-ghost text-xs">+ add link</button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function PortalConfig({ cfg, set, inputCls }: { cfg: any; set: (k: string, v: any) => void; inputCls: string }) {
  return (
    <div className="space-y-2">
      <input className={inputCls} placeholder="button text" value={cfg.label ?? ""} onChange={(e) => set("label", e.target.value)} />
      <input className={inputCls} placeholder="link URL" value={cfg.href ?? ""} onChange={(e) => set("href", e.target.value)} />
      <StyleRow label="style" value={cfg.variant ?? "glow"} onChange={(v) => set("variant", v)} inputCls={inputCls}
        options={[["glow","glow"],["neon","neon pink"],["arcade","arcade green"],["glass","glass"],["ghost","ghost"],["holographic","holographic"]]} />
    </div>
  );
}

function StatsCardConfig({ cfg, set, inputCls }: { cfg: any; set: (k: string, v: any) => void; inputCls: string }) {
  const stats = cfg.stats ?? [];
  return (
    <div className="space-y-3">
      <StyleRow label="layout" value={cfg.layout ?? "grid"} onChange={(v) => set("layout", v)} inputCls={inputCls}
        options={[["grid","grid"],["horizontal","horizontal"],["bars","bars"],["minimal","minimal"]]} />
      {stats.map((s: any, i: number) => (
        <div key={i} className="flex gap-2">
          <input className={inputCls} placeholder="label" value={s.label} onChange={(e) => { const a = [...stats]; a[i] = { ...a[i], label: e.target.value }; set("stats", a); }} />
          <input className={inputCls} placeholder="value" value={s.value} onChange={(e) => { const a = [...stats]; a[i] = { ...a[i], value: e.target.value }; set("stats", a); }} />
          {cfg.layout === "bars" && (
            <input className={inputCls} placeholder="max" value={s.max ?? ""} onChange={(e) => { const a = [...stats]; a[i] = { ...a[i], max: e.target.value }; set("stats", a); }} style={{ width: 60 }} />
          )}
          <button onClick={() => set("stats", stats.filter((_: any, j: number) => j !== i))} className="text-red-400/50 hover:text-red-300 px-2 text-xs shrink-0">✕</button>
        </div>
      ))}
      <button onClick={() => set("stats", [...stats, { label: "", value: "" }])} className="peng-btn peng-btn-ghost text-xs">+ add stat</button>
    </div>
  );
}

function CountdownConfig({ cfg, set, inputCls }: { cfg: any; set: (k: string, v: any) => void; inputCls: string }) {
  return (
    <div className="space-y-2">
      <input className={inputCls} placeholder="label (e.g. next stream)" value={cfg.label ?? ""} onChange={(e) => set("label", e.target.value)} />
      <input className={inputCls} type="datetime-local" value={cfg.targetDate ? cfg.targetDate.slice(0, 16) : ""} onChange={(e) => set("targetDate", new Date(e.target.value).toISOString())} />
      <StyleRow label="clock style" value={cfg.clockStyle ?? "default"} onChange={(v) => set("clockStyle", v)} inputCls={inputCls}
        options={[["default","default"],["digital","digital green"],["neon","neon pink"],["minimal","minimal"]]} />
    </div>
  );
}

function BackgroundConfig({ cfg, set }: { cfg: any; set: (k: string, v: any) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputCls = "w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)] transition";
  const [open, setOpen] = useState(false);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "space_background");
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) { setError(d.error ?? "Upload failed"); return; }
      set("url", d.url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <input className={inputCls} placeholder="paste image or gif URL" value={cfg.url ?? ""} onChange={(e) => set("url", e.target.value)} data-testid="background-url-input" />
      <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden" data-testid="background-file-input" />
      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="peng-btn peng-btn-ghost w-full text-xs disabled:opacity-50" data-testid="background-upload-button">
        {uploading ? "uploading..." : cfg.url ? "replace background" : "upload background"}
      </button>
      {cfg.url && (
        <div className="h-28 overflow-hidden rounded-lg border border-[var(--bg-border)]"
          style={{ backgroundImage: `linear-gradient(rgba(5,8,16,${(cfg.dim ?? 58) / 100}), rgba(5,8,16,${(cfg.dim ?? 58) / 100})), url(${cfg.url})`, backgroundSize: cfg.fit ?? "cover", backgroundPosition: cfg.position ?? "center" }}
          data-testid="background-preview"
        />
      )}
      <button type="button" onClick={() => setOpen(!open)} className="text-[10px] text-white/35 hover:text-white/70 transition flex items-center gap-1">
        <span className="text-[8px]">{open ? "▼" : "▶"}</span> advanced
      </button>
      {open && (
        <div className="space-y-2 pl-3 border-l border-white/[0.06]">
          <div className="grid gap-2 md:grid-cols-2">
            <StyleRow label="fit" value={cfg.fit ?? "cover"} onChange={(v) => set("fit", v)} inputCls={inputCls}
              options={[["cover","cover page"],["contain","show full"],["auto","original size"]]} />
            <StyleRow label="position" value={cfg.position ?? "center"} onChange={(v) => set("position", v)} inputCls={inputCls}
              options={[["center","center"],["top","top"],["bottom","bottom"],["left center","left"],["right center","right"]]} />
          </div>
          <Field label={`overlay: ${cfg.dim ?? 58}%`}>
            <input type="range" min={20} max={85} value={cfg.dim ?? 58} onChange={(e) => set("dim", Number(e.target.value))} className="w-full" />
          </Field>
          <Field label={`blur: ${cfg.blur ?? 0}px`}>
            <input type="range" min={0} max={12} value={cfg.blur ?? 0} onChange={(e) => set("blur", Number(e.target.value))} className="w-full" />
          </Field>
          <label className="inline-flex items-center gap-2 text-xs text-white/50">
            <input type="checkbox" checked={cfg.fixed ?? true} onChange={(e) => set("fixed", e.target.checked)} />
            keep background still while scrolling
          </label>
        </div>
      )}
      {error && <p className="text-xs text-red-400" data-testid="background-upload-error">{error}</p>}
    </div>
  );
}

function Mp3UploadConfig({ cfg, set }: { cfg: any; set: (k: string, v: any) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputCls = "w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)] transition";

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", cfg.title ?? file.name);
      if (cfg.artist) fd.append("artist", cfg.artist);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) { setError(d.error ?? "Upload failed"); return; }
      set("url", d.upload.url);
      set("title", d.upload.title);
      set("artist", d.upload.artist);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <input className={inputCls} placeholder="title" value={cfg.title ?? ""} onChange={(e) => set("title", e.target.value)} />
      <input className={inputCls} placeholder="artist" value={cfg.artist ?? ""} onChange={(e) => set("artist", e.target.value)} />
      <input ref={fileRef} type="file" accept="audio/*" onChange={upload} className="hidden" data-testid="mp3-file-input" />
      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="peng-btn peng-btn-ghost text-xs w-full disabled:opacity-50" data-testid="mp3-upload-button">
        {uploading ? "uploading…" : cfg.url ? "replace track" : "upload track"}
      </button>
      {cfg.url && <audio controls src={cfg.url} className="w-full" style={{ height: 36 }} />}
      {error && <p className="text-xs text-red-400" data-testid="upload-error">{error}</p>}
    </div>
  );
}

function BestFriendsConfig({ cfg, set, inputCls }: { cfg: any; set: (k: string, v: any) => void; inputCls: string }) {
  const friends = cfg.friends ?? [];

  function updateFriend(i: number, patch: Record<string, any>) {
    const next = [...friends];
    next[i] = { ...next[i], ...patch };
    set("friends", next);
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-3">
        <Field label="title">
          <input className={inputCls} placeholder="top people" value={cfg.title ?? ""} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <StyleRow label="style" value={cfg.style ?? "cards"} onChange={(v) => set("style", v)} inputCls={inputCls}
          options={[["cards","cards"],["spotlight","spotlight"],["polaroid","polaroid"],["neon","neon"]]} />
        <StyleRow label="columns" value={String(cfg.cols ?? 4)} onChange={(v) => set("cols", Number(v))} inputCls={inputCls}
          options={[["2","2"],["3","3"],["4","4"]]} />
      </div>

      <Divider label={`people (${friends.length}/8)`} />

      {friends.map((f: any, i: number) => (
        <div key={i} className="rounded-lg border border-[var(--bg-border)] bg-white/[0.02] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>#{i + 1}</span>
            <button onClick={() => set("friends", friends.filter((_: any, j: number) => j !== i))} className="text-red-400/50 hover:text-red-300 text-xs">remove</button>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <input className={inputCls} placeholder="username *" value={f.username ?? ""} onChange={(e) => updateFriend(i, { username: e.target.value })} />
            <input className={inputCls} placeholder="display name" value={f.displayName ?? ""} onChange={(e) => updateFriend(i, { displayName: e.target.value })} />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <input className={inputCls} placeholder="avatar URL" value={f.avatarUrl ?? ""} onChange={(e) => updateFriend(i, { avatarUrl: e.target.value })} />
            <input className={inputCls} placeholder="short note" value={f.note ?? ""} onChange={(e) => updateFriend(i, { note: e.target.value })} />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[10px] text-white/35 shrink-0">
              <span style={{ fontFamily: "var(--font-mono)" }}>color</span>
              <input type="color" value={f.accentColor ?? "#8b5cf6"} onChange={(e) => updateFriend(i, { accentColor: e.target.value })} className="w-8 h-7 rounded cursor-pointer bg-transparent border border-[var(--bg-border)]" />
            </label>
            <input className={inputCls} placeholder="custom link (optional)" value={f.href ?? ""} onChange={(e) => updateFriend(i, { href: e.target.value })} />
          </div>
        </div>
      ))}

      {friends.length < 8 && (
        <button onClick={() => set("friends", [...friends, { username: "", displayName: "", avatarUrl: "", accentColor: "#8b5cf6", note: "", href: "" }])} className="peng-btn peng-btn-ghost text-xs w-full">
          + add person
        </button>
      )}
    </div>
  );
}

function NowStatusConfig({ cfg, set, inputCls }: { cfg: any; set: (k: string, v: any) => void; inputCls: string }) {
  return (
    <div className="space-y-2">
      <input className={inputCls} placeholder="what (song title, show, game...)" value={cfg.what ?? ""} onChange={(e) => set("what", e.target.value)} />
      <div className="grid gap-2 md:grid-cols-3">
        <StyleRow label="activity" value={cfg.activity ?? "listening"} onChange={(v) => set("activity", v)} inputCls={inputCls}
          options={[["listening","listening to"],["watching","watching"],["playing","playing"],["reading","reading"],["vibing","vibing to"],["working","working on"]]} />
        <StyleRow label="style" value={cfg.style ?? "card"} onChange={(v) => set("style", v)} inputCls={inputCls}
          options={[["card","card"],["pill","pill"],["minimal","minimal"]]} />
        <Field label="mood emoji">
          <input className={inputCls} placeholder="🎧 or any emoji" value={cfg.mood ?? ""} onChange={(e) => set("mood", e.target.value)} />
        </Field>
      </div>
      <input className={inputCls} placeholder="note (optional)" value={cfg.note ?? ""} onChange={(e) => set("note", e.target.value)} />
    </div>
  );
}

function MarqueeConfig({ cfg, set, inputCls }: { cfg: any; set: (k: string, v: any) => void; inputCls: string }) {
  return (
    <div className="space-y-2">
      <input className={inputCls} placeholder="ticker text" value={cfg.text ?? ""} onChange={(e) => set("text", e.target.value)} />
      <div className="grid gap-2 md:grid-cols-3">
        <StyleRow label="size" value={cfg.textSize ?? "sm"} onChange={(v) => set("textSize", v)} inputCls={inputCls}
          options={[["xs","xs"],["sm","sm"],["md","md"],["lg","lg"],["xl","xl"]]} />
        <Field label="color">
          <input className={inputCls} type="color" value={cfg.color ?? "#8b5cf6"} onChange={(e) => set("color", e.target.value)} />
        </Field>
        <Field label={`speed: ${cfg.speed ?? 20}s`}>
          <input type="range" min={5} max={60} value={cfg.speed ?? 20} onChange={(e) => set("speed", Number(e.target.value))} className="w-full mt-2" />
        </Field>
      </div>
      <input className={inputCls} placeholder="separator (e.g. ✦ or •)" value={cfg.separator ?? " ✦ "} onChange={(e) => set("separator", e.target.value)} />
    </div>
  );
}

function QuoteCardConfig({ cfg, set, inputCls }: { cfg: any; set: (k: string, v: any) => void; inputCls: string }) {
  return (
    <div className="space-y-2">
      <textarea className={inputCls} rows={3} placeholder="your quote" value={cfg.quote ?? ""} onChange={(e) => set("quote", e.target.value)} />
      <input className={inputCls} placeholder="— attribution (optional)" value={cfg.attribution ?? ""} onChange={(e) => set("attribution", e.target.value)} />
      <div className="grid gap-2 md:grid-cols-2">
        <StyleRow label="style" value={cfg.style ?? "minimal"} onChange={(v) => set("style", v)} inputCls={inputCls}
          options={[["minimal","minimal"],["big","big centered"],["bubble","bubble"],["neon","neon"],["scrawl","handwritten"]]} />
        <Field label="color">
          <input className={inputCls} type="color" value={cfg.accent ?? "#8b5cf6"} onChange={(e) => set("accent", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function PhotoGridConfig({ cfg, set, inputCls }: { cfg: any; set: (k: string, v: any) => void; inputCls: string }) {
  const photos = cfg.photos ?? [];

  function updatePhoto(i: number, patch: Record<string, any>) {
    const next = [...photos];
    next[i] = { ...next[i], ...patch };
    set("photos", next);
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-3">
        <StyleRow label="layout" value={cfg.layout ?? "grid"} onChange={(v) => set("layout", v)} inputCls={inputCls}
          options={[["grid","grid"],["polaroid","polaroid wall"],["strips","film strips"]]} />
        {cfg.layout !== "polaroid" && (
          <StyleRow label="columns" value={String(cfg.cols ?? 3)} onChange={(v) => set("cols", Number(v))} inputCls={inputCls}
            options={[["2","2"],["3","3"],["4","4"]]} />
        )}
        <StyleRow label="filter" value={cfg.filter ?? "none"} onChange={(v) => set("filter", v)} inputCls={inputCls}
          options={[["none","none"],["grainy","grainy"],["vhs","VHS"],["warm","warm"],["cold","cold"],["noir","noir"]]} />
      </div>

      {photos.map((p: any, i: number) => (
        <div key={i} className="flex gap-2 items-center">
          <input className={inputCls} placeholder="image URL" value={p.url ?? ""} onChange={(e) => updatePhoto(i, { url: e.target.value })} />
          <input className={inputCls} placeholder="caption" value={p.caption ?? ""} onChange={(e) => updatePhoto(i, { caption: e.target.value })} />
          <button onClick={() => set("photos", photos.filter((_: any, j: number) => j !== i))} className="text-red-400/50 hover:text-red-300 text-xs shrink-0 px-1">✕</button>
        </div>
      ))}

      <button onClick={() => set("photos", [...photos, { url: "", caption: "" }])} className="peng-btn peng-btn-ghost text-xs">+ add photo</button>
    </div>
  );
}

function AboutMeConfig({ cfg, set, inputCls }: { cfg: any; set: (k: string, v: any) => void; inputCls: string }) {
  const fields = cfg.fields ?? [];

  function updateField(i: number, patch: Record<string, any>) {
    const next = [...fields];
    next[i] = { ...next[i], ...patch };
    set("fields", next);
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-2">
        <Field label="title">
          <input className={inputCls} placeholder="about me" value={cfg.title ?? ""} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <StyleRow label="style" value={cfg.style ?? "clean"} onChange={(v) => set("style", v)} inputCls={inputCls}
          options={[["clean","clean"],["retro","retro spotlight"],["terminal","terminal"]]} />
      </div>

      {fields.map((f: any, i: number) => (
        <div key={i} className="flex gap-2">
          <input className={inputCls} placeholder="label" value={f.label ?? ""} onChange={(e) => updateField(i, { label: e.target.value })} style={{ width: "35%" }} />
          <input className={inputCls} placeholder="value" value={f.value ?? ""} onChange={(e) => updateField(i, { value: e.target.value })} />
          <button onClick={() => set("fields", fields.filter((_: any, j: number) => j !== i))} className="text-red-400/50 hover:text-red-300 text-xs shrink-0 px-1">✕</button>
        </div>
      ))}

      <button onClick={() => set("fields", [...fields, { label: "", value: "" }])} className="peng-btn peng-btn-ghost text-xs">+ add field</button>
    </div>
  );
}

function InterestTagsConfig({ cfg, set, inputCls }: { cfg: any; set: (k: string, v: any) => void; inputCls: string }) {
  const tags: string[] = (cfg.tags ?? []).map((t: any) => (typeof t === "string" ? t : t.label));
  const [input, setInput] = useState("");

  function addTag() {
    const clean = input.trim();
    if (!clean || tags.includes(clean)) return;
    set("tags", [...tags, clean]);
    setInput("");
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-2">
        <Field label="title (optional)">
          <input className={inputCls} placeholder="into, interests, etc." value={cfg.title ?? ""} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <StyleRow label="style" value={cfg.style ?? "default"} onChange={(v) => set("style", v)} inputCls={inputCls}
          options={[["default","subtle"],["neon","neon"],["bubble","bubble"]]} />
      </div>
      <div className="flex gap-2">
        <input className={inputCls} placeholder="type a tag and press enter" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
        <button onClick={addTag} className="peng-btn peng-btn-ghost text-xs shrink-0">add</button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span key={i} className="flex items-center gap-1 rounded border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/65">
              {tag}
              <button onClick={() => set("tags", tags.filter((_, j) => j !== i))} className="text-white/25 hover:text-red-400 ml-0.5 text-[10px]">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AchievementsConfig({ cfg, set, inputCls }: { cfg: any; set: (k: string, v: any) => void; inputCls: string }) {
  const badges = cfg.badges ?? [];

  function updateBadge(i: number, patch: Record<string, any>) {
    const next = [...badges];
    next[i] = { ...next[i], ...patch };
    set("badges", next);
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-2">
        <Field label="title">
          <input className={inputCls} placeholder="achievements" value={cfg.title ?? ""} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <StyleRow label="style" value={cfg.style ?? "cards"} onChange={(v) => set("style", v)} inputCls={inputCls}
          options={[["cards","cards"],["compact","compact row"],["neon","neon glow"]]} />
      </div>

      <Divider label={`badges (${badges.length})`} />
      <p className="text-[10px] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>Add custom badges or copy from your earned achievements</p>

      {badges.map((b: any, i: number) => (
        <div key={i} className="flex gap-2 items-center">
          <input className={inputCls} placeholder="emoji" value={b.icon ?? ""} onChange={(e) => updateBadge(i, { icon: e.target.value })} style={{ width: 60 }} />
          <input className={inputCls} placeholder="name" value={b.name ?? ""} onChange={(e) => updateBadge(i, { name: e.target.value })} />
          <input className={inputCls} placeholder="description" value={b.description ?? ""} onChange={(e) => updateBadge(i, { description: e.target.value })} />
          <button onClick={() => set("badges", badges.filter((_: any, j: number) => j !== i))} className="text-red-400/50 hover:text-red-300 text-xs shrink-0 px-1">✕</button>
        </div>
      ))}

      <button onClick={() => set("badges", [...badges, { icon: "★", name: "", description: "" }])} className="peng-btn peng-btn-ghost text-xs">+ add badge</button>
    </div>
  );
}

function SignalLandingConfig({ cfg, set, inputCls }: { cfg: any; set: (k: string, v: any) => void; inputCls: string }) {
  const links = cfg.links ?? [];
  const stats = cfg.stats ?? [];
  const [open, setOpen] = useState(false);

  function updateLink(i: number, patch: Record<string, any>) {
    const next = [...links]; next[i] = { ...next[i], ...patch }; set("links", next);
  }
  function updateStat(i: number, patch: Record<string, any>) {
    const next = [...stats]; next[i] = { ...next[i], ...patch }; set("stats", next);
  }

  return (
    <div className="space-y-3">
      <div className="signal-editor-note">
        <strong>Peng layout</strong>
        <span>name + caption control the center card, links become both the icon row and the bottom cards.</span>
      </div>
      {/* Identity */}
      <div className="grid gap-2 md:grid-cols-2">
        <Field label="center name">
          <input className={inputCls} placeholder="your name" value={cfg.name ?? ""} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="small role line">
          <input className={inputCls} placeholder="creator · streamer" value={cfg.title ?? ""} onChange={(e) => set("title", e.target.value)} />
        </Field>
      </div>
      <Field label="thought line under the role">
        <input className={inputCls} placeholder="a line that hits different" value={cfg.caption ?? ""} onChange={(e) => set("caption", e.target.value)} />
      </Field>

      <Divider label="top-left signal board" />
      <div className="grid gap-2 md:grid-cols-2">
        <Field label="signal label">
          <input className={inputCls} placeholder="tonight's signal" value={cfg.signalLabel ?? ""} onChange={(e) => set("signalLabel", e.target.value)} />
        </Field>
        <Field label={`signal meter: ${cfg.signalPct ?? 11}%`}>
          <input type="range" min={0} max={100} value={cfg.signalPct ?? 11} onChange={(e) => set("signalPct", Number(e.target.value))} className="w-full mt-2" />
        </Field>
      </div>
      {stats.map((s: any, i: number) => (
        <div key={i} className="flex gap-2">
          <input className={inputCls} placeholder="label" value={s.label ?? ""} onChange={(e) => updateStat(i, { label: e.target.value })} style={{ width: "45%" }} />
          <input className={inputCls} placeholder="value" value={s.value ?? ""} onChange={(e) => updateStat(i, { value: e.target.value })} />
          <button onClick={() => set("stats", stats.filter((_: any, j: number) => j !== i))} className="text-red-400/50 hover:text-red-300 text-xs px-1 shrink-0">✕</button>
        </div>
      ))}
      <button onClick={() => set("stats", [...stats, { label: "", value: "" }])} className="peng-btn peng-btn-ghost text-xs">+ add stat</button>

      <Divider label="center icons + bottom cards" />
      {links.map((l: any, i: number) => (
        <div key={i} className="rounded-lg border border-[var(--bg-border)] bg-white/[0.02] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>card {i + 1}</span>
            <button onClick={() => set("links", links.filter((_: any, j: number) => j !== i))} className="text-red-400/50 hover:text-red-300 text-xs">remove</button>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <input className={inputCls} placeholder="label" value={l.label ?? ""} onChange={(e) => updateLink(i, { label: e.target.value })} />
            <input className={inputCls} placeholder="sub text" value={l.sub ?? ""} onChange={(e) => updateLink(i, { sub: e.target.value })} />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <input className={inputCls} placeholder="action tag (watch, join, open, chat)" value={l.badge ?? ""} onChange={(e) => updateLink(i, { badge: e.target.value })} />
            <input className={inputCls} placeholder="URL" value={l.url ?? ""} onChange={(e) => updateLink(i, { url: e.target.value })} />
          </div>
          <p className="text-[10px] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>
            label/url decides the icon under your caption too.
          </p>
        </div>
      ))}
      {links.length < 4 && (
        <button onClick={() => set("links", [...links, { label: "", sub: "", badge: "", url: "" }])} className="peng-btn peng-btn-ghost text-xs">+ add link card</button>
      )}

      <Divider label="top-right enter card" />
      <div className="grid gap-2 md:grid-cols-2">
        <Field label="portal label">
          <input className={inputCls} placeholder="Enter Hub" value={cfg.portalLabel ?? ""} onChange={(e) => set("portalLabel", e.target.value)} />
        </Field>
        <Field label="portal URL">
          <input className={inputCls} placeholder="/hub" value={cfg.portalUrl ?? ""} onChange={(e) => set("portalUrl", e.target.value)} />
        </Field>
      </div>
      <Field label="portal sub text">
        <input className={inputCls} placeholder="links · community · drops" value={cfg.portalSub ?? ""} onChange={(e) => set("portalSub", e.target.value)} />
      </Field>
    </div>
  );
}
