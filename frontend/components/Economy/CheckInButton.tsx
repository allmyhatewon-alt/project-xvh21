"use client";
import { useState, useEffect } from "react";

export function CheckInButton() {
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<null | {
    streak: number;
    shardsEarned: number;
    multiplier: number;
    milestone: number | null;
  }>(null);

  useEffect(() => {
    fetch("/api/check-in")
      .then((r) => r.json())
      .then((d) => setCanCheckIn(d.canCheckIn))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function checkIn() {
    setLoading(true);
    try {
      const r = await fetch("/api/check-in", { method: "POST" });
      const d = await r.json();
      if (r.ok) {
        setResult(d);
        setCanCheckIn(false);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-xs opacity-30" style={{ fontFamily: "var(--font-mono)" }}>
        ...
      </div>
    );
  }

  if (result) {
    return (
      <div className="text-right">
        <p className="text-xs text-green-400" style={{ fontFamily: "var(--font-mono)" }}>
          +{result.shardsEarned} ◈ shards
        </p>
        {result.multiplier > 1 && (
          <p className="text-xs opacity-50" style={{ fontFamily: "var(--font-mono)" }}>
            {result.multiplier}× streak bonus
          </p>
        )}
        {result.milestone && (
          <p className="text-xs text-orange-400 mt-1">
            🔥 {result.milestone}-day streak!
          </p>
        )}
      </div>
    );
  }

  if (!canCheckIn) {
    return (
      <span
        className="text-xs opacity-30"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        checked in ✓
      </span>
    );
  }

  return (
    <button onClick={checkIn} className="peng-btn peng-btn-primary text-xs">
      Daily Check-in
    </button>
  );
}
