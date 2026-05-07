"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { MUSIC_PLAYLIST, FALLBACK_PLAYLIST, type MusicTrack } from "@/lib/music-config";

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function encodeAssetPath(path: string) {
  return path.split("/").map((part, index) => index === 0 ? part : encodeURIComponent(part)).join("/");
}

export function AudioPlayer() {
  const pathname = usePathname();
  // Render dock ONLY on the landing page ("/").
  const visible = pathname === "/";

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);

  const [playlist, setPlaylist] = useState<MusicTrack[]>([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [cleanMode, setCleanMode] = useState(false);
  const [started, setStarted] = useState(false);

  // Build playlist: 1) hard-coded config (preferred) 2) user uploads 3) fallback
  useEffect(() => {
    if (!visible) return;
    if (MUSIC_PLAYLIST.length) {
      setPlaylist(shuffled(MUSIC_PLAYLIST));
      return;
    }
    fetch("/api/upload")
      .then((r) => r.ok ? r.json() : { uploads: [] })
      .then((d) => {
        const userTracks: MusicTrack[] = (d.uploads ?? []).map((u: any) => ({
          url: u.url,
          title: u.title || u.filename,
          artist: u.artist || undefined,
        }));
        setPlaylist(userTracks.length ? shuffled(userTracks) : FALLBACK_PLAYLIST);
      })
      .catch(() => setPlaylist(FALLBACK_PLAYLIST));
  }, [visible]);

  // pause + tear down audio whenever we leave the landing page
  useEffect(() => {
    if (!visible) {
      try { audioRef.current?.pause(); } catch {}
      setPlaying(false);
    }
  }, [visible]);

  const initAudio = useCallback(() => {
    if (!audioRef.current || ctxRef.current) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    ctxRef.current = ctx;

    const src = ctx.createMediaElementSource(audioRef.current);
    srcRef.current = src;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.5;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    src.connect(analyser);
    analyser.connect(ctx.destination);

    (window as any)._pengAnalyser = analyser;
    (window as any)._pengDataArray = dataArray;

    drawVisualizer();
  }, []);

  function drawVisualizer() {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    function draw() {
      rafRef.current = requestAnimationFrame(draw);
      if (!canvas || !ctx) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      analyser!.getByteFrequencyData(data);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barW = canvas.width / data.length;
      data.forEach((val, i) => {
        const h = (val / 255) * canvas.height;
        const hue = 270 + (i / data.length) * 60;
        ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.5)`;
        ctx.fillRect(i * barW, canvas.height - h, barW - 1, h);
      });
    }
    draw();
  }

  function loadTrack(trackIdx: number) {
    const track = playlist[trackIdx];
    if (!audioRef.current || !track) return;
    audioRef.current.src = encodeAssetPath(track.url);
    audioRef.current.volume = volume;
  }

  function play() {
    if (!audioRef.current || !playlist.length) return;
    initAudio();
    if (ctxRef.current?.state === "suspended") ctxRef.current.resume();
    if (!started) {
      loadTrack(0);
      setStarted(true);
    }
    audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
  }

  function pause() {
    audioRef.current?.pause();
    setPlaying(false);
  }

  function skip() {
    if (!playlist.length) return;
    const next = (idx + 1) % playlist.length;
    setIdx(next);
    loadTrack(next);
    if (playing) audioRef.current?.play().catch(() => {});
  }

  function onEnded() { skip(); }

  function onVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }

  if (!visible) return null;

  const trackName = started && playlist[idx]
    ? `${playlist[idx].title}${playlist[idx].artist ? " / " + playlist[idx].artist : ""}`
    : "click play to start";

  return (
    <div id="audio-player-dock" className={cleanMode ? "clean-mode" : ""} data-testid="audio-player-dock">
      <div className={`landing-now-playing ${playing ? "is-playing" : ""}`} data-testid="landing-now-playing">
        <span className="landing-now-playing-dot" aria-hidden="true" />
        <div className="landing-now-playing-copy">
          <small>{playing ? "now playing" : "music"}</small>
          <strong>{trackName}</strong>
        </div>
      </div>
      <canvas ref={canvasRef} id="visualizer-canvas" style={{ height: "48px" }} />
      <div className="relative z-10 flex items-center gap-3 px-4 py-2 h-12">
        <span className="audio-dock-label flex-1 truncate text-xs opacity-60" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }} data-testid="audio-track-name">
          {trackName}
        </span>
        <button onClick={playing ? pause : play} className="peng-btn peng-btn-ghost px-3 py-1 text-xs" title={playing ? "pause" : "play"} data-testid="audio-play-button">
          {playing ? "pause" : "play"}
        </button>
        <button onClick={skip} className="peng-btn peng-btn-ghost px-3 py-1 text-xs" title="skip" data-testid="audio-skip-button">skip</button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={onVolumeChange}
          className="w-20 accent-purple-500"
          style={{ height: "2px" }}
          title="volume"
          data-testid="audio-volume-slider"
        />
        <button
          onClick={() => setCleanMode((c) => !c)}
          className="peng-btn peng-btn-ghost px-2 py-1 text-xs opacity-50 hover:opacity-100"
          title={cleanMode ? "expand" : "clean"}
          data-testid="audio-clean-mode-button"
        >
          {cleanMode ? "open" : "clean"}
        </button>
      </div>
      <audio ref={audioRef} onEnded={onEnded} preload="none" crossOrigin="anonymous" />
    </div>
  );
}
