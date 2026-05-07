"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";
import { useAuth } from "@/app/providers";

type StoreItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: string;
  tier: "FREE" | "SHARD" | "GEM";
  price: number;
};

const FILTERS = ["all", "BADGE", "AURA", "SKIN", "BLOCK"] as const;

/* ── SVG icons per item type ───────────────────────────────── */
function IconBadge() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}
function IconAura() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>
    </svg>
  );
}
function IconSkin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 2.75 1.12 5.26 2.92 7.08C6.72 20.88 9.23 22 12 22c1.11 0 2-.9 2-2v-.5c0-.55.22-1.05.59-1.41a2 2 0 0 0-.59-3.28A8.01 8.01 0 0 1 4 12c0-4.42 3.58-8 8-8"/>
      <circle cx="8.5" cy="9.5" r="1" fill="currentColor"/>
      <circle cx="14.5" cy="9.5" r="1" fill="currentColor"/>
      <circle cx="11" cy="6.5" r="1" fill="currentColor"/>
      <circle cx="16.5" cy="12" r="1" fill="currentColor"/>
    </svg>
  );
}
function IconBlock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  );
}

/* ── Slug-specific override icons ─────────────────────────── */
function IconSlug({ slug }: { slug: string }) {
  switch (slug) {
    case "name-glow":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20V4l8 16 8-16v16"/></svg>;
    case "custom-accent":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2a10 10 0 1 1 0 20"/><path d="M12 2v20M2 12h20"/></svg>;
    case "signal-board":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2v4M12 12v10M12 6a6 6 0 0 1 6 6"/><circle cx="12" cy="12" r="2"/></svg>;
    case "portal-ring":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>;
    case "post-pin":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6z"/></svg>;
    case "streak-shield":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2L4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5z"/><path d="M9 12l2 2 4-4"/></svg>;
    case "status-bubble-plus":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M9 10h6M12 7v6"/></svg>;
    case "xp-weekend":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2L4 14h7v8l9-12h-7z"/></svg>;
    case "chat-badge":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M9 10l1.5 2 3-4"/></svg>;
    case "vip-chat-tag":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7l4 6 5-9 5 9 4-6v12H3z"/></svg>;
    case "creator-frame":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>;
    case "hologram-name":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2l9 4.5v9L12 20 3 15.5v-9L12 2z"/><path d="M12 20V11M3 6.5l9 4.5 9-4.5"/></svg>;
    case "custom-cursor":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 3l14 9-7 1-4 7z"/></svg>;
    case "profile-particles":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="5" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="4" r="1.5" fill="currentColor"/><circle cx="19" cy="7" r="1.5" fill="currentColor"/><circle cx="6" cy="13" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/><circle cx="9" cy="19" r="1.5" fill="currentColor"/><circle cx="18" cy="18" r="1.5" fill="currentColor"/></svg>;
    case "midnight-room":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>;
    case "rainbow-trail":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20a8 8 0 0 0 8-8"/><path d="M12 20a5 5 0 0 0 5-5"/><path d="M12 20a2 2 0 0 0 2-2"/><path d="M12 20a11 11 0 0 0 11-11"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>;
    case "clip-feature":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>;
    case "founder-mark":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>;
    case "spotlight-boost":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>;
    case "signal-landing-kit":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>;
    case "own-board":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3h18v18H3z"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>;
    default:
      return null;
  }
}

function StoreIcon({ slug, type }: { slug: string; type: string }) {
  const specific = <IconSlug slug={slug} />;
  if (specific.props.children !== null) return specific; // has a specific override
  switch (type) {
    case "BADGE": return <IconBadge />;
    case "AURA":  return <IconAura />;
    case "SKIN":  return <IconSkin />;
    case "BLOCK": return <IconBlock />;
    default:      return <IconBadge />;
  }
}

const TYPE_META: Record<string, { label: string; cls: string }> = {
  BADGE: { label: "badge",  cls: "mark-badge" },
  AURA:  { label: "aura",   cls: "mark-aura"  },
  SKIN:  { label: "skin",   cls: "mark-skin"  },
  BLOCK: { label: "block",  cls: "mark-block" },
};

export default function StorePage() {
  const { user, refresh } = useAuth();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("all");
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/marketplace/catalog", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]));
  }, []);

  const visible = useMemo(() => filter === "all" ? items : items.filter((item) => item.type === filter), [filter, items]);

  async function buy(item: StoreItem) {
    if (!user) { setStatus("sign in to buy items"); return; }
    setBusy(item.slug);
    setStatus("checking balance...");
    const res = await fetch("/api/marketplace/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.slug }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    if (res.ok) {
      setStatus(data.owned ? "already owned" : `${item.name} unlocked`);
      refresh();
    } else {
      setStatus(data.error ?? "purchase failed");
    }
  }

  return (
    <HubShell rightRail={<RightRail />}>
      <div className="hub-page-wrap store-page" data-testid="store-page">
        <section className="store-hero">
          <div>
            <p className="hub-page-kicker">creator store</p>
            <h1 className="hub-page-title mb-1">upgrades that matter</h1>
            <p className="hub-page-sub">Cosmetics, boosts, profile kits, and stream tools.</p>
          </div>
          <div className="store-wallet">
            <span>balance</span>
            <strong>{user ? `${user.gems.toLocaleString()} gems` : "sign in"}</strong>
            <small>{user ? `${user.shards.toLocaleString()} shards` : "wallet locked"}</small>
          </div>
        </section>

        <div className="store-filter-row">
          {FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={filter === f ? "is-on" : ""}>
              {f === "all" ? "All" : TYPE_META[f]?.label ?? f.toLowerCase()}
            </button>
          ))}
          <span className="store-filter-status">{status || `${visible.length} items`}</span>
        </div>

        <div className="store-grid">
          {visible.map((item) => (
            <article key={item.slug} className={`store-item-card store-item-type-${item.type.toLowerCase()}`} data-testid={`store-item-${item.slug}`}>
              <div className={`store-item-mark ${TYPE_META[item.type]?.cls ?? ""}`}>
                <StoreIcon slug={item.slug} type={item.type} />
              </div>
              <div className="store-item-copy">
                <span className="store-item-type-label">{TYPE_META[item.type]?.label ?? item.type.toLowerCase()} · {item.tier.toLowerCase()}</span>
                <h2>{item.name}</h2>
                <p>{item.description}</p>
              </div>
              <div className="store-item-actions">
                <strong className="store-item-price">
                  {item.price === 0 ? "Free" : `${item.price.toLocaleString()} ${item.tier === "GEM" ? "gems" : "shards"}`}
                </strong>
                <button
                  type="button"
                  onClick={() => buy(item)}
                  disabled={busy === item.slug || !user}
                  className="store-buy-btn"
                >
                  {busy === item.slug ? "..." : item.price === 0 ? "Claim" : "Unlock"}
                </button>
              </div>
            </article>
          ))}
        </div>

        <section className="store-bottom-note">
          <div>
            <span>coming next</span>
            <strong>limited drops, creator bundles, and live gift packs</strong>
          </div>
          <Link href="/hub/owner" className="peng-btn peng-btn-ghost text-xs">owner controls</Link>
        </section>
      </div>
    </HubShell>
  );
}
