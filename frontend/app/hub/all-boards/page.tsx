import Link from "next/link";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AllBoardsPage() {
  const boards = await prisma.board.findMany({ orderBy: { postCount: "desc" } });
  return (
    <HubShell rightRail={<RightRail />}>
      <div className="hub-page-wrap boards-directory-page">
        <section className="hub-page-hero boards-directory-hero">
          <div>
            <p className="hub-page-kicker">community map</p>
            <h1 className="hub-page-title mb-1">all boards</h1>
            <p className="hub-page-sub">Pick the room before you post. Each board has its own pace, rules, and reason to exist.</p>
          </div>
          <div className="hub-page-hero-mark" aria-hidden="true">#</div>
        </section>

        <div className="boards-directory-grid" data-testid="boards-grid">
          {boards.map((b, index) => {
            const profile = boardDirectoryProfile(b.slug);
            return (
              <Link
                key={b.id}
                href={`/hub/board/${b.slug}`}
                data-testid={`board-card-${b.slug}`}
                className={`board-directory-card board-tone-${profile.tone}`}
              >
                <div className="board-directory-top">
                  <span className="board-directory-icon">{profile.icon}</span>
                  <small>{index === 0 ? "most active" : `${b.postCount} posts`}</small>
                </div>
                <strong>{profile.name}</strong>
                <p>{profile.description ?? b.description}</p>
                <div className="board-directory-lanes">
                  {profile.lanes.map((lane) => <span key={lane}>{lane}</span>)}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </HubShell>
  );
}

function boardDirectoryProfile(slug: string) {
  const profiles: Record<string, { name: string; description: string; icon: string; tone: string; lanes: string[] }> = {
    general: { name: "general", description: "Open room for quick questions, updates, and community talk.", icon: "G", tone: "cyan", lanes: ["questions", "updates", "random"] },
    clips: { name: "clips & edits", description: "Stream moments, edits, and short posts people can replay fast.", icon: "C", tone: "green", lanes: ["clips", "edits", "replays"] },
    announcements: { name: "announcements", description: "Official updates, drops, dates, and clean signal only.", icon: "A", tone: "gold", lanes: ["updates", "drops", "alerts"] },
    fanart: { name: "fan art", description: "Community drawings, banners, thumbnails, edits, and works in progress.", icon: "F", tone: "pink", lanes: ["finished", "wips", "gfx"] },
    gaming: { name: "gaming", description: "Games, ranked talk, builds, clips, and team-up posts.", icon: "G", tone: "blue", lanes: ["ranked", "builds", "clips"] },
    music: { name: "music", description: "Tracks, playlists, mixes, new drops, and recommendations.", icon: "M", tone: "violet", lanes: ["drops", "playlists", "finds"] },
  };
  return profiles[slug] ?? { name: slug.replaceAll("-", " "), description: "Focused posts for this topic.", icon: slug.slice(0, 1).toUpperCase(), tone: "cyan", lanes: ["posts", "questions", "links"] };
}
