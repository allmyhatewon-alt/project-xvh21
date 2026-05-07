"use client";
import Link from "next/link";
import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/providers";
import { useRouter, useSearchParams } from "next/navigation";

type Post = {
  id: string;
  authorId: string;
  title: string;
  body: string;
  flair: string | null;
  voteScore: number;
  commentCount: number;
  isPinned: boolean;
  createdAt: string;
  board: { slug: string; name: string };
  author: { username: string; displayName: string; image: string | null; accentColor: string };
};

type LiveCreator = {
  id: string;
  title: string;
  category: string;
  viewerCount: number;
  isLive: boolean;
  user: { username: string; displayName: string; image: string | null; accentColor: string };
};

type Pulse = {
  activeNow: number;
  weeklyPosts: number;
  signal: string;
  recentPosts: Array<{
    id: string;
    title: string;
    flair: string | null;
    href: string;
    board: { slug: string; name: string };
    author: { username: string; displayName: string; image: string | null; accentColor: string };
    score: number;
    comments: number;
  }>;
  creators: Array<{
    username: string;
    displayName: string;
    image: string | null;
    accentColor: string;
    status: string | null;
    level: number;
    streakCount: number;
    followers: number;
    posts: number;
    isLive: boolean;
    href: string;
  }>;
  boards: Array<{ slug: string; name: string; description: string | null; postCount: number; icon: string | null; href: string }>;
};

type SignalPlan = {
  mode: string;
  score: number;
  line: string;
  primary: { label: string; href: string };
  steps: string[];
};

const TABS = [
  { key: "hot", label: "Hot" },
  { key: "new", label: "New" },
  { key: "rising", label: "Rising" },
  { key: "following", label: "Following" },
  { key: "saved", label: "Saved" },
  { key: "live", label: "Live" },
  { key: "foryou", label: "For You" },
];
const BOARD_TABS = TABS.filter((item) => ["hot", "new", "rising"].includes(item.key));

export function FeedView({ initialBoardSlug = "" }: { initialBoardSlug?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBoardView = Boolean(initialBoardSlug);
  const board = useMemo(() => boardProfile(initialBoardSlug), [initialBoardSlug]);
  const visibleTabs = isBoardView ? BOARD_TABS : TABS;
  const requestedTab = searchParams.get("sort") ?? "hot";
  const initialTab = isBoardView && !BOARD_TABS.some((item) => item.key === requestedTab) ? "hot" : requestedTab;
  const [tab, setTab] = useState(initialTab);
  const [posts, setPosts] = useState<Post[]>([]);
  const [liveCreators, setLiveCreators] = useState<LiveCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState<string>("Welcome");
  const { user } = useAuth();

  useEffect(() => {
    setGreeting(greetingFor());
  }, []);

  useEffect(() => {
    if (isBoardView && !BOARD_TABS.some((item) => item.key === tab)) setTab("hot");
  }, [isBoardView, tab]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setLiveCreators([]);

    if (tab === "live") {
      const res = await fetch("/api/live");
      const data = await res.json();
      setLiveCreators(data.streams ?? []);
      setPosts([]);
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (initialBoardSlug) params.set("board", initialBoardSlug);
    if (tab === "hot" || tab === "new" || tab === "rising") params.set("sort", tab);
    if (tab === "following") params.set("following", "1");
    if (tab === "foryou") params.set("foryou", "1");
    if (tab === "saved") {
      // Read saved IDs from localStorage and batch-fetch
      try {
        const ids = JSON.parse(localStorage.getItem("peng:saved-posts") || "[]") as string[];
        if (ids.length === 0) { setPosts([]); setLoading(false); return; }
        params.set("ids", ids.join(","));
      } catch {
        setPosts([]); setLoading(false); return;
      }
    }
    const res = await fetch(`/api/posts?${params}`);
    const data = await res.json();
    setPosts(data.posts ?? []);
    setLoading(false);
  }, [tab, initialBoardSlug]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className={`hub-feed-panel space-y-5 ${isBoardView ? "is-board-view" : "is-home-view"}`} data-testid="feed-view">
      {isBoardView ? (
        <BoardHero board={board} postHref={`/hub/post/new?board=${initialBoardSlug}`} />
      ) : (
        <>
          <div className="feed-hero flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="feed-hero-kicker">{user ? `welcome back / @${user.username}` : "welcome to peng's place"}</p>
              <h1 className="hub-page-title" data-testid="feed-title">
                <span suppressHydrationWarning>{greeting}<span className="hub-page-title-slash">,</span> peng</span>
              </h1>
              <p className="hub-page-sub">Posts, clips, live rooms, and creator updates in one place.</p>
            </div>
            <div className="feed-hero-actions flex items-center gap-3">
              <LivePulse />
              <Link href="/hub/post/new" className="peng-btn peng-btn-primary flex items-center gap-2 text-xs" data-testid="create-post-button">
                <span className="create-post-spark">+</span>
                CREATE POST
              </Link>
            </div>
          </div>

          <AmbientTicker />

          <CreatorPulse />

          <SignalDirector />

          <HitUpgradeDeck />

          <CreatorLevelStrip />

          <div className="hub-mission-row" data-testid="hub-mission-row">
            <Link href="/hub/quests" className="hub-mission-card">
              <span>daily streak</span>
              <strong>{user ? `${user.streakCount ?? 0} days` : "sign in"}</strong>
              <small>earn daily progress</small>
            </Link>
            <Link href="/hub/discover" className="hub-mission-card">
              <span>discover</span>
              <strong>find creators</strong>
              <small>boards, creators, clips</small>
            </Link>
            <Link href="/hub/space/edit" className="hub-mission-card">
              <span>spotlight</span>
              <strong>{user ? "edit yours" : "build one"}</strong>
              <small>templates + effects</small>
            </Link>
          </div>
        </>
      )}

      {/* 3. TABS */}
      <div className="feed-tabs-row" data-testid="feed-tabs">
        {visibleTabs.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setTab(item.key);
              const sp = new URLSearchParams(searchParams.toString());
              sp.set("sort", item.key);
              router.replace(`?${sp.toString()}`, { scroll: false });
            }}
            className={`feed-tab-btn ${tab === item.key ? "is-active" : ""}`}
            data-testid={`feed-tab-${item.key}`}
          >
            {item.key === "live" && <span className="feed-tab-live-dot" />}
            {item.label}
          </button>
        ))}
      </div>

      <div className="feed-card-stagger space-y-3" key={tab}>
        {loading && (
          <p className="py-8 text-center text-xs text-white/30" style={{ fontFamily: "var(--font-mono)" }}>
            loading...
          </p>
        )}

        {/* LIVE NOW tab — show live rooms */}
        {!loading && tab === "live" && liveCreators.length === 0 && (
          <div className="peng-card hub-home-empty" data-testid="empty-feed">
            <div className="hub-home-empty-mark" aria-hidden="true">📡</div>
            <div>
              <p className="hub-home-empty-title">no one live right now</p>
              <p className="hub-home-empty-copy">Be the first to go live and own the room.</p>
            </div>
            <Link href="/hub/live/studio" className="peng-btn peng-btn-primary text-xs" style={{ fontFamily: "var(--font-mono)" }}>
              go live
            </Link>
          </div>
        )}
        {!loading && tab === "live" && liveCreators.map((stream) => (
          <Link key={stream.id} href={`/hub/live/${stream.user.username}`} className="peng-card hub-post-card post-card-lift flex items-center gap-4 hover:border-[var(--accent)]/40" data-testid={`live-card-${stream.id}`}>
            <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{ background: `${stream.user.accentColor}33` }}>
              {stream.user.image ? <img src={stream.user.image} alt="" className="w-full h-full object-cover" /> : stream.user.username.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white truncate" style={{ fontFamily: "var(--font-mono)" }}>{stream.title}</p>
              <p className="text-xs text-white/40 truncate" style={{ fontFamily: "var(--font-mono)" }}>@{stream.user.username} / {stream.category}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="live-pulse-dot" aria-hidden="true" />
              <span className="text-xs text-white/60" style={{ fontFamily: "var(--font-mono)" }}>{stream.viewerCount} watching</span>
            </div>
          </Link>
        ))}

        {/* Regular post tabs */}
        {!loading && tab !== "live" && posts.length === 0 && (
          <div className="peng-card hub-home-empty" data-testid="empty-feed">
            <div className="hub-home-empty-mark" aria-hidden="true">{"\u{1F427}"}</div>
            <div>
              <p className="hub-home-empty-title">{isBoardView ? `${board.name} is quiet` : tab === "foryou" ? "nothing personalized yet" : "quiet in here right now"}</p>
              <p className="hub-home-empty-copy">{isBoardView ? board.empty : tab === "foryou" ? "Follow some creators and posts will start showing up here." : "Start the first post or browse clips while the feed fills up."}</p>
            </div>
            <div className="hub-home-empty-actions">
              <Link href={isBoardView ? `/hub/post/new?board=${initialBoardSlug}` : "/hub/post/new"} className="peng-btn peng-btn-primary text-xs" style={{ fontFamily: "var(--font-mono)" }}>
                start a post
              </Link>
              <Link href={isBoardView ? "/hub/all-boards" : tab === "foryou" ? "/hub/discover" : "/hub/clips"} className="peng-btn peng-btn-ghost text-xs" style={{ fontFamily: "var(--font-mono)" }}>
                {isBoardView ? "all boards" : tab === "foryou" ? "find creators" : "browse clips"}
              </Link>
            </div>
          </div>
        )}
        {tab !== "live" && isBoardView && posts.length > 0 && (
          <div className="board-thread-table" data-testid="board-thread-table">
            <div className="board-thread-head">
              <span>thread</span>
              <span>replies</span>
              <span>views</span>
              <span>last post</span>
            </div>
            {posts.map((post) => (
              <BoardThreadRow key={post.id} post={post} />
            ))}
          </div>
        )}
        {tab !== "live" && !isBoardView && posts.map((post) => (
          <PostCard key={post.id} post={post} viewerId={user?.id} onChange={fetchPosts} />
        ))}
      </div>

      {!isBoardView && (
        <>
          <div className="feed-clips-strip">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm lowercase tracking-wide text-white/60" style={{ fontFamily: "var(--font-mono)" }}>
                clips / b/clips
              </h2>
              <Link href="/hub/clips" className="text-xs text-[var(--xp-color)] hover:text-white" data-testid="view-all-clips-link" style={{ fontFamily: "var(--font-mono)" }}>
                view all {"->"}
              </Link>
            </div>
            <div className="peng-card feed-soft-card feed-clips-compact">
              <span className="hub-empty-peng-art" aria-hidden="true">{"\u{1F427}"}</span>
              <span className="text-sm text-white/65" style={{ fontFamily: "var(--font-mono)" }}>
                no clips posted yet
              </span>
              <Link href="/hub/post/new?flair=CLIP&board=clips" className="ml-auto text-xs text-[var(--xp-color)] hover:underline" data-testid="post-first-clip-link" style={{ fontFamily: "var(--font-mono)" }}>
                post the first clip {"->"}
              </Link>
            </div>
          </div>

          <div className="hub-next-row" aria-label="next moves">
            <Link href="/hub/discover" className="hub-next-card">
              <span>explore</span>
              <strong>find a room</strong>
            </Link>
            <Link href="/hub/quests" className="hub-next-card">
              <span>daily</span>
              <strong>check the streak</strong>
            </Link>
            <Link href="/hub/showcase" className="hub-next-card">
              <span>profile</span>
              <strong>edit your profile</strong>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function BoardHero({ board, postHref }: { board: ReturnType<typeof boardProfile>; postHref: string }) {
  return (
    <section className={`board-feed-hero board-tone-${board.tone}`} data-testid="board-feed-hero">
      <div className="board-feed-top">
        <div className="board-feed-icon" aria-hidden="true">{board.icon}</div>
        <div className="board-feed-copy">
          <p className="feed-hero-kicker">community board</p>
          <h1 className="hub-page-title" data-testid="feed-title">{board.name}</h1>
          <p className="hub-page-sub">{board.description}</p>
        </div>
        <div className="board-feed-actions">
          <Link href="/hub/all-boards" className="peng-btn peng-btn-ghost text-xs">all boards</Link>
          <Link href={postHref} className="peng-btn peng-btn-primary text-xs">post here</Link>
        </div>
      </div>

      <div className="board-feed-pin">
        <span>pinned note</span>
        <strong>{board.pin}</strong>
      </div>

      <div className="board-feed-lanes" aria-label="board lanes">
        {board.lanes.map((lane) => (
          <div key={lane.title} className="board-feed-lane">
            <span>{lane.label}</span>
            <strong>{lane.title}</strong>
          </div>
        ))}
      </div>

      <div className="board-feed-guide" aria-label="board rules">
        {board.guide.map((item) => <span key={item}>{item}</span>)}
      </div>
    </section>
  );
}

function boardProfile(slug: string) {
  const profiles: Record<string, { name: string; description: string; empty: string; icon: string; tone: string; pin: string; guide: string[]; lanes: Array<{ label: string; title: string }> }> = {
    general: {
      name: "general",
      description: "Open conversation without the dashboard noise. Quick thoughts, questions, and community talk live here.",
      empty: "Start with a question, a thought, or something people can answer fast.",
      icon: "G",
      tone: "cyan",
      pin: "Keep posts easy to answer. One thought, one question, or one clean update beats a wall of text.",
      guide: ["quick posts", "easy replies", "keep it readable"],
      lanes: [{ label: "lane 01", title: "questions" }, { label: "lane 02", title: "updates" }, { label: "lane 03", title: "random" }],
    },
    clips: {
      name: "clips & edits",
      description: "A cleaner room for moments worth replaying. Post the clip, add context, let people react.",
      empty: "Drop the first clip with a short title and what makes the moment worth watching.",
      icon: "C",
      tone: "green",
      pin: "Lead with the moment. Mention who is in it, what happened, and why chat should run it back.",
      guide: ["short context", "clean titles", "best moments"],
      lanes: [{ label: "lane 01", title: "stream clips" }, { label: "lane 02", title: "edits" }, { label: "lane 03", title: "replays" }],
    },
    announcements: {
      name: "announcements",
      description: "Official updates only. Quiet, direct, and easy to scan.",
      empty: "Use this board for updates that people should not miss.",
      icon: "A",
      tone: "gold",
      pin: "Dates, links, and what changed should be visible fast. Keep announcements calm and direct.",
      guide: ["official posts", "clear dates", "no clutter"],
      lanes: [{ label: "lane 01", title: "updates" }, { label: "lane 02", title: "drops" }, { label: "lane 03", title: "alerts" }],
    },
    fanart: {
      name: "fan art",
      description: "A gallery-style board for drawings, edits, banners, thumbnails, and anything made by the community.",
      empty: "Post the first piece with the artist name, tools used, or what inspired it.",
      icon: "F",
      tone: "pink",
      pin: "Credit the artist, show the piece cleanly, and add a little story so people know what they are looking at.",
      guide: ["credit artists", "show process", "support the work"],
      lanes: [{ label: "lane 01", title: "finished art" }, { label: "lane 02", title: "wips" }, { label: "lane 03", title: "gfx" }],
    },
    gaming: {
      name: "gaming",
      description: "Games, runs, builds, ranked talk, and clips without making the page feel packed.",
      empty: "Start with the game name and the question or moment you want people to react to.",
      icon: "G",
      tone: "blue",
      pin: "Put the game first. Builds, ranks, clips, and questions should be obvious before people click.",
      guide: ["game first", "ranked talk", "clip friendly"],
      lanes: [{ label: "lane 01", title: "ranked" }, { label: "lane 02", title: "builds" }, { label: "lane 03", title: "clips" }],
    },
    music: {
      name: "music",
      description: "Tracks, mixes, playlists, and recommendations in a room that feels like a listening booth.",
      empty: "Share a track, why it hits, and where people should listen.",
      icon: "M",
      tone: "violet",
      pin: "Drop the title, artist, and why it belongs here. Links are welcome, spam is not.",
      guide: ["track links", "short notes", "new drops"],
      lanes: [{ label: "lane 01", title: "new drops" }, { label: "lane 02", title: "playlists" }, { label: "lane 03", title: "finds" }],
    },
  };
  return profiles[slug] ?? {
    name: slug.replaceAll("-", " "),
    description: "A focused board for this topic. Posts stay centered and easy to browse.",
    empty: "Be the first to start this board with something clear and easy to reply to.",
    icon: slug.slice(0, 1).toUpperCase(),
    tone: "cyan",
    pin: "Keep the post specific enough that people know how to reply.",
    guide: ["focused posts", "clean titles", "easy replies"],
    lanes: [{ label: "lane 01", title: "posts" }, { label: "lane 02", title: "questions" }, { label: "lane 03", title: "links" }],
  };
}

function BoardThreadRow({ post }: { post: Post }) {
  const views = Math.max(12, post.commentCount * 9 + Math.abs(post.voteScore) * 4 + post.title.length);
  const created = new Date(post.createdAt);
  const isFresh = Date.now() - created.getTime() < 1000 * 60 * 60 * 24 * 2;
  return (
    <article className={`board-thread-row ${post.isPinned ? "is-pinned" : ""}`} data-testid={`thread-row-${post.id}`}>
      <div className="board-thread-main">
        <Link href={`/hub/post/${post.id}`} className="board-thread-title" data-testid={`post-link-${post.id}`}>
          {post.isPinned && <span>PIN</span>}
          {isFresh && !post.isPinned && <span>NEW</span>}
          <strong>{post.title}</strong>
        </Link>
        <div className="board-thread-meta">
          <Link href={`/hub/user/${post.author.username}`} className="board-thread-author" data-testid={`post-author-${post.id}`}>
            <i style={{ background: `${post.author.accentColor}55` }}>
              {post.author.image ? <img src={post.author.image} alt="" /> : post.author.username.slice(0, 1).toUpperCase()}
            </i>
            {post.author.username}
          </Link>
          <span>/</span>
          <Link href={`/hub/board/${post.board.slug}`} data-testid={`post-board-${post.id}`}>b/{post.board.slug}</Link>
          {post.flair && <em data-testid={`post-flair-${post.id}`}>{post.flair}</em>}
        </div>
      </div>
      <div className="board-thread-stat">
        <strong>{post.commentCount}</strong>
        <span>replies</span>
      </div>
      <div className="board-thread-stat">
        <strong>{views}</strong>
        <span>views</span>
      </div>
      <Link href={`/hub/post/${post.id}`} className="board-thread-last">
        <strong>{created.toLocaleDateString()}</strong>
        <span>by {post.author.username}</span>
      </Link>
    </article>
  );
}

function SignalDirector() {
  const { user } = useAuth();
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [copied, setCopied] = useState(false);
  const [spark, setSpark] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/pulse", { cache: "no-store" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled) setPulse(data);
      })
      .catch(() => {
        if (!cancelled) setPulse(null);
      });
    return () => { cancelled = true; };
  }, []);

  const plan = useMemo(() => buildSignalPlan(user, pulse, spark), [user, pulse, spark]);

  async function copyPlan() {
    const text = [`Pengelus run: ${plan.mode}`, plan.line, ...plan.steps.map((step, index) => `${index + 1}. ${step}`)].join("\n");
    await navigator.clipboard?.writeText(text).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="signal-director-card" data-testid="signal-director">
      <div className="signal-director-main">
        <span className="signal-director-kicker">today's plan</span>
        <h2>{plan.mode}</h2>
        <p>{plan.line}</p>
        <div className="signal-director-steps">
          {plan.steps.map((step, index) => (
            <span key={`${step}-${index}`}><b>{index + 1}</b>{step}</span>
          ))}
        </div>
      </div>
      <div className="signal-director-side">
        <div className="signal-orb" style={{ "--score": `${plan.score}%` } as CSSProperties}>
          <span>{plan.score}</span>
          <small>signal</small>
        </div>
        <div className="signal-director-actions">
          <Link href={plan.primary.href} className="peng-btn peng-btn-primary text-xs">{plan.primary.label}</Link>
          <button type="button" className="peng-btn peng-btn-ghost text-xs" onClick={() => setSpark((value) => value + 1)}>reroll</button>
          <button type="button" className="peng-btn peng-btn-ghost text-xs" onClick={copyPlan}>{copied ? "copied" : "copy run"}</button>
        </div>
      </div>
    </section>
  );
}

function buildSignalPlan(user: ReturnType<typeof useAuth>["user"], pulse: Pulse | null, spark: number): SignalPlan {
  const hour = typeof window === "undefined" ? 12 : new Date().getHours();
  const active = pulse?.activeNow ?? 9;
  const weeklyPosts = pulse?.weeklyPosts ?? 0;
  const streak = user?.streakCount ?? 0;
  const level = user?.level ?? 1;
  const variants = [
    {
      mode: hour >= 20 || hour < 4 ? "Late-night posting window" : "Creator warmup",
      score: Math.min(99, 42 + active + streak * 4 + level),
      line: active > 12 ? "There are enough people around for a post to catch. Keep it short, specific, and easy to reply to." : "It is a quieter window. One clear post can set the tone for the feed.",
      primary: { label: "create post", href: "/hub/post/new" },
      steps: ["Post one short thought people can answer fast.", "Add the strongest context in the first line.", "Check back in ten minutes and reply while it is fresh."],
    },
    {
      mode: "Profile polish",
      score: Math.min(99, 55 + streak * 3 + (user?.status ? 8 : 0)),
      line: "Your profile should make the next click obvious: follow, watch, join, or message.",
      primary: { label: "edit spotlight", href: "/hub/space/edit" },
      steps: ["Update your status with what you are doing today.", "Move the strongest link or music block above the fold.", "Use one effect and let the layout breathe."],
    },
    {
      mode: "Live setup check",
      score: Math.min(99, 48 + active * 2 + (weeklyPosts > 3 ? 10 : 0)),
      line: "The live page is strongest when the title, category, and chat prompt are simple.",
      primary: { label: "open studio", href: "/hub/live/studio" },
      steps: ["Pick a clean scene before going live.", "Keep chat TTS off until the room has momentum.", "End with a clip prompt so the feed has something to carry."],
    },
  ];
  return variants[Math.abs(spark) % variants.length];
}

function HitUpgradeDeck() {
  const { user } = useAuth();
  const [done, setDone] = useState<string[]>([]);
  const [goal, setGoal] = useState(420);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem("peng:creator-checklist") || "[]"));
      setGoal(Number(localStorage.getItem("peng:creator-goal") || "420"));
    } catch {
      setDone([]);
    }
  }, []);

  function toggleStep(id: string) {
    const next = done.includes(id) ? done.filter((item) => item !== id) : [...done, id];
    setDone(next);
    localStorage.setItem("peng:creator-checklist", JSON.stringify(next));
  }

  function moveGoal(amount: number) {
    const next = Math.max(0, Math.min(1000, goal + amount));
    setGoal(next);
    localStorage.setItem("peng:creator-goal", String(next));
  }

  async function copyInvite() {
    const invite = `${window.location.origin}/hub/user/${user?.username ?? "peng"}`;
    await navigator.clipboard?.writeText(invite).catch(() => undefined);
    setCopied("invite copied");
    window.setTimeout(() => setCopied(""), 1500);
  }

  const steps = [
    { id: "status", label: "set today's status", href: "/hub/settings" },
    { id: "spotlight", label: "polish spotlight", href: "/hub/space/edit" },
    { id: "post", label: "drop one post", href: "/hub/post/new" },
    { id: "live", label: "open studio check", href: "/hub/live/studio" },
  ];
  const progress = Math.round((done.length / steps.length) * 100);

  return (
    <section className="hit-upgrade-deck" data-testid="hit-upgrade-deck">
      <div className="hit-upgrade-head">
        <div>
          <span>creator launchpad</span>
          <h2>make the next click obvious</h2>
        </div>
        <div className="hit-upgrade-progress">
          <strong>{progress}%</strong>
          <small>ready</small>
        </div>
      </div>

      <div className="hit-upgrade-grid">
        <div className="hit-panel checklist-panel">
          <div className="hit-panel-title">
            <span>questline</span>
            <strong>first session setup</strong>
          </div>
          <div className="hit-checklist">
            {steps.map((step) => (
              <div key={step.id} className={done.includes(step.id) ? "is-done" : ""}>
                <button type="button" onClick={() => toggleStep(step.id)}>
                  <i>{done.includes(step.id) ? "OK" : "GO"}</i>
                  <span>{step.label}</span>
                </button>
                <Link href={step.href}>open</Link>
              </div>
            ))}
          </div>
        </div>

        <div className="hit-panel goal-panel">
          <div className="hit-panel-title">
            <span>goal</span>
            <strong>gem drive</strong>
          </div>
          <div className="goal-ring" style={{ "--goal": `${goal / 10}%` } as CSSProperties}>
            <strong>{goal}</strong>
            <small>/ 1,000 gems</small>
          </div>
          <div className="goal-actions">
            <button type="button" onClick={() => moveGoal(-50)}>-50</button>
            <button type="button" onClick={() => moveGoal(50)}>+50</button>
            <Link href="/hub/store">store bundles</Link>
          </div>
        </div>

        <div className="hit-panel raid-panel">
          <div className="hit-panel-title">
            <span>growth loop</span>
            <strong>raid + watch party</strong>
          </div>
          <p>Send people from a live room into a creator profile, clip, or board when the stream ends.</p>
          <div className="raid-actions">
            <Link href="/hub/live">find live rooms</Link>
            <button type="button" onClick={copyInvite}>{copied || "copy profile invite"}</button>
          </div>
        </div>

        <div className="hit-panel factory-panel">
          <div className="hit-panel-title">
            <span>clip factory</span>
            <strong>turn moments into posts</strong>
          </div>
          <div className="factory-lanes">
            <Link href="/hub/post/new?flair=CLIP&board=clips"><span>trim</span><small>post clip</small></Link>
            <Link href="/hub/discover"><span>boost</span><small>find viewers</small></Link>
            <Link href="/hub/owner"><span>mod</span><small>review room</small></Link>
          </div>
        </div>
      </div>

      <div className="hit-feature-rail">
        {[
          ["analytics", "visits, clicks, returning fans"],
          ["levels", "chat XP and cosmetic unlocks"],
          ["monetize", "store items, gems, bundles"],
          ["mobile", "future Peng Studio app path"],
        ].map(([title, copy]) => (
          <span key={title}><b>{title}</b>{copy}</span>
        ))}
      </div>
    </section>
  );
}

function CreatorLevelStrip() {
  const { user } = useAuth();
  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;
  const needed = Math.max(100, level * 100);
  const progress = Math.min(99, Math.round(((xp % needed) / needed) * 100));
  const title = levelTitle(level);
  const unlocks = [
    { label: "spotlight effects", href: "/hub/space/edit", ready: level >= 2 },
    { label: "store cosmetics", href: "/hub/store", ready: level >= 4 },
    { label: "live tools", href: "/hub/live/studio", ready: level >= 6 },
  ];

  return (
    <section className="creator-level-strip" data-testid="creator-level-strip">
      <div className="creator-level-main">
        <span>creator level</span>
        <strong>{user ? `level ${level} / ${title}` : "sign in to level up"}</strong>
      </div>
      <div className="creator-level-progress">
        <div><span style={{ width: `${progress}%` }} /></div>
        <small>{user ? `${xp} xp / next unlock ${progress}%` : "posts, chats, streams, and spotlight updates earn XP"}</small>
      </div>
      <div className="creator-level-unlocks">
        {unlocks.map((unlock) => (
          <Link key={unlock.label} href={unlock.href} className={unlock.ready ? "is-ready" : ""}>
            <i>{unlock.ready ? "on" : "soon"}</i>
            <span>{unlock.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function levelTitle(level: number) {
  if (level >= 25) return "site legend";
  if (level >= 18) return "headliner";
  if (level >= 12) return "signal pro";
  if (level >= 6) return "rising creator";
  return "new signal";
}

function CreatorPulse() {
  const [pulse, setPulse] = useState<Pulse | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPulse() {
      try {
        const res = await fetch("/api/pulse", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setPulse(data);
      } catch {
        if (!cancelled) setPulse(null);
      }
    }
    loadPulse();
    const id = window.setInterval(loadPulse, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (!pulse) {
    return (
      <div className="creator-pulse-card creator-pulse-loading" data-testid="creator-pulse">
          <span className="creator-pulse-kicker">activity</span>
          <strong>checking updates...</strong>
      </div>
    );
  }

  return (
    <section className="creator-pulse-card" data-testid="creator-pulse">
      <div className="creator-pulse-top">
        <div>
          <span className="creator-pulse-kicker">activity</span>
          <h2>{pulse.signal}</h2>
        </div>
        <div className="creator-pulse-meter">
          <span>{pulse.activeNow}</span>
          <small>around</small>
        </div>
      </div>

      <div className="creator-pulse-grid">
        <div className="creator-pulse-panel">
          <p>moving right now</p>
          <div className="creator-pulse-list">
            {pulse.recentPosts.slice(0, 3).map((post) => (
              <Link href={post.href} key={post.id} className="creator-pulse-post">
                <span>{post.flair ?? `b/${post.board.slug}`}</span>
                <strong>{post.title}</strong>
                <small>@{post.author.username} / {post.comments} replies</small>
              </Link>
            ))}
            {pulse.recentPosts.length === 0 && <small className="creator-pulse-empty">no posts yet. clean slate.</small>}
          </div>
        </div>

        <div className="creator-pulse-panel">
          <p>creators glowing</p>
          <div className="creator-pulse-creators">
            {pulse.creators.slice(0, 4).map((creator) => (
              <Link href={creator.href} key={creator.username} className={`creator-pulse-avatar ${creator.isLive ? "is-live" : ""}`} title={`@${creator.username}${creator.isLive ? " · LIVE" : ""}`}>
                {creator.image ? <img src={creator.image} alt="" /> : <span style={{ background: `${creator.accentColor}55` }}>{creator.username.slice(0, 1).toUpperCase()}</span>}
                {creator.isLive ? <small className="live-badge-sm">LIVE</small> : <small>lv {creator.level}</small>}
              </Link>
            ))}
          </div>
          <div className="creator-pulse-boards">
            {pulse.boards.slice(0, 2).map((board) => (
              <Link href={board.href} key={board.slug}>
                <span>{board.icon ?? "#"}</span>
                <strong>{board.name}</strong>
                <small>{board.postCount} posts</small>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function greetingFor() {
  if (typeof window === "undefined") return "Welcome";
  const h = new Date().getHours();
  if (h < 5)  return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Up late";
}

function PostCard({ post, viewerId, onChange }: { post: Post; viewerId?: string; onChange: () => void }) {
  const [score, setScore] = useState(post.voteScore);
  const [vote, setVote] = useState(0);
  const [saved, setSaved] = useState(false);
  const [reported, setReported] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    const savedIds = JSON.parse(localStorage.getItem("peng:saved-posts") || "[]") as string[];
    setSaved(savedIds.includes(post.id));
  }, [post.id]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }

  async function castVote(value: 1 | -1 | 0) {
    if (!viewerId) return;
    const newVal = vote === value ? 0 : value;
    const res = await fetch(`/api/posts/${post.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: newVal }),
    });
    const data = await res.json();
    if (res.ok) {
      setScore(data.voteScore);
      setVote(data.value);
    }
  }

  async function deletePost() {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) onChange();
  }

  function toggleSave() {
    const savedIds = JSON.parse(localStorage.getItem("peng:saved-posts") || "[]") as string[];
    const next = savedIds.includes(post.id) ? savedIds.filter((id) => id !== post.id) : [...savedIds, post.id];
    localStorage.setItem("peng:saved-posts", JSON.stringify(next));
    setSaved(next.includes(post.id));
    showToast(next.includes(post.id) ? "saved" : "unsaved");
  }

  async function sharePost() {
    const url = `${window.location.origin}/hub/post/${post.id}`;
    await navigator.clipboard?.writeText(url).catch(() => undefined);
    showToast("link copied");
  }

  function reportPost(reason: string) {
    setReported(true);
    setReportOpen(false);
    showToast(`reported: ${reason}`);
  }

  const canDelete = !!viewerId && post.authorId === viewerId;
  const isAuthor = !!viewerId;

  return (
    <article className="peng-card hub-post-card post-card-lift hover:border-[var(--accent)]/40" data-testid={`post-card-${post.id}`}>
      <div className="flex gap-3">
        <div className="post-vote-col">
          <button onClick={() => castVote(1)} className={`post-vote-btn ${vote === 1 ? "is-up" : ""}`} data-testid={`upvote-${post.id}`} aria-label="upvote">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </button>
          <span className="post-vote-score">{score}</span>
          <button onClick={() => castVote(-1)} className={`post-vote-btn ${vote === -1 ? "is-down" : ""}`} data-testid={`downvote-${post.id}`} aria-label="downvote">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 text-xs" style={{ fontFamily: "var(--font-mono)" }}>
            <Link href={`/hub/board/${post.board.slug}`} className="text-white/60 hover:text-white" data-testid={`post-board-${post.id}`}>
              b/{post.board.slug}
            </Link>
            <span className="text-white/20">|</span>
            <Link href={`/hub/user/${post.author.username}`} className="flex items-center gap-1.5 text-white/60 hover:text-white" data-testid={`post-author-${post.id}`}>
              <div className="flex h-4 w-4 items-center justify-center rounded-full text-[8px]" style={{ background: `${post.author.accentColor}55` }}>
                {post.author.image ? <img src={post.author.image} alt="" className="h-full w-full rounded-full object-cover" /> : "P"}
              </div>
              <span>@{post.author.username}</span>
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-white/40">{new Date(post.createdAt).toLocaleDateString()}</span>
            {post.flair && (
              <span className="ml-auto rounded border border-[var(--bg-border)] px-2 py-0.5 text-[10px] tracking-wider text-white/60" data-testid={`post-flair-${post.id}`}>
                {post.flair}
              </span>
            )}
          </div>

          <Link href={`/hub/post/${post.id}`} className="block hover:opacity-90" data-testid={`post-link-${post.id}`}>
            <h3 className="post-title" style={{ fontFamily: "var(--font-bricolage)" }}>
              {post.isPinned && <span className="mr-2 text-[var(--accent)]">PIN</span>}
              {post.title}
            </h3>
            <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-white/60">{post.body}</p>
          </Link>

          <div className="post-action-bar">
            <Link href={`/hub/post/${post.id}`} className="post-action-btn" data-testid={`post-comments-${post.id}`}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {post.commentCount}
            </Link>
            <button onClick={toggleSave} className={`post-action-btn ${saved ? "is-saved" : ""}`} data-testid={`post-save-${post.id}`}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              {saved ? "Saved" : "Save"}
            </button>
            <button onClick={sharePost} className="post-action-btn" data-testid={`post-share-${post.id}`}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Share
            </button>
            {canDelete && (
              <button onClick={deletePost} className="post-action-btn is-danger ml-auto" data-testid={`post-delete-${post.id}`}>
                Delete
              </button>
            )}
            {!canDelete && !reported && (
              <button onClick={() => setReportOpen(true)} className="post-action-btn ml-auto" data-testid={`post-report-${post.id}`}>
                Report
              </button>
            )}
            {reported && <span className="post-action-btn is-reported ml-auto">Reported</span>}
            {toast && <span className="post-toast">{toast}</span>}
          </div>

          {reportOpen && (
            <div className="mt-3 rounded-lg border border-white/10 bg-black/90 p-3" data-testid={`post-report-menu-${post.id}`}>
              <p className="mb-2 text-[10px] uppercase tracking-widest text-white/40" style={{ fontFamily: "var(--font-mono)" }}>what happened?</p>
              <div className="flex flex-wrap gap-2">
                {["spammy", "weird energy", "stolen clip", "other"].map((reason) => (
                  <button key={reason} onClick={() => reportPost(reason)} className="peng-btn peng-btn-ghost text-[10px]">
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function LivePulse() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/presence", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setCount(data.activeNow ?? null);
      } catch {
        if (!cancelled) setCount(null);
      }
    }
    load();
    const id = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="live-pulse" data-testid="live-pulse" title="active right now">
      <span className="live-pulse-dot" />
      <span className="live-pulse-num">{count ?? "--"}</span>
      <span className="live-pulse-label">online</span>
    </div>
  );
}

const TICKER_LINES = [
  "Live rooms update automatically when creators go on air.",
  "Post clips in b/clips so people can find them later.",
  "Daily streaks reset at midnight UTC.",
  "Profiles look better when the first link has a clear purpose.",
  "Short posts usually get faster replies.",
  "Shards come from check-ins. Gems unlock profile upgrades.",
];

function AmbientTicker() {
  const [i, setI] = useState(0);
  const line = useMemo(() => TICKER_LINES[i], [i]);

  useEffect(() => {
    const id = setInterval(() => setI((value) => (value + 1) % TICKER_LINES.length), 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="ambient-ticker" data-testid="ambient-ticker">
      <span className="ambient-ticker-marker" />
      <span key={i} className="ambient-ticker-line">{line}</span>
    </div>
  );
}
