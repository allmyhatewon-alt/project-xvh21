"use client";
import { useEffect, useRef, useState } from "react";

type ShopItem = {
  id: string;
  name: string;
  price: number;
  caption: string;
  rare?: boolean;
  icon?: string;
};

const ITEMS: ShopItem[] = [
  { id: "name-glow", name: "Name Glow", price: 200, caption: "puts a clean glow on your name. not loud, just enough for people to notice.", icon: "✦" },
  { id: "custom-accent", name: "Custom Accent", price: 350, caption: "pick your own profile color. no preset prison.", icon: "◈" },
  { id: "signal-board", name: "Signal Board Skin", price: 450, caption: "adds the broadcast-board look from the landing page to your spotlight kit.", icon: "⬡" },
  { id: "portal-ring", name: "Portal Ring", price: 475, caption: "that little enter-the-hub energy. clean animated portal trim for profile cards.", icon: "◎" },
  { id: "post-pin", name: "Post Pin", price: 500, caption: "pin one post for 48 hours. use it when you actually cooked.", icon: "⟡" },
  { id: "streak-shield", name: "Streak Shield", price: 600, caption: "miss one day without losing the streak. for when life gets annoying.", icon: "⬟" },
  { id: "status-bubble-plus", name: "Status Bubble+", price: 650, caption: "upgrades the thinking bubble with more pop, better tails, and cleaner presence.", icon: "◉" },
  { id: "xp-weekend", name: "2x XP Weekend", price: 800, caption: "double xp for a weekend. good time to post, comment, and farm a little.", icon: "⚡" },
  { id: "chat-badge", name: "Chat Badge", price: 900, caption: "adds a tiny badge next to your name in live chat. subtle flex.", icon: "⬥" },
  { id: "vip-chat-tag", name: "VIP Chat Tag", price: 1100, caption: "a brighter chat tag for people who actually show up. clean, readable, not corny.", icon: "♛" },
  { id: "creator-frame", name: "Creator Frame", price: 1250, caption: "puts a premium frame around your profile banner and avatar so the page feels official.", icon: "▣" },
  { id: "hologram-name", name: "Hologram Name", price: 1350, caption: "turns your profile name into a slick hologram glow. looks expensive without yelling.", icon: "◈" },
  { id: "custom-cursor", name: "Custom Cursor", price: 1200, caption: "swap the cursor for a tiny image you pick. png, 32x32, keep it clean.", rare: true, icon: "⌖" },
  { id: "profile-particles", name: "Profile Particles", price: 1400, caption: "small floating particles on your spotlight. movement without making it messy.", rare: true, icon: "⁂" },
  { id: "midnight-room", name: "Midnight Room Skin", price: 1600, caption: "a darker premium profile skin with teal edges and less empty black space.", rare: true, icon: "◐" },
  { id: "rainbow-trail", name: "Rainbow Trail", price: 1750, caption: "a soft animated accent trail on profile cards. playful but still clean.", rare: true, icon: "≋" },
  { id: "clip-feature", name: "Clip Feature", price: 1500, caption: "puts one clip in rotation on hub home for a few hours.", rare: true, icon: "▷" },
  { id: "founder-mark", name: "Founder Mark", price: 2500, caption: "early-supporter style badge. the kind of thing people flex later.", rare: true, icon: "✵" },
  { id: "spotlight-boost", name: "Spotlight Boost", price: 3000, caption: "adds a boost badge and makes your profile card feel like it belongs on the front page.", rare: true, icon: "⬆" },
  { id: "signal-landing-kit", name: "Signal Landing Kit", price: 2200, caption: "unlock the full screenshot-style landing kit for spotlight builds.", rare: true, icon: "⊞" },
  { id: "own-board", name: "Spin Up A Board", price: 5000, caption: "your own board. slug, rules, icon, the whole thing.", rare: true, icon: "⬡" },
];

let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  try {
    const A = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new A();
    return audioCtx;
  } catch {
    return null;
  }
}

function playKeyClick() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(360 + Math.random() * 180, t);
  osc.frequency.exponentialRampToValueAtTime(190, t + 0.05);
  gain.gain.setValueAtTime(0.035, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.07);
}

export function GemShop({ user, onClose }: { user: any; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(ITEMS[0].id);
  const [muted, setMuted] = useState(false);
  const [buyStatus, setBuyStatus] = useState("");
  const [owned, setOwned] = useState<string[]>([]);
  const [equipped, setEquipped] = useState<string[]>([]);
  const active = ITEMS.find((i) => i.id === activeId)!;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    fetch("/api/marketplace/inventory", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : { items: [] })
      .then((data) => {
        const items = data.items ?? [];
        setOwned(items.map((item: any) => item.slug));
        setEquipped(items.filter((item: any) => item.equippedAt).map((item: any) => item.slug));
      })
      .catch(() => {
        setOwned([]);
        setEquipped([]);
      });
  }, []);

  async function buyActive() {
    setBuyStatus("checking...");
    const res = await fetch("/api/marketplace/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: active.id }),
    });
    const data = await res.json();
    if (res.ok) setOwned((items) => Array.from(new Set([...items, active.id])));
    setBuyStatus(res.ok ? (data.owned ? "already owned" : "bought. refresh balance soon.") : data.error ?? "purchase failed");
  }

  async function equipActive() {
    setBuyStatus("equipping...");
    const res = await fetch("/api/marketplace/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: active.id }),
    });
    const data = await res.json();
    if (res.ok) {
      const itemType = data.equipped?.type;
      setEquipped((items) => {
        const byType = ITEMS.filter((item) => item.id !== active.id);
        return Array.from(new Set([...items.filter((id) => !byType.some((item) => item.id === id && itemType)), active.id]));
      });
      setBuyStatus("equipped. profile got the upgrade.");
    } else {
      setBuyStatus(data.error ?? "equip failed");
    }
  }

  return (
    <div
      ref={overlayRef}
      className="floating-stat-overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      data-testid="gem-shop"
    >
      <div className="gem-shop-card">
        <button onClick={onClose} className="floating-stat-close" data-testid="gem-shop-close" aria-label="close">x</button>

        <header className="gem-shop-header">
          <div>
            <p className="gem-shop-kicker">PENGELUS / GEM SHOP</p>
            <h2 className="gem-shop-title">spend your gems</h2>
          </div>
          <div className="gem-shop-balance">
            <span className="gem-shop-bal-label">BALANCE</span>
            <span className="gem-shop-bal-value"><span className="text-[var(--gem-color)] mr-1">G</span>{(user?.gems ?? 0).toLocaleString()}</span>
            <button onClick={() => setMuted((m) => !m)} className="gem-shop-mute" data-testid="gem-shop-mute" aria-label="toggle sound">
              {muted ? "muted" : "sound"}
            </button>
          </div>
        </header>

        <div className="gem-shop-body">
          <ul className="gem-shop-list" data-testid="gem-shop-list">
            {ITEMS.map((item) => {
              const canBuy = (user?.gems ?? 0) >= item.price;
              const selected = item.id === activeId;
              const isOwned = owned.includes(item.id);
              const isEquipped = equipped.includes(item.id);
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveId(item.id)}
                    className={`gem-shop-row ${selected ? "is-active" : ""} ${item.rare ? "is-rare" : ""}`}
                    data-testid={`gem-shop-item-${item.id}`}
                  >
                    <span className="gem-shop-row-name">
                      {item.icon && <span className="gem-shop-row-icon" aria-hidden="true">{item.icon}</span>}
                      {item.rare && <span className="gem-shop-row-rare" title="rare">*</span>}
                      {item.name}
                    </span>
                    <span className={`gem-shop-row-price ${!canBuy && !isOwned ? "is-locked" : ""}`}>{isEquipped ? "ON" : isOwned ? "OWNED" : `G ${item.price.toLocaleString()}`}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="gem-shop-preview">
            <div className="gem-shop-screen">
              <div className="gem-shop-screen-bar">
                <span className="dot" /><span className="dot" /><span className="dot" />
                <span className="gem-shop-screen-id">~/peng/shop/{active.id}</span>
              </div>
              <div className="gem-shop-screen-body" data-testid="gem-shop-preview">
                <div className={`gem-shop-item-demo demo-${active.id}`} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <p className="gem-shop-prompt">
                  <span className="gem-shop-prompt-arrow">&gt;</span>
                  <span className="gem-shop-prompt-name">{active.name}</span>
                  {active.rare && <span className="gem-shop-prompt-tag">RARE</span>}
                </p>
                <Typed key={active.id} text={active.caption} muted={muted} />
              </div>
            </div>

            <button
              className="gem-shop-buy"
              data-testid={`gem-shop-buy-${active.id}`}
              onClick={buyActive}
              disabled={owned.includes(active.id)}
            >
              <span>{owned.includes(active.id) ? "already" : "buy for"}</span>
              <span className="gem-shop-buy-price">{owned.includes(active.id) ? "OWNED" : `G ${active.price.toLocaleString()}`}</span>
            </button>
            {owned.includes(active.id) && (
              <button
                className="gem-shop-equip"
                data-testid={`gem-shop-equip-${active.id}`}
                onClick={equipActive}
                disabled={equipped.includes(active.id)}
              >
                {equipped.includes(active.id) ? "equipped" : "equip this"}
              </button>
            )}
            {buyStatus && <p className="gem-shop-foot">{buyStatus}</p>}
            <p className="gem-shop-foot">esc to close | gems carry across seasons | refunds within 5 minutes if it bricks</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Typed({ text, muted }: { text: string; muted: boolean }) {
  const [out, setOut] = useState("");

  useEffect(() => {
    let i = 0;
    let cancelled = false;
    setOut("");
    function step() {
      if (cancelled) return;
      i += 1;
      setOut(text.slice(0, i));
      if (!muted && text[i - 1] && text[i - 1] !== " ") playKeyClick();
      if (i < text.length) {
        const ch = text[i - 1] ?? "";
        let delay = 22 + Math.random() * 24;
        if (ch === " ") delay += 30;
        if (ch === "," || ch === ".") delay += 120;
        setTimeout(step, delay);
      }
    }
    const timer = setTimeout(step, 160);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, muted]);

  return (
    <p className="gem-shop-caption" data-testid="gem-shop-caption">
      {out}
      <span className="gem-shop-caret" />
    </p>
  );
}
