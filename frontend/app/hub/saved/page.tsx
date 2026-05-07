"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";

type SavedPost = {
  id: string;
  title: string;
  body: string;
  flair: string | null;
  voteScore: number;
  createdAt: string;
  board: { slug: string; name: string };
  author: { username: string; displayName: string; image: string | null };
};

const TIPS = [
  { title: "tap save on any post", copy: "look for the bookmark button under any post — it lands here instantly.", href: "/hub" },
  { title: "build your reading list", copy: "save posts you want to come back to later — they stay until you remove them.", href: "/hub/showcase" },
  { title: "save a clip to revisit", copy: "long clips, lore drops, art process — pin them so you don't lose them.", href: "/hub/clips" },
];

export default function SavedPage() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem("peng:saved-posts") || "[]");
      setSavedIds(Array.isArray(ids) ? ids : []);
    } catch {}
  }, []);

  useEffect(() => {
    if (savedIds.length === 0) { setPosts([]); return; }
    setLoading(true);
    fetch(`/api/posts?ids=${savedIds.join(",")}`)
      .then((r) => r.ok ? r.json() : { posts: [] })
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [savedIds]);

  function unsave(id: string) {
    const next = savedIds.filter((s) => s !== id);
    setSavedIds(next);
    setPosts((p) => p.filter((post) => post.id !== id));
    localStorage.setItem("peng:saved-posts", JSON.stringify(next));
  }

  const total = savedIds.length;

  return (
    <HubShell rightRail={<RightRail />}>
      <div className="hub-page-wrap saved-page">
        <section className="saved-hero">
          <div>
            <p className="hub-page-kicker">saved · your private shelf</p>
            <h1 className="hub-page-title mb-1">things worth keeping</h1>
            <p className="hub-page-sub">posts and clips you wanted to come back to</p>
          </div>
          <div className="saved-stats">
            <div><strong suppressHydrationWarning>{total}</strong><span>saved</span></div>
            <div><strong>private</strong><span>only you see this</span></div>
          </div>
        </section>

        {/* MAIN AREA */}
        {loading && (
          <p className="text-xs text-white/30 py-8 text-center" style={{ fontFamily: "var(--font-mono)" }}>loading saved posts...</p>
        )}

        {!loading && total === 0 && (
          <section className="saved-empty" data-testid="saved-empty">
            <div className="saved-empty-mark">◇</div>
            <p className="saved-empty-title">your shelf is empty for now</p>
            <p className="saved-empty-copy">save anything you want to find later — one click on any post.</p>
            <Link href="/hub" className="peng-btn peng-btn-primary text-xs mt-3">browse the feed</Link>
          </section>
        )}

        {!loading && posts.length > 0 && (
          <section className="saved-list space-y-3" data-testid="saved-list">
            {posts.map((post) => (
              <div key={post.id} className="peng-card group relative hover:border-[var(--accent)]/40" data-testid={`saved-${post.id}`}>
                <Link href={`/hub/post/${post.id}`} className="block">
                  <div className="mb-2 flex items-center gap-2 text-[10px] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
                    <span>b/{post.board.slug}</span>
                    <span className="text-white/20">·</span>
                    <span>@{post.author.username}</span>
                    {post.flair && (
                      <>
                        <span className="text-white/20">·</span>
                        <span className="rounded border border-[var(--bg-border)] px-1.5 py-0.5">{post.flair}</span>
                      </>
                    )}
                    <span className="ml-auto">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug" style={{ fontFamily: "var(--font-bricolage)" }}>{post.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-white/60">{post.body}</p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>
                    <span>▲ {post.voteScore}</span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => unsave(post.id)}
                  className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white/40 hover:text-red-400 px-2 py-1 rounded border border-transparent hover:border-red-400/30"
                  title="Remove from saved"
                  data-testid={`unsave-${post.id}`}
                >
                  remove
                </button>
              </div>
            ))}
          </section>
        )}

        {/* Show IDs that failed to load (deleted posts) */}
        {!loading && savedIds.length > 0 && posts.length < savedIds.length && (
          <p className="mt-2 text-[10px] text-white/20 text-center" style={{ fontFamily: "var(--font-mono)" }}>
            {savedIds.length - posts.length} saved post(s) are no longer available
          </p>
        )}

        {/* TIPS */}
        <section className="discover-section mt-8">
          <header className="discover-section-head">
            <h2>how saving works</h2>
            <span className="discover-section-meta">quick habits</span>
          </header>
          <div className="saved-tips" data-testid="saved-tips">
            {TIPS.map((t) => (
              <Link key={t.title} href={t.href} className="saved-tip" data-testid={`saved-tip-${t.title.split(" ")[0]}`}>
                <p className="saved-tip-title">{t.title}</p>
                <p className="saved-tip-copy">{t.copy}</p>
                <span className="saved-tip-go">try it →</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </HubShell>
  );
}
