"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/app/providers";

export function LandingPengCard() {
  const { user } = useAuth();
  const [time, setTime] = useState("00:00:00");

  useEffect(() => {
    function tick() {
      const d = new Date();
      const fmt = (n: number) => String(n).padStart(2, "0");
      setTime(`${fmt(d.getHours())}:${fmt(d.getMinutes())}:${fmt(d.getSeconds())}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="peng-card relative overflow-hidden w-full max-w-md" data-testid="landing-peng-card" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(16px)" }}>
      {/* Top status */}
      <div className="text-center mb-4">
        <p className="text-[10px] tracking-widest text-[var(--xp-color)] inline-flex items-center gap-2" style={{ fontFamily: "var(--font-mono)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--xp-color)] inline-block animate-pulse" />
          PENG_OS · SYSTEM READY
          <span className="text-white/40">{time}</span>
        </p>
      </div>

      {/* Big peng */}
      <h2
        className="text-center text-7xl md:text-8xl font-black text-white leading-none my-6"
        style={{ fontFamily: "var(--font-syne)" }}
      >
        peng
      </h2>

      {/* Socials inline */}
      <div className="flex items-center justify-center gap-2 my-4">
        <a href="https://discord.gg/peng" target="_blank" rel="noopener" className="w-10 h-10 border border-[var(--bg-border)] rounded-full flex items-center justify-center hover:border-[var(--accent)] transition-colors" data-testid="discord-link">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white/70"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25 19.736 19.736 0 0 0-4.885 1.515C.533 9.046-.32 13.58.099 18.057a19.9 19.9 0 0 0 5.993 3.03c.453-.631.865-1.295 1.226-1.994a13.107 13.107 0 0 1-1.872-.892c.157-.118.31-.24.46-.366 3.928 1.793 8.18 1.793 12.062 0 .15.126.303.248.46.366a12.299 12.299 0 0 1-1.873.892c.36.698.772 1.362 1.225 1.993a19.839 19.839 0 0 0 6.002-3.03c.5-5.177-.838-9.674-3.549-13.66zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
        </a>
        <a href="https://tiktok.com/@peng" target="_blank" rel="noopener" className="px-3 py-2 border border-[var(--bg-border)] rounded-full text-xs text-white/70 hover:border-[var(--accent)] transition-colors" data-testid="tiktok-link" style={{ fontFamily: "var(--font-mono)" }}>
          + tiktok.com/@peng
        </a>
        <a href="https://twitch.tv/peng" target="_blank" rel="noopener" className="w-10 h-10 border border-[var(--bg-border)] rounded-full flex items-center justify-center hover:border-[var(--accent)] transition-colors" data-testid="twitch-link">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white/70"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>
        </a>
      </div>

      <p className="text-center text-[10px] tracking-[0.3em] uppercase text-white/50 my-3" style={{ fontFamily: "var(--font-mono)" }}>
        creator · streamer · chaos
      </p>

      <p className="text-center text-xs italic text-white/40 mb-6">jaakuna run through my veins.</p>

      {/* Quick action grid */}
      <div className="grid grid-cols-4 gap-2">
        <ActionCard label="latest tiktoks" sub="clips, edits, stream moments" badge={<span className="text-[10px] text-red-400" style={{ fontFamily: "var(--font-mono)" }}>● LIVE</span>} action="watch" testid="action-tiktoks" href="https://tiktok.com/@peng" />
        <ActionCard label="discord" sub="server, updates, people" action="join" testid="action-discord" href="https://discord.gg/peng" />
        <ActionCard label="twitch" sub="live when the signal hits" action="open" testid="action-twitch" href="https://twitch.tv/peng" />
        <ActionCard label="message peng" sub="login, send, show up" action="chat" testid="action-message" href={user ? `/hub/user/peng` : "/auth/signin"} />
      </div>

      {/* Email + sign in */}
      <div className="border-t border-[var(--bg-border)] mt-6 pt-4">
        {user ? (
          <Link href="/hub" className="text-center block text-xs text-[var(--accent)] hover:text-white" data-testid="logged-in-hub-link" style={{ fontFamily: "var(--font-mono)" }}>
            signed in as @{user.username} → enter the hub
          </Link>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 border border-[var(--bg-border)] rounded text-xs">
            <span className="text-white/30 flex-1" style={{ fontFamily: "var(--font-mono)" }}>admin@pengelus.me</span>
            <Link href="/auth/signin" className="text-[var(--accent)] hover:underline" data-testid="landing-signin-link" style={{ fontFamily: "var(--font-mono)" }}>sign in</Link>
            <span className="text-white/20">·</span>
            <Link href="/auth/signup" className="text-white/60 hover:underline" data-testid="landing-signup-link" style={{ fontFamily: "var(--font-mono)" }}>sign up</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionCard({ label, sub, action, badge, testid, href }: { label: string; sub: string; action: string; badge?: React.ReactNode; testid: string; href: string }) {
  return (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener" className="peng-card hover:border-[var(--accent)] !p-3 group block" data-testid={testid}>
      <div className="flex items-start justify-between mb-1">
        {badge ?? <span className="text-[10px] text-white/40">{action === "watch" ? "🎵" : action === "join" ? "◈" : action === "open" ? "▶" : "💬"}</span>}
        <span className="text-[10px] text-[var(--xp-color)]" style={{ fontFamily: "var(--font-mono)" }}>{action}</span>
      </div>
      <p className="text-xs text-white font-bold mt-2" style={{ fontFamily: "var(--font-mono)" }}>{label}</p>
      <p className="text-[10px] text-white/40 mt-1 leading-tight">{sub}</p>
    </a>
  );
}
