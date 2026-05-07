"use client";
import { useEffect, useState, useCallback } from "react";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";
import { useAuth } from "@/app/providers";
import Link from "next/link";

type Quest = {
  id: string;
  label: string;
  reward: string;
  xp: number;
  shards: number;
  icon: string;
  done: boolean;
  claimed: boolean;
  href: string;
};

const QUEST_HREFS: Record<string, string> = {
  checkin:  "/hub",
  post:     "/hub/post/new",
  comment:  "/hub",
  vote:     "/hub",
  showcase: "/hub/showcase",
  space:    "/hub/space/edit",
};

export default function QuestsPage() {
  const { user, refresh } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimStatus, setClaimStatus] = useState<Record<string, string>>({});

  const loadQuests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quests", { cache: "no-store" });
      const data = await res.json();
      setQuests((data.quests ?? []).map((q: any) => ({
        ...q,
        reward: `+${q.xp} xp${q.shards > 0 ? ` / +${q.shards} shards` : ""}`,
        href: QUEST_HREFS[q.id] ?? "/hub",
      })));
    } catch {
      setQuests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  async function claimQuest(questId: string) {
    setClaimStatus((s) => ({ ...s, [questId]: "claiming..." }));
    const res = await fetch("/api/quests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questId }),
    });
    const data = await res.json();
    if (res.ok) {
      setClaimStatus((s) => ({ ...s, [questId]: `+${data.xp} xp claimed!` }));
      refresh();
      loadQuests();
    } else {
      setClaimStatus((s) => ({ ...s, [questId]: data.error ?? "failed" }));
    }
    setTimeout(() => setClaimStatus((s) => { const n = { ...s }; delete n[questId]; return n; }), 2500);
  }

  const totalXp = quests.reduce((sum, q) => sum + (q.done ? q.xp : 0), 0);
  const completedCount = quests.filter((q) => q.done).length;
  const claimedCount = quests.filter((q) => q.claimed).length;

  return (
    <HubShell rightRail={<RightRail />}>
      <div className="hub-page-wrap">
        <section className="hub-page-hero">
          <div>
            <p className="hub-page-kicker">daily route</p>
            <h1 className="hub-page-title mb-1">daily quests</h1>
            <p className="hub-page-sub">small wins, streaks, xp, and reasons to come back</p>
          </div>
          <div className="hub-page-hero-mark" aria-hidden="true">+</div>
        </section>

        {user && (
          <div className="quests-summary peng-card mb-4">
            <div className="quests-summary-row">
              <span className="quests-summary-label">streak</span>
              <strong className="quests-summary-val">{user.streakCount ?? 0} days</strong>
            </div>
            <div className="quests-summary-row">
              <span className="quests-summary-label">today</span>
              <strong className="quests-summary-val">{completedCount}/{quests.length} done</strong>
            </div>
            <div className="quests-summary-row">
              <span className="quests-summary-label">xp available</span>
              <strong className="quests-summary-val" style={{ color: "var(--xp-color)" }}>+{totalXp}</strong>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-xs text-white/30 py-6 text-center" style={{ fontFamily: "var(--font-mono)" }}>loading quests...</p>
        ) : (
          <div className="hub-quest-grid" data-testid="quests-list">
            {quests.map((q) => (
              <div key={q.id} className={`peng-card hub-quest-card ${q.done ? "is-done" : ""} ${q.claimed ? "is-claimed" : ""}`} data-testid={q.id}>
                <div className="hub-quest-icon" aria-hidden="true">{q.icon}</div>
                <div className="hub-quest-body">
                  <p className="hub-quest-label">{q.label}</p>
                  <p className="hub-quest-reward">{q.reward}</p>
                  {claimStatus[q.id] && (
                    <p className="hub-quest-claim-msg">{claimStatus[q.id]}</p>
                  )}
                </div>
                <div className="hub-quest-actions">
                  {q.claimed ? (
                    <span className="hub-quest-badge">claimed</span>
                  ) : q.done && user ? (
                    <button type="button" onClick={() => claimQuest(q.id)} className="peng-btn peng-btn-primary text-[10px] px-3 py-1" data-testid={`claim-${q.id}`}>
                      claim
                    </button>
                  ) : (
                    <Link href={q.href} className="hub-quest-go text-white/40" data-testid={`go-${q.id}`}>
                      {q.done ? "✓" : "→"}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!user && (
          <div className="peng-card hub-empty-room mt-4">
            <div>
              <p className="hub-empty-room-title">sign in to track quests</p>
              <p className="hub-empty-room-copy">quests save per account — streaks, xp, all of it</p>
            </div>
            <Link href="/auth/signin" className="peng-btn peng-btn-primary text-xs">sign in</Link>
          </div>
        )}
      </div>
    </HubShell>
  );
}
