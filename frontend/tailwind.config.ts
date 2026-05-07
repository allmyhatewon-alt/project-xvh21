import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-press-start)", "monospace"],
        mono: ["var(--font-jetbrains)", "var(--font-space-mono)", "monospace"],
        syne: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "var(--bg)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        border: "var(--bg-border)",
        accent: "var(--accent)",
        shard: "var(--shard-color)",
        gem: "var(--gem-color)",
        xp: "var(--xp-color)",
      },
      animation: {
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "text-glow": "text-glow 3s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "slide-up": "slide-up 0.4s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "peng-wander": "peng-wander 40s linear infinite",
        "peng-glitch": "peng-glitch 11s steps(1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
