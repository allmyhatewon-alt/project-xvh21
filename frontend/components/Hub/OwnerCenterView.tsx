"use client";

import { useMemo, useState } from "react";

type Summary = {
  users: number;
  posts: number;
  boards: number;
  gems: number;
  shards: number;
  xp: number;
};

type RecentUser = {
  id: string;
  username: string;
  role: string;
  createdAt: string;
};

type RecentPost = {
  id: string;
  title: string;
  boardSlug: string;
  author: string;
  createdAt: string;
};

type RecentCheckIn = {
  id: string;
  username: string;
  shardsEarned: number;
  streak: number;
  createdAt: string;
};

type SiteSettings = {
  liveEnabled: boolean;
  liveMode: "all" | "restream_only" | "native_only" | "obs_only";
  chatEnabled: boolean;
  chatBotEnabled: boolean;
  clipsEnabled: boolean;
  storeEnabled: boolean;
  profileEffectsEnabled: boolean;
  publicSignupEnabled: boolean;
};

type BotCommand = {
  id: string;
  trigger: string;
  response: string;
  enabled: boolean;
};

type BooleanSettingKey = Exclude<keyof SiteSettings, "liveMode">;

const SWITCH_CONTROLS: Array<{ key: BooleanSettingKey; label: string; note: string }> = [
  { key: "liveEnabled", label: "live rooms", note: "allow creators to publish live rooms" },
  { key: "chatEnabled", label: "hub chat", note: "let signed-in users type in chat" },
  { key: "chatBotEnabled", label: "peng bot", note: "Nightbot-style automated commands" },
  { key: "clipsEnabled", label: "clips", note: "show clip lanes and clip posting paths" },
  { key: "storeEnabled", label: "store", note: "allow marketplace purchases and featured store pushes" },
  { key: "profileEffectsEnabled", label: "profile effects", note: "allow animated/profile cosmetic effects" },
  { key: "publicSignupEnabled", label: "public signup", note: "allow new accounts to register" },
];

const COMMANDS = [
  { label: "push announcement", value: ",announce tonight 9pm est / clips first" },
  { label: "spotlight creator", value: ",spotlight @peng 6h home rail" },
  { label: "grant gems", value: ",grant gems @username 250 reason:first event" },
  { label: "give shards", value: ",give shards @username 500" },
  { label: "feature user", value: ",feature @username home rail" },
  { label: "unfeature user", value: ",unfeature @username" },
  { label: "promote mod", value: ",promote @username mod" },
  { label: "demote staff", value: ",demote @username" },
  { label: "reset streak", value: ",reset streak @username" },
  { label: "site night mode", value: ",site night on" },
  { label: "feature store item", value: ",store feature name-glow" },
  { label: "maintenance toggle", value: ",maintenance off" },
  { label: "staff help", value: ",help" },
];

export function OwnerCenterView({
  summary,
  recentUsers,
  recentPosts,
  recentCheckIns,
  settings,
  botCommands,
}: {
  summary: Summary;
  recentUsers: RecentUser[];
  recentPosts: RecentPost[];
  recentCheckIns: RecentCheckIn[];
  settings: SiteSettings;
  botCommands: BotCommand[];
}) {
  const [controlSettings, setControlSettings] = useState(settings);
  const [commands, setCommands] = useState(botCommands);
  const [copied, setCopied] = useState<string | null>(null);
  const [status, setStatus] = useState("owner room is live");

  const timeline = useMemo(() => {
    const lines = [
      ...recentCheckIns.map((item) => ({
        id: `check-${item.id}`,
        ts: item.createdAt,
        line: `check-in: @${item.username} pulled ${item.shardsEarned} shards and hit streak ${item.streak}`,
      })),
      ...recentPosts.map((item) => ({
        id: `post-${item.id}`,
        ts: item.createdAt,
        line: `post: @${item.author} dropped "${item.title}" in b/${item.boardSlug}`,
      })),
      ...recentUsers.map((item) => ({
        id: `user-${item.id}`,
        ts: item.createdAt,
        line: `signup: @${item.username} came in as ${item.role.toLowerCase()}`,
      })),
    ];

    return lines
      .sort((a, b) => +new Date(b.ts) - +new Date(a.ts))
      .slice(0, 8);
  }, [recentCheckIns, recentPosts, recentUsers]);

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

  async function saveSettings(next: SiteSettings) {
    setControlSettings(next);
    setStatus("saving controls...");
    const res = await fetch("/api/owner/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: next }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.settings) {
      setControlSettings(data.settings);
      setStatus("owner controls saved");
    } else {
      setStatus(data.error ?? "controls did not save");
    }
  }

  async function saveCommands(next = commands) {
    setCommands(next);
    setStatus("saving bot commands...");
    const res = await fetch("/api/owner/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commands: next }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.commands) {
      setCommands(data.commands);
      setStatus("bot commands saved");
    } else {
      setStatus(data.error ?? "bot commands did not save");
    }
  }

  function toggleSetting(key: BooleanSettingKey) {
    saveSettings({ ...controlSettings, [key]: !controlSettings[key] });
  }

  return (
    <div className="max-w-[1100px] space-y-6" data-testid="owner-center-view">
      <div className="peng-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] tracking-[0.28em] text-[var(--accent)]" style={{ fontFamily: "var(--font-mono)" }}>
              OWNER MODE
            </p>
            <h1 className="hub-heading mt-2">
              owner center
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/58">
              This is your control room. Flip what needs flipping, watch the room, and keep the site feeling on purpose.
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
        <StatCard label="boards" value={summary.boards} tint="var(--shard-color)" />
        <StatCard label="gems" value={summary.gems} tint="var(--gem-color)" />
        <StatCard label="shards" value={summary.shards} tint="var(--shard-color)" />
        <StatCard label="xp" value={summary.xp} tint="var(--xp-color)" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="peng-card">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] tracking-[0.24em] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
                  SWITCHBOARD
                </p>
                <p className="mt-1 text-sm text-white">Keep the room feeling right.</p>
              </div>
            </div>
            <div className="space-y-3">
              {SWITCH_CONTROLS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleSetting(item.key)}
                  className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-[var(--accent)]/40"
                  data-testid={`owner-switch-${item.key}`}
                >
                  <div>
                    <p className="text-sm text-white">{item.label}</p>
                    <p className="mt-1 text-[11px] text-white/42" style={{ fontFamily: "var(--font-mono)" }}>
                      {item.note}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] tracking-[0.22em] ${
                      controlSettings[item.key] ? "bg-[var(--accent)]/18 text-[var(--accent)]" : "bg-white/[0.06] text-white/40"
                    }`}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {controlSettings[item.key] ? "ON" : "OFF"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="peng-card">
            <p className="text-[10px] tracking-[0.24em] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
              LIVE STREAM POLICY
            </p>
            <p className="mt-1 text-sm text-white/58">Choose what kind of streaming creators can use.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                { value: "all", label: "all modes", note: "native, OBS, and restream links" },
                { value: "restream_only", label: "restream only", note: "Twitch, Kick, YouTube, Bunny, HLS, custom" },
                { value: "native_only", label: "native only", note: "camera and screen share inside Pengelus" },
                { value: "obs_only", label: "OBS only", note: "MediaMTX stream key ingest" },
              ].map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => saveSettings({ ...controlSettings, liveMode: mode.value as SiteSettings["liveMode"] })}
                  className={`rounded-lg border px-3 py-3 text-left transition ${controlSettings.liveMode === mode.value ? "border-[var(--accent)]/40 bg-[var(--accent)]/10" : "border-white/10 bg-white/[0.03] hover:border-white/20"}`}
                  data-testid={`owner-live-mode-${mode.value}`}
                >
                  <strong className="block text-sm text-white">{mode.label}</strong>
                  <span className="mt-1 block text-[11px] text-white/42" style={{ fontFamily: "var(--font-mono)" }}>{mode.note}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="peng-card">
            <p className="text-[10px] tracking-[0.24em] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
              QUICK COMMANDS
            </p>
            <div className="mt-4 space-y-3">
              {COMMANDS.map((command) => (
                <div key={command.label} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-white">{command.label}</p>
                    <button
                      type="button"
                      onClick={() => copyCommand(command.label, command.value)}
                      className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/55 transition hover:border-[var(--accent)]/35 hover:text-white"
                      data-testid={`owner-command-${command.label.replace(/\s+/g, "-")}`}
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
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] tracking-[0.24em] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
                  PENG BOT
                </p>
                <p className="mt-1 text-sm text-white">Nightbot-style chat commands.</p>
              </div>
              <button type="button" onClick={() => saveCommands()} className="peng-btn peng-btn-primary text-xs" data-testid="save-bot-commands">save bot</button>
            </div>
            <div className="space-y-3">
              {commands.map((command, index) => (
                <div key={command.id || command.trigger} className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      value={command.trigger}
                      onChange={(e) => setCommands((items) => items.map((item, i) => i === index ? { ...item, trigger: e.target.value } : item))}
                      className="w-32 rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setCommands((items) => items.map((item, i) => i === index ? { ...item, enabled: !item.enabled } : item))}
                      className={`rounded-full px-3 py-1 text-[10px] ${command.enabled ? "bg-[var(--accent)]/18 text-[var(--accent)]" : "bg-white/[0.06] text-white/40"}`}
                    >
                      {command.enabled ? "ON" : "OFF"}
                    </button>
                  </div>
                  <input
                    value={command.response}
                    onChange={(e) => setCommands((items) => items.map((item, i) => i === index ? { ...item, response: e.target.value } : item))}
                    className="rounded border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-white outline-none"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCommands((items) => [...items, { id: `new-${Date.now()}`, trigger: "!new", response: "New command response.", enabled: true }])}
                className="peng-btn peng-btn-ghost text-xs"
              >
                add command
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="peng-card">
            <p className="text-[10px] tracking-[0.24em] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
              LIVE LOGS
            </p>
            <div className="mt-4 space-y-2">
              {timeline.map((item) => (
                <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                  <p className="text-[11px] text-white/75">{item.line}</p>
                  <p className="mt-1 text-[10px] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>
                    {new Date(item.ts).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="peng-card">
            <p className="text-[10px] tracking-[0.24em] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
              FRESH EYES
            </p>
            <div className="mt-4 space-y-3">
              {recentUsers.slice(0, 4).map((item) => (
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
