import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";
import { AdminConsoleView } from "@/components/Hub/AdminConsoleView";

export default async function Page() {
  const user = await getCurrentUser();
  const role = user?.role;

  if (!user) {
    redirect("/auth/signin?callback=/hub/admin");
  }

  if (role !== "ADMIN") {
    redirect("/hub");
  }

  const [
    users,
    posts,
    comments,
    boards,
    admins,
    mods,
    queue,
    recentUsers,
    boardHealth,
    modActions,
    restrictions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.board.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "MOD" } }),
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        voteScore: true,
        commentCount: true,
        createdAt: true,
        author: { select: { username: true } },
        board: { select: { slug: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, username: true, role: true, createdAt: true },
    }),
    prisma.board.findMany({
      orderBy: [{ postCount: "desc" }, { createdAt: "asc" }],
      take: 5,
      select: { id: true, slug: true, name: true, postCount: true },
    }),
    prisma.moderationAction.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        command: true,
        targetUsername: true,
        reason: true,
        createdAt: true,
        moderator: { select: { username: true } },
      },
    }),
    prisma.userRestriction.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        kind: true,
        reason: true,
        expiresAt: true,
        createdAt: true,
        user: { select: { username: true } },
      },
    }),
  ]);

  return (
    <HubShell rightRail={<RightRail />}>
      <AdminConsoleView
        summary={{ users, posts, comments, boards, admins, mods }}
        queue={queue.map((item) => ({
          id: item.id,
          title: item.title,
          author: item.author.username,
          boardSlug: item.board.slug,
          comments: item.commentCount,
          score: item.voteScore,
          createdAt: item.createdAt.toISOString(),
        }))}
        recentUsers={recentUsers.map((item) => ({
          id: item.id,
          username: item.username,
          role: item.role,
          createdAt: item.createdAt.toISOString(),
        }))}
        boards={boardHealth}
        modActions={modActions.map((item) => ({
          id: item.id,
          command: item.command,
          targetUsername: item.targetUsername,
          reason: item.reason,
          moderator: item.moderator.username,
          createdAt: item.createdAt.toISOString(),
        }))}
        restrictions={restrictions.map((item) => ({
          id: item.id,
          kind: item.kind,
          username: item.user.username,
          reason: item.reason,
          expiresAt: item.expiresAt?.toISOString() ?? null,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    </HubShell>
  );
}
