"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/providers";
import { GemShop } from "@/components/Effects/GemShop";
import { Portal } from "@/components/Effects/Portal";

type Currency = "shards" | "gems" | "xp";

const META: Record<Currency, { label: string; symbol: string; color: string; tint: string; glow: string }> = {
  shards: { label: "shards", symbol: "S", color: "var(--shard-color)", tint: "rgba(0,212,255,0.18)", glow: "rgba(0,212,255,0.55)" },
  gems: { label: "gems", symbol: "G", color: "var(--gem-color)", tint: "rgba(240,171,252,0.18)", glow: "rgba(240,171,252,0.55)" },
  xp: { label: "xp", symbol: "XP", color: "var(--xp-color)", tint: "rgba(74,222,128,0.18)", glow: "rgba(74,222,128,0.55)" },
};

export function FloatingStat({ kind }: { kind: Currency }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [displayed, setDisplayed] = useState(0);
  const lastValue = useRef(0);
  const meta = META[kind];
  const target = user ? (user[kind] ?? 0) : 0;

  useEffect(() => {
    if (lastValue.current === target) {
      setDisplayed(target);
      return;
    }
    const start = lastValue.current;
    const delta = target - start;
    const dur = 700;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(start + delta * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else lastValue.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`floating-stat-trigger group ${kind === "gems" ? "floating-stat-gems" : ""}`}
        data-testid={`floating-stat-${kind}`}
        style={{ ["--c" as any]: meta.color, ["--g" as any]: meta.glow, ["--t" as any]: meta.tint }}
        aria-label={`open ${kind} panel`}
      >
        <span className="floating-stat-symbol" aria-hidden="true">{meta.symbol}</span>
        <span className="floating-stat-value" data-testid={`floating-stat-${kind}-value`}>{displayed.toLocaleString()}</span>
        <span className="floating-stat-pulse" aria-hidden="true" />
      </button>

      {open && kind === "gems" && (
        <Portal><GemShop user={user} onClose={() => setOpen(false)} /></Portal>
      )}
      {open && kind !== "gems" && (
        <Portal>
          <FloatingStatPanel kind={kind} value={target} meta={meta} user={user} onClose={() => setOpen(false)} />
        </Portal>
      )}
    </>
  );
}

function FloatingStatPanel({
  kind,
  value,
  meta,
  user,
  onClose,
}: {
  kind: Currency;
  value: number;
  meta: typeof META[Currency];
  user: any;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const orbitNodes = Array.from({ length: 12 }).map((_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const r = 110 + (i % 3) * 18;
    const dur = 6 + (i % 4) * 1.4;
    const delay = -((i / 12) * dur);
    return (
      <span
        key={i}
        className="orbit-node"
        style={{
          ["--r" as any]: `${r}px`,
          ["--dur" as any]: `${dur}s`,
          ["--delay" as any]: `${delay}s`,
          ["--start" as any]: `${(a * 180) / Math.PI}deg`,
          background: meta.color,
          boxShadow: `0 0 14px ${meta.glow}`,
        }}
      />
    );
  });

  return (
    <div
      ref={overlayRef}
      className="floating-stat-overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      data-testid={`floating-stat-panel-${kind}`}
    >
      <div className="floating-stat-card" style={{ ["--c" as any]: meta.color, ["--g" as any]: meta.glow, ["--t" as any]: meta.tint }}>
        <button onClick={onClose} className="floating-stat-close" data-testid={`floating-stat-${kind}-close`} aria-label="close">x</button>

        <div className="floating-stat-stage">
          <div className="orbit-ring" />
          <div className="orbit-ring orbit-ring-2" />
          <div className="orbit-ring orbit-ring-3" />
          {orbitNodes}
          <div className="orbit-core">
            <span className="orbit-core-symbol">{meta.symbol}</span>
          </div>
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={`s${i}`} className="orbit-spark" style={{ ["--a" as any]: `${(i / 16) * 360}deg`, ["--d" as any]: `${0.2 + (i % 5) * 0.18}s` }} />
          ))}
        </div>

        <div className="floating-stat-meta">
          <p className="floating-stat-kicker">YOUR {meta.label.toUpperCase()}</p>
          <p className="floating-stat-bignum" data-testid={`floating-stat-${kind}-bignum`}>{value.toLocaleString()}</p>
          <div className="floating-stat-grid">
            <Cell label="LEVEL" value={String(user.level ?? 1)} />
            <Cell label="STREAK" value={String(user.streakCount ?? 0)} />
            <Cell label="ROLE" value={(user.role ?? "fan").toLowerCase()} />
            <Cell label="BEST" value={String(user.longestStreak ?? 0)} />
          </div>
          <p className="floating-stat-foot">
            {kind === "shards" && "shards are your everyday balance. check in, post, vote, build it up."}
            {kind === "gems" && (user.gemsUnlocked ? "gems buy profile upgrades, boosts, and the stuff that makes your page feel yours." : "gems unlock after you build a little signal. keep going.")}
            {kind === "xp" && "xp is your activity signal. level up by showing up and actually doing stuff."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="floating-stat-cell">
      <p className="floating-stat-cell-label">{label}</p>
      <p className="floating-stat-cell-value">{value}</p>
    </div>
  );
}
