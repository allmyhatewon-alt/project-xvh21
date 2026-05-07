"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";
import { useAuth } from "@/app/providers";

type Note = {
  id: string;
  kind: "follow" | "reply" | "system" | "shop";
  who: string;
  body: string;
  href: string;
  ago: string;
  unread: boolean;
};

const TABS = [
  { key: "all",    label: "all"       },
  { key: "reply",  label: "replies"   },
  { key: "follow", label: "followers" },
  { key: "system", label: "hub notes" },
  { key: "shop",   label: "shop"      },
];

export default function InboxPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("all");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [localRead, setLocalRead] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : { notifications: [] })
      .then((data) => {
        setNotes(data.notifications ?? []);
        setLoading(false);
      })
      .catch(() => { setNotes([]); setLoading(false); });
  }, [user]);

  const visible = useMemo(() => {
    const list = tab === "all" ? notes : notes.filter((n) => n.kind === tab);
    return list.map((n) => ({ ...n, unread: n.unread && !localRead.has(n.id) }));
  }, [tab, notes, localRead]);

  const unreadCount = notes.filter((n) => n.unread && !localRead.has(n.id)).length;

  function markAllRead() {
    const ids = notes.map((n) => n.id);
    const s = new Set<string>();
    ids.forEach((id) => s.add(id));
    setLocalRead(s);
  }

  return (
    <HubShell rightRail={<RightRail />}>
      <div className="hub-page-wrap inbox-page">
        <section className="inbox-hero">
          <div>
            <p className="hub-page-kicker">inbox · @{user?.username ?? "guest"}</p>
            <h1 className="hub-page-title mb-1">your signal feed</h1>
            <p className="hub-page-sub">mentions, replies, and hub notes — no algorithmic mess</p>
          </div>
          <div className="inbox-stats">
            <div><strong>{unreadCount}</strong><span>unread</span></div>
            <div><strong>{notes.length}</strong><span>total</span></div>
            <button type="button" onClick={markAllRead} className="peng-btn peng-btn-ghost text-[10px]" data-testid="inbox-mark-read">mark all read</button>
          </div>
        </section>

        <div className="inbox-tabs" data-testid="inbox-tabs">
          {TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`inbox-tab ${tab === t.key ? "is-on" : ""}`} data-testid={`inbox-tab-${t.key}`}>
              {t.label}
              {t.key !== "all" && (
                <span className="inbox-tab-count">{notes.filter((n) => n.kind === t.key).length}</span>
              )}
            </button>
          ))}
        </div>

        <section className="inbox-list" data-testid="inbox-list">
          {loading && (
            <p className="text-xs text-white/30 py-6 text-center" style={{ fontFamily: "var(--font-mono)" }}>loading...</p>
          )}
          {!loading && visible.length === 0 && (
            <div className="inbox-empty">
              <span className="inbox-empty-mark">@</span>
              <p className="inbox-empty-title">nothing in <em>{tab}</em> right now</p>
              <p className="inbox-empty-copy">{user ? "when someone tags or replies, it lands here first." : "sign in to see your real notifications."}</p>
            </div>
          )}
          {visible.map((n) => (
            <Link key={n.id} href={n.href} className={`inbox-row inbox-row--${n.kind} ${n.unread ? "is-unread" : ""}`} data-testid={`inbox-${n.id}`} onClick={() => setLocalRead((s) => { const next = new Set(s); next.add(n.id); return next; })}>
              <span className="inbox-row-icon">
                {n.kind === "follow"  && "↗"}
                {n.kind === "reply"   && "↩"}
                {n.kind === "system"  && "✦"}
                {n.kind === "shop"    && "◈"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="inbox-row-top">
                  <span className="inbox-row-who">@{n.who}</span>
                  <span className="inbox-row-ago">{n.ago}</span>
                </p>
                <p className="inbox-row-body">{n.body}</p>
              </div>
              {n.unread && <span className="inbox-row-dot" aria-label="unread" />}
            </Link>
          ))}
        </section>

        {!user && (
          <section className="inbox-signin" data-testid="inbox-signin">
            <div>
              <p className="discover-pull-kicker">guest preview</p>
              <p className="discover-pull-copy">sign in to get real mentions, replies, and hub-only drops here.</p>
            </div>
            <Link href="/auth/signin" className="peng-btn peng-btn-primary text-xs">sign in</Link>
          </section>
        )}
      </div>
    </HubShell>
  );
}
