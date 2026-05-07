"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers";

type Entry = {
  id: string;
  name: string;
  body: string;
  createdAt: string;
  signer?: { username: string; displayName: string; image: string | null; accentColor: string } | null;
};

export function GuestbookWidget({ username }: { username: string }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch(`/api/guestbook/${username}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setEntries(data.entries ?? []))
      .catch(() => setEntries([]));
  }, [username]);

  async function sign(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    const res = await fetch(`/api/guestbook/${username}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error ?? "could not sign");
      return;
    }
    setEntries((items) => [data.entry, ...items].slice(0, 12));
    setBody("");
    setStatus("signed");
  }

  async function hideEntry(id: string) {
    const res = await fetch(`/api/guestbook/${username}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setEntries((items) => items.filter((entry) => entry.id !== id));
      setStatus("hidden");
    }
  }

  return (
    <section className="peng-card guestbook-widget" data-testid="guestbook-widget">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-widest text-[var(--accent)]" style={{ fontFamily: "var(--font-mono)" }}>GUESTBOOK</p>
          <h2 className="text-lg font-black text-white" style={{ fontFamily: "var(--font-bricolage)" }}>leave a mark</h2>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/45" style={{ fontFamily: "var(--font-mono)" }}>{entries.length} notes</span>
      </div>

      <form onSubmit={sign} className="guestbook-form">
        <input value={body} onChange={(e) => setBody(e.target.value)} disabled={!user} maxLength={220} placeholder={user ? "write something quick..." : "sign in to write"} />
        <button disabled={!user || !body.trim()}>sign</button>
      </form>
      {status && <p className="mt-2 text-xs text-white/40" style={{ fontFamily: "var(--font-mono)" }}>{status}</p>}

      <div className="mt-4 space-y-2">
        {entries.length === 0 && <p className="text-xs text-white/35">no notes yet.</p>}
        {entries.map((entry) => (
          <div key={entry.id} className="guestbook-entry">
            <p>{entry.body}</p>
            <span>@{entry.signer?.username ?? entry.name} / {new Date(entry.createdAt).toLocaleDateString()}</span>
            {(user?.username === username || user?.role === "ADMIN") && (
              <button type="button" onClick={() => hideEntry(entry.id)} className="guestbook-hide" data-testid={`guestbook-hide-${entry.id}`}>
                hide
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
