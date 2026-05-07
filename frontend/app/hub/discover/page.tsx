"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";

type Creator = {
  username: string;
  displayName: string;
  image: string | null;
  accentColor: string;
  status: string | null;
  level: number;
  xp?: number;
  levelTitle?: string;
  levelProgress?: number;
  streakCount?: number;
  posts?: number;
  followers: number;
  isLive: boolean;
  href: string;
};
type Board = { slug: string; name: string; description: string | null; postCount: number; icon: string | null; href: string };
type Clip = { id: string; title: string; flair: string | null; href: string; board: { slug: string }; author: { username: string }; score: number; comments: number };

const TAGS = ["streamers", "artists", "writers", "musicians", "gamers", "lore-heads", "night-owls", "lurkers"];
const DISCOVERY_MODES = [
  { id: "for-you", label: "For you", hint: "balanced picks" },
  { id: "live", label: "Live", hint: "rooms with motion" },
  { id: "rising", label: "Rising", hint: "levels moving up" },
  { id: "new", label: "New", hint: "fresh profiles" },
  { id: "music", label: "Music", hint: "status + audio energy" },
] as const;
type DiscoveryMode = (typeof DISCOVERY_MODES)[number]["id"];

export default function DiscoverPage() {
  const [tag, setTag] = useState("streamers");
  const [mode, setMode] = useState<DiscoveryMode>("for-you");
  const [creators, setCreators] = useState<Creator[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [activeNow, setActiveNow] = useState<number | null>(null);
  const [newToday, setNewToday] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/pulse", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      fetch("/api/presence", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      fetch("/api/posts?sort=new&limit=6", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ posts: [] })),
    ]).then(([pulse, presence, postsData]) => {
      if (pulse) {
        setCreators(pulse.creators ?? []);
        setBoards(pulse.boards ?? []);
      }
      if (presence) {
        setActiveNow(presence.activeNow);
        setNewToday(presence.newToday);
      }
      setClips(((postsData?.posts ?? []) as Clip[]).slice(0, 3));
    });
  }, []);

  const recommendedCreators = useMemo(() => {
    return [...creators].sort((a, b) => creatorScore(b, mode, tag) - creatorScore(a, mode, tag)).slice(0, 4);
  }, [creators, mode, tag]);
  const quietGems = useMemo(() => {
    return [...creators]
      .filter((creator) => !creator.isLive)
      .sort((a, b) => (b.levelProgress ?? 0) + (b.streakCount ?? 0) - ((a.levelProgress ?? 0) + (a.streakCount ?? 0)))
      .slice(0, 3);
  }, [creators]);

  return (
    <HubShell rightRail={<RightRail />}>
      <div className="hub-page-wrap discover-page">
        <section className="discover-hero">
          <div>
            <p className="hub-page-kicker">discover</p>
            <h1 className="hub-page-title mb-1">find your room</h1>
            <p className="hub-page-sub">Creators, boards, clips, and live rooms worth checking next.</p>
          </div>
          <div className="discover-stats">
            <div><strong suppressHydrationWarning>{activeNow ?? "--"}</strong><span>online</span></div>
            <div><strong suppressHydrationWarning>{newToday ?? "--"}</strong><span>new today</span></div>
            <div><strong>{boards.length || "--"}</strong><span>boards active</span></div>
          </div>
        </section>

        <div className="discover-chips" data-testid="discover-tags">
          {TAGS.map((t) => (
            <button key={t} type="button" onClick={() => setTag(t)} className={`discover-chip ${tag === t ? "is-on" : ""}`} data-testid={`discover-tag-${t}`}>
              #{t}
            </button>
          ))}
        </div>

        <section className="discover-mixer" data-testid="discover-mixer">
          <div className="discover-mixer-head">
            <div>
              <span>better discovery</span>
              <strong>{tag.replace("-", " ")} radar</strong>
            </div>
            <Link href="/hub/leaderboard">creator levels</Link>
          </div>
          <div className="discover-mode-tabs">
            {DISCOVERY_MODES.map((item) => (
              <button key={item.id} type="button" onClick={() => setMode(item.id)} className={mode === item.id ? "is-active" : ""}>
                <strong>{item.label}</strong>
                <span>{item.hint}</span>
              </button>
            ))}
          </div>
          <div className="discover-recommend-grid">
            {recommendedCreators.length === 0 && <p className="discover-empty-copy">post, go live, or finish a spotlight to seed recommendations.</p>}
            {recommendedCreators.map((creator) => (
              <Link key={creator.username} href={creator.href} className="discover-recommend-card" style={{ ["--accent-color" as any]: creator.accentColor }}>
                <div className="discover-recommend-top">
                  <span className="discover-recommend-avatar">{creator.image ? <img src={creator.image} alt="" /> : creator.displayName.slice(0, 1).toUpperCase()}</span>
                  <small>{creatorReason(creator, mode)}</small>
                </div>
                <strong>{creator.displayName}</strong>
                <p>{creator.status ?? `${creator.levelTitle ?? levelTitleFallback(creator.level)} - level ${creator.level}`}</p>
                <div className="creator-level-meter" aria-label={`${creator.levelProgress ?? 0}% to next level`}>
                  <span style={{ width: `${creator.levelProgress ?? 0}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="discover-section">
          <header className="discover-section-head">
            <h2>trending creators</h2>
            <span className="discover-section-meta">sorted by activity</span>
          </header>
          <div className="discover-creator-grid" data-testid="discover-creators">
            {creators.length === 0 && (
              <p className="text-xs text-white/30 col-span-2 py-4" style={{ fontFamily: "var(--font-mono)" }}>no creators yet - be the first to post</p>
            )}
            {creators.map((c) => (
              <Link key={c.username} href={c.href} className="discover-creator" style={{ ["--accent-color" as any]: c.accentColor }} data-testid={`discover-creator-${c.username}`}>
                <div className={`discover-creator-avatar ${c.isLive ? "is-live" : ""}`}>
                  {c.image ? <img src={c.image} alt="" /> : c.displayName.slice(0, 1).toUpperCase()}
                  {c.isLive && <span className="discover-live-pip" aria-label="live" />}
                </div>
                <div className="min-w-0">
                  <p className="discover-creator-name">{c.displayName}</p>
                  <p className="discover-creator-handle">{c.username}{c.isLive ? " / LIVE" : ""}</p>
                  <p className="discover-creator-vibe">{c.status ?? `level ${c.level}`}</p>
                  <div className="discover-level-pill"><span>{c.levelTitle ?? levelTitleFallback(c.level)}</span><i><b style={{ width: `${c.levelProgress ?? 0}%` }} /></i></div>
                </div>
                <div className="discover-creator-stat">
                  <strong>{c.followers}</strong>
                  <span>follows</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="discover-section discover-quiet-rail">
          <header className="discover-section-head">
            <h2>quiet gems</h2>
            <span className="discover-section-meta">small rooms with good signal</span>
          </header>
          <div className="discover-quiet-grid">
            {quietGems.map((creator) => (
              <Link key={creator.username} href={creator.href} className="discover-quiet-card">
                <strong>{creator.displayName}</strong>
                <span>{creator.levelTitle ?? levelTitleFallback(creator.level)} / {creator.posts ?? 0} posts</span>
              </Link>
            ))}
            {quietGems.length === 0 && <p className="discover-empty-copy">quiet picks will show after more creators post.</p>}
          </div>
        </section>

        <section className="discover-section">
          <header className="discover-section-head">
            <h2>boards heating up</h2>
            <Link href="/hub/all-boards" className="discover-section-link">see all {"->"}</Link>
          </header>
          <div className="discover-board-list" data-testid="discover-boards">
            {boards.length === 0 && (
              <p className="text-xs text-white/30 py-4" style={{ fontFamily: "var(--font-mono)" }}>boards loading...</p>
            )}
            {boards.map((b) => {
              const maxPosts = Math.max(...boards.map((x) => x.postCount), 1);
              const heat = Math.round((b.postCount / maxPosts) * 100);
              return (
                <Link key={b.slug} href={b.href} className="discover-board" data-testid={`discover-board-${b.slug}`}>
                  <span className="discover-board-tag">{b.icon ?? "#"}</span>
                  <div className="min-w-0">
                    <p className="discover-board-name">b/{b.name}</p>
                    <p className="discover-board-copy">{b.description ?? "board"}</p>
                  </div>
                  <div className="discover-board-heat" title={`${b.postCount} posts`}>
                    <div className="discover-board-heat-fill" style={{ width: `${heat}%` }} />
                    <span>{b.postCount} posts</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="discover-section">
          <header className="discover-section-head">
            <h2>what's moving</h2>
            <Link href="/hub/clips" className="discover-section-link">view clips {"->"}</Link>
          </header>
          <div className="discover-clip-row" data-testid="discover-clips">
            {clips.length === 0 && (
              <p className="text-xs text-white/30 py-4" style={{ fontFamily: "var(--font-mono)" }}>nothing posted yet</p>
            )}
            {clips.map((c) => (
              <Link key={c.id} href={c.href ?? `/hub/post/${c.id}`} className="discover-clip" data-testid={`discover-clip-${c.id}`}>
                <div className="discover-clip-thumb">
                  <span className="discover-clip-play">{">"}</span>
                  <span className="discover-clip-len">{c.score > 0 ? `+${c.score}` : "new"}</span>
                </div>
                <p className="discover-clip-title">{c.title}</p>
                <p className="discover-clip-meta">{c.author.username} / {c.comments} replies</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="discover-pull">
          <div>
            <p className="discover-pull-kicker">do not see your people?</p>
            <p className="discover-pull-copy">Post something specific, comment on a board, or finish your spotlight so people know where to go next.</p>
          </div>
          <div className="discover-pull-actions">
            <Link href="/hub/post/new" className="peng-btn peng-btn-primary text-xs">start a post</Link>
            <Link href="/hub/showcase" className="peng-btn peng-btn-ghost text-xs">build your links</Link>
          </div>
        </section>
      </div>
    </HubShell>
  );
}

function creatorScore(creator: Creator, mode: DiscoveryMode, tag: string) {
  const base = creator.level * 12 + creator.followers * 4 + (creator.posts ?? 0) * 3 + (creator.streakCount ?? 0) * 2;
  const tagBoost = creator.status?.toLowerCase().includes(tag.replace("-", " ")) ? 18 : 0;
  if (mode === "live") return base + (creator.isLive ? 80 : -20);
  if (mode === "rising") return base + (creator.levelProgress ?? 0) + (creator.level < 10 ? 20 : 0);
  if (mode === "new") return base - creator.level * 4 + (creator.posts ?? 0) * 8;
  if (mode === "music") return base + (creator.status?.toLowerCase().match(/music|song|track|listening|drop/) ? 45 : 0);
  return base + tagBoost + (creator.isLive ? 24 : 0);
}

function creatorReason(creator: Creator, mode: DiscoveryMode) {
  if (creator.isLive) return "live now";
  if (mode === "rising") return `${creator.levelProgress ?? 0}% to next level`;
  if (mode === "new") return `${creator.posts ?? 0} posts`;
  if (mode === "music") return "audio profile";
  return creator.levelTitle ?? levelTitleFallback(creator.level);
}

function levelTitleFallback(level: number) {
  if (level >= 18) return "headliner";
  if (level >= 12) return "signal pro";
  if (level >= 6) return "rising creator";
  return "new signal";
}
