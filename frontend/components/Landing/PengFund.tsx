"use client";
import { useState } from "react";

const TIERS = [5, 10, 25, 50];

export function PengFund() {
  const [tier, setTier] = useState(10);

  return (
    <div className="peng-card" data-testid="peng-fund">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] tracking-widest text-white/60 flex items-center gap-1.5" style={{ fontFamily: "var(--font-mono)" }}>
          <span className="text-red-500">✕</span> PENG FUND
        </p>
        <span className="text-[10px] text-white/40 px-1.5 py-0.5 border border-[var(--bg-border)] rounded" style={{ fontFamily: "var(--font-mono)" }}>LVL 1</span>
      </div>

      <div className="text-center my-2">
        <p className="text-xs text-white/80" style={{ fontFamily: "var(--font-mono)" }}>$0 / $1,000</p>
        <p className="text-[10px] text-white/40 tracking-wider mt-0.5" style={{ fontFamily: "var(--font-mono)" }}>0% RAISED</p>
      </div>

      {/* Orb */}
      <div className="flex justify-center my-4">
        <div
          className="w-12 h-12 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.7), transparent 70%)",
            boxShadow: "0 0 30px rgba(255,255,255,0.3)",
          }}
        />
      </div>

      <div className="border-t border-[var(--bg-border)] pt-3 mt-2">
        <p className="text-[10px] tracking-widest text-white/40 mb-2" style={{ fontFamily: "var(--font-mono)" }}>WHAT THIS FUNDS</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {["site upgrades", "editing time", "stream setup"].map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 border border-[var(--bg-border)] rounded text-white/60" style={{ fontFamily: "var(--font-mono)" }}>{t}</span>
          ))}
        </div>
        <div className="flex justify-between text-[10px] mb-3" style={{ fontFamily: "var(--font-mono)" }}>
          <span className="text-white/40">SUPPORTERS</span>
          <span className="text-white/60">0</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {TIERS.map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              className={`py-2 text-[10px] rounded border transition-colors ${
                tier === t ? "border-[var(--accent)] text-white" : "border-[var(--bg-border)] text-white/50 hover:text-white"
              }`}
              data-testid={`fund-tier-${t}`}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              ${t}
            </button>
          ))}
        </div>

        <button
          onClick={() => alert("Stripe payments will be enabled in a future update.")}
          className="w-full peng-btn peng-btn-primary text-[10px] py-2.5"
          data-testid="donate-stripe-button"
        >
          DONATE WITH STRIPE
        </button>

        <button className="w-full peng-btn peng-btn-ghost text-[10px] py-2 mt-2" data-testid="refresh-fund-total-button">REFRESH TOTAL</button>
      </div>

      <div className="border-t border-[var(--bg-border)] pt-3 mt-3">
        <p className="text-[10px] tracking-widest text-white/40 mb-2" style={{ fontFamily: "var(--font-mono)" }}>RECENT SUPPORT</p>
        <p className="text-[10px] text-white/40 italic mb-1" style={{ fontFamily: "var(--font-mono)" }}>waiting for the first drop.</p>
        <p className="text-[10px] text-white/40 italic" style={{ fontFamily: "var(--font-mono)" }}>could not load stripe total right now.</p>
        <p className="text-[10px] text-white/30 mt-2 italic" style={{ fontFamily: "var(--font-mono)" }}>real total pulled from stripe. every push moves the goal.</p>
      </div>
    </div>
  );
}
