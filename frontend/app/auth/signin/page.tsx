"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SigninForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/hub";
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(typeof d.error === "string" ? d.error : "Invalid email or password");
        return;
      }
      window.location.href = callbackUrl;
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-xs opacity-40 mb-8 hover:opacity-80" data-testid="back-to-landing-link" style={{ fontFamily: "var(--font-mono)" }}>
          ← back to landing
        </Link>
        <h1 className="text-2xl font-black text-white mb-1 text-center" style={{ fontFamily: "var(--font-syne)" }}>
          sign in
        </h1>
        <p className="text-xs text-center opacity-40 mb-8" style={{ fontFamily: "var(--font-mono)" }}>
          welcome back
        </p>

        <form onSubmit={submit} className="flex flex-col gap-4" data-testid="signin-form">
          <div>
            <label className="block text-xs opacity-50 mb-1" style={{ fontFamily: "var(--font-mono)" }}>email</label>
            <input
              data-testid="signin-email-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              className="w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-[var(--radius)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs opacity-50 mb-1" style={{ fontFamily: "var(--font-mono)" }}>password</label>
            <input
              data-testid="signin-password-input"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              className="w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-[var(--radius)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400" data-testid="signin-error" style={{ fontFamily: "var(--font-mono)" }}>{error}</p>
          )}

          <button
            data-testid="signin-submit-button"
            type="submit"
            disabled={loading}
            className="peng-btn peng-btn-primary w-full py-3 mt-2 disabled:opacity-40"
          >
            {loading ? "signing in…" : "Sign In"}
          </button>

          <p className="text-center text-xs opacity-40" style={{ fontFamily: "var(--font-mono)" }}>
            no account?{" "}
            <Link href="/auth/signup" className="underline hover:opacity-80" data-testid="goto-signup-link">create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function SigninPage() {
  return <Suspense><SigninForm /></Suspense>;
}
