"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function VerifyEmailView() {
  const searchParams = useSearchParams();
  const sent = searchParams.get("sent") === "1";
  const status = searchParams.get("status");
  const email = searchParams.get("email") ?? "";
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function resend() {
    if (!email) return;
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (!r.ok) {
        setMessage(typeof d.error === "string" ? d.error : "Could not resend right now.");
        return;
      }
      setMessage(d.alreadyVerified ? "That email is already verified." : "Fresh verification link sent.");
    } catch {
      setMessage("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const headline =
    status === "invalid" ? "that link is not valid" :
    status === "expired" ? "that link expired" :
    status === "missing" ? "missing verification link" :
    sent ? "check your email" :
    "verify your email";

  const copy =
    status === "invalid" ? "The link looks broken or already got cleared out. Ask for a fresh one and try again." :
    status === "expired" ? "Verification links only live for a little while. Send yourself a fresh one below." :
    status === "missing" ? "Open the full email link, or resend a new verification email." :
    "We sent a verification link to your inbox. Click it before signing in.";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md rounded-[24px] border border-[var(--bg-border)] bg-[rgba(8,12,20,0.78)] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--accent)] mb-3" style={{ fontFamily: "var(--font-mono)" }}>
          email checkpoint
        </p>
        <h1 className="text-3xl font-black text-white mb-3" style={{ fontFamily: "var(--font-syne)" }}>
          {headline}
        </h1>
        <p className="text-sm text-white/60 leading-6 mb-5">
          {copy}
        </p>

        {email && (
          <p className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/60" style={{ fontFamily: "var(--font-mono)" }}>
            inbox: {email}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          {email && (
            <button
              type="button"
              onClick={resend}
              disabled={busy}
              className="peng-btn peng-btn-primary px-4 py-2 disabled:opacity-40"
            >
              {busy ? "sending..." : "resend email"}
            </button>
          )}
          <Link href="/auth/signin" className="peng-btn peng-btn-ghost px-4 py-2">
            go to sign in
          </Link>
        </div>

        {message && (
          <p className="mt-4 text-xs text-white/65" style={{ fontFamily: "var(--font-mono)" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyEmailView /></Suspense>;
}
