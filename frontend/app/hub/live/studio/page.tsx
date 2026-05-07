"use client";
import { FormEvent, PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";
import { useAuth } from "@/app/providers";

const PLATFORMS = ["native", "mediamtx", "bunny", "twitch", "kick", "youtube", "hls", "custom"] as const;
type StreamMode = typeof PLATFORMS[number];
type SiteSettings = {
  liveEnabled: boolean;
  liveMode: "all" | "restream_only" | "native_only" | "obs_only";
  chatEnabled: boolean;
  chatBotEnabled: boolean;
  clipsEnabled: boolean;
  storeEnabled: boolean;
  profileEffectsEnabled: boolean;
  publicSignupEnabled: boolean;
};
type PendingOffer = { viewerId: string; offer: RTCSessionDescriptionInit };
type OverlayWidget = {
  id: string;
  type: "follow" | "gift" | "goal" | "music" | "badge" | "tts";
  label: string;
  detail: string;
  x: number;
  y: number;
  preset: "neon" | "glass" | "arcade" | "minimal";
  enabled: boolean;
};
type TtsSettings = {
  enabled: boolean;
  readChat: boolean;
  readGifts: boolean;
  provider: "browser" | "openai" | "kitten";
  voice: string;
  premiumVoice: string;
  instructions: string;
  rate: number;
  pitch: number;
  maxLength: number;
};

const WIDGET_PRESETS: Array<Omit<OverlayWidget, "id" | "x" | "y" | "enabled">> = [
  { type: "follow", label: "new follower", detail: "@new_peng joined the room", preset: "neon" },
  { type: "gift", label: "gift drop", detail: "spark burst x5", preset: "arcade" },
  { type: "goal", label: "gem goal", detail: "420 / 1,000 gems", preset: "glass" },
  { type: "music", label: "now playing", detail: "jaakuan radio - late night", preset: "minimal" },
  { type: "badge", label: "stream tag", detail: "pengelus native", preset: "neon" },
  { type: "tts", label: "voice engine", detail: "chat reads out loud", preset: "neon" },
];

const DEFAULT_WIDGETS: OverlayWidget[] = [
  { id: "widget-follow", type: "follow", label: "new follower", detail: "@new_peng joined the room", x: 8, y: 12, preset: "neon", enabled: true },
  { id: "widget-goal", type: "goal", label: "gem goal", detail: "420 / 1,000 gems", x: 70, y: 78, preset: "glass", enabled: true },
];

const STUDIO_SCENE_PRESETS: Array<{
  id: string;
  name: string;
  mood: string;
  title: string;
  category: string;
  summary: string;
  widgets: Array<Omit<OverlayWidget, "id" | "enabled">>;
  tts: Partial<TtsSettings>;
}> = [
  {
    id: "portal-open",
    name: "portal open",
    mood: "start stream",
    title: "portal is open",
    category: "just chatting",
    summary: "clean intro screen, follow alert, soft voice. best for starting without looking empty.",
    widgets: [
      { type: "badge", label: "stream starting", detail: "portal is open", x: 9, y: 10, preset: "neon" },
      { type: "follow", label: "new signal", detail: "@viewer stepped in", x: 65, y: 18, preset: "glass" },
      { type: "music", label: "now playing", detail: "peng radio - low glow", x: 8, y: 78, preset: "minimal" },
    ],
    tts: { enabled: true, readChat: false, readGifts: true, provider: "browser", voice: "portal voice", rate: 0.95, pitch: 0.9 },
  },
  {
    id: "gift-storm",
    name: "gift storm",
    mood: "high energy",
    title: "gift storm lobby",
    category: "community",
    summary: "big gift alert, gem goal, faster TTS. made for rooms where people are pressing buttons.",
    widgets: [
      { type: "gift", label: "gift drop", detail: "spark burst x5", x: 36, y: 12, preset: "arcade" },
      { type: "goal", label: "gem goal", detail: "0 / 1,000 gems", x: 66, y: 76, preset: "neon" },
      { type: "tts", label: "voice engine", detail: "gifts read out loud", x: 7, y: 62, preset: "glass" },
    ],
    tts: { enabled: true, readChat: false, readGifts: true, provider: "kitten", voice: "Kitten Bruno", rate: 1.12, pitch: 1.05 },
  },
  {
    id: "cozy-desk",
    name: "cozy desk",
    mood: "after hours",
    title: "late night desk",
    category: "study / chill",
    summary: "minimal overlays, calm chat reads, less noise. good when the stream needs space.",
    widgets: [
      { type: "music", label: "now playing", detail: "quiet loop", x: 7, y: 78, preset: "minimal" },
      { type: "badge", label: "desk mode", detail: "talking, building, chilling", x: 8, y: 10, preset: "glass" },
    ],
    tts: { enabled: true, readChat: true, readGifts: true, provider: "browser", voice: "soft desk", rate: 0.88, pitch: 0.85, maxLength: 70 },
  },
  {
    id: "boss-room",
    name: "boss room",
    mood: "main event",
    title: "main event room",
    category: "gaming",
    summary: "center-stage alerts and a room tag that makes the stream feel like an event.",
    widgets: [
      { type: "badge", label: "main event", detail: "boss room live", x: 36, y: 8, preset: "arcade" },
      { type: "follow", label: "new challenger", detail: "@viewer entered", x: 9, y: 18, preset: "neon" },
      { type: "gift", label: "power up", detail: "chat dropped gems", x: 62, y: 62, preset: "arcade" },
    ],
    tts: { enabled: true, readChat: true, readGifts: true, provider: "kitten", voice: "Kitten Bruno", rate: 1.05, pitch: 1.12, maxLength: 95 },
  },
];

function parseWidgets(raw: unknown): OverlayWidget[] {
  if (!Array.isArray(raw)) return DEFAULT_WIDGETS;
  return raw
    .filter((item) => item && typeof item === "object")
    .map((item: any) => ({
      id: String(item.id || `widget-${Date.now()}`),
      type: ["follow", "gift", "goal", "music", "badge", "tts"].includes(item.type) ? item.type : "badge",
      label: String(item.label || "stream widget").slice(0, 40),
      detail: String(item.detail || "pengelus overlay").slice(0, 80),
      x: Number.isFinite(Number(item.x)) ? Math.min(92, Math.max(0, Number(item.x))) : 10,
      y: Number.isFinite(Number(item.y)) ? Math.min(86, Math.max(0, Number(item.y))) : 10,
      preset: ["neon", "glass", "arcade", "minimal"].includes(item.preset) ? item.preset : "neon",
      enabled: item.enabled !== false,
    }))
    .slice(0, 8);
}

function parseTts(raw: unknown): TtsSettings {
  const defaults: TtsSettings = { enabled: false, readChat: false, readGifts: true, provider: "browser", voice: "peng pulse", premiumVoice: "marin", instructions: "Speak like a high-energy livestream alert.", rate: 1, pitch: 1, maxLength: 90 };
  if (!raw || typeof raw !== "object") return defaults;
  const item = raw as Partial<TtsSettings>;
  return {
    enabled: Boolean(item.enabled),
    readChat: Boolean(item.readChat),
    readGifts: item.readGifts !== false,
    provider: item.provider === "openai" || item.provider === "kitten" ? item.provider : "browser",
    voice: String(item.voice || defaults.voice).slice(0, 40),
    premiumVoice: String(item.premiumVoice || defaults.premiumVoice).slice(0, 40),
    instructions: String(item.instructions || defaults.instructions).slice(0, 180),
    rate: Math.min(1.8, Math.max(0.65, Number(item.rate) || defaults.rate)),
    pitch: Math.min(1.8, Math.max(0.55, Number(item.pitch) || defaults.pitch)),
    maxLength: Math.min(160, Math.max(30, Number(item.maxLength) || defaults.maxLength)),
  };
}

export default function LiveStudioPage() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const mediaRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [form, setForm] = useState({
    title: "late night signal",
    category: "just chatting",
    platform: "native" as StreamMode,
    sourceUrl: "",
    embedUrl: "",
    thumbnailUrl: "",
    isLive: false,
  });
  const [status, setStatus] = useState("");
  const [nativeStatus, setNativeStatus] = useState("camera idle");
  const [resolved, setResolved] = useState("");
  const [deviceMode, setDeviceMode] = useState<"camera" | "screen">("camera");
  const [quality, setQuality] = useState({ bitrate: "4500", fps: "60", resolution: "1080p" });
  const [widgets, setWidgets] = useState<OverlayWidget[]>(DEFAULT_WIDGETS);
  const [selectedWidget, setSelectedWidget] = useState(DEFAULT_WIDGETS[0]?.id ?? "");
  const [ttsSettings, setTtsSettings] = useState<TtsSettings>({ enabled: false, readChat: false, readGifts: true, provider: "browser", voice: "peng pulse", premiumVoice: "marin", instructions: "Speak like a high-energy livestream alert.", rate: 1, pitch: 1, maxLength: 90 });
  const [widgetUrl, setWidgetUrl] = useState("");
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [allowedPlatforms, setAllowedPlatforms] = useState<string[]>([...PLATFORMS]);

  useEffect(() => {
    fetch("/api/live/my", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : { stream: null })
      .then((data) => {
        const allowed = Array.isArray(data.allowedPlatforms) ? data.allowedPlatforms : [...PLATFORMS];
        setAllowedPlatforms(allowed);
        if (data.settings) setSiteSettings(data.settings);
        if (!data.stream) {
          if (allowed.length && !allowed.includes(form.platform)) {
            setForm((current) => ({ ...current, platform: allowed[0] as StreamMode }));
          }
          return;
        }
        const nextPlatform = allowed.includes(data.stream.platform) ? data.stream.platform : (allowed[0] ?? "native");
        setForm({
          title: data.stream.title ?? "",
          category: data.stream.category ?? "just chatting",
          platform: nextPlatform,
          sourceUrl: data.stream.sourceUrl ?? "",
          embedUrl: data.stream.embedUrl ?? "",
          thumbnailUrl: data.stream.thumbnailUrl ?? "",
          isLive: !!data.stream.isLive,
        });
        const nextWidgets = parseWidgets(data.stream.widgets);
        setWidgets(nextWidgets);
        setSelectedWidget(nextWidgets[0]?.id ?? "");
        setTtsSettings(parseTts(data.stream.ttsSettings));
        setWidgetUrl(data.stream.widgetUrl ?? "");
        setResolved(data.stream.resolvedEmbedUrl ?? "");
      })
      .catch(() => {});
  }, []);

  const stopNative = useCallback(() => {
    mediaRef.current?.getTracks().forEach((track) => track.stop());
    mediaRef.current = null;
    peersRef.current.forEach((peer) => peer.close());
    peersRef.current.clear();
    if (videoRef.current) videoRef.current.srcObject = null;
    setNativeStatus("camera idle");
  }, []);

  async function waitForIce(peer: RTCPeerConnection) {
    if (peer.iceGatheringState === "complete") return;
    await new Promise<void>((resolve) => {
      const done = () => {
        if (peer.iceGatheringState === "complete") {
          peer.removeEventListener("icegatheringstatechange", done);
          resolve();
        }
      };
      peer.addEventListener("icegatheringstatechange", done);
      window.setTimeout(resolve, 2500);
    });
  }

  async function startNative() {
    if (!user) return;
    stopNative();
    setNativeStatus(deviceMode === "screen" ? "asking for screen..." : "asking for camera...");
    const stream = deviceMode === "screen"
      ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      : await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
    mediaRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => {});
    }
    const nextForm = {
      ...form,
      platform: "native" as StreamMode,
      sourceUrl: `pengelus-native:${user.username}`,
      embedUrl: "",
      isLive: true,
    };
    setForm(nextForm);
    setNativeStatus("native signal live");
    await saveWith(nextForm);
  }

  async function handleOffer(item: PendingOffer) {
    if (!mediaRef.current || peersRef.current.has(item.viewerId)) return;
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    mediaRef.current.getTracks().forEach((track) => peer.addTrack(track, mediaRef.current!));
    peersRef.current.set(item.viewerId, peer);
    await peer.setRemoteDescription(item.offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    await waitForIce(peer);
    await fetch("/api/live/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "broadcaster-answer", viewerId: item.viewerId, answer: peer.localDescription }),
    });
    setNativeStatus(`${peersRef.current.size} native viewer${peersRef.current.size === 1 ? "" : "s"} linked`);
  }

  useEffect(() => {
    if (!user || form.platform !== "native" || !form.isLive || !mediaRef.current) return;
    let cancelled = false;
    async function poll() {
      const res = await fetch("/api/live/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "broadcaster-poll" }),
      });
      const data = await res.json().catch(() => ({ offers: [] }));
      if (cancelled) return;
      for (const offer of (data.offers ?? []) as PendingOffer[]) {
        await handleOffer(offer).catch(() => setNativeStatus("viewer link failed"));
      }
    }
    poll();
    const id = window.setInterval(poll, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [form.isLive, form.platform, user]);

  useEffect(() => () => stopNative(), [stopNative]);

  async function saveWith(nextForm = form) {
    setStatus("saving...");
    const res = await fetch("/api/live/my", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...nextForm, widgets: JSON.stringify(widgets), ttsSettings: JSON.stringify(ttsSettings) }),
    });
    const data = await res.json();
    if (res.ok) {
      setResolved(data.stream?.resolvedEmbedUrl ?? "");
      setWidgetUrl(data.stream?.widgetUrl ?? "");
      setStatus(nextForm.isLive ? "you are live on pengelus" : "stream saved");
    } else {
      setStatus(data.error ?? "could not save stream");
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    await saveWith(form);
  }

  async function endStream() {
    const nextForm = { ...form, isLive: false };
    setForm(nextForm);
    stopNative();
    await saveWith(nextForm);
  }

  function addWidget(preset: Omit<OverlayWidget, "id" | "x" | "y" | "enabled">) {
    const next: OverlayWidget = {
      ...preset,
      id: `widget-${preset.type}-${Date.now()}`,
      x: 12 + (widgets.length % 4) * 12,
      y: 14 + (widgets.length % 3) * 16,
      enabled: true,
    };
    setWidgets((current) => [...current, next].slice(0, 8));
    setSelectedWidget(next.id);
  }

  function applyScenePreset(preset: typeof STUDIO_SCENE_PRESETS[number]) {
    const stamp = Date.now();
    const nextWidgets = preset.widgets.map((widget, index) => ({
      ...widget,
      id: `scene-${preset.id}-${stamp}-${index}`,
      enabled: true,
    }));
    setWidgets(nextWidgets);
    setSelectedWidget(nextWidgets[0]?.id ?? "");
    setTtsSettings((current) => ({ ...current, ...preset.tts }));
    setForm((current) => ({
      ...current,
      title: preset.title,
      category: preset.category,
    }));
    setStatus(`${preset.name} scene loaded`);
  }

  function updateWidget(id: string, patch: Partial<OverlayWidget>) {
    setWidgets((current) => current.map((widget) => widget.id === id ? { ...widget, ...patch } : widget));
  }

  function removeWidget(id: string) {
    setWidgets((current) => current.filter((widget) => widget.id !== id));
    setSelectedWidget((current) => current === id ? widgets.find((widget) => widget.id !== id)?.id ?? "" : current);
  }

  async function copySetupValue(label: string, value: string) {
    await navigator.clipboard?.writeText(value).catch(() => {});
    setStatus(`${label} copied`);
  }

  function testTts() {
    if (ttsSettings.provider !== "browser") {
      const key = widgetUrl.split("key=")[1] || "";
      if (!key) {
        setStatus("save once to test the generated voice");
        return;
      }
      fetch("/api/live/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user?.username || "", key, text: "chat is live on pengelus", author: user?.username || "peng", isGift: false }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setStatus(data.error ?? "generated voice is not ready yet");
            return;
          }
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => URL.revokeObjectURL(url);
          await audio.play().catch(() => URL.revokeObjectURL(url));
          setStatus("generated voice test played");
        })
        .catch(() => setStatus("generated voice test failed"));
      return;
    }
    if (!("speechSynthesis" in window)) {
      setStatus("browser voice is not available here");
      return;
    }
    const text = `${ttsSettings.voice}: chat is live on pengelus`;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = ttsSettings.rate;
    utterance.pitch = ttsSettings.pitch;
    window.speechSynthesis.speak(utterance);
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>, id: string) {
    event.preventDefault();
    setSelectedWidget(id);
    const bounds = overlayRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const move = (moveEvent: globalThis.PointerEvent) => {
      const x = ((moveEvent.clientX - bounds.left) / bounds.width) * 100;
      const y = ((moveEvent.clientY - bounds.top) / bounds.height) * 100;
      updateWidget(id, { x: Math.min(92, Math.max(0, x)), y: Math.min(86, Math.max(0, y)) });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const activeWidget = widgets.find((widget) => widget.id === selectedWidget) ?? widgets[0];
  const currentUsername = user?.username || "peng";
  const mediaMtxPath = (form.platform === "mediamtx" ? form.sourceUrl.trim() : "") || currentUsername;
  const obsServer = "rtmp://127.0.0.1:1935";
  const obsStreamKey = mediaMtxPath.replace(/^\/+/, "").split("/")[0] || currentUsername;
  const mediaMtxWatchUrl = `http://127.0.0.1:8888/${encodeURIComponent(obsStreamKey)}`;
  const canUseLive = siteSettings?.liveEnabled !== false;
  const platformAllowed = (platform: StreamMode) => allowedPlatforms.includes(platform);
  const livePolicyLabel = siteSettings?.liveMode ? siteSettings.liveMode.replace(/_/g, " ") : "loading policy";
  const sourcePlaceholder = form.platform === "mediamtx"
    ? "stream path like peng, or a MediaMTX HLS/WebRTC URL"
    : form.platform === "bunny"
    ? "Bunny library/video, player.mediadelivery.net embed, .m3u8, or MP4 URL"
    : "twitch.tv/yourname, kick.com/yourname, youtube link, .m3u8...";
  const sourceLabel = form.platform === "mediamtx" ? "MediaMTX stream path" : form.platform === "bunny" ? "Bunny source" : "channel or source URL";

  if (!user) {
    return (
      <HubShell rightRail={<RightRail />}>
        <div className="hub-page-wrap">
          <div className="hub-empty-room">
            <div>
              <p className="hub-empty-room-title">sign in to go live</p>
              <p className="hub-empty-room-copy">Streaming is tied to your creator profile.</p>
            </div>
            <Link href="/auth/signin" className="peng-btn peng-btn-primary text-xs">sign in</Link>
          </div>
        </div>
      </HubShell>
    );
  }

  return (
    <HubShell rightRail={<RightRail />}>
      <div className="hub-page-wrap live-studio-page">
        <section className="hub-page-hero live-studio-hero">
          <div>
            <p className="hub-page-kicker">creator studio / @{user.username}</p>
            <h1 className="hub-page-title mb-1">go live</h1>
            <p className="hub-page-sub">stream straight to Pengelus from camera or screen. embeds are still there when you need them.</p>
          </div>
          <div className={`live-studio-status ${form.isLive ? "is-live" : ""}`}>
            <span />
            {form.isLive ? "live" : "offline"}
          </div>
        </section>

        <div className="live-studio-grid">
          <form onSubmit={save} className="peng-card live-studio-form live-studio-form-upgraded" data-testid="live-studio-form">
            <div className="studio-console-head">
              <span>broadcast control</span>
              <strong>focused setup</strong>
              <small>Keep the room clean. Open advanced drawers only when you need them.</small>
            </div>
            <div className="studio-policy-strip">
              <span>{canUseLive ? "live enabled" : "live paused"}</span>
              <strong>{livePolicyLabel}</strong>
              <small>{canUseLive ? "Owner policy controls which stream lanes are open." : "Owner paused streaming for the site."}</small>
            </div>

            <div className="stream-details-card">
              <div className="stream-details-head">
                <span className="native-stream-kicker">stream identity</span>
                <strong>title, category, presence</strong>
                <p>The only details a viewer should feel immediately.</p>
              </div>
              <div className="stream-details-grid">
                <label>
                  <span>stream title</span>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={90} />
                </label>
                <label>
                  <span>category</span>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} maxLength={32} />
                </label>
                <label>
                  <span>stream type</span>
                  <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as StreamMode })}>
                    {PLATFORMS.map((platform) => (
                      <option key={platform} value={platform} disabled={!platformAllowed(platform)}>
                        {platformAllowed(platform) ? platform : `${platform} locked`}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>resolution</span>
                  <select value={quality.resolution} onChange={(e) => setQuality({ ...quality, resolution: e.target.value })}>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                    <option value="1440p">1440p</option>
                  </select>
                </label>
                <label>
                  <span>FPS</span>
                  <select value={quality.fps} onChange={(e) => setQuality({ ...quality, fps: e.target.value })}>
                    <option value="30">30</option>
                    <option value="60">60</option>
                  </select>
                </label>
                <label>
                  <span>bitrate kbps</span>
                  <input type="number" min="1200" max="12000" step="100" value={quality.bitrate} onChange={(e) => setQuality({ ...quality, bitrate: e.target.value })} />
                </label>
                {form.platform !== "native" && (
                  <label className="stream-details-wide">
                    <span>{sourceLabel}</span>
                    <input value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder={sourcePlaceholder} />
                  </label>
                )}
              </div>
              <div className="stream-details-actions">
                <button type="button" className={`live-toggle ${form.isLive ? "is-live" : ""}`} onClick={() => setForm({ ...form, isLive: !form.isLive })}>
                  <span />
                  {form.isLive ? "live switch on" : "flip live manually"}
                </button>
                <button className="peng-btn peng-btn-primary text-xs" type="submit" data-testid="save-live-studio" disabled={!canUseLive || !platformAllowed(form.platform)}>save stream</button>
              </div>
              {status && <p className="live-studio-save-status">{status}</p>}
            </div>

            <div className="native-stream-card">
              <span className="native-stream-kicker">pengelus native</span>
              <strong>camera or screen</strong>
              <p>Start a native room when you want the cleanest in-site setup.</p>
              <div className="native-room-link">/hub/live/{user.username}</div>
              <div className="native-stream-modes">
                <button type="button" className={deviceMode === "camera" ? "is-on" : ""} onClick={() => setDeviceMode("camera")}>camera</button>
                <button type="button" className={deviceMode === "screen" ? "is-on" : ""} onClick={() => setDeviceMode("screen")}>screen</button>
              </div>
              <div className="native-stream-actions">
                <button type="button" className="peng-btn peng-btn-primary text-xs" onClick={startNative} disabled={!canUseLive || !platformAllowed("native")}>start native</button>
                <button type="button" className="peng-btn peng-btn-ghost text-xs" onClick={endStream}>end</button>
              </div>
              <small>{nativeStatus}</small>
            </div>

            <div className="stream-route-board">
              <span className="native-stream-kicker">bandwidth plan</span>
              <strong>pick the lane for the stream</strong>
              <div className="stream-route-options">
                <button type="button" className={form.platform === "native" ? "is-on" : ""} disabled={!platformAllowed("native")} onClick={() => setForm({ ...form, platform: "native" })}>
                  <span>native room</span>
                  <small>{platformAllowed("native") ? "instant camera/screen, best for testing" : "locked by owner policy"}</small>
                </button>
                <button type="button" className={form.platform === "bunny" ? "is-on" : ""} disabled={!platformAllowed("bunny")} onClick={() => setForm({ ...form, platform: "bunny" })}>
                  <span>Bunny CDN</span>
                  <small>{platformAllowed("bunny") ? "best for replays, HLS, clips, and heavier playback" : "locked by owner policy"}</small>
                </button>
                <button type="button" className={form.platform === "mediamtx" ? "is-on" : ""} disabled={!platformAllowed("mediamtx")} onClick={() => setForm({ ...form, platform: "mediamtx", sourceUrl: form.sourceUrl || currentUsername })}>
                  <span>OBS ingest</span>
                  <small>{platformAllowed("mediamtx") ? "stream key path through MediaMTX" : "locked by owner policy"}</small>
                </button>
              </div>
            </div>

            {form.platform === "mediamtx" && (
              <div className="obs-setup-card">
                <span className="native-stream-kicker">OBS setup</span>
                <strong>stream through OBS into Pengelus</strong>
                <p>Open OBS, go to Settings / Stream, set Service to Custom, then paste these in. After you hit Start Streaming, Pengelus watches the same path.</p>
                <div className="obs-flow-strip">
                  <span>OBS</span>
                  <i />
                  <span>MediaMTX</span>
                  <i />
                  <span>Pengelus</span>
                </div>
                <div className="obs-copy-grid">
                  <button type="button" onClick={() => copySetupValue("OBS server", obsServer)}>
                    <span>server</span>
                    <strong>{obsServer}</strong>
                  </button>
                  <button type="button" onClick={() => copySetupValue("stream key", obsStreamKey)}>
                    <span>stream key</span>
                    <strong>{obsStreamKey}</strong>
                  </button>
                  <button type="button" onClick={() => copySetupValue("watch URL", mediaMtxWatchUrl)}>
                    <span>watch URL</span>
                    <strong>{mediaMtxWatchUrl}</strong>
                  </button>
                </div>
                <div className="peng-studio-note">
                  <span>later: Peng Studio app</span>
                  <p>A desktop app makes sense after this web flow is solid. It would handle scenes, stream keys, overlays, chat, gifts, and mic checks without making creators touch OBS settings.</p>
                </div>
              </div>
            )}

            <details className="studio-advanced-panel studio-advanced-tools">
              <summary>
                <span>advanced tools</span>
                <strong>scenes, overlays, voice, metadata</strong>
              </summary>
              <div className="studio-advanced-stack">
              <div className="scene-director-card">
              <div className="scene-director-head">
                <span className="native-stream-kicker">scene director</span>
                <strong>one click and the room has a vibe</strong>
                <p>Pick a preset and Pengelus sets the title, category, overlays, and voice behavior together.</p>
              </div>
              <div className="scene-preset-grid">
                {STUDIO_SCENE_PRESETS.map((preset) => (
                  <button key={preset.id} type="button" onClick={() => applyScenePreset(preset)}>
                    <span>{preset.mood}</span>
                    <strong>{preset.name}</strong>
                    <small>{preset.summary}</small>
                  </button>
                ))}
              </div>
              </div>

              <div className="live-overlay-builder">
                <span className="native-stream-kicker">open studio</span>
                <strong>streamlabs, but peng coded</strong>
              <p>Add alerts and draggable overlays. What you place here shows on the live room.</p>
              <div className="widget-source-link">
                <span>widget source link</span>
                <input value={widgetUrl || "save once to generate your widget link"} readOnly />
                {widgetUrl && <Link href={widgetUrl} target="_blank">open overlay</Link>}
              </div>
              <div className="widget-preset-grid">
                {WIDGET_PRESETS.map((preset) => (
                  <button key={preset.type} type="button" onClick={() => addWidget(preset)}>
                    <span>{preset.label}</span>
                    <small>{preset.preset}</small>
                  </button>
                ))}
              </div>
              {activeWidget && (
                <div className="widget-inspector">
                  <label>
                    <span>widget text</span>
                    <input value={activeWidget.label} onChange={(e) => updateWidget(activeWidget.id, { label: e.target.value.slice(0, 40) })} />
                  </label>
                  <label>
                    <span>widget detail</span>
                    <input value={activeWidget.detail} onChange={(e) => updateWidget(activeWidget.id, { detail: e.target.value.slice(0, 80) })} />
                  </label>
                  <label>
                    <span>preset</span>
                    <select value={activeWidget.preset} onChange={(e) => updateWidget(activeWidget.id, { preset: e.target.value as OverlayWidget["preset"] })}>
                      <option value="neon">neon</option>
                      <option value="glass">glass</option>
                      <option value="arcade">arcade</option>
                      <option value="minimal">minimal</option>
                    </select>
                  </label>
                  <div className="widget-inspector-actions">
                    <button type="button" onClick={() => updateWidget(activeWidget.id, { enabled: !activeWidget.enabled })}>{activeWidget.enabled ? "hide" : "show"}</button>
                    <button type="button" onClick={() => removeWidget(activeWidget.id)}>remove</button>
                  </div>
                </div>
              )}
              </div>

              <div className="live-tts-builder">
                <span className="native-stream-kicker">voice engine</span>
                <strong>comments can talk now</strong>
              <p>Like TikFinity energy, but inside Pengelus. New chat comments and gift drops can be read out loud.</p>
              <div className="tts-toggle-row">
                <button type="button" className={ttsSettings.enabled ? "is-on" : ""} onClick={() => setTtsSettings({ ...ttsSettings, enabled: !ttsSettings.enabled })}>tts {ttsSettings.enabled ? "on" : "off"}</button>
                <button type="button" className={ttsSettings.readChat ? "is-on" : ""} onClick={() => setTtsSettings({ ...ttsSettings, readChat: !ttsSettings.readChat })}>read chat</button>
                <button type="button" className={ttsSettings.readGifts ? "is-on" : ""} onClick={() => setTtsSettings({ ...ttsSettings, readGifts: !ttsSettings.readGifts })}>read gifts</button>
              </div>
              <div className="tts-toggle-row">
                <button type="button" className={ttsSettings.provider === "browser" ? "is-on" : ""} onClick={() => setTtsSettings({ ...ttsSettings, provider: "browser" })}>browser voice</button>
                <button type="button" className={ttsSettings.provider === "kitten" ? "is-on" : ""} onClick={() => setTtsSettings({ ...ttsSettings, provider: "kitten", voice: ttsSettings.voice || "Kitten Bruno" })}>free kitten</button>
                <button type="button" className={ttsSettings.provider === "openai" ? "is-on" : ""} onClick={() => setTtsSettings({ ...ttsSettings, provider: "openai" })}>premium ai</button>
                <button type="button" onClick={() => setTtsSettings({ ...ttsSettings, premiumVoice: "marin", instructions: "Sound like a clean hype livestream announcer." })}>peng preset</button>
              </div>
              <label>
                <span>{ttsSettings.provider === "kitten" ? "kitten voice" : "voice name"}</span>
                <input value={ttsSettings.voice} onChange={(e) => setTtsSettings({ ...ttsSettings, voice: e.target.value.slice(0, 40) })} />
              </label>
              <label>
                <span>premium voice</span>
                <select value={ttsSettings.premiumVoice} onChange={(e) => setTtsSettings({ ...ttsSettings, premiumVoice: e.target.value })}>
                  {["marin", "cedar", "alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse"].map((voice) => <option key={voice} value={voice}>{voice}</option>)}
                </select>
              </label>
              <label>
                <span>premium direction</span>
                <input value={ttsSettings.instructions} onChange={(e) => setTtsSettings({ ...ttsSettings, instructions: e.target.value.slice(0, 180) })} />
              </label>
              <div className="tts-slider-grid">
                <label>
                  <span>speed {ttsSettings.rate.toFixed(2)}</span>
                  <input type="range" min="0.65" max="1.8" step="0.05" value={ttsSettings.rate} onChange={(e) => setTtsSettings({ ...ttsSettings, rate: Number(e.target.value) })} />
                </label>
                <label>
                  <span>pitch {ttsSettings.pitch.toFixed(2)}</span>
                  <input type="range" min="0.55" max="1.8" step="0.05" value={ttsSettings.pitch} onChange={(e) => setTtsSettings({ ...ttsSettings, pitch: Number(e.target.value) })} />
                </label>
              </div>
              <label>
                <span>max comment length</span>
                <input type="number" min="30" max="160" value={ttsSettings.maxLength} onChange={(e) => setTtsSettings({ ...ttsSettings, maxLength: Number(e.target.value) })} />
              </label>
              <button type="button" className="peng-btn peng-btn-ghost text-xs" onClick={testTts}>test voice</button>
              </div>

              <div className="stream-details-card is-advanced-details">
                {form.platform !== "native" && (
                  <label>
                    <span>override embed URL</span>
                    <input value={form.embedUrl} onChange={(e) => setForm({ ...form, embedUrl: e.target.value })} placeholder="optional iframe/video embed url" />
                  </label>
                )}
                <label>
                  <span>thumbnail URL</span>
                  <input value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} placeholder="optional stream card image" />
                </label>
              </div>
              </div>
            </details>
          </form>

          <section className="live-studio-preview">
            <div className="live-player-shell native-preview-shell">
              {form.platform === "native" ? (
                <video ref={videoRef} muted playsInline autoPlay className="live-player-frame" />
              ) : resolved ? (
                form.platform === "hls" || resolved.includes(".m3u8") || resolved.match(/\.(mp4|webm)(\?|$)/i) ? (
                  <video src={resolved} controls muted playsInline className="live-player-frame" />
                ) : (
                  <iframe src={resolved} className="live-player-frame" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="stream preview" />
                )
              ) : (
                <div className="live-player-empty">save a stream source to preview it</div>
              )}
              {form.platform === "native" && !mediaRef.current && <div className="native-preview-empty">hit start native to light this up</div>}
              <div className="stream-overlay-canvas is-editing" ref={overlayRef}>
                {widgets.filter((widget) => widget.enabled).map((widget) => (
                  <button
                    type="button"
                    key={widget.id}
                    className={`stream-widget stream-widget-${widget.preset} ${selectedWidget === widget.id ? "is-selected" : ""}`}
                    style={{ left: `${widget.x}%`, top: `${widget.y}%` }}
                    onPointerDown={(event) => startDrag(event, widget.id)}
                  >
                    <span>{widget.label}</span>
                    <strong>{widget.detail}</strong>
                  </button>
                ))}
              </div>
            </div>
            <div className="live-studio-room-key">
              <strong>room key</strong>
              <div><span>room</span><code>/hub/live/{user.username}</code></div>
              <div><span>ingest</span><code>{form.platform === "mediamtx" ? `OBS / ${obsStreamKey}` : form.platform === "native" ? deviceMode : form.platform}</code></div>
              <div><span>status</span><code>{form.isLive ? "live" : "offline"}</code></div>
            </div>
            <div className="live-studio-health">
              <div><span>resolution</span><strong>{quality.resolution}</strong></div>
              <div><span>FPS</span><strong>{quality.fps}</strong></div>
              <div><span>bitrate</span><strong>{quality.bitrate}</strong></div>
            </div>
          </section>
        </div>
      </div>
    </HubShell>
  );
}
