"use client";
import { useEffect, useRef } from "react";

// Ping-pong GIF renderer using omggif — matches existing app.js implementation
export function GifBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let frames: ImageData[] = [];
    let delays: number[] = [];
    let dir = 1;
    let frameIdx = 0;
    let lastTime = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function drawFrame(idx: number) {
      if (!canvas || !ctx || !frames[idx]) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Center+cover the GIF frame
      const fw = frames[idx].width;
      const fh = frames[idx].height;

      // Create offscreen canvas for the frame
      const off = document.createElement("canvas");
      off.width = fw;
      off.height = fh;
      const octx = off.getContext("2d")!;
      octx.putImageData(frames[idx], 0, 0);

      const scale = Math.max(canvas.width / fw, canvas.height / fh);
      const dw = fw * scale;
      const dh = fh * scale;
      const dx = (canvas.width - dw) / 2;
      const dy = (canvas.height - dh) / 2;

      ctx.drawImage(off, dx, dy, dw, dh);
    }

    function loop(ts: number) {
      if (!delays.length) { raf = requestAnimationFrame(loop); return; }
      const delay = (delays[frameIdx] || 10) * 10; // centiseconds → ms
      if (ts - lastTime >= delay) {
        drawFrame(frameIdx);
        frameIdx += dir;
        if (frameIdx >= frames.length - 1) { dir = -1; }
        if (frameIdx <= 0) { dir = 1; }
        lastTime = ts;
      }
      raf = requestAnimationFrame(loop);
    }

    // Apply beat-sync scaling via global analyser
    function beatLoop() {
      const analyser = (window as any)._pengAnalyser;
      const dataArray = (window as any)._pengDataArray;
      if (analyser && dataArray && canvas) {
        analyser.getByteFrequencyData(dataArray);
        const bass = dataArray.slice(0, 4).reduce((a: number, b: number) => a + b, 0) / (4 * 255);
        const scale = 1 + bass * 0.04;
        canvas.style.transform = `scale(${scale})`;
        canvas.style.filter = `brightness(${0.85 + bass * 0.25}) saturate(${1 + bass * 0.3})`;
      }
      requestAnimationFrame(beatLoop);
    }

    async function loadGif() {
      try {
        const resp = await fetch("/iguess.gif");
        const buf = await resp.arrayBuffer();
        const arr = new Uint8Array(buf);

        // Dynamically load omggif from CDN
        if (!(window as any).GifReader) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement("script");
            s.src = "https://unpkg.com/omggif@1.0.10/omggif.js";
            s.onload = () => resolve();
            s.onerror = reject;
            document.head.appendChild(s);
          });
        }

        const reader = new (window as any).GifReader(arr);
        const w = reader.width;
        const h = reader.height;
        let prev: Uint8ClampedArray | null = null;

        for (let i = 0; i < reader.numFrames(); i++) {
          const pixels = new Uint8ClampedArray(w * h * 4);
          if (prev) pixels.set(prev);
          reader.decodeAndBlitFrameRGBA(i, pixels);
          frames.push(new ImageData(new Uint8ClampedArray(pixels), w, h));
          delays.push(reader.frameInfo(i).delay);
          prev = pixels;
        }

        raf = requestAnimationFrame(loop);
        beatLoop();
      } catch (e) {
        console.warn("GIF background failed:", e);
      }
    }

    loadGif();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 opacity-30 pointer-events-none transition-transform"
      aria-hidden="true"
      style={{ willChange: "transform, filter" }}
    />
  );
}
