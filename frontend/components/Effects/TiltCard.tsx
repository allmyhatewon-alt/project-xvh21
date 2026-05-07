"use client";
import { useRef, ReactNode } from "react";

// Lightweight 3-axis tilt wrapper. Wrap any block and it will tilt
// toward the cursor + cast a soft accent glow that follows the pointer.
export function TiltCard({
  children,
  className = "",
  max = 6,
  testid,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  testid?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * max;
    const ry = (px - 0.5) * max;
    el.style.setProperty("--rx", `${rx}deg`);
    el.style.setProperty("--ry", `${ry}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  }
  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", `0deg`);
    el.style.setProperty("--ry", `0deg`);
  }

  return (
    <div
      ref={ref}
      className={`tilt-card ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      data-testid={testid}
    >
      <div className="tilt-card-inner">{children}</div>
    </div>
  );
}
