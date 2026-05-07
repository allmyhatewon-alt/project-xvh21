"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";
import { useAuth } from "@/app/providers";

type Post = {
  id: string;
  title: string;
  body: string;
  flair: string | null;
  voteScore: number;
  commentCount: number;
  createdAt: string;
  board: { slug: string; name: string };
  author: { username: string; displayName: string; image: string | null; accentColor: string; level?: number };
  comments: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: { username: string; displayName: string; image: string | null; accentColor: string };
  }>;
};

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const r = await fetch(`/api/posts/${params.id}`);
    if (!r.ok) { setPost(null); return; }
    const d = await r.json();
    setPost(d.post);
  }
  useEffect(() => { load(); }, [params.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading(true);
    const r = await fetch(`/api/posts/${params.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: comment }),
    });
    if (r.ok) { setComment(""); await load(); }
    setLoading(false);
  }

  async function deletePost() {
    if (!confirm("Delete this post?")) return;
    const r = await fetch(`/api/posts/${params.id}`, { method: "DELETE" });
    if (r.ok) router.push("/hub");
  }

  return (
    <HubShell rightRail={<RightRail />}>
      <div className="max-w-2xl">
        {!post ? (
          <p className="text-xs text-white/40" style={{ fontFamily: "var(--font-mono)" }}>loading…</p>
        ) : (
          <>
            <div className="post-detail-breadcrumb">
              <Link href={`/hub/board/${post.board.slug}`} className="post-detail-bc-link" data-testid="post-detail-board-link">b/{post.board.slug}</Link>
              <span className="post-detail-bc-sep">/</span>
              <Link href={`/hub/user/${post.author.username}`} className="post-detail-bc-link" data-testid="post-detail-author-link">@{post.author.username}</Link>
              <span className="post-detail-bc-sep">·</span>
              <span className="post-detail-bc-date">{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              {post.flair && <span className="post-detail-flair">{post.flair}</span>}
            </div>
            <h1 className="post-detail-title" data-testid="post-detail-title">{post.title}</h1>
            <p className="post-detail-body" data-testid="post-detail-body">{post.body}</p>

            <div className="post-detail-meta-bar">
              <span className="post-detail-meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                {post.voteScore}
              </span>
              <span className="post-detail-meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {post.commentCount}
              </span>
              {user?.username === post.author.username && (
                <button onClick={deletePost} className="post-detail-meta-item is-danger ml-auto" data-testid="post-detail-delete">Delete post</button>
              )}
            </div>

            <div className="post-detail-comments-section">
              <h2 className="post-comments-heading">
                {post.comments.length > 0 ? `${post.comments.length} comment${post.comments.length !== 1 ? "s" : ""}` : "Comments"}
              </h2>

              {user && (
                <form onSubmit={submit} className="post-comment-form" data-testid="comment-form">
                  <div className="post-comment-avatar">
                    <div className="w-full h-full rounded-full flex items-center justify-center text-[10px]" style={{ background: `${user.accentColor}44` }}>
                      {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover rounded-full" /> : user.username.slice(0, 1).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <textarea
                      data-testid="comment-input"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment…"
                      className="post-comment-input"
                      rows={3}
                    />
                    <button data-testid="comment-submit" disabled={loading || !comment.trim()} className="peng-btn peng-btn-primary text-xs mt-2 disabled:opacity-40">
                      {loading ? "Posting…" : "Post"}
                    </button>
                  </div>
                </form>
              )}

              <div className="post-comments-list" data-testid="comments-list">
                {post.comments.length === 0 && (
                  <p className="post-comments-empty">No comments yet — be the first to reply.</p>
                )}
                {post.comments.map((c) => (
                  <div key={c.id} className="post-comment-item" data-testid={`comment-${c.id}`}>
                    <div className="post-comment-avatar-sm" style={{ background: `${c.author.accentColor}44` }}>
                      {c.author.image
                        ? <img src={c.author.image} alt="" className="w-full h-full object-cover rounded-full" />
                        : <span className="text-[10px] text-white/70">{c.author.username.slice(0, 1).toUpperCase()}</span>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <Link href={`/hub/user/${c.author.username}`} className="text-xs font-semibold text-white/80 hover:text-white" data-testid={`comment-author-${c.id}`}>
                          @{c.author.username}
                        </Link>
                        <span className="text-[10px] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </HubShell>
  );
}
