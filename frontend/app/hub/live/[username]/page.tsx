"use client";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { HubShell } from "@/components/Hub/HubShell";
import { useAuth } from "@/app/providers";

type LiveStream = {
  id: string;
  title: string;
  category: string;
  platform: string;
  embedUrl: string;
  playerKind: string;
  thumbnailUrl: string | null;
  widgets: OverlayWidget[];
  ttsSettings: TtsSettings;
  isLive: boolean;
  viewerCount: number;
  startedAt: string | null;
  user: { username: string; displayName: string; image: string | null; accentColor: string; status: string | null };
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
type ChatBadge = { slug: string; name: string; icon: string };
type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  author: {
    username: string;
    displayName: string;
    image: string | null;
    role: string;
    accentColor: string;
    badges?: ChatBadge[];
  };
};

export default function LiveRoomPage({ params }: { params: { username: string } }) {
  const { user } = useAuth();
  const roomKey = `live:${params.username.toLowerCase()}`;
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatBody, setChatBody] = useState("");
  const [chatStatus, setChatStatus] = useState("");
  const [chatOpen, setChatOpen] = useState(true);
  const [quality, setQuality] = useState("Auto");

  const uptime = useMemo(() => {
    if (!stream?.startedAt) return "starting soon";
    const minutes = Math.max(1, Math.floor((Date.now() - new Date(stream.startedAt).getTime()) / 60000));
    if (minutes < 60) return `${minutes}m live`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m live`;
  }, [stream?.startedAt]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/live?user=${encodeURIComponent(params.username)}`, { cache: "no-store" });
      const data = await res.json();
      if (!cancelled) {
        setStream(data.stream ?? null);
        setLoading(false);
      }
    }
    load();
    const id = window.setInterval(load, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [params.username]);

  useEffect(() => {
    let cancelled = false;
    async function loadChat() {
      const res = await fetch(`/api/chat?room=${encodeURIComponent(roomKey)}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({ messages: [] }));
      if (!cancelled) setMessages((data.messages ?? []).slice(-22));
    }
    loadChat();
    const id = window.setInterval(loadChat, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [roomKey]);

  async function sendChat(event: FormEvent) {
    event.preventDefault();
    if (!chatBody.trim()) return;
    const body = chatBody.trim();
    setChatBody("");
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, room: roomKey }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.message) {
      setMessages((current) => [...current.slice(-21), data.message]);
      setChatStatus("");
    } else {
      setChatStatus(data.error ?? "chat failed");
    }
  }

  return (
    <HubShell>
      <div className="hub-page-wrap live-room-page viewer-room-page">
        {loading ? (
          <div className="hub-empty-room"><p className="hub-empty-room-title">loading stream...</p></div>
        ) : !stream ? (
          <div className="hub-empty-room">
            <div>
              <p className="hub-empty-room-title">@{params.username} has no stream setup</p>
              <p className="hub-empty-room-copy">When they add a source, the room appears here.</p>
            </div>
            <Link href="/hub/live" className="peng-btn peng-btn-primary text-xs">back to live</Link>
          </div>
        ) : (
          <section className={`viewer-live-lounge ${chatOpen ? "is-chat-open" : "is-chat-closed"}`} data-testid="live-room-stage">
            <div className="viewer-live-main">
              <div className="viewer-player-shell">
                <div className="viewer-presence-aura" aria-hidden="true" />
                <div className="viewer-live-topbar">
                  <span className={`viewer-live-pill ${stream.isLive ? "is-live" : ""}`}>{stream.isLive ? "LIVE" : "OFFLINE"}</span>
                  <div className="viewer-stream-title">
                    <strong>{stream.title}</strong>
                    <small>@{stream.user.username} / {stream.category}</small>
                  </div>
                  <span className="viewer-count">{stream.viewerCount} watching</span>
                </div>

                <StreamPlayer stream={stream} />

                <div className="viewer-floating-actions" aria-label="stream actions">
                  <button type="button">follow</button>
                  <button type="button" onClick={() => navigator.clipboard?.writeText(window.location.href)}>share</button>
                  <button
                    type="button"
                    onClick={() => setQuality((current) => current === "Auto" ? "1080p" : current === "1080p" ? "720p" : "Auto")}
                  >
                    {quality}
                  </button>
                </div>
              </div>

              <div className="viewer-now-playing">
                <span>now playing</span>
                <strong>{stream.user.status || "pengelus lounge signal"}</strong>
                <small>{uptime}</small>
              </div>

              <div className="viewer-creator-strip">
                <div className="viewer-creator-avatar" style={{ background: `${stream.user.accentColor}44` }}>
                  {stream.user.image ? <img src={stream.user.image} alt="" /> : stream.user.username.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <span>watching with</span>
                  <strong>{stream.user.displayName || stream.user.username}</strong>
                </div>
                <Link href={`/hub/user/${stream.user.username}`}>profile</Link>
              </div>
            </div>

            <aside className={`viewer-chat-panel ${chatOpen ? "is-open" : "is-closed"}`} data-testid="viewer-live-chat">
              <div className="viewer-chat-head">
                <div>
                  <span>chat</span>
                  <strong>{messages.length || "quiet"} messages</strong>
                </div>
                <button type="button" onClick={() => setChatOpen((open) => !open)} aria-label={chatOpen ? "collapse chat" : "open chat"}>
                  {chatOpen ? "close" : "open"}
                </button>
              </div>

              {chatOpen && (
                <>
                  <div className="viewer-chat-log">
                    {messages.map((message) => {
                      const { ownerBadge, inlineBadges } = splitLiveBadges(message.author);
                      return (
                        <div key={message.id} className={`viewer-chat-line ${message.body.startsWith("[gift]") ? "is-gift" : ""}`}>
                          <strong className={ownerBadge ? "has-owner-crown" : ""} style={{ color: message.author.accentColor }}>
                            {ownerBadge && <span className="chat-owner-crown" title={ownerBadge.name}>{ownerBadge.icon}</span>}
                            <span className="chat-author-name">{message.author.username}</span>
                            {inlineBadges.length > 0 && (
                              <span className="live-chat-badges">
                                {inlineBadges.map((badge) => (
                                  <i key={badge.slug} className={`hub-chat-mini-badge is-${badge.slug}`} title={badge.name}>{badge.icon}</i>
                                ))}
                              </span>
                            )}
                          </strong>
                          <span>{message.body}</span>
                        </div>
                      );
                    })}
                  </div>
                  <form className="viewer-chat-form" onSubmit={sendChat}>
                    <input value={chatBody} onChange={(e) => setChatBody(e.target.value)} disabled={!user} placeholder={user ? "say something..." : "sign in to chat"} maxLength={160} />
                    <button disabled={!user || !chatBody.trim()}>send</button>
                  </form>
                  {chatStatus && <p className="live-chat-status">{chatStatus}</p>}
                </>
              )}
            </aside>
          </section>
        )}
      </div>
    </HubShell>
  );
}

function fallbackLiveBadges(author: ChatMessage["author"]) {
  const role = author.role?.toLowerCase();
  if (role === "admin" || role === "owner") return [{ slug: "owner-crown", name: "Owner", icon: "♛" }];
  if (role === "mod") return [{ slug: "mod-diamond", name: "Mod", icon: "MOD" }];
  return [];
}

function splitLiveBadges(author: ChatMessage["author"]) {
  const badges = author.badges ?? fallbackLiveBadges(author);
  return {
    ownerBadge: badges.find((badge) => badge.slug === "owner-crown"),
    inlineBadges: badges.filter((badge) => badge.slug !== "owner-crown").slice(0, 2),
  };
}

function StreamPlayer({ stream }: { stream: LiveStream }) {
  if (stream.playerKind === "native") return <NativeViewer username={stream.user.username} title={stream.title} />;
  if (!stream.embedUrl) return <div className="live-player-empty">stream source not set</div>;
  if (stream.playerKind === "video") return <video src={stream.embedUrl} controls autoPlay muted playsInline className="live-player-frame" />;
  return <iframe src={stream.embedUrl} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="live-player-frame" title={stream.title} />;
}

function NativeViewer({ username, title }: { username: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const viewerIdRef = useRef(`viewer-${Math.random().toString(36).slice(2)}-${Date.now()}`);
  const [state, setState] = useState("connecting to native signal...");

  useEffect(() => {
    let cancelled = false;

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

    async function connect() {
      const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      peerRef.current = peer;
      peer.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          videoRef.current.play().catch(() => {});
          setState("native stream linked");
        }
      };
      peer.addTransceiver("video", { direction: "recvonly" });
      peer.addTransceiver("audio", { direction: "recvonly" });
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await waitForIce(peer);
      await fetch("/api/live/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "viewer-offer", username, viewerId: viewerIdRef.current, offer: peer.localDescription }),
      });
      setState("waiting for creator...");
    }

    connect().catch(() => setState("native signal waiting"));
    const id = window.setInterval(async () => {
      if (cancelled || peerRef.current?.remoteDescription) return;
      const res = await fetch(`/api/live/signal?username=${encodeURIComponent(username)}&viewerId=${encodeURIComponent(viewerIdRef.current)}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (data.answer && peerRef.current && !peerRef.current.remoteDescription) {
        await peerRef.current.setRemoteDescription(data.answer);
        setState("native stream linked");
      } else if (!data.broadcasterSeen) {
        setState("creator has the room open, waiting for native broadcast");
      }
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      peerRef.current?.close();
      peerRef.current = null;
    };
  }, [username]);

  return (
    <>
      <video ref={videoRef} controls autoPlay playsInline className="live-player-frame" title={title} />
      <div className="native-viewer-state">{state}</div>
    </>
  );
}
