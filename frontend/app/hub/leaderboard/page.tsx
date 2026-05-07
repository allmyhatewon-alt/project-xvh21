"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";
import { useAuth } from "@/app/providers";

type LeaderboardUser = {
  id: string;
  username: string;
  displayName: string;
  image: string | null;
  accentColor: string;
  xp: number;
  level: number;
  shards: number;
  streakCount: number;
  isLive: boolean;
};

const PERIODS = [
  { key: "all",    label: "all time" },
  { key: "month",  label: "this month" },
  { key: "week",   label: "this week" },
  { key: "streak", label: "streaks" },
] as const;

export default function LeaderboardPage() {
  const { user: me } = useAuth();
  const [period, setPeriod] = useState<typeof PERIODS[number]["key"]>("all");
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => { setUsers(data.users ?? []); setLoading(false); })
      .catch(() => { setUsers([]); setLoading(false); });
  }, [period]);

  return (
    <HubShell rightRail={<RightRail />}>
      <div className="hub-page-wrap">
        <section className="hub-page-hero">
          <div>
            <p className="hub-page-kicker">top of the hub</p>
            <h1 className="hub-page-title mb-1">leaderboard</h1>
            <p className="hub-page-sub">xp, streaks, and people who keep showing up</p>
          </div>
          <div className="hub-page-hero-mark" aria-hidden="true">1</div>
        </section>

        {/* Period filter */}
        <div className="leaderboard-filter-row" data-testid="leaderboard-filters">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`leaderboard-filter-btn ${period === p.key ? "is-on" : ""}`}
              data-testid={`leaderboard-period-${p.key}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading && (
          <p className="py-8 text-center text-xs text-white/30" style={{ fontFamily: "var(--font-mono)" }}>loading...</p>
        )}

        {!loading && users.length === 0 && (
          <div className="peng-card hub-empty-room">
            <div>
              <p className="hub-empty-room-title">no one on the board yet</p>
              <p className="hub-empty-room-copy">check in daily, post, and earn xp to appear here.</p>
            </div>
            <Link href="/hub/quests" className="peng-btn peng-btn-primary text-xs">do daily quests</Link>
          </div>
        )}

        <ol className="hub-rank-list" data-testid="leaderboard-list">
          {users.map((u, i) => {
            const isMe = me?.id === u.id;
            return (
              <li key={u.id} className={`peng-card hub-rank-row ${isMe ? "is-me" : ""} ${u.isLive ? "is-live" : ""}`} data-testid={`leaderboard-row-${u.username}`}>
                <span className="hub-rank-pos" style={{ color: i < 3 ? "var(--accent)" : "var(--text-dim)" }}>
                  {i === 0 ? "◆" : i === 1 ? "◈" : i === 2 ? "·" : i + 1}
                </span>
                <Link href={`/hub/user/${u.username}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: `${u.accentColor}33` }}>
                    {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : <span className="text-sm" style={{ color: u.accentColor }}>{u.username.slice(0, 1).toUpperCase()}</span>}
                    {u.isLive && <span className="rank-live-pip" aria-label="live" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate" style={{ fontFamily: "var(--font-mono)" }}>{u.displayName}{isMe ? " (you)" : ""}</p>
                    <p className="text-[10px] text-white/40 truncate" style={{ fontFamily: "var(--font-mono)" }}>@{u.username} · LVL {u.level}</p>
                  </div>
                </Link>
                <div className="hub-rank-stats">
                  <div className="hub-rank-stat">
                    <span style={{ color: "var(--xp-color)" }}>{u.xp.toLocaleString()}</span>
                    <small>xp</small>
                  </div>
                  <div className="hub-rank-stat">
                    <span style={{ color: "var(--gem-color)" }}>🔥 {u.streakCount}</span>
                    <small>streak</small>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </HubShell>
  );
}
