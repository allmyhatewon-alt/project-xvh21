"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";

const FLAIRS = ["", "CLIP", "ART", "DISCUSSION", "LORE", "MUSIC", "DEV", "QUESTION", "ANNOUNCEMENT"];

function simpleMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/\n/g, "<br/>");
}

function PostNew() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialBoard = sp.get("board") ?? "general";
  const initialFlair = sp.get("flair") ?? "";

  const [boards, setBoards] = useState<{ slug: string; name: string }[]>([]);
  const [boardSlug, setBoardSlug] = useState(initialBoard);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [flair, setFlair] = useState(initialFlair);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/boards")
      .then((r) => r.json())
      .then((d) => setBoards(d.boards || []))
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Title is required"); return; }
    if (!body.trim()) { setError("Body is required"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardSlug, title: title.trim(), body: body.trim(), flair: flair || undefined }),
      });
      const d = await r.json();
      if (!r.ok) { setError(typeof d.error === "string" ? d.error : "Something went wrong"); return; }
      router.push(`/hub/post/${d.post.id}`);
    } finally {
      setLoading(false);
    }
  }

  function insertFormat(open: string, close: string) {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.slice(start, end);
    const next = body.slice(0, start) + open + (selected || "text") + close + body.slice(end);
    setBody(next);
    setTimeout(() => {
      el.focus();
      const cursor = start + open.length + (selected || "text").length + close.length;
      el.setSelectionRange(cursor, cursor);
    }, 0);
  }

  const titleOver = title.length > 180;
  const bodyOver  = body.length > 9500;

  return (
    <HubShell rightRail={<RightRail />}>
      <div className="hub-page-wrap new-post-page">
        <section className="hub-page-hero">
          <div>
            <p className="hub-page-kicker">new post</p>
            <h1 className="hub-page-title mb-1">Drop something</h1>
            <p className="hub-page-sub">Share clips, thoughts, art, or whatever belongs in the room</p>
          </div>
        </section>

        <div className="new-post-layout">
          <form onSubmit={submit} className="new-post-form" data-testid="create-post-form">

            {/* Board + Flair row */}
            <div className="new-post-row-2">
              <div className="new-post-field">
                <label className="new-post-label">Board</label>
                <select
                  data-testid="post-board-select"
                  value={boardSlug}
                  onChange={(e) => setBoardSlug(e.target.value)}
                  className="new-post-select"
                >
                  {boards.map((b) => (
                    <option key={b.slug} value={b.slug}>b/{b.slug}</option>
                  ))}
                </select>
              </div>
              <div className="new-post-field">
                <label className="new-post-label">Flair</label>
                <select
                  data-testid="post-flair-input"
                  value={flair}
                  onChange={(e) => setFlair(e.target.value)}
                  className="new-post-select"
                >
                  {FLAIRS.map((f) => (
                    <option key={f} value={f}>{f || "No flair"}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div className="new-post-field">
              <div className="new-post-label-row">
                <label className="new-post-label">Title</label>
                <span className={`new-post-counter ${titleOver ? "is-over" : ""}`}>{title.length}/200</span>
              </div>
              <input
                data-testid="post-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's this about?"
                required
                maxLength={200}
                className="new-post-input"
                autoFocus
              />
            </div>

            {/* Body with toolbar */}
            <div className="new-post-field">
              <div className="new-post-label-row">
                <label className="new-post-label">Body</label>
                <div className="new-post-toolbar" aria-label="formatting tools">
                  <button type="button" onClick={() => insertFormat("**", "**")} title="Bold" className="new-post-fmt-btn"><strong>B</strong></button>
                  <button type="button" onClick={() => insertFormat("*", "*")} title="Italic" className="new-post-fmt-btn"><em>I</em></button>
                  <button type="button" onClick={() => insertFormat("`", "`")} title="Code" className="new-post-fmt-btn"><span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{ "`" }</span></button>
                  <button type="button" onClick={() => insertFormat("> ", "")} title="Quote" className="new-post-fmt-btn">❝</button>
                  <div className="new-post-toolbar-divider" />
                  <button
                    type="button"
                    onClick={() => setPreview((p) => !p)}
                    className={`new-post-fmt-btn new-post-preview-toggle ${preview ? "is-on" : ""}`}
                    title="Toggle preview"
                  >
                    {preview ? "Edit" : "Preview"}
                  </button>
                  <span className={`new-post-counter ${bodyOver ? "is-over" : ""}`}>{body.length}/10k</span>
                </div>
              </div>

              {preview ? (
                <div
                  className="new-post-preview"
                  dangerouslySetInnerHTML={{ __html: body ? simpleMarkdown(body) : "<span style='opacity:0.3;font-style:italic'>Nothing to preview yet...</span>" }}
                />
              ) : (
                <textarea
                  ref={bodyRef}
                  data-testid="post-body-input"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  maxLength={10000}
                  rows={10}
                  placeholder={"What do you want to say?\n\nTips: **bold**, *italic*, `code`, > quote"}
                  className="new-post-textarea"
                />
              )}
            </div>

            {error && (
              <p className="new-post-error" data-testid="create-post-error">{error}</p>
            )}

            <div className="new-post-actions">
              <button
                data-testid="create-post-submit"
                type="submit"
                disabled={loading || !title.trim() || !body.trim()}
                className="peng-btn peng-btn-primary disabled:opacity-40"
              >
                {loading ? "Posting…" : "Post"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="peng-btn peng-btn-ghost"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Tips sidebar */}
          <aside className="new-post-tips">
            <h3 className="new-post-tips-title">Posting tips</h3>
            <ul className="new-post-tips-list">
              <li><strong>Short title, clear hook</strong> — people scan titles first</li>
              <li><strong>Pick the right board</strong> — posts do better in matching rooms</li>
              <li><strong>Use flair</strong> — CLIP, ART, DISCUSSION get sorted automatically</li>
              <li><strong>First line matters most</strong> — front-load the interesting part</li>
            </ul>
            <div className="new-post-fmt-guide">
              <p>Formatting</p>
              <code>**bold**</code>
              <code>*italic*</code>
              <code>`code`</code>
              <code>&gt; quote</code>
            </div>
          </aside>
        </div>
      </div>
    </HubShell>
  );
}

export default function Page() {
  return <Suspense><PostNew /></Suspense>;
}
