"use client";
import { useEffect, useRef } from "react";

export function PengLetters() {
  const ref = useRef<HTMLDivElement>(null);
  const echoRef = useRef<HTMLDivElement>(null);
  const penguin = "\u{1F427}";

  // Beat-sync glitch via Web Audio analyser
  useEffect(() => {
    let raf: number;
    let cooldown = false;

    function sync() {
      const analyser = (window as any)._pengAnalyser;
      const data = (window as any)._pengDataArray;
      if (analyser && data && ref.current) {
        analyser.getByteFrequencyData(data);
        const kick = data.slice(0, 4).reduce((a: number, b: number) => a + b, 0) / (4 * 255);
        if (kick > 0.18 && !cooldown) {
          const el = ref.current;
          el.classList.remove("beat-hit");
          void el.offsetWidth; // force reflow
          el.classList.add("beat-hit");
          cooldown = true;
          setTimeout(() => {
            el?.classList.remove("beat-hit");
            cooldown = false;
          }, 400);
        }
      }
      raf = requestAnimationFrame(sync);
    }

    sync();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden -z-5"
      aria-hidden="true"
    >
      <div
        ref={ref}
        className="bg-mega-letters"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          fontSize: "clamp(2.6rem, 7vw, 8.5rem)",
          color: "rgba(255,255,255,0.10)",
              filter: "drop-shadow(0 0 26px rgba(45,212,191,0.18))",
          lineHeight: 1,
          userSelect: "none",
          animation: "peng-wander 40s linear infinite, peng-glitch 11s steps(1) infinite",
          willChange: "transform",
        }}
      >
        {penguin}
      </div>
      <div
        ref={echoRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          fontSize: "clamp(2.2rem, 6vw, 7rem)",
          color: "rgba(255,255,255,0.055)",
          filter: "drop-shadow(0 0 18px rgba(0,212,255,0.12))",
          lineHeight: 1,
          userSelect: "none",
          animation: "peng-wander 40s linear infinite",
          animationDelay: "-4s",
          willChange: "transform",
        }}
      >
        {penguin}
      </div>

      <style jsx>{`
        .beat-hit {
          animation: peng-wander 40s linear infinite, beat-burst 0.4s steps(1) !important;
        }
        @keyframes beat-burst {
          0%   { filter: none; text-shadow: none; }
          10%  { filter: hue-rotate(180deg); text-shadow: -4px 0 #ff00ff, 4px 0 #00ffff; clip-path: polygon(0 20%, 100% 20%, 100% 45%, 0 45%); }
          30%  { filter: none; text-shadow: none; clip-path: none; }
          50%  { text-shadow: -2px 0 rgba(255,0,255,0.5), 2px 0 rgba(0,255,255,0.5); }
          100% { filter: none; text-shadow: none; }
        }
      `}</style>
    </div>
  );
}
