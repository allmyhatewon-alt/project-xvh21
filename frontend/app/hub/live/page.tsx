"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";

type LiveStream = {
  id: string;
  title: string;
  category: string;
  platform: string;
  embedUrl: string;
  playerKind: string;
  thumbnailUrl: string | null;
  isLive: boolean;
  viewerCount: number;
  startedAt: string | null;
  user: { username: string; displayName: string; image: string | null; accentColor: string; status: string | null };
};

export default function LiveNowPage() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const featured = streams[0];
  const totalViewers = streams.reduce((sum, stream) => sum + stream.viewerCount, 0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/live", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setStreams(data.streams ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = window.setInterval(load, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <HubShell rightRail={<RightRail />}>
      <div className="hub-page-wrap live-page">
        <section className="live-hero">
          <div>
            <p className="hub-page-kicker">pengelus live</p>
            <h1 className="hub-page-title mb-1">watch rooms</h1>
            <p className="hub-page-sub">Creator streams and chat rooms without leaving the hub.</p>
          </div>
          <div className="live-hero-pulse" data-testid="live-pulse-card">
            <span className="live-hero-dot" />
            <div>
              <strong>{streams.length}</strong>
              <span>live</span>
            </div>
            <div>
              <strong>{totalViewers}</strong>
              <span>watching</span>
            </div>
          </div>
        </section>

        <section className="live-studio-callout">
          <div>
            <span>creator studio</span>
            <strong>ready to go live?</strong>
            <small>Use camera, screen share, OBS ingest, or an external embed when it fits the stream.</small>
          </div>
          <Link href="/hub/live/studio" className="peng-btn peng-btn-primary text-xs" data-testid="go-live-studio-link">
            open studio
          </Link>
        </section>

        {featured && (
          <section className="live-featured-stage" data-testid="live-featured-stage">
            <div className="live-player-shell">
              <StreamPlayer stream={featured} />
            </div>
            <div className="live-featured-info">
              <span className="live-card-badge">LIVE</span>
              <h2>{featured.title}</h2>
              <p>@{featured.user.username} / {featured.category} / {featured.platform}</p>
              <Link href={`/hub/live/${featured.user.username}`} className="peng-btn peng-btn-primary text-xs">
                enter room
              </Link>
            </div>
          </section>
        )}

        <section className="discover-section">
          <header className="discover-section-head">
            <h2>streaming now</h2>
            <span className="discover-section-meta">{loading ? "checking..." : "updated live"}</span>
          </header>
          <div className="live-grid" data-testid="live-now-grid">
            {!loading && streams.length === 0 && (
              <div className="hub-empty-room live-empty-room">
                <div>
                  <p className="hub-empty-room-title">nobody is live yet</p>
                  <p className="hub-empty-room-copy">Be the first stream on the board. Start with a clear title and one reason to watch.</p>
                </div>
                <Link href="/hub/live/studio" className="peng-btn peng-btn-primary text-xs">go live</Link>
              </div>
            )}
            {streams.map((stream) => (
              <Link key={stream.id} href={`/hub/live/${stream.user.username}`} className="live-card" data-testid={`live-stream-${stream.id}`}>
                <div className="live-card-thumb" style={stream.thumbnailUrl ? { backgroundImage: `linear-gradient(180deg, rgba(5,8,16,0.08), rgba(5,8,16,0.78)), url(${stream.thumbnailUrl})` } : undefined}>
                  <span className="live-card-badge">LIVE</span>
                  {stream.playerKind === "native" && <span className="live-card-native">native</span>}
                  <span className="live-card-viewers">live / {stream.viewerCount}</span>
                  <span className="live-card-play">{">"}</span>
                </div>
                <p className="live-card-title">{stream.title}</p>
                <p className="live-card-meta">@{stream.user.username} / #{stream.category}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </HubShell>
  );
}

function StreamPlayer({ stream }: { stream: LiveStream }) {
  if (stream.playerKind === "native") {
    return (
      <div className="live-native-directory-preview">
        <span className="live-native-orb" />
        <strong>pengelus native room</strong>
        <p>enter the room for the camera/screen stream, chat, and gifts</p>
      </div>
    );
  }
  if (!stream.embedUrl) {
    return <div className="live-player-empty">stream source not set yet</div>;
  }
  if (stream.playerKind === "video") {
    return <video src={stream.embedUrl} controls autoPlay muted playsInline className="live-player-frame" />;
  }
  return <iframe src={stream.embedUrl} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="live-player-frame" title={stream.title} />;
}
