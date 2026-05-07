"use client";
import { useEffect, useRef, useState } from "react";

type OverlayWidget = {
  id: string;
  type: string;
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
  provider: string;
  voice: string;
  premiumVoice: string;
  instructions: string;
  rate: number;
  pitch: number;
  maxLength: number;
};
type ChatMessage = {
  id: string;
  body: string;
  room: string;
  createdAt: string;
  author: { username: string; displayName: string; accentColor: string };
};
type WidgetPayload = {
  stream: {
    title: string;
    widgets: OverlayWidget[];
    ttsSettings: TtsSettings;
    isLive: boolean;
    user: { username: string; displayName: string; accentColor: string };
  } | null;
  messages: ChatMessage[];
};

export default function LiveWidgetSourcePage({ params }: { params: { username: string } }) {
  const [payload, setPayload] = useState<WidgetPayload>({ stream: null, messages: [] });
  const [error, setError] = useState("");
  const [spoken, setSpoken] = useState("");
  const [widgetKey, setWidgetKey] = useState("");
  const bootedRef = useRef(false);
  const spokenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("key") ?? "";
    setWidgetKey(key);
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/live/widget?user=${encodeURIComponent(params.username)}&key=${encodeURIComponent(key)}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok) {
        setError(data.error ?? "Widget link locked.");
        return;
      }
      setPayload(data);
      setError("");
    }
    load();
    const id = window.setInterval(load, 1800);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [params.username]);

  useEffect(() => {
    const settings = payload.stream?.ttsSettings;
    if (!settings?.enabled || !("speechSynthesis" in window)) return;
    if (!bootedRef.current) {
      payload.messages.forEach((message) => spokenIdsRef.current.add(message.id));
      bootedRef.current = true;
      return;
    }
    const next = payload.messages.filter((message) => !spokenIdsRef.current.has(message.id));
    next.forEach((message) => {
      spokenIdsRef.current.add(message.id);
      const isGift = message.body.startsWith("[gift]");
      if ((isGift && !settings.readGifts) || (!isGift && !settings.readChat)) return;
      const clean = message.body.replace(/https?:\/\/\S+/g, "link").replace(/\s+/g, " ").trim().slice(0, settings.maxLength || 90);
      if (!clean) return;
      if (settings.provider === "openai" || settings.provider === "kitten") {
        playGeneratedTts(params.username, widgetKey, message, clean, isGift);
      } else {
        const prefix = isGift ? "gift alert" : `${message.author.username} says`;
        const utterance = new SpeechSynthesisUtterance(`${prefix}: ${clean}`);
        utterance.rate = settings.rate || 1;
        utterance.pitch = settings.pitch || 1;
        window.speechSynthesis.speak(utterance);
      }
      setSpoken(clean);
      window.setTimeout(() => setSpoken(""), 3200);
    });
  }, [payload.messages, payload.stream?.ttsSettings]);

  async function playGeneratedTts(username: string, key: string, message: ChatMessage, text: string, isGift: boolean) {
    const res = await fetch("/api/live/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, key, text, author: message.author.username, isGift }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    await audio.play().catch(() => URL.revokeObjectURL(url));
  }

  if (error) return <div className="widget-source-locked">{error}</div>;
  const widgets = payload.stream?.widgets?.filter((widget) => widget.enabled !== false).slice(0, 8) ?? [];

  return (
    <main className="widget-source-page">
      <div className="stream-overlay-canvas widget-source-canvas">
        {widgets.map((widget) => (
          <div
            key={widget.id}
            className={`stream-widget stream-widget-${widget.preset || "neon"} is-live-widget`}
            style={{ left: `${widget.x}%`, top: `${widget.y}%` }}
          >
            <span>{widget.label}</span>
            <strong>{widget.detail}</strong>
          </div>
        ))}
      </div>
      {spoken && (
        <div className="tts-spoken-card">
          <span>voice engine</span>
          <strong>{spoken}</strong>
        </div>
      )}
    </main>
  );
}
