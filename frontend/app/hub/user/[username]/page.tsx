import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { HubProfileView } from "@/components/HubProfile/HubProfileView";
import { ProfileViewPing } from "@/components/Analytics/ProfileViewPing";
import { Suspense } from "react";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";
import type { Metadata } from "next";

interface Props { params: { username: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    select: { displayName: true, bio: true, status: true },
  });
  if (!user) return { title: "Not Found" };
  return {
    title: `${user.displayName} (@${params.username}) - pengelus`,
    description: user.status ?? user.bio ?? `${user.displayName}'s hub profile`,
  };
}

export default async function HubUserPage({ params }: Props) {
  const [profile, viewer] = await Promise.all([
    prisma.user.findUnique({
      where: { username: params.username.toLowerCase() },
      select: {
        id: true,
        username: true,
        displayName: true,
        image: true,
        bio: true,
        status: true,
        bannerUrl: true,
        accentColor: true,
        shards: true,
        gems: true,
        xp: true,
        level: true,
        streakCount: true,
        longestStreak: true,
        role: true,
        createdAt: true,
        hubProfile: true,
        inventory: {
          where: { equippedAt: { not: null } },
          include: { item: true },
          orderBy: { equippedAt: "desc" },
          take: 8,
        },
        achievements: { include: { achievement: true }, orderBy: { earnedAt: "desc" }, take: 12 },
        posts: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            board: { select: { slug: true, name: true } },
            author: { select: { username: true, displayName: true, image: true, accentColor: true } },
          },
        },
        _count: { select: { posts: true, followers: true, follows: true } },
      },
    }),
    getCurrentUser(),
  ]);

  if (!profile) notFound();

  const isOwn = viewer?.username === profile.username;
  const analytics = isOwn || viewer?.role === "ADMIN"
    ? await getProfileAnalytics(profile.id)
    : null;

  // Parse showcase JSON
  const showcase = profile.hubProfile ? JSON.parse(profile.hubProfile.showcase || "[]") : [];
  const interests = profile.hubProfile ? JSON.parse(profile.hubProfile.interests || "[]") : [];

  return (
    <Suspense>
      <HubShell rightRail={<RightRail />}>
        <HubProfileView
          profile={{
            ...profile,
            hubProfile: profile.hubProfile ? { ...profile.hubProfile, showcase, interests } : null,
            inventory: profile.inventory.map((entry) => ({ ...entry, equippedAt: entry.equippedAt?.toISOString() ?? null, createdAt: entry.createdAt.toISOString() })),
            posts: profile.posts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
            counts: profile._count,
            analytics,
          } as any}
          isOwn={isOwn}
        />
        {!isOwn && <ProfileViewPing username={profile.username} type="HUB_PROFILE_VIEW" />}
      </HubShell>
    </Suspense>
  );
}

async function getProfileAnalytics(ownerId: string) {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const [views30d, hubViews30d, linkClicks30d] = await Promise.all([
    prisma.profileEvent.count({ where: { ownerId, type: "PROFILE_VIEW", createdAt: { gte: since } } }),
    prisma.profileEvent.count({ where: { ownerId, type: "HUB_PROFILE_VIEW", createdAt: { gte: since } } }),
    prisma.profileEvent.count({ where: { ownerId, type: "LINK_CLICK", createdAt: { gte: since } } }),
  ]);
  return { views30d, hubViews30d, linkClicks30d };
}
