"use client";
import { useEffect, useState } from "react";

export function SignalBoard() {
  const [signal, setSignal] = useState(11);

  useEffect(() => {
    const id = setInterval(() => {
      setSignal((s) => {
        const next = s + (Math.random() - 0.45) * 4;
        return Math.max(0, Math.min(100, Math.round(next)));
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="peng-card" data-testid="signal-board">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] tracking-widest text-[var(--accent)] flex items-center gap-1.5" style={{ fontFamily: "var(--font-mono)" }}>
          <span className="w-1 h-3 inline-block bg-[var(--accent)]" />
          SIGNAL BOARD
        </p>
      </div>
      <div className="flex items-center justify-between text-[10px] mb-3" style={{ fontFamily: "var(--font-mono)" }}>
        <span className="text-white/40 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          BROADCAST STATUS
        </span>
        <span className="text-white/40 tracking-wider">OFFLINE</span>
      </div>
      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-white/70" style={{ fontFamily: "var(--font-mono)" }}>tonight&apos;s signal</span>
          <span className="text-sm text-[var(--shard-color)]" style={{ fontFamily: "var(--font-mono)" }}>{signal}%</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${signal}%`,
              background: "linear-gradient(90deg, var(--shard-color), var(--accent))",
            }}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <a href="https://twitch.tv/peng" target="_blank" rel="noopener" className="peng-btn peng-btn-ghost text-[10px] flex-1" data-testid="open-twitch-link">open twitch</a>
        <a href="https://tiktok.com/@peng" target="_blank" rel="noopener" className="peng-btn peng-btn-ghost text-[10px] flex-1" data-testid="open-tiktok-link">open tiktok</a>
      </div>
      <p className="text-[10px] text-white/30 mt-3" style={{ fontFamily: "var(--font-mono)" }}>low signal. keep the tab open anyway.</p>
    </div>
  );
}
