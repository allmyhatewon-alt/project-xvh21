"use client";
import Link from "next/link";

export function EnterHubPortal() {
  return (
    <Link href="/hub" className="block peng-card group hover:border-[var(--accent)] transition-colors" data-testid="enter-hub-portal">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] tracking-widest text-white/40 flex items-center gap-1.5" style={{ fontFamily: "var(--font-mono)" }}>
          <span>◈</span> STEP THROUGH THE PORTAL
        </p>
      </div>
      <h2
        className="text-3xl font-black text-white leading-none mb-3"
        style={{
          fontFamily: "var(--font-syne)",
          textShadow: "0 0 20px var(--accent-glow)",
        }}
      >
        ENTER<br />THE<br />HUB
      </h2>
      <p className="text-[10px] text-white/40 mb-3" style={{ fontFamily: "var(--font-mono)" }}>
        chat · clips · replies · chaos
      </p>
      <div className="text-[10px] text-[var(--accent)] tracking-wider opacity-70 group-hover:opacity-100 transition-opacity" style={{ fontFamily: "var(--font-mono)" }}>
        [ ENTER ]
      </div>
    </Link>
  );
}
