"use client";
import Link from "next/link";
import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * The "ENTER THE HUB" CTA. Hijacks the click to:
 *   1. Fire a layered Web Audio portal sound (sub bass void drop +
 *      Bb minor pentatonic arpeggio rise + crystal echo shimmer + cave reverb).
 *   2. Spawn a penguin particle burst.
 *   3. Flash a purple radial portal overlay.
 *   4. Then navigate to /hub.
 */
export function EnterHubButton() {
  const router = useRouter();
  const btnRef = useRef<HTMLAnchorElement>(null);
  const [firing, setFiring] = useState(false);

  const playPortalSound = useCallback(() => {
    const AudioCtx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    let ctx: AudioContext;
    try {
      ctx = new AudioCtx();
    } catch {
      return;
    }
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);

    // Cave reverb - 2.4s exponential decay impulse
    const irLen = Math.floor(ctx.sampleRate * 2.4);
    const ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < irLen; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 1.6);
      }
    }
    const conv = ctx.createConvolver();
    conv.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    conv.connect(wet);
    wet.connect(master);

    const tone = (
      freq: number,
      vol: number,
      start: number,
      dur: number,
      type: OscillatorType = "sine",
      toFreq?: number,
    ) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t + start);
      if (toFreq)
        osc.frequency.exponentialRampToValueAtTime(toFreq, t + start + dur);
      g.gain.setValueAtTime(0, t + start);
      g.gain.linearRampToValueAtTime(vol, t + start + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
      osc.connect(g);
      g.connect(master);
      g.connect(conv);
      osc.start(t + start);
      osc.stop(t + start + dur + 0.1);
    };

    // Sub bass void drop
    tone(110, 0.24, 0, 2.2, "sine", 30);
    tone(55, 0.13, 0, 2.6, "triangle");

    // Bb minor pentatonic arpeggio (Bb3 → Db4 → Eb4 → F4 → Bb4)
    const arp: [number, number, number][] = [
      [233, 0.11, 0.0],
      [277, 0.1, 0.09],
      [311, 0.09, 0.17],
      [370, 0.08, 0.25],
      [466, 0.07, 0.33],
    ];
    arp.forEach(([f, v, s]) => tone(f, v, s, 1.9, "sine", f * 1.3));

    // Crystal echo shimmer - 4 decay taps
    [0, 0.28, 0.56, 0.84].forEach((delay, rep) => {
      const v = 0.09 * Math.pow(0.58, rep);
      tone(1046, v, delay, 0.65, "sine"); // C6
      tone(1318, v * 0.75, delay + 0.05, 0.58, "sine"); // E6
      tone(1568, v * 0.45, delay + 0.1, 0.5, "sine"); // G6
    });

    // Entry whoosh - bandpass noise burst
    const nb = ctx.createBuffer(
      1,
      Math.floor(ctx.sampleRate * 0.45),
      ctx.sampleRate,
    );
    const nd = nb.getChannelData(0);
    for (let j = 0; j < nd.length; j++) nd[j] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource();
    ns.buffer = nb;
    const nf = ctx.createBiquadFilter();
    nf.type = "bandpass";
    nf.frequency.value = 900;
    nf.Q.value = 0.5;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.07, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    ns.connect(nf);
    nf.connect(ng);
    ng.connect(master);
    ng.connect(conv);
    ns.start(t);
    ns.stop(t + 0.45);
  }, []);

  const spawnPengs = useCallback((cx: number, cy: number) => {
    for (let i = 0; i < 9; i++) {
      const idx = i;
      setTimeout(() => {
        const el = document.createElement("span");
        el.className = "peng-particle";
        el.textContent = "🐧";
        el.style.left = `${cx + (Math.random() - 0.5) * 150}px`;
        el.style.top = `${cy + (Math.random() - 0.5) * 40}px`;
        el.style.fontSize = `${0.65 + Math.random() * 0.95}rem`;
        el.style.animationDuration = `${1.3 + Math.random() * 0.9}s`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2200);
      }, idx * 65);
    }
  }, []);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (firing) return;
    setFiring(true);

    playPortalSound();

    const flash = document.createElement("div");
    flash.className = "hub-portal-flash on";
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 700);

    const btn = btnRef.current;
    if (btn) {
      const rc = btn.getBoundingClientRect();
      spawnPengs(rc.left + rc.width / 2, rc.top + rc.height / 2);

      const ring = document.createElement("div");
      ring.className = "hub-ripple";
      ring.style.left = `${rc.left}px`;
      ring.style.top = `${rc.top}px`;
      ring.style.width = `${rc.width}px`;
      ring.style.height = `${rc.height}px`;
      document.body.appendChild(ring);
      setTimeout(() => ring.remove(), 1000);
    }

    setTimeout(() => router.push("/hub"), 700);
  };

  return (
    <Link
      ref={btnRef}
      href="/hub"
      onClick={onClick}
      className={`peng-btn peng-btn-primary mb-6 px-8 py-4 text-sm enter-hub-btn ${firing ? "firing" : ""}`}
      style={{ fontFamily: "var(--font-press-start)", fontSize: "0.6rem" }}
      data-testid="enter-hub-link"
    >
      ENTER THE HUB
    </Link>
  );
}
