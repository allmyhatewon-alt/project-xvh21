"use client";
import { useEffect, useState } from "react";
import { Portal } from "@/components/Effects/Portal";

type Burst = { id: number; x: number; y: number; color: string };

let _id = 0;
const listeners = new Set<(b: Burst) => void>();

export function fireBurst(x: number, y: number, color = "var(--accent)") {
  const b = { id: ++_id, x, y, color };
  listeners.forEach((fn) => fn(b));
}

export function ParticleBurstHost() {
  const [bursts, setBursts] = useState<Burst[]>([]);

  useEffect(() => {
    const fn = (b: Burst) => {
      setBursts((bs) => [...bs, b]);
      setTimeout(() => setBursts((bs) => bs.filter((x) => x.id !== b.id)), 1000);
    };
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  return (
    <Portal>
      <div className="particle-host" aria-hidden="true">
        {bursts.map((b) => (
          <div key={b.id} className="particle-burst" style={{ left: b.x, top: b.y }}>
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className="particle-bit"
                style={{
                  ["--a" as any]: `${(i / 14) * 360}deg`,
                  ["--c" as any]: b.color,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </Portal>
  );
}
