"use client";

import { useMemo, useState } from "react";

type Summary = {
  users: number;
  posts: number;
  comments: number;
  boards: number;
  admins: number;
  mods: number;
};

type QueuePost = {
  id: string;
  title: string;
  author: string;
  boardSlug: string;
  comments: number;
  score: number;
  createdAt: string;
};

type RecentUser = {
  id: string;
  username: string;
  role: string;
  createdAt: string;
};

type BoardHealth = {
  id: string;
  slug: string;
  name: string;
  postCount: number;
};

type ModAction = {
  id: string;
  command: string;
  targetUsername: string | null;
  reason: string | null;
  moderator: string;
  createdAt: string;
};

type Restriction = {
  id: string;
  kind: string;
  username: string;
  reason: string | null;
  expiresAt: string | null;
  createdAt: string;
};

const DEFAULT_SWITCHES = [
  { id: "feed-lock", label: "feed lock", note: "freeze new posts while you clean something up", enabled: false },
  { id: "open-signups", label: "open signups", note: "keep registration live", enabled: true },
  { id: "clips-priority", label: "clips priority", note: "nudge clips slightly higher on home", enabled: true },
];

const ADMIN_COMMANDS = [
  { label: "help menu", value: ",help" },
  { label: "ban user", value: ",ban @username reason" },
  { label: "kick user", value: ",kick @username reason" },
  { label: "warn user", value: ",warn @username chill out" },
  { label: "mute user", value: ",mute @username 10m" },
  { label: "slow mode", value: ",slowmode 30s" },
  { label: "announce", value: ",announce quick room note" },
  { label: "pin post", value: ",pin postId" },
  { label: "lock chat", value: ",lock chat" },
  { label: "unlock chat", value: ",unlock chat" },
  { label: "room status", value: ",status" },
  { label: "clear marker", value: ",clear" },
];

export function AdminConsoleView({
  summary,
  queue,
  recentUsers,
  boards,
  modActions,
  restrictions,
}: {
  summary: Summary;
  queue: QueuePost[];
  recentUsers: RecentUser[];
  boards: BoardHealth[];
  modActions: ModAction[];
  restrictions: Restriction[];
}) {
  const [switches, setSwitches] = useState(DEFAULT_SWITCHES);
  const [handled, setHandled] = useState<string[]>([]);
  const [status, setStatus] = useState("moderation board ready");
  const [copied, setCopied] = useState<string | null>(null);

  const pendingQueue = useMemo(
    () => queue.filter((item) => !handled.includes(item.id)),
    [handled, queue],
  );

  function toggleSwitch(id: string) {
    setSwitches((items) => items.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
    setStatus("admin switches updated");
  }

  function markHandled(id: string) {
    setHandled((items) => [...items, id]);
    setStatus("queue item handled");
  }

  async function copyCommand(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setStatus(`${label} copied`);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setStatus("copy missed, try again");
    }
  }

  return (
    <div className="max-w-[1100px] space-y-6" data-testid="admin-console-view">
      <div className="peng-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] tracking-[0.28em] text-[var(--accent)]" style={{ fontFamily: "var(--font-mono)" }}>
              ADMIN MODE
            </p>
            <h1 className="hub-heading mt-2">
              admin console
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/58">
              This is the cleanup room. Watch the queue, keep the boards readable, and make sure the place still feels human.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] text-white/60" style={{ fontFamily: "var(--font-mono)" }}>
            {status}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="users" value={summary.users} tint="var(--accent)" />
        <StatCard label="posts" value={summary.posts} tint="var(--xp-color)" />
        <StatCard label="comments" value={summary.comments} tint="var(--shard-color)" />
        <StatCard label="boards" value={summary.boards} tint="var(--gem-color)" />
        <StatCard label="admins" value={summary.admins} tint="var(--accent)" />
        <StatCard label="mods" value={summary.mods} tint="var(--xp-color)" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="peng-card">
            <p className="text-[10px] tracking-[0.24em] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
              ACTIVE RESTRICTIONS
            </p>
            <div className="mt-4 space-y-3">
              {restrictions.length === 0 && <p className="text-xs text-white/35">no bans or mutes active.</p>}
              {restrictions.map((item) => (
                <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white">@{item.username}</p>
                    <span className="rounded-full bg-red-500/10 px-3 py-1 text-[10px] text-red-200" style={{ fontFamily: "var(--font-mono)" }}>{item.kind.replace("CHAT_", "")}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
                    {item.reason || "no reason"} {item.expiresAt ? `/ until ${new Date(item.expiresAt).toLocaleString()}` : "/ permanent"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="peng-card">
            <p className="text-[10px] tracking-[0.24em] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
              MOD LOGS
            </p>
            <div className="mt-4 space-y-2">
              {modActions.length === 0 && <p className="text-xs text-white/35">no command logs yet.</p>}
              {modActions.map((item) => (
                <div key={item.id} className="rounded-lg border border-white/10 bg-black/15 px-3 py-2">
                  <p className="text-[11px] text-white/75">
                    @{item.moderator} ran <span className="text-[var(--accent)]">{item.command}</span>{item.targetUsername ? ` on @${item.targetUsername}` : ""}
                  </p>
                  <p className="mt-1 text-[10px] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>
                    {item.reason || "no reason"} / {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="peng-card">
            <p className="text-[10px] tracking-[0.24em] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
              QUICK SWITCHES
            </p>
            <div className="mt-4 space-y-3">
              {switches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleSwitch(item.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-[var(--accent)]/40"
                  data-testid={`admin-switch-${item.id}`}
                >
                  <div>
                    <p className="text-sm text-white">{item.label}</p>
                    <p className="mt-1 text-[11px] text-white/42" style={{ fontFamily: "var(--font-mono)" }}>
                      {item.note}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] tracking-[0.22em] ${
                      item.enabled ? "bg-[var(--accent)]/18 text-[var(--accent)]" : "bg-white/[0.06] text-white/40"
                    }`}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {item.enabled ? "ON" : "OFF"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="peng-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] tracking-[0.24em] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
                  REVIEW QUEUE
                </p>
                <p className="mt-1 text-sm text-white">Fresh stuff worth a look.</p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/45" style={{ fontFamily: "var(--font-mono)" }}>
                {pendingQueue.length} open
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {pendingQueue.length === 0 && (
                <div className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-5 text-sm text-white/45">
                  Queue is clear for now.
                </div>
              )}
              {pendingQueue.map((item) => (
                <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">{item.title}</p>
                      <p className="mt-1 text-[10px] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
                        @{item.author} / b/{item.boardSlug} / {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => markHandled(item.id)}
                        className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/55 transition hover:border-[var(--accent)]/35 hover:text-white"
                        data-testid={`admin-handle-${item.id}`}
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        handled
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-3 text-[11px] text-white/45" style={{ fontFamily: "var(--font-mono)" }}>
                    <span>{item.comments} comments</span>
                    <span>{item.score} score</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="peng-card">
            <p className="text-[10px] tracking-[0.24em] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
              CHAT COMMANDS
            </p>
            <p className="mt-1 text-sm text-white/58">
              Paste these in live chat. They answer like Discord commands and stay locked to staff.
            </p>
            <div className="mt-4 space-y-3">
              {ADMIN_COMMANDS.map((command) => (
                <div key={command.label} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-white">{command.label}</p>
                    <button
                      type="button"
                      onClick={() => copyCommand(command.label, command.value)}
                      className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/55 transition hover:border-[var(--accent)]/35 hover:text-white"
                      data-testid={`admin-command-${command.label.replace(/\s+/g, "-")}`}
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {copied === command.label ? "copied" : "copy"}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-white/45" style={{ fontFamily: "var(--font-mono)" }}>
                    {command.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="peng-card">
            <p className="text-[10px] tracking-[0.24em] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
              NEW PEOPLE
            </p>
            <div className="mt-4 space-y-3">
              {recentUsers.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-3">
                  <div>
                    <p className="text-sm text-white">@{item.username}</p>
                    <p className="mt-1 text-[10px] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
                      {item.role.toLowerCase()} joined {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[10px] text-white/45" style={{ fontFamily: "var(--font-mono)" }}>
                    watch
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="peng-card">
            <p className="text-[10px] tracking-[0.24em] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
              BOARD HEALTH
            </p>
            <div className="mt-4 space-y-3">
              {boards.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-3">
                  <div>
                    <p className="text-sm text-white">{item.name}</p>
                    <p className="mt-1 text-[10px] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
                      b/{item.slug}
                    </p>
                  </div>
                  <span className="text-sm text-[var(--xp-color)]" style={{ fontFamily: "var(--font-mono)" }}>
                    {item.postCount} posts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <div className="peng-card">
      <p className="text-[10px] tracking-[0.24em] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
        {label}
      </p>
      <p className="admin-stat-number mt-3" style={{ color: tint }}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}
