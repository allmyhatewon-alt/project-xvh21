"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Result = {
  type: "creator" | "board" | "post";
  href: string;
  title: string;
  subtitle: string;
  meta: string;
  image?: string | null;
  accentColor?: string;
  icon?: string;
  badge?: string | null;
  flair?: string | null;
  body?: string;
};

type SearchResults = { users: Result[]; boards: Result[]; posts: Result[] };

export function SearchBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Cmd/Ctrl+K to open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 30);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        setResults(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  function handleInput(val: string) {
    setQuery(val);
    setCursor(-1);
    clearTimeout(timerRef.current);
    if (val.trim().length < 2) { setResults(null); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val.trim())}`);
        const data = await res.json();
        setResults(data);
      } catch {}
      setLoading(false);
    }, 220);
  }

  const flat: Result[] = results
    ? [...(results.users ?? []), ...(results.boards ?? []), ...(results.posts ?? [])]
    : [];

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, flat.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor((c) => Math.max(c - 1, -1)); }
    if (e.key === "Enter" && cursor >= 0 && flat[cursor]) navigate(flat[cursor].href);
    if (e.key === "Enter" && cursor === -1 && query.trim().length >= 2) {
      navigate(`/hub/discover?q=${encodeURIComponent(query.trim())}`);
    }
  }

  const typeLabel: Record<string, string> = { creator: "creator", board: "board", post: "post" };
  const typeIcon:  Record<string, string> = { creator: "person", board: "hash", post: "file" };

  return (
    <>
      {/* Trigger bar */}
      <button
        type="button"
        className="search-trigger"
        onClick={() => { setOpen(true); }}
        data-testid="search-trigger"
        aria-label="Search"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <span>Search</span>
        <kbd>⌘K</kbd>
      </button>

      {/* Overlay */}
      {open && (
        <div className="search-overlay" data-testid="search-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); setQuery(""); setResults(null); } }}>
          <div className="search-panel" role="dialog" aria-label="Search">
            <div className="search-input-row">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => handleInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search creators, boards, posts..."
                className="search-input"
                data-testid="search-input"
                autoComplete="off"
                spellCheck={false}
              />
              {loading && <span className="search-loading" aria-label="Loading" />}
              <button type="button" className="search-esc" onClick={() => { setOpen(false); setQuery(""); setResults(null); }}>ESC</button>
            </div>

            <div className="search-results" data-testid="search-results">
              {!results && !loading && query.length < 2 && (
                <div className="search-hint">
                  <p>Type at least 2 characters to search</p>
                  <div className="search-hint-shortcuts">
                    <span><kbd>↑↓</kbd> navigate</span>
                    <span><kbd>↵</kbd> open</span>
                    <span><kbd>ESC</kbd> close</span>
                  </div>
                </div>
              )}

              {results && flat.length === 0 && (
                <div className="search-empty">No results for &ldquo;{query}&rdquo;</div>
              )}

              {results && (
                <>
                  {results.users.length > 0 && (
                    <div className="search-section">
                      <p className="search-section-label">Creators</p>
                      {results.users.map((r, i) => (
                        <SearchRow key={r.href} result={r} active={flat.indexOf(r) === cursor} onClick={() => navigate(r.href)} />
                      ))}
                    </div>
                  )}
                  {results.boards.length > 0 && (
                    <div className="search-section">
                      <p className="search-section-label">Boards</p>
                      {results.boards.map((r) => (
                        <SearchRow key={r.href} result={r} active={flat.indexOf(r) === cursor} onClick={() => navigate(r.href)} />
                      ))}
                    </div>
                  )}
                  {results.posts.length > 0 && (
                    <div className="search-section">
                      <p className="search-section-label">Posts</p>
                      {results.posts.map((r) => (
                        <SearchRow key={r.href} result={r} active={flat.indexOf(r) === cursor} onClick={() => navigate(r.href)} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SearchRow({ result, active, onClick }: { result: Result; active: boolean; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <button
      ref={ref}
      type="button"
      className={`search-row ${active ? "is-active" : ""}`}
      onClick={onClick}
      data-testid={`search-result-${result.href}`}
    >
      <div className="search-row-icon">
        {result.type === "creator" ? (
          result.image
            ? <img src={result.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            : <span style={{ background: `${result.accentColor ?? "#8b5cf6"}44`, color: result.accentColor ?? "#8b5cf6", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontSize: "0.7rem", fontWeight: 700 }}>{result.title.slice(0, 1).toUpperCase()}</span>
        ) : result.type === "board" ? (
          <span className="search-row-board-icon">{result.icon ?? "#"}</span>
        ) : (
          <span className="search-row-post-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </span>
        )}
      </div>
      <div className="search-row-body">
        <p className="search-row-title">{result.title}</p>
        <p className="search-row-sub">{result.subtitle}</p>
      </div>
      <div className="search-row-meta">
        {result.badge && <span className="search-row-badge">{result.badge}</span>}
        <span>{result.meta}</span>
      </div>
    </button>
  );
}
