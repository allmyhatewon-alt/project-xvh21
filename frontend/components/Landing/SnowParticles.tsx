"use client";
import { useEffect, useRef } from "react";

/**
 * Ambient floating particle layer for the landing page.
 * Drifting purple/cyan dots + occasional sparkle, all on canvas (cheap).
 * Reacts subtly to mouse movement.
 */
export function SnowParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const setSize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    setSize();
    window.addEventListener("resize", setSize);

    type P = {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      a: number;
      hue: number;
      sparkle: boolean;
    };
    const COUNT = Math.floor((window.innerWidth * window.innerHeight) / 12000);
    const parts: P[] = [];
    for (let i = 0; i < COUNT; i++) {
      parts.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 0.6 + Math.random() * 1.6,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -0.05 - Math.random() * 0.18,
        a: 0.12 + Math.random() * 0.45,
        hue: Math.random() < 0.7 ? 270 : 190, // mostly purple, some cyan
        sparkle: Math.random() < 0.18,
      });
    }

    const mouse = { x: -9999, y: -9999 };
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    let tick = 0;
    const draw = () => {
      tick++;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const p of parts) {
        // Repel softly from cursor
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14400) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / 120) * 0.6;
          p.vx += (dx / d) * f * 0.05;
          p.vy += (dy / d) * f * 0.05;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Drag back toward upward drift
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + (-0.08 - p.r * 0.02) * 0.04;

        // Wrap
        if (p.y < -10) {
          p.y = window.innerHeight + 10;
          p.x = Math.random() * window.innerWidth;
        }
        if (p.x < -10) p.x = window.innerWidth + 10;
        if (p.x > window.innerWidth + 10) p.x = -10;

        const sparkle = p.sparkle ? 0.5 + 0.5 * Math.sin(tick * 0.05 + p.x) : 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.a * sparkle})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsla(${p.hue}, 90%, 60%, 0.6)`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", setSize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-[3]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
