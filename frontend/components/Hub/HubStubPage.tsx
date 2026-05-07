"use client";
import Link from "next/link";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";

export function HubStubPage({
  title,
  description,
  icon = "*",
  cta,
}: {
  title: string;
  description: string;
  icon?: string;
  cta?: { href: string; label: string; testid?: string };
}) {
  const quickLinks = [
    { href: "/hub/discover", label: "discover", copy: "new boards and people" },
    { href: "/hub/quests", label: "quests", copy: "quick xp and streaks" },
    { href: "/hub/clips", label: "clips", copy: "short posts, fast scroll" },
  ];

  return (
    <HubShell rightRail={<RightRail />}>
      <div className="hub-page-wrap">
        <section className="hub-page-hero">
          <div>
            <p className="hub-page-kicker">pengelus room</p>
            <h1 className="hub-page-title mb-1" data-testid="stub-title">{title}</h1>
            <p className="hub-page-sub">{description}</p>
          </div>
          <div className="hub-page-hero-mark" aria-hidden="true">{icon}</div>
        </section>

        <div className="hub-empty-room">
          <div>
            <p className="hub-empty-room-title">this page is warming up</p>
            <p className="hub-empty-room-copy">It should still feel like part of the hub, not some random empty hallway.</p>
          </div>
          {cta && (
            <Link href={cta.href} className="peng-btn peng-btn-primary text-xs" data-testid={cta.testid}>
              {cta.label}
            </Link>
          )}
        </div>

        <div className="hub-action-grid">
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href} className="hub-next-card">
              <span>{item.label}</span>
              <strong>{item.copy}</strong>
            </Link>
          ))}
        </div>
      </div>
    </HubShell>
  );
}
