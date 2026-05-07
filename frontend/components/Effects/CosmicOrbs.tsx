"use client";
import { useMemo } from "react";

// Slow drifting cosmic orbs + parallax stars for landing background.
export function CosmicOrbs() {
  const orbs = useMemo(
    () => [
  { size: 540, top: "5%",  left: "-10%", color: "rgba(139,92,246,0.16)", dur: 38 },
      { size: 320, top: "55%", left: "85%",  color: "rgba(0,212,255,0.14)",  dur: 44 },
      { size: 260, top: "78%", left: "10%",  color: "rgba(255,43,214,0.12)", dur: 32 },
  { size: 200, top: "20%", left: "70%",  color: "rgba(45,212,191,0.12)", dur: 28 },
    ],
    []
  );

  const stars = useMemo(
    () => Array.from({ length: 60 }).map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 5,
      dur: 3 + Math.random() * 5,
    })),
    []
  );

  return (
    <div className="cosmic-orbs" aria-hidden="true">
      {orbs.map((o, i) => (
        <span
          key={i}
          className="cosmic-orb"
          style={{
            width: o.size, height: o.size,
            top: o.top, left: o.left,
            background: `radial-gradient(circle, ${o.color}, transparent 70%)`,
            animationDuration: `${o.dur}s`,
          }}
        />
      ))}
      {stars.map((s, i) => (
        <span
          key={`star-${i}`}
          className="cosmic-star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
