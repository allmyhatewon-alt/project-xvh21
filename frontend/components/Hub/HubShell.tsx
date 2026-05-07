"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers";
import { usePathname, useRouter } from "next/navigation";
import { FloatingStat } from "@/components/Effects/FloatingStats";

// Minimal stroke icons for the hub shell.
function Icon({ name, className = "w-3.5 h-3.5" }: { name: string; className?: string }) {
  const paths: Record<string, JSX.Element> = {
    home: <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z" />,
    flame: <path d="M12 2s4 4 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 1-3 5a6 6 0 0 0 12 0c0-7-6-11-6-11z" />,
    trending: <path d="M3 17l6-6 4 4 8-8M14 7h7v7" />,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m9 9 7-2-2 7-7 2z" /></>,
    bars: <path d="M3 21V8M9 21V3M15 21v-9M21 21v-5" />,
    play: <path d="M8 5v14l11-7z" />,
    users: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M2 20c0-3 4-5 7-5s7 2 7 5M14 20c0-2 3-3 5-3s4 1 4 3" /></>,
    bookmark: <path d="M5 3h14v18l-7-5-7 5z" />,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    crown: <path d="M3 7l4 6 5-9 5 9 4-6v12H3z" />,
    palette: <path d="M12 2a10 10 0 0 0 0 20c2 0 2-2 2-3s2-2 4-2 4-2 4-5a10 10 0 0 0-10-10z" />,
    bolt: <path d="M13 2 4 14h7v8l9-12h-7z" />,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9z" /><path d="M9 21a3 3 0 0 0 6 0" /></>,
    moon: <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3a7 7 0 1 0 11.5 11.5z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
    shield: <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    inbox: <path d="M3 13h5l2 3h4l2-3h5M5 5h14v16H5z" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    store: <><path d="M4 10h16l-1 11H5z" /><path d="M7 10a5 5 0 0 1 10 0" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths[name] ?? null}
    </svg>
  );
}

const SIDEBAR_FEED = [
  { href: "/hub", label: "Home", icon: "home" },
  { href: "/hub?sort=hot", label: "Hot", icon: "flame" },
  { href: "/hub?sort=new", label: "New", icon: "trending" },
  { href: "/hub/discover", label: "Discover", icon: "compass" },
  { href: "/hub/live", label: "Live Now", icon: "bars" },
  { href: "/hub/clips", label: "Clips", icon: "play" },
  { href: "/hub/following", label: "Following", icon: "users" },
  { href: "/hub/saved", label: "Saved", icon: "bookmark" },
];

const SIDEBAR_COMMUNITY = [
  { href: "/hub/all-boards", label: "All boards", icon: "grid" },
  { href: "/hub/leaderboard", label: "Leaderboard", icon: "crown" },
  { href: "/hub/board/fanart", label: "Fan Art", icon: "palette" },
  { href: "/hub/quests", label: "Daily quests", icon: "bolt" },
  { href: "/hub/store", label: "Store", icon: "store" },
  { href: "/hub/inbox", label: "Inbox", icon: "inbox" },
];

const SIDEBAR_OWNER = [
  { href: "/hub/admin", label: "Admin console", icon: "shield" },
  { href: "/hub/owner", label: "Owner Center", icon: "bolt" },
  { href: "/hub/settings", label: "Settings", icon: "settings" },
];

const QUICK_COMMANDS = [
  { label: "Home", hint: "main feed", href: "/hub", icon: "home", keys: "feed posts home" },
  { label: "Discover", hint: "find boards and creators", href: "/hub/discover", icon: "compass", keys: "explore boards creators" },
  { label: "Create Post", hint: "start a discussion", href: "/hub/post/new", icon: "plus", keys: "new post create" },
  { label: "Daily Quests", hint: "xp and streaks", href: "/hub/quests", icon: "bolt", keys: "daily streak xp" },
  { label: "Store", hint: "upgrades and cosmetics", href: "/hub/store", icon: "store", keys: "shop marketplace gems shards cosmetics" },
  { label: "Clips", hint: "short posts", href: "/hub/clips", icon: "play", keys: "clips videos" },
  { label: "Go Live", hint: "broadcast studio", href: "/hub/live/studio", icon: "play", keys: "stream live twitch kick studio broadcast" },
  { label: "Edit Spotlight", hint: "profile builder", href: "/hub/space/edit", icon: "palette", keys: "spotlight profile editor template" },
  { label: "Settings", hint: "account controls", href: "/hub/settings", icon: "settings", keys: "settings account" },
];

type SearchResult = {
  type: string;
  href: string;
  title: string;
  subtitle: string;
  meta?: string;
  image?: string | null;
  accentColor?: string;
  badge?: string | null;
  icon?: string;
};

export function HubShell({ children, rightRail }: { children: React.ReactNode; rightRail?: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [boards, setBoards] = useState<{ slug: string; name: string }[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ users: SearchResult[]; boards: SearchResult[]; posts: SearchResult[] }>({ users: [], boards: [], posts: [] });
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetch("/api/boards").then((r) => r.json()).then((d) => setBoards(d.boards || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!menuOpen || !user) return;
    fetch("/api/marketplace/inventory", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : { items: [] })
      .then((data) => setInventory(data.items ?? []))
      .catch(() => setInventory([]));
  }, [menuOpen, user]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("peng:hub-theme");
    if (savedTheme === "light") {
      setTheme("light");
      return;
    }
    if (savedTheme === "night" || savedTheme === "lounge" || savedTheme === "dark") {
      setTheme("dark");
      localStorage.setItem("peng:hub-theme", "dark");
    }
  }, []);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setSearchResults({ users: [], boards: [], posts: [] });
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { cache: "no-store" })
        .then((r) => r.ok ? r.json() : { users: [], boards: [], posts: [] })
        .then((data) => {
          if (!cancelled) setSearchResults({ users: data.users ?? [], boards: data.boards ?? [], posts: data.posts ?? [] });
        })
        .catch(() => {
          if (!cancelled) setSearchResults({ users: [], boards: [], posts: [] });
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search]);

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      localStorage.setItem("peng:hub-theme", next);
      return next;
    });
  }

  const commandResults = QUICK_COMMANDS.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${item.label} ${item.hint} ${item.keys}`.toLowerCase().includes(q);
  }).slice(0, 6);
  const hasSearchResults = search.trim().length >= 2 && (searchResults.users.length > 0 || searchResults.boards.length > 0 || searchResults.posts.length > 0);

  function runSearch() {
    const q = search.trim();
    if (!q && commandResults[0]) {
      router.push(commandResults[0].href);
      setSearchOpen(false);
      return;
    }
    const exact = commandResults[0];
    if (exact && `${exact.label} ${exact.keys}`.toLowerCase().includes(q.toLowerCase())) {
      router.push(exact.href);
    } else {
      router.push(`/hub/discover?q=${encodeURIComponent(q)}`);
    }
    setSearchOpen(false);
  }

  return (
    <div className="hub-shell-frame min-h-screen pb-20" data-hub-theme={theme} data-testid="hub-shell">
      {/* Top bar */}
      <header className="hub-topbar sticky top-0 z-40 border-b border-[var(--bg-border)] backdrop-blur">
        <div className="grid h-14 grid-cols-[minmax(0,1fr)_minmax(180px,520px)_minmax(0,1fr)] items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/"
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[var(--bg-border)] bg-white/[0.02] px-2.5 text-[10px] uppercase tracking-wider text-white/60 transition-colors hover:border-[var(--accent)] hover:text-white"
              data-testid="goto-landing-link"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: 0 }}
              title="back to landing"
            >
              <Icon name="home" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">landing</span>
            </Link>

            <Link href="/hub" className="flex min-w-0 items-baseline gap-2" data-testid="hub-logo-link">
              <span className="truncate font-black text-white" style={{ fontFamily: "var(--font-bricolage)", fontSize: "1.08rem", letterSpacing: 0 }}>pengelus</span>
              <span className="hidden text-[10px] text-[var(--accent)]/80 sm:inline" style={{ fontFamily: "var(--font-mono)", letterSpacing: 0 }}>creator hub</span>
            </Link>
          </div>

          <div className="relative min-w-0 w-full max-w-xl justify-self-center">
            <Icon name="search" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              data-testid="hub-search-input"
              type="text"
              placeholder="search creators, posts, boards..."
              value={search}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSearch();
                if (e.key === "Escape") setSearchOpen(false);
              }}
              className="w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-full pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-[var(--accent)] transition-colors"
              style={{ fontFamily: "var(--font-mono)" }}
            />
            {searchOpen && (
              <div className="hub-command-palette" data-testid="hub-command-palette">
                <div className="hub-command-head">
                  <span>quick jump</span>
                  <button type="button" onClick={() => setSearchOpen(false)}>esc</button>
                </div>
                <div className="hub-command-list">
                  {hasSearchResults ? (
                    <>
                      <SearchSection label="creators" items={searchResults.users} router={router} close={() => setSearchOpen(false)} />
                      <SearchSection label="boards" items={searchResults.boards} router={router} close={() => setSearchOpen(false)} />
                      <SearchSection label="posts" items={searchResults.posts} router={router} close={() => setSearchOpen(false)} />
                    </>
                  ) : commandResults.length > 0 ? (
                    commandResults.map((item) => (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => {
                          router.push(item.href);
                          setSearchOpen(false);
                        }}
                        className="hub-command-item"
                      >
                        <Icon name={item.icon} className="w-4 h-4" />
                        <span>
                          <strong>{item.label}</strong>
                          <small>{item.hint}</small>
                        </span>
                      </button>
                    ))
                  ) : (
                    <button type="button" onClick={runSearch} className="hub-command-item">
                      <Icon name="search" className="w-4 h-4" />
                      <span>
                        <strong>{searching ? "Searching..." : `Search "${search}"`}</strong>
                        <small>{searching ? "checking the hub" : "open discover results"}</small>
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex min-w-0 items-center justify-end gap-2">
            <div className="hidden items-center gap-1 rounded-full border border-[var(--bg-border)] bg-white/[0.02] px-1.5 py-1 sm:flex">
              <button
                onClick={toggleTheme}
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/5 hover:text-white"
                data-testid="hub-theme-toggle"
                title={theme === "light" ? "switch to dark mode" : "switch to light mode"}
              >
                <Icon name={theme === "light" ? "moon" : "sun"} className="w-4 h-4" />
              </button>
              <Link href="/hub/quests" className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/5 hover:text-white" data-testid="goto-notifications-link" title="notifications"><Icon name="bell" className="w-4 h-4" /></Link>
              <Link href="/hub/post/new" className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/5 hover:text-white" data-testid="create-post-link" title="create post"><Icon name="plus" className="w-4 h-4" /></Link>
            </div>

            {/* Floating currency stats  clickable, opens animated panel */}
            {user && (
              <div className="hidden items-center gap-2 md:flex" data-testid="topbar-stats">
                <FloatingStat kind="shards" />
                <FloatingStat kind="gems" />
                <FloatingStat kind="xp" />
              </div>
            )}

            {user ? (
              <div className="relative shrink-0">
                <button onClick={() => setMenuOpen((m) => !m)} className="flex items-center gap-2 rounded-full border border-transparent py-0.5 pl-0.5 pr-2 transition-colors hover:border-[var(--bg-border)] hover:bg-white/[0.03]" data-testid="user-menu-button">
                  <div
                    className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs"
                    style={{ background: `linear-gradient(135deg, ${user.accentColor}, ${user.accentColor}88)` }}
                  >
                    {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : "P"}
                  </div>
                  <span className="hidden text-xs text-white sm:inline" style={{ fontFamily: "var(--font-mono)", letterSpacing: 0 }}>{user.username}</span>
                </button>
                {menuOpen && (
                  <div className="user-dropdown-panel absolute right-0 top-10 w-72 bg-[var(--bg-elevated)] border border-[rgba(96,150,220,0.1)] rounded-2xl shadow-2xl py-1 z-50 backdrop-blur-xl" data-testid="user-dropdown-menu" style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.36), 0 0 0 1px rgba(255,255,255,0.04)" }}>
                    <Link href={`/hub/user/${user.username}`} className="block px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white">view profile</Link>
                    <Link href={`/@${user.username}`} className="block px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white">spotlight</Link>
                    <Link href="/hub/showcase" className="block px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white">edit profile</Link>
                    <button onClick={() => setInventoryOpen((open) => !open)} className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white" data-testid="inventory-toggle">
                      inventory {inventory.length ? `(${inventory.length})` : ""}
                    </button>
                    {inventoryOpen && (
                      <div className="mx-2 my-1 rounded-lg border border-white/10 bg-black/20 p-2" data-testid="topbar-inventory-panel">
                        {inventory.length === 0 ? (
                          <p className="px-1 py-2 text-[11px] text-white/35">nothing owned yet. tap gems to shop.</p>
                        ) : (
                          <div className="max-h-52 space-y-1 overflow-auto pr-1">
                            {inventory.map((item) => (
                              <div key={item.id} className="inventory-menu-item">
                                <span>{item.equippedAt ? "ON" : item.type}</span>
                                <div>
                                  <strong>{item.name}</strong>
                                  <small>{item.description ?? item.slug}</small>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <Link href="/hub/settings" className="block px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white">settings</Link>
                    <button onClick={signOut} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-white/5" data-testid="sign-out-button">sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/signin" className="shrink-0 rounded-full border border-[var(--bg-border)] px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-[var(--accent)] hover:text-white" data-testid="signin-link" style={{ fontFamily: "var(--font-mono)", letterSpacing: 0 }}>sign in</Link>
            )}
          </div>
        </div>
      </header>

      <div className="hub-grid">
        {/* LEFT SIDEBAR */}
        <aside className="hub-sidebar-console hidden lg:block sticky top-[76px] self-start" data-testid="hub-sidebar">
          <SidebarSection label="FEED" items={SIDEBAR_FEED} pathname={pathname} />
          <div className="hub-nav-divider mt-4 mb-2" />
          <SidebarSection label="COMMUNITY" items={SIDEBAR_COMMUNITY} pathname={pathname} />
          {user?.role === "ADMIN" && <><div className="hub-nav-divider mt-4 mb-2" /><SidebarSection label="OWNER" items={SIDEBAR_OWNER} pathname={pathname} /></>}
          <div className="hub-nav-divider mt-4 mb-2" />
          <div className="hub-sidebar-signal">
            <span>status</span>
            <strong>{user ? "ready" : "guest"}</strong>
            <small>{theme === "light" ? "light mode" : "dark mode"}</small>
          </div>
          <div className="mt-6" />
          <p className="hub-nav-section-label">POPULAR BOARDS</p>
          <ul className="space-y-1">
            {boards.slice(0, 6).map((b) => (
              <li key={b.slug}>
                <Link href={`/hub/board/${b.slug}`} className="block px-3 py-1 text-xs text-white/50 hover:text-white transition-colors" data-testid={`board-link-${b.slug}`} style={{ fontFamily: "var(--font-mono)" }}>
                  {b.name}
                </Link>
              </li>
            ))}
            <li><Link href="/hub/all-boards" className="block px-3 py-1 text-xs text-white/30 hover:text-white" data-testid="see-all-boards-link" style={{ fontFamily: "var(--font-mono)" }}>see all {"->"}</Link></li>
          </ul>
        </aside>

        {/* MAIN  balanced center column */}
        <main className="hub-main-stage min-w-0">{children}</main>

        {/* RIGHT RAIL */}
        <aside className="hidden lg:block sticky top-[76px] self-start">
          {rightRail}
        </aside>
      </div>
    </div>
  );
}

function SidebarSection({ label, items, pathname }: { label: string; items: typeof SIDEBAR_FEED; pathname: string | null }) {
  return (
    <>
      <p className="hub-nav-section-label">{label}</p>
      <ul className="space-y-0.5">
        {items.map((it) => {
          const active = pathname === it.href.split("?")[0];
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-200 ${
                  active
                    ? "bg-[rgba(45,212,191,0.09)] text-white border-l-2 border-[var(--accent)] shadow-[0_0_16px_rgba(45,212,191,0.08)]"
                    : "text-white/48 hover:text-white/85 hover:bg-white/[0.04] hover:shadow-none"
                }`}
                data-testid={`sidebar-${it.label.toLowerCase().replace(/\s+/g, "-")}-link`}
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}
              >
                <Icon name={it.icon} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function SearchSection({ label, items, router, close }: { label: string; items: SearchResult[]; router: ReturnType<typeof useRouter>; close: () => void }) {
  if (!items.length) return null;
  return (
    <div className="hub-search-section">
      <p>{label}</p>
      {items.map((item) => (
        <button
          key={`${item.type}-${item.href}`}
          type="button"
          className="hub-command-item hub-search-result-item"
          onClick={() => {
            router.push(item.href);
            close();
          }}
        >
          {item.image ? (
            <img src={item.image} alt="" />
          ) : (
            <span className="hub-search-result-icon" style={{ background: item.accentColor ? `${item.accentColor}33` : undefined }}>{item.icon ?? item.type.slice(0, 1).toUpperCase()}</span>
          )}
          <span>
            <strong>{item.title}{item.badge ? <em>{item.badge}</em> : null}</strong>
            <small>{item.subtitle}{item.meta ? ` / ${item.meta}` : ""}</small>
          </span>
        </button>
      ))}
    </div>
  );
}
