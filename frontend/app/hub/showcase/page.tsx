"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";
import { useAuth } from "@/app/providers";
import { BlockEditor } from "@/components/SpaceEditor/BlockEditor";
import { BlockRenderer, type Block } from "@/components/BlockRenderer/BlockRenderer";

export default function ShowcasePage() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [showcase, setShowcase] = useState<Block[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");
  const [portalLabel, setPortalLabel] = useState("Enter Spotlight");
  const [portalEnabled, setPortalEnabled] = useState(true);
  const [socials, setSocials] = useState<any>({});
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState("");
  const [accent, setAccent] = useState("#8b5cf6");
  const [saved, setSaved] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Account / security
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountMsg, setAccountMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);

  useEffect(() => {
    fetch("/api/showcase").then((r) => r.json()).then((d) => {
      if (d.profile) {
        setProfile(d.profile);
        setShowcase(d.profile.showcase || []);
        setInterests(d.profile.interests || []);
        setPortalLabel(d.profile.portalLabel === "Enter My Space" || d.profile.portalLabel === "Enter My Links" ? "Enter Spotlight" : d.profile.portalLabel);
        setPortalEnabled(d.profile.portalEnabled);
        setSocials({
          tiktokUrl: d.profile.tiktokUrl ?? "",
          twitchUrl: d.profile.twitchUrl ?? "",
          youtubeUrl: d.profile.youtubeUrl ?? "",
          twitterUrl: d.profile.twitterUrl ?? "",
          instagramUrl: d.profile.instagramUrl ?? "",
          kickUrl: d.profile.kickUrl ?? "",
          discordUser: d.profile.discordUser ?? "",
        });
      }
    });
    if (user) {
      setDisplayName(user.displayName ?? "");
      setBio(user.bio ?? "");
      setStatus(user.status ?? "");
      setAccent(user.accentColor);
      setImage(user.image ?? null);
      setBannerUrl(user.bannerUrl ?? null);
    }
  }, [user]);

  async function uploadProfileMedia(file: File, kind: "profile_image" | "profile_banner") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "upload failed");
    return data.url as string;
  }

  async function onPickMedia(file: File | null, kind: "profile_image" | "profile_banner") {
    if (!file) return;
    setSaved(kind === "profile_image" ? "uploading avatar..." : "uploading banner...");
    try {
      const url = await uploadProfileMedia(file, kind);
      if (kind === "profile_image") setImage(url);
      if (kind === "profile_banner") setBannerUrl(url);
      setSaved(kind === "profile_image" ? "avatar ready" : "banner ready");
    } catch (error: any) {
      setSaved(error.message ?? "upload failed");
    }
  }

  async function saveAccount() {
    if (newPassword && newPassword !== confirmPassword) {
      setAccountMsg({ type: "err", text: "new passwords don't match" });
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setAccountMsg({ type: "err", text: "password must be at least 8 characters" });
      return;
    }
    if (!newEmail && !newPassword) {
      setAccountMsg({ type: "err", text: "nothing to update" });
      return;
    }
    setSavingAccount(true);
    setAccountMsg(null);
    const body: Record<string, string> = {};
    if (newEmail.trim()) body.newEmail = newEmail.trim();
    if (newPassword) { body.currentPassword = currentPassword; body.newPassword = newPassword; }
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setAccountMsg({ type: "ok", text: "account updated" });
      setNewEmail(""); setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      refresh();
      setTimeout(() => setAccountMsg(null), 3000);
    } else {
      setAccountMsg({ type: "err", text: data.error ?? "failed to update" });
    }
    setSavingAccount(false);
  }

  async function save() {
    setSaving(true);
    const [a, b] = await Promise.all([
      fetch("/api/showcase", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showcase,
          interests,
          portalLabel,
          portalEnabled,
          ...socials,
        }),
      }),
      fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, status, accentColor: accent, image, bannerUrl }),
      }),
    ]);
    if (a.ok && b.ok) {
      setSaved("saved");
      refresh();
      setTimeout(() => setSaved(null), 2500);
    } else {
      setSaved("Failed to save");
    }
    setSaving(false);
  }

  if (!user) {
    return (
      <HubShell rightRail={<RightRail />}>
        <p className="text-xs text-white/40 italic">sign in to customize your profile</p>
      </HubShell>
    );
  }

  return (
    <HubShell rightRail={<RightRail />}>
      <div className="max-w-4xl space-y-6 profile-editor-page">
        <div className="spotlight-editor-hero">
          <div>
            <p className="text-[10px] tracking-widest text-[var(--accent)]" style={{ fontFamily: "var(--font-mono)" }}>PROFILE EDITOR</p>
            <h1 className="hub-heading lowercase">edit profile</h1>
            <p className="text-xs text-white/45 mt-1" style={{ fontFamily: "var(--font-mono)" }}>
              banner, status, socials, and the profile blocks people see first.
            </p>
          </div>
          <div className="spotlight-editor-actions">
            <Link href={`/hub/user/${user.username}`} className="peng-btn peng-btn-ghost text-xs" data-testid="view-profile-link" style={{ fontFamily: "var(--font-mono)" }}>
              view profile
            </Link>
            <button
              data-testid="save-showcase-button"
              onClick={save}
              disabled={saving}
              className="peng-btn peng-btn-primary disabled:opacity-40"
            >
              {saving ? "saving..." : "save profile"}
            </button>
          </div>
        </div>

        {/* Profile basics */}
        <Section title="PROFILE">
          <Field label="display name">
            <input
              data-testid="display-name-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              className="w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]"
            />
          </Field>
          <Field label="bio">
            <textarea
              data-testid="bio-input"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]"
            />
          </Field>
          <Field label="status">
            <input
              data-testid="status-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              maxLength={90}
              placeholder="e.g. editing clips, don't bother me"
              className="w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]"
              style={{ fontFamily: "var(--font-mono)" }}
            />
            <p className="mt-1 text-[10px] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
              shows above your name on your hub profile and spotlight
            </p>
          </Field>
          <Field label="accent color">
            <div className="flex items-center gap-2">
              <input
                data-testid="accent-color-input"
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="w-10 h-10 rounded border border-[var(--bg-border)] bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono text-white/60">{accent}</span>
            </div>
          </Field>
          <Field label="profile picture">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-[var(--bg-border)] bg-[var(--bg-elevated)] flex items-center justify-center text-white/40">
                {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : "P"}
              </div>
              <label className="peng-btn peng-btn-ghost text-xs cursor-pointer">
                choose png / jpg / gif
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => onPickMedia(e.target.files?.[0] ?? null, "profile_image")}
                />
              </label>
            </div>
          </Field>
          <Field label="banner">
            <div className="space-y-3">
              <div className="h-24 rounded-lg overflow-hidden border border-[var(--bg-border)] bg-[var(--bg-elevated)] flex items-center justify-center text-white/40">
                {bannerUrl ? <img src={bannerUrl} alt="" className="w-full h-full object-cover" /> : "banner preview"}
              </div>
              <label className="peng-btn peng-btn-ghost text-xs cursor-pointer">
                choose png / jpg / gif
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => onPickMedia(e.target.files?.[0] ?? null, "profile_banner")}
                />
              </label>
            </div>
          </Field>
        </Section>

        {/* Portal */}
        <Section title="SPOTLIGHT">
          <Field label="enabled">
            <label className="inline-flex items-center gap-2 text-xs text-white/70 cursor-pointer">
              <input data-testid="portal-enabled-toggle" type="checkbox" checked={portalEnabled} onChange={(e) => setPortalEnabled(e.target.checked)} />
              show spotlight button on profile
            </label>
          </Field>
          <Field label="button label">
            <input
              data-testid="portal-label-input"
              type="text"
              value={portalLabel}
              onChange={(e) => setPortalLabel(e.target.value)}
              maxLength={40}
              className="w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]"
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </Field>
        </Section>

        {/* Socials */}
        <Section title="SOCIAL LINKS">
          {[
            ["tiktokUrl", "TikTok URL"],
            ["twitchUrl", "Twitch URL"],
            ["youtubeUrl", "YouTube URL"],
            ["twitterUrl", "X / Twitter URL"],
            ["instagramUrl", "Instagram URL"],
            ["kickUrl", "Kick URL"],
            ["discordUser", "Discord username"],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                data-testid={`social-${key}-input`}
                type="text"
                value={socials[key] ?? ""}
                onChange={(e) => setSocials((s: any) => ({ ...s, [key]: e.target.value }))}
                className="w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]"
              />
            </Field>
          ))}
        </Section>

        {/* Interests */}
        <Section title="INTERESTS">
          <div className="flex flex-wrap gap-2 mb-2">
            {interests.map((i, idx) => (
              <span key={idx} className="text-xs px-2 py-1 border border-[var(--bg-border)] rounded text-white/70 flex items-center gap-2" style={{ fontFamily: "var(--font-mono)" }}>
                {i}
                <button onClick={() => setInterests(interests.filter((_, j) => j !== idx))} className="text-red-400 hover:text-red-300" data-testid={`remove-interest-${idx}`}>x</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              data-testid="interest-input"
              type="text"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              placeholder="add an interest"
              className="flex-1 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && interestInput.trim()) {
                  setInterests([...interests, interestInput.trim()]);
                  setInterestInput("");
                  e.preventDefault();
                }
              }}
            />
            <button
              data-testid="add-interest-button"
              onClick={() => { if (interestInput.trim()) { setInterests([...interests, interestInput.trim()]); setInterestInput(""); } }}
              className="peng-btn peng-btn-ghost text-xs"
              type="button"
            >
              + Add
            </button>
          </div>
        </Section>

        {/* Account / Security */}
        <section className="editor-section space-y-3">
          <div>
            <p className="text-[10px] tracking-widest text-[var(--accent)]" style={{ fontFamily: "var(--font-mono)" }}>ACCOUNT &amp; SECURITY</p>
            <p className="text-xs text-white/40 mt-0.5">change your login email or password</p>
          </div>
          <div className="peng-card space-y-4">
            <Field label="new email">
              <input
                data-testid="new-email-input"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={user.email ?? "current email"}
                className="w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]"
              />
              <p className="mt-1 text-[10px] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>leave blank to keep current email</p>
            </Field>
            <div className="border-t border-[var(--bg-border)] pt-4 space-y-3">
              <p className="text-[10px] tracking-widest text-white/30" style={{ fontFamily: "var(--font-mono)" }}>CHANGE PASSWORD</p>
              <Field label="current password">
                <input
                  data-testid="current-password-input"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="required to set a new password"
                  autoComplete="current-password"
                  className="w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]"
                />
              </Field>
              <Field label="new password">
                <input
                  data-testid="new-password-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="min 8 characters"
                  autoComplete="new-password"
                  className="w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]"
                />
              </Field>
              <Field label="confirm new password">
                <input
                  data-testid="confirm-password-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="type it again"
                  autoComplete="new-password"
                  className="w-full bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]"
                />
              </Field>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                data-testid="save-account-button"
                onClick={saveAccount}
                disabled={savingAccount}
                className="peng-btn peng-btn-primary disabled:opacity-40"
              >
                {savingAccount ? "saving..." : "update account"}
              </button>
              {accountMsg && (
                <span
                  data-testid="account-save-status"
                  className={`text-xs ${accountMsg.type === "ok" ? "text-green-400" : "text-red-400"}`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {accountMsg.text}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Showcase blocks */}
        <Section title="PROFILE BLOCKS" sub="set up the extra stuff under your main profile">
          <BlockEditor blocks={showcase} onChange={setShowcase} gemsUnlocked={user.gemsUnlocked} />

          <div className="mt-6">
            <p className="text-[10px] tracking-widest text-white/40 mb-2" style={{ fontFamily: "var(--font-mono)" }}>PREVIEW</p>
            <div className="peng-card p-4 bg-black/40">
              {showcase.length === 0 ? (
                <p className="text-xs text-white/30 italic">no blocks yet</p>
              ) : (
                <BlockRenderer blocks={showcase} isOwner={true} gemsUnlocked={true} />
              )}
            </div>
          </div>
        </Section>

        {/* Save */}
        <div className="flex items-center gap-3 pb-12">
          <button
            data-testid="save-showcase-bottom-button"
            onClick={save}
            disabled={saving}
            className="peng-btn peng-btn-primary disabled:opacity-40"
          >
            {saving ? "saving..." : "save profile"}
          </button>
          {saved && <span className="text-xs text-green-400" data-testid="save-status" style={{ fontFamily: "var(--font-mono)" }}>{saved}</span>}
        </div>
      </div>
    </HubShell>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="editor-section space-y-3">
      <div>
        <p className="text-[10px] tracking-widest text-[var(--accent)]" style={{ fontFamily: "var(--font-mono)" }}>{title}</p>
        {sub && <p className="text-xs text-white/40 mt-0.5">{sub}</p>}
      </div>
      <div className="peng-card space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-white/40 tracking-wider mb-1.5 block" style={{ fontFamily: "var(--font-mono)" }}>{label}</label>
      {children}
    </div>
  );
}
