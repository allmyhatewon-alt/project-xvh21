"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";
import { useAuth } from "@/app/providers";
import { BlockEditor } from "@/components/SpaceEditor/BlockEditor";
import { BlockRenderer, type Block } from "@/components/BlockRenderer/BlockRenderer";

const TEMPLATE_OPTIONS = [
  {
    id: "pengelus-deploy",
    name: "Peng",
    category: "coded",
    vibe: "cinematic profile with a big identity card and live links",
    badge: "peng",
    blocks: () => [
      makeBlock("BACKGROUND", { themePreset: "deploy", dim: 38, blur: 0, fixed: true, bannerGlow: 70, nameGlow: 75 }),
      makeBlock("SIGNAL_LANDING", {
        name: "peng",
        title: "creator · streamer",
        caption: "jaakuna run through my veins.",
        signalLabel: "tonight's signal",
        signalPct: 11,
        stats: [{ label: "broadcast", value: "offline" }, { label: "signal", value: "11%" }],
        links: [
          { label: "latest tiktoks", sub: "clips, edits, stream moments", badge: "watch", url: "https://tiktok.com/@" },
          { label: "discord", sub: "server, updates, people", badge: "join", url: "https://discord.gg/" },
          { label: "twitch", sub: "live when the signal hits", badge: "open", url: "https://twitch.tv/" },
          { label: "message", sub: "login, send, show up", badge: "chat", url: "/hub" },
        ],
        portalLabel: "Enter The Hub",
        portalSub: "links · community · drops",
        portalUrl: "/hub",
      }),
    ],
  },
  {
    id: "os-coded",
    name: "OS Coded",
    category: "coded",
    vibe: "terminal layout with clean system panels",
    badge: "dev",
    blocks: () => [
      makeBlock("MARQUEE", { text: "SYSTEM BOOTING · PROFILE LOADED · ALL LINKS ONLINE", speed: 18, color: "#22c55e", textSize: "xs", separator: " · " }),
      makeBlock("TEXT", { heading: "system online", body: "links booted. profile loaded. everything important is one click away.", effect: "glitch", size: "hero", align: "center", accent: "#22c55e" }),
      makeBlock("ABOUT_ME", { title: "sys.info", style: "terminal", fields: [{ label: "status", value: "online" }, { label: "mode", value: "LIVE" }, { label: "build", value: "v2.0" }, { label: "stack", value: "edit me" }] }),
      makeBlock("STATS_CARD", { layout: "bars", stats: [{ label: "UPTIME", value: "99", max: "100" }, { label: "OUTPUT", value: "85", max: "100" }, { label: "SIGNAL", value: "72", max: "100" }] }),
      makeBlock("SOCIAL_LINKS", { displayMode: "minimal", links: [{ label: "GitHub", url: "https://github.com/" }, { label: "Discord", url: "https://discord.gg/" }, { label: "X", url: "https://x.com/" }] }),
      makeBlock("PORTAL", { label: "RUN PROFILE.EXE", href: "/hub", variant: "arcade" }),
    ],
  },
  {
    id: "anime",
    name: "Anime Aesthetic",
    category: "style",
    vibe: "soft anime layout with a focused hero section",
    badge: "style",
    blocks: () => [
      makeBlock("MARQUEE", { text: "new arc loading · main character energy · do not skip", speed: 22, color: "#f472b6", textSize: "xs", separator: " · " }),
      makeBlock("TEXT", { heading: "main character arc", body: "updates, edits, streams, and whatever chapter we are on right now.", effect: "sticker", size: "hero", align: "center", accent: "#f472b6" }),
      makeBlock("NOW_STATUS", { activity: "watching", what: "add what you're watching", style: "pill", mood: "👁" }),
      makeBlock("QUOTE_CARD", { quote: "the arc is not over yet.", attribution: "", style: "scrawl", accent: "#f472b6" }),
      makeBlock("COUNTDOWN", { label: "next episode", targetDate: new Date(Date.now() + 129600000).toISOString(), clockStyle: "neon" }),
      makeBlock("INTEREST_TAGS", { title: "into", style: "neon", tags: ["shonen", "slice of life", "gaming", "edits", "music"] }),
      makeBlock("SOCIAL_LINKS", { displayMode: "pills", links: [{ label: "TikTok", url: "https://tiktok.com/@" }, { label: "Instagram", url: "https://instagram.com/" }, { label: "Discord", url: "https://discord.gg/" }] }),
    ],
  },
  {
    id: "twitch",
    name: "Twitch Streamer",
    category: "streamer",
    vibe: "stream panel with clear community links",
    badge: "live",
    blocks: () => [
      makeBlock("TEXT", { heading: "stream room open", body: "follow the channel, join the server, catch the next live before chat fills up.", effect: "neon", size: "hero", align: "center", accent: "#9146ff" }),
      makeBlock("NOW_STATUS", { activity: "playing", what: "add your current game", style: "card", mood: "🎮" }),
      makeBlock("COUNTDOWN", { label: "next stream", targetDate: new Date(Date.now() + 86400000).toISOString(), clockStyle: "digital" }),
      makeBlock("BEST_FRIENDS", { title: "the squad", style: "neon", cols: 4, friends: [] }),
      makeBlock("SOCIAL_LINKS", { displayMode: "stack", links: [{ label: "Twitch", url: "https://twitch.tv/" }, { label: "Discord", url: "https://discord.gg/" }, { label: "YouTube", url: "https://youtube.com/" }, { label: "Kick", url: "https://kick.com/" }] }),
      makeBlock("PORTAL", { label: "JOIN THE ROOM", href: "/hub", variant: "neon" }),
    ],
  },
  {
    id: "music",
    name: "Music Drop",
    category: "music",
    vibe: "artist card with a featured music player",
    badge: "audio",
    blocks: () => [
      makeBlock("MARQUEE", { text: "NEW DROP · PLAY IT · SHARE IT · RUN IT BACK", speed: 20, color: "#f472b6", textSize: "sm", separator: " · " }),
      makeBlock("TEXT", { heading: "new drop", body: "play it, share it, run it back.", effect: "chrome", size: "hero", align: "center", accent: "#f472b6" }),
      makeBlock("MUSIC_PLAYER", { playerType: "spotify", playerStyle: "spotlight", title: "featured track", artist: "paste your embed URL below", embedUrl: "", caption: "now playing", accent: "#f472b6", coverUrl: "" }),
      makeBlock("NOW_STATUS", { activity: "listening", what: "add your current track", style: "pill", mood: "🎧" }),
      makeBlock("INTEREST_TAGS", { title: "sound", style: "bubble", tags: ["rap", "r&b", "lo-fi", "edit me"] }),
      makeBlock("SOCIAL_LINKS", { displayMode: "grid", links: [{ label: "Spotify", url: "https://open.spotify.com/" }, { label: "SoundCloud", url: "https://soundcloud.com/" }, { label: "YouTube", url: "https://youtube.com/" }, { label: "Instagram", url: "https://instagram.com/" }] }),
    ],
  },
  {
    id: "artist",
    name: "GFX Artist",
    category: "creator",
    vibe: "portfolio layout for commissions and proof",
    badge: "gfx",
    blocks: () => [
      makeBlock("TEXT", { heading: "visuals that hit", body: "banners, thumbnails, overlays, edits, and profile work that does not look rushed.", effect: "sticker", size: "hero", align: "center", accent: "#22c55e" }),
      makeBlock("PHOTO_GRID", { photos: [], layout: "strips", cols: 3, filter: "none" }),
      makeBlock("STATS_CARD", { layout: "horizontal", stats: [{ label: "ORDERS", value: "OPEN" }, { label: "SLOTS", value: "3" }, { label: "STYLE", value: "GFX" }] }),
      makeBlock("ACHIEVEMENTS", { title: "past work", style: "compact", badges: [{ icon: "🎨", name: "Banner Pack", description: "stream + socials" }, { icon: "✏️", name: "Thumbnails", description: "youtube cuts" }] }),
      makeBlock("SOCIAL_LINKS", { displayMode: "pills", links: [{ label: "Instagram", url: "https://instagram.com/" }, { label: "Discord", url: "https://discord.gg/" }, { label: "TikTok", url: "https://tiktok.com/@" }] }),
      makeBlock("PORTAL", { label: "BOOK A SLOT", href: "/hub", variant: "glow" }),
    ],
  },
  {
    id: "event",
    name: "Event Hype",
    category: "creator",
    vibe: "event page with a timer and one clear action",
    badge: "drop",
    blocks: () => [
      makeBlock("MARQUEE", { text: "INCOMING · DATE SET · SHOW UP · INCOMING · DATE SET", speed: 14, color: "#facc15", textSize: "md", separator: " · " }),
      makeBlock("TEXT", { heading: "event loading", body: "save the date. bring the whole room. no long explanation needed.", effect: "glitch", size: "hero", align: "center", accent: "#facc15" }),
      makeBlock("QUOTE_CARD", { quote: "this one is different.", attribution: "", style: "big", accent: "#facc15" }),
      makeBlock("COUNTDOWN", { label: "starts in", targetDate: new Date(Date.now() + 172800000).toISOString(), clockStyle: "neon" }),
      makeBlock("SOCIAL_LINKS", { displayMode: "pills", links: [{ label: "Discord", url: "https://discord.gg/" }, { label: "Twitch", url: "https://twitch.tv/" }, { label: "TikTok", url: "https://tiktok.com/@" }] }),
      makeBlock("PORTAL", { label: "JOIN THE DROP", href: "/hub", variant: "arcade" }),
    ],
  },
  {
    id: "gamer",
    name: "Pro Gamer",
    category: "streamer",
    vibe: "competitive layout with rank and squad sections",
    badge: "ranked",
    blocks: () => [
      makeBlock("TEXT", { heading: "locked in", body: "ranked clips, squad links, and where to catch the next run.", effect: "neon", size: "hero", align: "center", accent: "#38bdf8" }),
      makeBlock("NOW_STATUS", { activity: "playing", what: "add your current game", style: "card", mood: "🎮" }),
      makeBlock("STATS_CARD", { layout: "bars", stats: [{ label: "WIN RATE", value: "73", max: "100" }, { label: "KD", value: "3.2" }, { label: "RANK", value: "ELITE" }] }),
      makeBlock("BEST_FRIENDS", { title: "the squad", style: "neon", cols: 4, friends: [] }),
      makeBlock("ACHIEVEMENTS", { title: "ranked badges", style: "neon", badges: [{ icon: "🏆", name: "Tournament Win", description: "first place" }, { icon: "⚡", name: "Top Fragger", description: "every match" }] }),
      makeBlock("SOCIAL_LINKS", { displayMode: "stack", links: [{ label: "Twitch", url: "https://twitch.tv/" }, { label: "YouTube", url: "https://youtube.com/" }, { label: "Discord", url: "https://discord.gg/" }] }),
    ],
  },
  {
    id: "clean",
    name: "Clean Creator",
    category: "clean",
    vibe: "premium links, calm, easy to read",
    badge: "minimal",
    blocks: () => [
      makeBlock("TEXT", { heading: "everything important", body: "links, updates, and the places I actually use.", effect: "glow", size: "big", align: "center", accent: "#8b5cf6" }),
      makeBlock("ABOUT_ME", { title: "about me", style: "clean", fields: [{ label: "based in", value: "" }, { label: "into", value: "" }, { label: "status", value: "" }] }),
      makeBlock("INTEREST_TAGS", { title: "", style: "default", tags: ["creator", "edit me", "add your tags"] }),
      makeBlock("SOCIAL_LINKS", { displayMode: "stack", links: [{ label: "TikTok", url: "https://tiktok.com/@" }, { label: "Twitch", url: "https://twitch.tv/" }, { label: "Instagram", url: "https://instagram.com/" }, { label: "X", url: "https://x.com/" }] }),
      makeBlock("PORTAL", { label: "ENTER MY SPACE", href: "/hub", variant: "ghost" }),
    ],
  },
  {
    id: "mood-board",
    name: "Mood Board",
    category: "style",
    vibe: "soft personal page with photos, status, and links",
    badge: "mood",
    blocks: () => [
      makeBlock("MARQUEE", { text: "mood board · current favorites · latest updates", speed: 25, color: "#fbbf24", textSize: "xs", separator: " · " }),
      makeBlock("NOW_STATUS", { activity: "sharing", what: "add your current mood", style: "card", mood: "✨" }),
      makeBlock("QUOTE_CARD", { quote: "add a quote that hits.", attribution: "", style: "scrawl", accent: "#fbbf24" }),
      makeBlock("PHOTO_GRID", { photos: [], layout: "polaroid", cols: 3, filter: "warm" }),
      makeBlock("INTEREST_TAGS", { title: "into right now", style: "bubble", tags: ["add your", "interests", "here"] }),
      makeBlock("SOCIAL_LINKS", { displayMode: "pills", links: [{ label: "TikTok", url: "https://tiktok.com/@" }, { label: "Instagram", url: "https://instagram.com/" }] }),
    ],
  },
  {
    id: "creator-hq",
    name: "Creator HQ",
    category: "creator",
    vibe: "full showcase with friends, achievements, and links",
    badge: "full",
    blocks: () => [
      makeBlock("TEXT", { heading: "creator hq", body: "everything about me in one place.", effect: "glow", size: "hero", align: "center", accent: "#2dd4bf" }),
      makeBlock("ABOUT_ME", { title: "about me", style: "clean", fields: [{ label: "role", value: "" }, { label: "based in", value: "" }, { label: "focus", value: "" }] }),
      makeBlock("INTEREST_TAGS", { title: "into", style: "neon", tags: ["add your", "interests", "here"] }),
      makeBlock("BEST_FRIENDS", { title: "top people", style: "cards", cols: 4, friends: [] }),
      makeBlock("ACHIEVEMENTS", { title: "achievements", style: "cards", badges: [] }),
      makeBlock("GUESTBOOK", { title: "leave a note", style: "clean" }),
      makeBlock("SOCIAL_LINKS", { displayMode: "grid", links: [{ label: "TikTok", url: "https://tiktok.com/@" }, { label: "Twitch", url: "https://twitch.tv/" }, { label: "Discord", url: "https://discord.gg/" }, { label: "Instagram", url: "https://instagram.com/" }] }),
    ],
  },
  {
    id: "portfolio",
    name: "Portfolio",
    category: "creator",
    vibe: "work showcase with projects and contact links",
    badge: "work",
    blocks: () => [
      makeBlock("TEXT", { heading: "my work", body: "projects, commissions, and proof that the output is real.", effect: "chrome", size: "hero", align: "left", accent: "#fb923c" }),
      makeBlock("PHOTO_GRID", { photos: [], layout: "grid", cols: 3, filter: "none" }),
      makeBlock("STATS_CARD", { layout: "horizontal", stats: [{ label: "PROJECTS", value: "0" }, { label: "STATUS", value: "OPEN" }, { label: "SLOTS", value: "∞" }] }),
      makeBlock("ACHIEVEMENTS", { title: "selected work", style: "cards", badges: [] }),
      makeBlock("QUOTE_CARD", { quote: "the work speaks for itself.", attribution: "", style: "minimal", accent: "#fb923c" }),
      makeBlock("SOCIAL_LINKS", { displayMode: "pills", links: [{ label: "Instagram", url: "https://instagram.com/" }, { label: "Discord", url: "https://discord.gg/" }] }),
      makeBlock("PORTAL", { label: "GET IN TOUCH", href: "/hub", variant: "glow" }),
    ],
  },
  {
    id: "streamer-hype",
    name: "Streamer Hype",
    category: "streamer",
    vibe: "full streamer setup with stats and links",
    badge: "stream",
    blocks: () => [
      makeBlock("MARQUEE", { text: "LIVE SOON · STREAM LOADING · CHAT FILLING UP · CLIPS DROPPING", speed: 16, color: "#34d399", textSize: "sm", separator: " · " }),
      makeBlock("TEXT", { heading: "stream loading", body: "bring the energy. catch the live. clip everything.", effect: "neon", size: "hero", align: "center", accent: "#34d399" }),
      makeBlock("NOW_STATUS", { activity: "playing", what: "add your game", style: "card", mood: "🎮" }),
      makeBlock("COUNTDOWN", { label: "live in", targetDate: new Date(Date.now() + 3600000).toISOString(), clockStyle: "digital" }),
      makeBlock("STATS_CARD", { layout: "horizontal", stats: [{ label: "FOLLOWERS", value: "0" }, { label: "CLIPS", value: "0" }, { label: "W/L", value: "edit me" }] }),
      makeBlock("BEST_FRIENDS", { title: "squad", style: "cards", cols: 4, friends: [] }),
      makeBlock("SOCIAL_LINKS", { displayMode: "stack", links: [{ label: "Twitch", url: "https://twitch.tv/" }, { label: "Discord", url: "https://discord.gg/" }, { label: "TikTok", url: "https://tiktok.com/@" }, { label: "YouTube", url: "https://youtube.com/" }] }),
    ],
  },
  {
    id: "night-radio",
    name: "Night Radio",
    category: "music",
    vibe: "late-night audio room with a real player and soft motion",
    badge: "radio",
    blocks: () => [
      makeBlock("BACKGROUND", { themePreset: "chrome", dim: 54, blur: 1, fixed: true, bannerGlow: 48, nameGlow: 42 }),
      makeBlock("MARQUEE", { text: "ON AIR / NEW SOUND / REQUESTS OPEN / STAY A WHILE", speed: 18, color: "#67e8f9", textSize: "xs", separator: " / " }),
      makeBlock("TEXT", { heading: "night radio", body: "a clean place for the track, the links, and the people who keep replaying it.", effect: "chrome", size: "hero", align: "center", accent: "#67e8f9" }),
      makeBlock("MUSIC_PLAYER", { playerType: "spotify", playerStyle: "landing", title: "late night signal", artist: "paste spotify, soundcloud, youtube, or mp3", embedUrl: "", caption: "now playing", accent: "#67e8f9", coverUrl: "" }),
      makeBlock("NOW_STATUS", { activity: "listening", what: "what is spinning right now?", style: "pill", mood: "audio" }),
      makeBlock("SOCIAL_LINKS", { displayMode: "grid", links: [{ label: "Spotify", url: "https://open.spotify.com/" }, { label: "SoundCloud", url: "https://soundcloud.com/" }, { label: "YouTube", url: "https://youtube.com/" }, { label: "Discord", url: "https://discord.gg/" }] }),
    ],
  },
  {
    id: "kick-room",
    name: "Live Room",
    category: "streamer",
    vibe: "streamer hub with schedule, room links, and one obvious action",
    badge: "live",
    blocks: () => [
      makeBlock("BACKGROUND", { themePreset: "twitch", dim: 52, blur: 0, fixed: true, bannerGlow: 54, nameGlow: 50 }),
      makeBlock("TEXT", { heading: "room opens soon", body: "stream schedule, chat link, clips, and where the community pulls up.", effect: "glow", size: "hero", align: "center", accent: "#34d399" }),
      makeBlock("COUNTDOWN", { label: "next live", targetDate: new Date(Date.now() + 7200000).toISOString(), clockStyle: "digital" }),
      makeBlock("STATS_CARD", { layout: "horizontal", stats: [{ label: "VIEWERS", value: "10" }, { label: "STREAK", value: "0" }, { label: "CLIPS", value: "0" }] }),
      makeBlock("MUSIC_PLAYER", { playerType: "direct", playerStyle: "compact", title: "pre-stream track", artist: "paste a playable audio link", embedUrl: "", caption: "pre-show", accent: "#34d399", coverUrl: "" }),
      makeBlock("SOCIAL_LINKS", { displayMode: "stack", links: [{ label: "Peng Live", url: "/hub/live/studio" }, { label: "Discord", url: "https://discord.gg/" }, { label: "TikTok", url: "https://tiktok.com/@" }] }),
      makeBlock("PORTAL", { label: "OPEN CHAT", href: "/hub", variant: "neon" }),
    ],
  },
  {
    id: "minimal-pro",
    name: "Minimal Pro",
    category: "clean",
    vibe: "quiet premium profile with zero clutter",
    badge: "pro",
    blocks: () => [
      makeBlock("BACKGROUND", { themePreset: "clean", dim: 42, blur: 0, fixed: true, bannerGlow: 28, nameGlow: 24 }),
      makeBlock("TEXT", { heading: "creator profile", body: "clean links, current status, and one featured piece.", effect: "glow", size: "big", align: "left", accent: "#2dd4bf" }),
      makeBlock("ABOUT_ME", { title: "profile", style: "clean", fields: [{ label: "role", value: "" }, { label: "status", value: "" }, { label: "contact", value: "" }] }),
      makeBlock("MUSIC_PLAYER", { playerType: "spotify", playerStyle: "compact", title: "featured", artist: "paste a link or embed", embedUrl: "", caption: "featured audio", accent: "#2dd4bf", coverUrl: "" }),
      makeBlock("SOCIAL_LINKS", { displayMode: "minimal", links: [{ label: "Website", url: "https://" }, { label: "Instagram", url: "https://instagram.com/" }, { label: "Discord", url: "https://discord.gg/" }] }),
      makeBlock("PORTAL", { label: "OPEN HUB", href: "/hub", variant: "ghost" }),
    ],
  },
];

const THEME_PACKS = [
  { id: "os-coded", name: "OS Coded", accent: "#22c55e", effect: "glitch", note: "terminal grid, sharp cards" },
  { id: "anime", name: "Anime", accent: "#f472b6", effect: "sticker", note: "soft glow, episode energy" },
  { id: "twitch", name: "Twitch", accent: "#9146ff", effect: "neon", note: "stream-room purple" },
  { id: "chrome", name: "Chrome", accent: "#93c5fd", effect: "chrome", note: "shiny premium text" },
  { id: "arcade", name: "Arcade", accent: "#facc15", effect: "glitch", note: "loud buttons, drop energy" },
  { id: "clean", name: "Clean", accent: "#8b5cf6", effect: "glow", note: "simple and readable" },
];

const TEMPLATE_CATEGORIES = ["all", "creator", "streamer", "style", "music", "coded", "clean"] as const;

const TEMPLATE_THEMES: Record<string, { themePreset: string; dim: number; bannerGlow?: number; nameGlow?: number }> = {
  "pengelus-deploy": { themePreset: "deploy", dim: 38, bannerGlow: 70, nameGlow: 75 },
  "os-coded": { themePreset: "os-coded", dim: 50, bannerGlow: 52, nameGlow: 58 },
  anime: { themePreset: "anime", dim: 48, bannerGlow: 60, nameGlow: 62 },
  twitch: { themePreset: "twitch", dim: 50, bannerGlow: 58, nameGlow: 58 },
  music: { themePreset: "chrome", dim: 46, bannerGlow: 56, nameGlow: 58 },
  artist: { themePreset: "arcade", dim: 50, bannerGlow: 54, nameGlow: 56 },
  event: { themePreset: "arcade", dim: 52, bannerGlow: 62, nameGlow: 60 },
  gamer: { themePreset: "twitch", dim: 48, bannerGlow: 58, nameGlow: 56 },
  clean: { themePreset: "clean", dim: 44, bannerGlow: 42, nameGlow: 36 },
  "mood-board": { themePreset: "anime", dim: 46, bannerGlow: 54, nameGlow: 52 },
  "creator-hq": { themePreset: "chrome", dim: 48, bannerGlow: 56, nameGlow: 54 },
  portfolio: { themePreset: "arcade", dim: 48, bannerGlow: 50, nameGlow: 48 },
  "streamer-hype": { themePreset: "twitch", dim: 48, bannerGlow: 62, nameGlow: 58 },
  "night-radio": { themePreset: "chrome", dim: 54, bannerGlow: 48, nameGlow: 42 },
  "kick-room": { themePreset: "twitch", dim: 52, bannerGlow: 54, nameGlow: 50 },
  "minimal-pro": { themePreset: "clean", dim: 42, bannerGlow: 28, nameGlow: 24 },
};

function makeBlock(type: string, config: Record<string, any>): Block {
  return {
    id: `${Date.now()}-${type}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    order: 0,
    config,
  };
}

export default function SpaceEditPage() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [published, setPublished] = useState(true);
  const [customCss, setCustomCss] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [templateCategory, setTemplateCategory] = useState("all");
  const [autoEditId, setAutoEditId] = useState<string | null>(null);
  const backgroundBlock = blocks.find((block) => block.type === "BACKGROUND");
  const background = backgroundBlock?.config ?? null;
  const visibleTemplates = templateCategory === "all" ? TEMPLATE_OPTIONS : TEMPLATE_OPTIONS.filter((template) => template.category === templateCategory);

  useEffect(() => {
    fetch("/api/space").then((r) => r.json()).then((d) => {
      if (d.space) {
        setBlocks(d.space.blocks || []);
        setPublished(!!d.space.published);
        setCustomCss(d.space.customCss ?? "");
      }
    });
  }, []);

  async function save() {
    setSaving(true);
    const r = await fetch("/api/space", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks, published, customCss: user?.gemsUnlocked ? customCss : "" }),
    });
    if (r.ok) {
      setSaved("saved");
      setTimeout(() => setSaved(null), 2500);
    } else {
      setSaved("Failed");
    }
    setSaving(false);
  }

  function applyTemplate(template: (typeof TEMPLATE_OPTIONS)[number]) {
    if (blocks.length > 0 && !window.confirm("Replace your current blocks with this template?")) return;
    const rawBlocks = template.blocks();
    const themedBlocks = rawBlocks.some((block) => block.type === "BACKGROUND")
      ? rawBlocks
      : [makeBlock("BACKGROUND", { ...(TEMPLATE_THEMES[template.id] ?? { themePreset: "clean", dim: 48 }), blur: 0, fixed: true }), ...rawBlocks];
    const newBlocks = themedBlocks.map((block, index) => ({ ...block, order: index }));
    setBlocks(newBlocks);
    // Auto-open edit panel for the first non-background block so user can customize right away
    const heroBlock = newBlocks.find((b) => b.type !== "BACKGROUND");
    if (heroBlock) setAutoEditId(heroBlock.id);
    setSaved(`${template.name} loaded — edit below`);
    setTimeout(() => setSaved(null), 3000);
  }

  function applyTheme(theme: (typeof THEME_PACKS)[number]) {
    const hasBackground = blocks.some((block) => block.type === "BACKGROUND");
    const themed = blocks.map((block) => {
      if (block.type === "TEXT") {
        return { ...block, config: { ...block.config, effect: theme.effect, accent: theme.accent } };
      }
      if (block.type === "BACKGROUND") {
        return { ...block, config: { ...block.config, themePreset: theme.id, dim: block.config.dim ?? 58 } };
      }
      return block;
    });
    const next = hasBackground ? themed : [{ ...makeBlock("BACKGROUND", { themePreset: theme.id, dim: 58, blur: 0, fixed: true }), order: 0 }, ...themed.map((block, i) => ({ ...block, order: i + 1 }))];
    setBlocks(next.map((block, i) => ({ ...block, order: i })));
    setSaved(`${theme.name} theme applied`);
    setTimeout(() => setSaved(null), 2200);
  }

  function updateBackgroundControl(patch: Record<string, any>) {
    const existing = blocks.find((block) => block.type === "BACKGROUND");
    if (existing) {
      setBlocks(blocks.map((block) => block.id === existing.id ? { ...block, config: { ...block.config, ...patch } } : block));
      return;
    }
    setBlocks([{ ...makeBlock("BACKGROUND", { themePreset: "clean", dim: 58, blur: 0, fixed: true, ...patch }), order: 0 }, ...blocks.map((block, i) => ({ ...block, order: i + 1 }))]);
  }

  if (!user) {
    return (
      <HubShell rightRail={<RightRail />}>
        <p className="text-xs text-white/40">sign in to edit your spotlight</p>
      </HubShell>
    );
  }

  return (
    <HubShell rightRail={<RightRail />}>
      <div className="max-w-4xl space-y-4 spotlight-editor-page">

        {/* ── Header ── */}
        <div className="spotlight-editor-hero">
          <div>
            <p className="text-[10px] tracking-widest text-[var(--accent)]" style={{ fontFamily: "var(--font-mono)" }}>SPOTLIGHT BUILDER</p>
            <h1 className="text-3xl font-black text-white lowercase" style={{ fontFamily: "var(--font-bricolage)" }}>edit your spotlight</h1>
            <p className="text-xs text-white/45 mt-1" style={{ fontFamily: "var(--font-mono)" }}>
              /@<Link href={`/@${user.username}`} className="text-[var(--accent)] hover:underline" data-testid="space-public-link">{user.username}</Link>
            </p>
          </div>
          <div className="spotlight-editor-actions">
            <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer" style={{ fontFamily: "var(--font-mono)" }}>
              <input data-testid="space-published-toggle" type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
              published
            </label>
            <Link href={`/@${user.username}`} className="peng-btn peng-btn-ghost text-xs" data-testid="space-preview-link" style={{ fontFamily: "var(--font-mono)" }}>view</Link>
            <button onClick={save} disabled={saving} className="peng-btn peng-btn-primary disabled:opacity-40" data-testid="save-space-button">
              {saving ? "saving..." : "save"}
            </button>
          </div>
        </div>

        {saved && <p className="text-xs text-green-400 px-1" style={{ fontFamily: "var(--font-mono)" }} data-testid="space-save-status">{saved}</p>}

        {/* ── Templates ── */}
        <EditorSection title="Templates" sub="Pick a starting point. You can change everything after." defaultOpen={!blocks.length} testId="space-template-panel">
          <div className="template-category-row" data-testid="template-category-row">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button key={cat} type="button" onClick={() => setTemplateCategory(cat)} className={templateCategory === cat ? "is-active" : ""} data-testid={`template-category-${cat}`}>{cat}</button>
            ))}
          </div>
          <p className="template-picker-note">Full starter layouts with editable blocks, colors, backgrounds, and links.</p>
          <div className="space-template-grid mt-3">
            {visibleTemplates.map((template) => (
              <button key={template.id} type="button" onClick={() => applyTemplate(template)} className={`space-template-card template-${template.id}`} data-testid={`space-template-${template.id}`}>
                <em>{template.badge}</em>
                <div className="template-mini" aria-hidden="true"><span /><span /><span /><i /></div>
                <strong>{template.name}</strong>
                <span>{template.vibe}</span>
                <small>use this</small>
              </button>
            ))}
          </div>
        </EditorSection>

        {/* ── Pieces / Block Editor ── */}
        <EditorSection title="Pieces" sub="Drag to reorder. Click edit to configure each block." defaultOpen testId="block-editor-section">
          <BlockEditor blocks={blocks} onChange={setBlocks} gemsUnlocked={user.gemsUnlocked} autoEditId={autoEditId} onAutoEditConsumed={() => setAutoEditId(null)} />
        </EditorSection>

        {/* ── Visual Controls ── */}
        <EditorSection title="Visual" sub="Background, blur, and glow controls." defaultOpen={false} testId="profile-control-panel">
          <div className="profile-control-grid">
            <label><span>dim {(background?.dim ?? 58)}%</span><input type="range" min={20} max={88} value={background?.dim ?? 58} onChange={(e) => updateBackgroundControl({ dim: Number(e.target.value) })} /></label>
            <label><span>blur {(background?.blur ?? 0)}px</span><input type="range" min={0} max={14} value={background?.blur ?? 0} onChange={(e) => updateBackgroundControl({ blur: Number(e.target.value) })} /></label>
            <label><span>banner glow {(background?.bannerGlow ?? 45)}%</span><input type="range" min={0} max={100} value={background?.bannerGlow ?? 45} onChange={(e) => updateBackgroundControl({ bannerGlow: Number(e.target.value) })} /></label>
            <label><span>name glow {(background?.nameGlow ?? 35)}%</span><input type="range" min={0} max={100} value={background?.nameGlow ?? 35} onChange={(e) => updateBackgroundControl({ nameGlow: Number(e.target.value) })} /></label>
          </div>
          <div className="theme-pack-grid mt-4" data-testid="theme-pack-panel">
            {THEME_PACKS.map((theme) => (
              <button key={theme.id} type="button" onClick={() => applyTheme(theme)} className={`theme-pack-card template-${theme.id}`} data-testid={`theme-pack-${theme.id}`}>
                <strong>{theme.name}</strong>
                <span>{theme.note}</span>
              </button>
            ))}
          </div>
        </EditorSection>

        {/* ── Custom CSS ── */}
        <EditorSection title="Custom CSS" sub="Gems feature. Advanced CSS for your spotlight." defaultOpen={false} gem={!user.gemsUnlocked}>
          <textarea
            data-testid="custom-css-input"
            value={customCss}
            onChange={(e) => setCustomCss(e.target.value)}
            disabled={!user.gemsUnlocked}
            rows={6}
            placeholder="/* your custom CSS */"
            className="w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded px-3 py-2 text-xs text-white font-mono outline-none focus:border-[var(--accent)] disabled:opacity-40"
          />
        </EditorSection>

        {/* ── Preview ── */}
        <EditorSection title="Preview" sub="Live desktop preview. No save needed." defaultOpen>
          <div className="desktop-preview-label mb-2">
            <span />
            <button className="peng-btn peng-btn-ghost text-[10px]" style={{ fontFamily: "var(--font-mono)" }} onClick={save}>
              save changes
            </button>
          </div>
          <div className="desktop-preview-outer" data-testid="live-space-preview">
            <div className="desktop-preview-chrome">
              <span /><span /><span />
              <div className="desktop-preview-url">/@{user.username}</div>
            </div>
            <DesktopPreviewFrame blocks={blocks} background={background} user={user} customCss={customCss} />
          </div>
        </EditorSection>

        <div className="flex items-center gap-3 pb-12 pt-2">
          <button onClick={save} disabled={saving} className="peng-btn peng-btn-primary disabled:opacity-40" data-testid="save-space-bottom-button">{saving ? "saving..." : "save spotlight"}</button>
          {saved && <span className="text-xs text-green-400" style={{ fontFamily: "var(--font-mono)" }}>{saved}</span>}
        </div>
      </div>
    </HubShell>
  );
}

// ── Collapsible editor section ──────────────────────────────────────────────
function DesktopPreviewFrame({
  blocks,
  background,
  user,
  customCss,
}: {
  blocks: Block[];
  background: any;
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  customCss: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    if (!viewportRef.current) return;
    const measure = () => {
      if (!viewportRef.current) return;
      setScale(viewportRef.current.getBoundingClientRect().width / 1280);
    };
    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(viewportRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="desktop-preview-viewport" ref={viewportRef}>
      {scale !== null && (
        <LiveSpotlightPreview
          blocks={blocks}
          background={background}
          user={user}
          customCss={customCss}
          scale={scale}
        />
      )}
    </div>
  );
}

function LiveSpotlightPreview({
  blocks,
  background,
  user,
  customCss,
  scale,
}: {
  blocks: Block[];
  background: any;
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  customCss: string;
  scale: number;
}) {
  const themePreset = background?.themePreset ?? "clean";
  const isSignalSpotlight = blocks.some((block) => block.type === "SIGNAL_LANDING");
  const cssVars = {
    "--user-accent": user.accentColor,
    "--user-accent-glow": `${user.accentColor}33`,
    "--profile-name-glow": `0 0 ${Math.round((background?.nameGlow ?? 35) / 2)}px ${user.accentColor}`,
    "--profile-banner-glow": `0 0 ${Math.round((background?.bannerGlow ?? 45) / 2)}px ${user.accentColor}${Math.round((background?.bannerGlow ?? 45) * 1.6).toString(16).padStart(2, "0")}`,
    transform: `scale(${scale})`,
  } as React.CSSProperties;

  return (
    <div className={`desktop-preview-live space-theme-${themePreset} ${isSignalSpotlight ? "is-signal-preview" : ""}`} style={cssVars}>
      {background?.url ? (
        <>
          <div
            className="space-background-layer"
            style={{
              backgroundImage: `url(${background.url})`,
              backgroundSize: background.fit ?? "cover",
              backgroundPosition: background.position ?? "center",
              backgroundAttachment: "scroll",
              filter: `blur(${background.blur ?? 0}px)`,
              transform: (background.blur ?? 0) > 0 ? "scale(1.03)" : undefined,
            }}
          />
          <div className="space-background-dim" style={{ background: `rgba(5,8,16,${Math.min(0.9, Math.max(0, (background.dim ?? 58) / 100))})` }} />
        </>
      ) : (
        <>
          <div className="space-background-layer theme-background-layer" />
          <div className="space-background-dim" style={{ background: "rgba(5,8,16,0.45)" }} />
        </>
      )}
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss.replace(/<\/?style[^>]*>/gi, "") }} />}
      <div className={isSignalSpotlight ? "desktop-preview-signal-content" : "desktop-preview-standard-content"}>
        {!isSignalSpotlight && (
          <div className="personal-site-head mb-10">
            <div
              className={`personal-site-banner ${user.bannerUrl ? "has-custom-banner" : ""}`}
              style={{
                background: user.bannerUrl
                  ? `radial-gradient(circle at 20% 60%, ${user.accentColor}44, transparent 34%), radial-gradient(circle at 80% 35%, rgba(244,114,182,0.18), transparent 28%), linear-gradient(180deg, rgba(5,8,16,0.1), rgba(5,8,16,0.62)), url(${user.bannerUrl}) center/cover`
                  : `radial-gradient(circle at 16% 22%, ${user.accentColor}66, transparent 30%), radial-gradient(circle at 84% 14%, rgba(45,212,191,0.24), transparent 28%), linear-gradient(135deg, ${user.accentColor}2e, rgba(18,26,42,0.88) 48%, rgba(8,12,22,0.98))`,
                boxShadow: "var(--profile-banner-glow), inset 0 -64px 74px rgba(0,0,0,0.46)",
              }}
            >
              <div className="profile-banner-shade" />
              <div className="personal-site-identity">
                <div className="inline-flex w-20 h-20 rounded-full overflow-hidden border-2 mb-3 relative z-10" style={{ borderColor: user.accentColor, boxShadow: `0 0 30px ${user.accentColor}55` }}>
                  {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl" style={{ background: `${user.accentColor}33` }}>P</div>}
                </div>
                {user.status && <p className="status-thought-bubble personal-status-bubble">{user.status}</p>}
                <h1 className="hub-identity-title" style={{ textShadow: "var(--profile-name-glow)" }}>{user.displayName}</h1>
                <p className="text-xs text-white/50 mt-1" style={{ fontFamily: "var(--font-mono)" }}>@{user.username}</p>
              </div>
            </div>
          </div>
        )}
        <BlockRenderer blocks={blocks} isOwner={true} gemsUnlocked={true} />
      </div>
    </div>
  );
}

function EditorSection({
  title, sub, children, defaultOpen = true, testId, gem,
}: {
  title: string; sub?: string; children: React.ReactNode;
  defaultOpen?: boolean; testId?: string; gem?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="editor-collapsible-section" data-testid={testId}>
      <button
        type="button"
        className="editor-collapsible-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-widest text-[var(--accent)] font-bold uppercase" style={{ fontFamily: "var(--font-mono)" }}>{title}</span>
            {gem && <span className="text-[10px] text-amber-400" style={{ fontFamily: "var(--font-mono)" }}>◆ gems</span>}
          </div>
          {sub && <p className="text-[10px] text-white/35 mt-0.5 text-left" style={{ fontFamily: "var(--font-mono)" }}>{sub}</p>}
        </div>
        <span className="editor-collapsible-chevron" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </button>
      {open && <div className="editor-collapsible-body">{children}</div>}
    </div>
  );
}
