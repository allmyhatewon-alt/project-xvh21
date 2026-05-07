"use client";
import Link from "next/link";
import { useAuth } from "@/app/providers";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

// ── Rail state is persisted in localStorage + synced to a data-attr on <html>
// so the CSS grid can expand without React re-renders in HubShell.
const STORAGE_KEY = "peng:chat-open";

function setHtmlAttr(open: boolean) {
  document.documentElement.setAttribute("data-chat-open", open ? "true" : "false");
}

export function RightRail() {
  const { user } = useAuth();
  // null = not yet hydrated from localStorage (avoid flash)
  const [railOpen, setRailOpen] = useState<boolean | null>(null);
  const [railClosing, setRailClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const [checkInState, setCheckInState] = useState({ canCheckIn: false, loading: true });

  // Read persisted state on mount (client-only)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const open = saved !== "false";
    setRailOpen(open);
    setHtmlAttr(open);
  }, []);

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  useEffect(() => {
    if (user) {
      fetch("/api/check-in")
        .then((r) => r.json())
        .then((d) => setCheckInState({ canCheckIn: !!d.canCheckIn, loading: false }))
        .catch(() => setCheckInState({ canCheckIn: false, loading: false }));
    }
  }, [user]);

  function closeRail() {
    setRailClosing(true);
    closeTimer.current = setTimeout(() => {
      setRailOpen(false);
      setRailClosing(false);
      localStorage.setItem(STORAGE_KEY, "false");
      setHtmlAttr(false);
    }, 320);
  }

  function openRail() {
    setRailOpen(true);
    localStorage.setItem(STORAGE_KEY, "true");
    setHtmlAttr(true);
  }

  // Not hydrated yet — render empty placeholder so layout doesn't jump
  if (railOpen === null) return <div className="right-rail-outer" />;

  return (
    <div className="right-rail-outer" data-testid="right-rail">
      {/* Fixed tab on viewport right edge when rail is dismissed */}
      {!railOpen && (
        <button className="rail-reopen-tab" onClick={openRail} aria-label="open chat">
          <span className="hub-live-dot" style={{ width: 8, height: 8 }} />
          chat
        </button>
      )}

      {(railOpen || railClosing) && (
        <div className={`right-rail-console${railClosing ? " is-sliding-out" : ""}`}>
          <HubLiveChat
            featured
            fullHeight
            canCheckIn={checkInState.canCheckIn}
            onClose={closeRail}
          />
        </div>
      )}
    </div>
  );
}

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id?: string;
    username: string;
    displayName: string;
    image: string | null;
    bio?: string | null;
    accentColor: string;
    role?: string;
    createdAt?: string;
    followers?: number;
    badges?: Array<{ slug: string; name: string; icon: string }>;
    equipped?: Array<{ slug: string; name: string; type: string }>;
  };
};

const DEFAULT_CHAT: ChatMessage[] = [
  {
    id: "sys-1",
    body: "room is open. keep it chill.",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    author: { username: "hub", displayName: "hub", image: null, accentColor: "#2dd4bf", role: "SYSTEM", followers: 0, badges: [{ slug: "system", name: "System", icon: "*" }] },
  },
  {
    id: "sys-2",
    body: "drop clips, questions, or whatever is on your mind.",
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    author: { username: "peng", displayName: "peng", image: null, accentColor: "#8b5cf6", role: "ADMIN", followers: 0, badges: [{ slug: "owner-crown", name: "Owner", icon: "♛" }] },
  },
];

const CHAT_SPARKS = [
  "what's the move tonight?",
  "drop the clip, i need to see it",
  "rate the profile vibe 1-10",
  "who's live right now?",
  "somebody give me a quest",
];

function HubLiveChat({
  featured = false,
  fullHeight = false,
  canCheckIn = false,
  onClose,
}: {
  featured?: boolean;
  fullHeight?: boolean;
  canCheckIn?: boolean;
  onClose?: () => void;
}) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_CHAT);
  const [sending, setSending] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<ChatMessage["author"] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchMessages() {
      try {
        const res = await fetch("/api/chat", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setMessages(data.messages?.length ? data.messages : DEFAULT_CHAT);
      } catch {
        if (!cancelled) setMessages(DEFAULT_CHAT);
      }
    }
    fetchMessages();
    const id = window.setInterval(fetchMessages, 6000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const clean = text.trim().slice(0, 160);
    if (!user || !clean) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: clean }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((items) => [...items.slice(-29), data.message]);
        setText("");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      className={`hub-chat-card is-open ${featured ? "is-featured" : ""} ${fullHeight ? "is-full-height" : ""}`}
      data-testid="hub-live-chat"
    >
      <div className="hub-chat-header">
        <div className="hub-chat-header-left">
          <span className="hub-live-dot" aria-hidden="true" />
          <div>
            <span className="hub-chat-header-title">pengelus live</span>
            <small>{user ? `@${user.username} synced` : `${messages.length} msgs · sign in to type`}</small>
          </div>
        </div>
        {onClose && (
          <button className="hub-chat-close-btn" onClick={onClose} aria-label="close chat" data-testid="hub-chat-close">
            ✕
          </button>
        )}
      </div>

      <div className="hub-chat-window">
        {fullHeight && (
          <div className="hub-chat-desk" data-testid="chat-live-desk">
            <Link href="/hub/quests" className="hub-chat-desk-tile">
              <span>daily</span>
              <strong>{user ? (canCheckIn ? "check in" : "done") : "locked"}</strong>
            </Link>
            <Link href="/hub/clips" className="hub-chat-desk-tile">
              <span>signal</span>
              <strong>clip radar</strong>
            </Link>
            <Link href="/hub/inbox" className="hub-chat-desk-tile">
              <span>inbox</span>
              <strong>{user ? "ready" : "sign in"}</strong>
            </Link>
          </div>
        )}

        {fullHeight && (
          <div className="hub-chat-vibe-strip" aria-label="live room vibe">
            <span><b>{Math.min(18, Math.max(6, messages.length + 6))}</b> around</span>
            <span>slow mode clean</span>
            <span>{user ? "you can type" : "read-only"}</span>
          </div>
        )}

        {selectedAuthor && (
          <div className="hub-chat-profile-card" data-testid="hub-chat-profile-card">
            <div className="hub-chat-profile-top">
              <div className="hub-chat-profile-avatar" style={{ background: `${selectedAuthor.accentColor}66` }}>
                {selectedAuthor.image ? <img src={selectedAuthor.image} alt="" /> : selectedAuthor.username.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p>{selectedAuthor.displayName}</p>
                <span>@{selectedAuthor.username}</span>
              </div>
              <Link href={`/hub/user/${selectedAuthor.username}`} className="hub-chat-profile-link">view</Link>
            </div>
            <div className="hub-chat-profile-stats">
              <span><strong>{selectedAuthor.followers ?? 0}</strong> followers</span>
              <span><strong>{formatJoinAge(selectedAuthor.createdAt)}</strong> here</span>
              <span><strong>{selectedAuthor.role?.toLowerCase() ?? "user"}</strong> role</span>
            </div>
            <div className="hub-chat-profile-badges">
              {(selectedAuthor.badges?.length ? selectedAuthor.badges : [{ slug: "new", name: "No badges yet", icon: "-" }]).map((badge) => (
                <span key={badge.slug} title={badge.name}>{badge.icon} {badge.name}</span>
              ))}
            </div>
          </div>
        )}

        <div className="hub-chat-log" data-testid="hub-chat-log">
          {messages.map((message) => {
            const { ownerBadge, inlineBadges } = splitChatBadges(message.author);
            return (
              <div key={message.id} className={`hub-chat-message ${message.author.username === user?.username ? "is-self" : ""}`}>
                <button
                  type="button"
                  className={`hub-chat-author ${ownerBadge ? "has-owner-crown" : ""} ${inlineBadges.length ? "has-chat-badge" : ""}`}
                  onClick={() => setSelectedAuthor((c) => c?.username === message.author.username ? null : message.author)}
                  data-testid={`hub-chat-author-${message.author.username}`}
                >
                  {ownerBadge && <span className="chat-owner-crown" title={ownerBadge.name}>{ownerBadge.icon}</span>}
                  <span className="chat-author-name">{message.author.username}</span>
                  {inlineBadges.length > 0 && (
                    <span className="hub-chat-author-badges" aria-label="chat badges">
                      {inlineBadges.map((badge) => (
                        <i key={badge.slug} className={`hub-chat-mini-badge is-${badge.slug}`} title={badge.name}>
                          {badge.icon}
                        </i>
                      ))}
                    </span>
                  )}
                </button>
                <p>{message.body}</p>
              </div>
            );
          })}
        </div>

        <div className="hub-chat-room-shelf" aria-label="room notes">
          <span>slow room</span>
          <span>clips welcome</span>
          <span>{user?.role === "ADMIN" || user?.role === "MOD" ? ",help" : user ? "mic open" : "sign in"}</span>
        </div>

        <div className="hub-chat-sparks" aria-label="chat sparks">
          {CHAT_SPARKS.map((spark) => (
            <button
              key={spark}
              type="button"
              disabled={!user}
              onClick={() => setText(spark)}
            >
              {spark}
            </button>
          ))}
        </div>

        <form onSubmit={sendMessage} className="hub-chat-form">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!user}
            maxLength={160}
            placeholder={user ? "type here..." : "sign in to type"}
            data-testid="hub-chat-input"
          />
          <button disabled={!user || !text.trim() || sending} data-testid="hub-chat-send">
            {sending ? "..." : "send"}
          </button>
        </form>
      </div>
    </section>
  );
}

function fallbackChatBadges(author: ChatMessage["author"]) {
  const badges: Array<{ slug: string; name: string; icon: string }> = [];
  const role = author.role?.toLowerCase();
  if (role === "admin" || role === "owner") badges.push({ slug: "owner-crown", name: "Owner", icon: "♛" });
  if (role === "mod") badges.push({ slug: "mod-diamond", name: "Mod", icon: "MOD" });
  if (author.equipped?.some((item) => item.slug === "vip-chat-tag")) badges.push({ slug: "vip-chat-tag", name: "VIP", icon: "VIP" });
  if (author.equipped?.some((item) => item.slug === "chat-badge")) badges.push({ slug: "chat-badge", name: "Chat Badge", icon: "CHAT" });
  return badges;
}

function splitChatBadges(author: ChatMessage["author"]) {
  const badges = author.badges ?? fallbackChatBadges(author);
  return {
    ownerBadge: badges.find((badge) => badge.slug === "owner-crown"),
    inlineBadges: badges.filter((badge) => badge.slug !== "owner-crown").slice(0, 2),
  };
}

function formatJoinAge(createdAt?: string) {
  if (!createdAt) return "new";
  const days = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000));
  if (days < 1) return "today";
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}yr`;
}
