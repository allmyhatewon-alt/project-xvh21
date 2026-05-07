import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";
import { OwnerCenterView } from "@/components/Hub/OwnerCenterView";
import { ensureDefaultBotCommands, getSiteSettings } from "@/lib/site-settings";

export default async function Page() {
  const user = await getCurrentUser();
  const role = user?.role;

  if (!user) {
    redirect("/auth/signin?callback=/hub/owner");
  }

  if (role !== "ADMIN") {
    redirect("/hub");
  }

  const [
    users,
    posts,
    boards,
    totals,
    recentUsers,
    recentPosts,
    recentCheckIns,
    settings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.board.count(),
    prisma.user.aggregate({
      _sum: { gems: true, shards: true, xp: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, username: true, role: true, createdAt: true },
    }),
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: { select: { username: true } },
        board: { select: { slug: true } },
      },
    }),
    prisma.checkIn.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        shardsEarned: true,
        streak: true,
        createdAt: true,
        user: { select: { username: true } },
      },
    }),
    getSiteSettings(),
  ]);

  await ensureDefaultBotCommands();
  const botCommands = await prisma.chatBotCommand.findMany({ orderBy: { trigger: "asc" } });

  return (
    <HubShell rightRail={<RightRail />}>
      <OwnerCenterView
        summary={{
          users,
          posts,
          boards,
          gems: totals._sum.gems ?? 0,
          shards: totals._sum.shards ?? 0,
          xp: totals._sum.xp ?? 0,
        }}
        recentUsers={recentUsers.map((item) => ({
          id: item.id,
          username: item.username,
          role: item.role,
          createdAt: item.createdAt.toISOString(),
        }))}
        recentPosts={recentPosts.map((item) => ({
          id: item.id,
          title: item.title,
          boardSlug: item.board.slug,
          author: item.author.username,
          createdAt: item.createdAt.toISOString(),
        }))}
        recentCheckIns={recentCheckIns.map((item) => ({
          id: item.id,
          username: item.user.username,
          shardsEarned: item.shardsEarned,
          streak: item.streak,
          createdAt: item.createdAt.toISOString(),
        }))}
        settings={settings}
        botCommands={botCommands.map((command) => ({
          id: command.id,
          trigger: command.trigger,
          response: command.response,
          enabled: command.enabled,
        }))}
      />
    </HubShell>
  );
}
