"use client";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";
import { useAuth } from "@/app/providers";
import Link from "next/link";
import { useState } from "react";

export default function SettingsPage() {
  const { user, signOut, refresh } = useAuth();
  if (!user) {
    return (
      <HubShell rightRail={<RightRail />}>
        <div className="hub-page-wrap">
          <div className="hub-empty-room">
            <div>
              <p className="hub-empty-room-title">settings are locked</p>
              <p className="hub-empty-room-copy">sign in and this room opens up.</p>
            </div>
            <Link href="/auth/signin" className="peng-btn peng-btn-primary text-xs">sign in</Link>
          </div>
        </div>
      </HubShell>
    );
  }
  return (
    <HubShell rightRail={<RightRail />}>
      <div className="hub-page-wrap">
        <section className="hub-page-hero">
          <div>
            <p className="hub-page-kicker">account room</p>
            <h1 className="hub-page-title mb-1">settings</h1>
            <p className="hub-page-sub">account, profile controls, and session stuff</p>
          </div>
          <div className="hub-page-hero-mark" aria-hidden="true">?</div>
        </section>

        <div className="hub-settings-grid">
          {/* Profile card */}
          <ProfileForm user={user} refresh={refresh} />

          {/* Account card (email + password) */}
          <AccountForm user={user} refresh={refresh} />

          {/* Customization */}
          <div className="peng-card hub-settings-card space-y-3">
            <p className="settings-section-label">CUSTOMIZATION</p>
            <Link href="/hub/showcase" className="peng-btn peng-btn-ghost text-xs w-full" data-testid="settings-customize-showcase">Customize Profile</Link>
            <Link href="/hub/space/edit" className="peng-btn peng-btn-ghost text-xs w-full" data-testid="settings-edit-space">Edit Spotlight</Link>
          </div>

          {/* Session */}
          <div className="peng-card hub-settings-card">
            <p className="settings-section-label mb-2">SESSION</p>
            <div className="flex items-center justify-between text-xs py-1" style={{ fontFamily: "var(--font-mono)" }}>
              <span className="text-white/40">username</span>
              <span className="text-white">@{user.username}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1" style={{ fontFamily: "var(--font-mono)" }}>
              <span className="text-white/40">role</span>
              <span className="text-white">{user.role}</span>
            </div>
            <div className="mt-4">
              <button onClick={signOut} className="peng-btn peng-btn-ghost text-xs text-red-400 hover:text-red-300 w-full" data-testid="settings-sign-out">Sign Out</button>
            </div>
          </div>
        </div>
      </div>
    </HubShell>
  );
}

function ProfileForm({ user, refresh }: { user: any; refresh: () => void }) {
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [status, setStatus] = useState(user.status ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [accentColor, setAccentColor] = useState(user.accentColor ?? "#8b5cf6");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, status: status || null, bio: bio || null, accentColor }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { setMsg("saved."); refresh(); }
    else setMsg(data.error ?? "save failed");
    setTimeout(() => setMsg(""), 2500);
  }

  return (
    <div className="peng-card hub-settings-card space-y-3">
      <p className="settings-section-label">PROFILE</p>
      <SettingsField label="display name">
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
          className="settings-input"
          data-testid="settings-display-name"
        />
      </SettingsField>
      <SettingsField label="status">
        <input
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          maxLength={90}
          placeholder="what are you up to?"
          className="settings-input"
          data-testid="settings-status"
        />
      </SettingsField>
      <SettingsField label="bio">
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="something about you"
          className="settings-input settings-textarea"
          data-testid="settings-bio"
        />
      </SettingsField>
      <SettingsField label="accent color">
        <div className="flex items-center gap-2">
          <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="settings-color-swatch" data-testid="settings-accent" />
          <span className="text-xs text-white/40" style={{ fontFamily: "var(--font-mono)" }}>{accentColor}</span>
        </div>
      </SettingsField>
      <div className="flex items-center justify-between pt-1">
        {msg && <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: msg === "saved." ? "var(--accent-2)" : "#f87171" }}>{msg}</span>}
        <button onClick={save} disabled={saving} className="peng-btn peng-btn-primary text-xs ml-auto" data-testid="settings-save-profile">
          {saving ? "saving..." : "save profile"}
        </button>
      </div>
    </div>
  );
}

function AccountForm({ user, refresh }: { user: any; refresh: () => void }) {
  const [email, setEmail] = useState(user.email ?? "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    if (!currentPw) { setMsg("current password required to make changes"); return; }
    setSaving(true);
    setMsg("");
    const body: any = { currentPassword: currentPw };
    if (email !== user.email) body.newEmail = email;
    if (newPw) body.newPassword = newPw;
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { setMsg("account updated."); setCurrentPw(""); setNewPw(""); refresh(); }
    else setMsg(data.error ?? "update failed");
    setTimeout(() => setMsg(""), 3000);
  }

  return (
    <div className="peng-card hub-settings-card space-y-3">
      <p className="settings-section-label">ACCOUNT</p>
      <SettingsField label="email">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="settings-input"
          data-testid="settings-email"
        />
      </SettingsField>
      <SettingsField label="current password">
        <input
          type="password"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          placeholder="required to make changes"
          className="settings-input"
          data-testid="settings-current-pw"
          autoComplete="current-password"
        />
      </SettingsField>
      <SettingsField label="new password">
        <input
          type="password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          placeholder="leave blank to keep current"
          className="settings-input"
          data-testid="settings-new-pw"
          autoComplete="new-password"
        />
      </SettingsField>
      <div className="flex items-center justify-between pt-1">
        {msg && <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: msg.includes("updated") ? "var(--accent-2)" : "#f87171" }}>{msg}</span>}
        <button onClick={save} disabled={saving} className="peng-btn peng-btn-primary text-xs ml-auto" data-testid="settings-save-account">
          {saving ? "saving..." : "update account"}
        </button>
      </div>
    </div>
  );
}

function SettingsField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="settings-field">
      <label className="settings-field-label">{label}</label>
      {children}
    </div>
  );
}
