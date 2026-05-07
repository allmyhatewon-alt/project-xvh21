import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ notifications: [] });

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // last 30 days

  const [commentsOnMyPosts, newFollowers, recentCheckins, recentPurchases] = await Promise.all([
    // Comments on the current user's posts
    prisma.comment.findMany({
      where: {
        post: { authorId: user.id },
        authorId: { not: user.id }, // exclude self-comments
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { username: true, displayName: true } },
        post: { select: { id: true, title: true } },
      },
    }),
    // New followers
    prisma.follow.findMany({
      where: { followingId: user.id, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        createdAt: true,
        follower: { select: { username: true, displayName: true } },
      },
    }),
    // Streak milestones from check-ins
    prisma.checkIn.findMany({
      where: {
        userId: user.id,
        streak: { in: [3, 7, 14, 30, 60, 100] },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, streak: true, createdAt: true },
    }),
    // Recent shop purchases
    prisma.inventoryItem.findMany({
      where: { userId: user.id, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, createdAt: true, item: { select: { name: true, slug: true } } },
    }),
  ]);

  type Notification = {
    id: string;
    kind: "reply" | "follow" | "system" | "shop";
    who: string;
    body: string;
    href: string;
    ago: string;
    unread: boolean;
  };

  const now = Date.now();
  function ago(date: Date): string {
    const diff = now - date.getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "just now";
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  const notifications: Notification[] = [];

  for (const c of commentsOnMyPosts) {
    notifications.push({
      id: `comment-${c.id}`,
      kind: "reply",
      who: c.author.username,
      body: `replied on "${c.post.title}": ${c.body.slice(0, 80)}${c.body.length > 80 ? "…" : ""}`,
      href: `/hub/post/${c.post.id}`,
      ago: ago(c.createdAt),
      unread: c.createdAt.getTime() > now - 24 * 60 * 60 * 1000,
    });
  }

  for (const f of newFollowers) {
    notifications.push({
      id: `follow-${f.follower.username}-${f.createdAt.getTime()}`,
      kind: "follow",
      who: f.follower.username,
      body: `${f.follower.displayName} started following you`,
      href: `/hub/user/${f.follower.username}`,
      ago: ago(f.createdAt),
      unread: f.createdAt.getTime() > now - 24 * 60 * 60 * 1000,
    });
  }

  for (const ci of recentCheckins) {
    notifications.push({
      id: `streak-${ci.id}`,
      kind: "system",
      who: "hub",
      body: `🔥 streak milestone: ${ci.streak} days. shards and xp dropped to your balance.`,
      href: "/hub/quests",
      ago: ago(ci.createdAt),
      unread: false,
    });
  }

  for (const inv of recentPurchases) {
    notifications.push({
      id: `shop-${inv.id}`,
      kind: "shop",
      who: "shop",
      body: `you unlocked "${inv.item.name}" — equip it from the gem shop.`,
      href: "/hub/store",
      ago: ago(inv.createdAt),
      unread: inv.createdAt.getTime() > now - 24 * 60 * 60 * 1000,
    });
  }

  // Sort all by recency (already ordered, but merge them)
  notifications.sort((a, b) => {
    // Approximation: notifications already carry ago strings; sort by unread first, then order is fine
    if (a.unread !== b.unread) return a.unread ? -1 : 1;
    return 0;
  });

  return NextResponse.json({ notifications: notifications.slice(0, 30) });
}
