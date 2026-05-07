"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Two penguin sprites that waddle around the screen on a slow path
 * AND lean toward the cursor like they're following it.
 * Click one for a tiny squeak (and bonus penguin emoji burst).
 */
export function CursorPenguins() {
  const wrap = useRef<HTMLDivElement>(null);
  const [excited, setExcited] = useState<number | null>(null);
  const [positions, setPositions] = useState([
    { left: 0, top: 0, dur: 7800 },
    { left: 0, top: 0, dur: 9200 },
  ]);

  useEffect(() => {
    const pickSpot = (idx: number) => {
      const marginX = window.innerWidth < 640 ? 18 : 42;
      const marginY = window.innerWidth < 640 ? 70 : 86;
      const width = window.innerWidth < 640 ? 56 : 76;
      const height = window.innerWidth < 640 ? 70 : 92;
      const lanes = [
        { x: [0.04, 0.28], y: [0.08, 0.34] },
        { x: [0.62, 0.9], y: [0.1, 0.34] },
        { x: [0.08, 0.34], y: [0.58, 0.82] },
        { x: [0.58, 0.9], y: [0.54, 0.8] },
        { x: [0.36, 0.58], y: [0.18, 0.74] },
      ];
      const lane = lanes[(Math.floor(Math.random() * lanes.length) + idx * 2) % lanes.length];
      const x = lane.x[0] + Math.random() * (lane.x[1] - lane.x[0]);
      const y = lane.y[0] + Math.random() * (lane.y[1] - lane.y[0]);
      const maxLeft = Math.max(marginX, window.innerWidth - width - marginX);
      const maxTop = Math.max(marginY, window.innerHeight - height - marginY);
      return {
        left: Math.min(maxLeft, Math.max(marginX, window.innerWidth * x)),
        top: Math.min(maxTop, Math.max(marginY, window.innerHeight * y)),
        dur: 6800 + Math.random() * 4200,
      };
    };

    const move = () => {
      const first = pickSpot(0);
      let second = pickSpot(1);
      for (let attempt = 0; attempt < 8; attempt++) {
        const distance = Math.hypot(first.left - second.left, first.top - second.top);
        if (distance > Math.min(360, window.innerWidth * 0.28)) break;
        second = pickSpot(1);
      }
      setPositions([first, second]);
    };
    move();
    const id = window.setInterval(move, 8200);
    window.addEventListener("resize", move);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", move);
    };
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const pengs = Array.from(el.querySelectorAll<HTMLDivElement>(".cursor-peng"));
    if (!pengs.length) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    const tick = () => {
      pengs.forEach((p, i) => {
        const rect = p.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.hypot(dx, dy);
        // Subtle lean toward cursor (max 14deg, max 18px shift)
        const tilt = Math.max(-14, Math.min(14, (dx / Math.max(dist, 1)) * 14));
        const lift = Math.max(-18, Math.min(18, (dy / Math.max(dist, 1)) * -10));
        p.style.setProperty("--lean", `${tilt}deg`);
        p.style.setProperty("--lift", `${lift}px`);
        // Eyes track cursor
        const eyes = p.querySelectorAll<HTMLSpanElement>(".eye");
        eyes.forEach((eye) => {
          const eyeR = eye.getBoundingClientRect();
          const ecx = eyeR.left + eyeR.width / 2;
          const ecy = eyeR.top + eyeR.height / 2;
          const ang = Math.atan2(my - ecy, mx - ecx);
          const px = Math.cos(ang) * 2;
          const py = Math.sin(ang) * 2;
          eye.style.setProperty("--px", `${px}px`);
          eye.style.setProperty("--py", `${py}px`);
        });
      });
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  const onPengClick = (idx: number) => (e: React.MouseEvent) => {
    setExcited(idx);
    setTimeout(() => setExcited(null), 600);

    // Spawn a small emoji burst
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 5; i++) {
      const t = i;
      setTimeout(() => {
        const el = document.createElement("span");
        el.className = "peng-particle";
        el.textContent = "🐧";
        el.style.left = `${cx + (Math.random() - 0.5) * 80}px`;
        el.style.top = `${cy + (Math.random() - 0.5) * 20}px`;
        el.style.fontSize = `${0.7 + Math.random() * 0.6}rem`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2200);
      }, t * 50);
    }

    // Tiny squeak via Web Audio
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      const t = ctx.currentTime;
      osc.frequency.setValueAtTime(820, t);
      osc.frequency.exponentialRampToValueAtTime(1320, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(620, t + 0.18);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    } catch {}
  };

  return (
    <div ref={wrap} className="cursor-pengs-wrap" aria-hidden="true">
      <button
        type="button"
        className={`cursor-peng cursor-peng-1 ${excited === 0 ? "excited" : ""}`}
        style={{
          left: positions[0].left ? `${positions[0].left}px` : undefined,
          top: positions[0].top ? `${positions[0].top}px` : undefined,
          transitionDuration: `${positions[0].dur}ms`,
        }}
        onClick={onPengClick(0)}
        aria-label="poke penguin"
      >
        <span className="peng-body">
          <span className="peng-belly" />
          <span className="peng-face">
            <span className="eye eye-l">
              <span className="pupil" />
            </span>
            <span className="eye eye-r">
              <span className="pupil" />
            </span>
            <span className="beak" />
          </span>
          <span className="foot foot-l" />
          <span className="foot foot-r" />
        </span>
      </button>

      <button
        type="button"
        className={`cursor-peng cursor-peng-2 ${excited === 1 ? "excited" : ""}`}
        style={{
          left: positions[1].left ? `${positions[1].left}px` : undefined,
          top: positions[1].top ? `${positions[1].top}px` : undefined,
          transitionDuration: `${positions[1].dur}ms`,
        }}
        onClick={onPengClick(1)}
        aria-label="poke penguin"
      >
        <span className="peng-body">
          <span className="peng-belly" />
          <span className="peng-face">
            <span className="eye eye-l">
              <span className="pupil" />
            </span>
            <span className="eye eye-r">
              <span className="pupil" />
            </span>
            <span className="beak" />
          </span>
          <span className="foot foot-l" />
          <span className="foot foot-r" />
        </span>
      </button>
    </div>
  );
}
