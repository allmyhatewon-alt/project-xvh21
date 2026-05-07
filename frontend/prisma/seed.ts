import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BOARDS = [
  { slug: "general", name: "general", description: "anything goes", icon: "◈" },
  { slug: "clips", name: "clips & edits", description: "best stream moments", icon: "▶" },
  { slug: "announcements", name: "announcements", description: "official news from peng", icon: "★" },
  { slug: "fanart", name: "art & fanart", description: "show off your creations", icon: "✺" },
  { slug: "gaming", name: "gaming", description: "everything game-related", icon: "◆" },
  { slug: "music", name: "music", description: "tracks, mixes, and recommendations", icon: "♪" },
];

const ACHIEVEMENTS = [
  { slug: "first_post", name: "First Post", description: "Posted for the first time", iconEmoji: "✦", xpReward: 5, shardReward: 5 },
  { slug: "owner", name: "Owner", description: "Welcome to the hub.", iconEmoji: "♛", xpReward: 0, shardReward: 0 },
  { slug: "streak_3", name: "3-Day Streak", description: "Checked in 3 days in a row", iconEmoji: "◈", xpReward: 10, shardReward: 5 },
  { slug: "streak_7", name: "7-Day Streak", description: "A whole week!", iconEmoji: "◆", xpReward: 25, shardReward: 15 },
  { slug: "streak_14", name: "14-Day Streak", description: "Two weeks strong", iconEmoji: "★", xpReward: 50, shardReward: 30 },
  { slug: "streak_30", name: "30-Day Streak", description: "An entire month", iconEmoji: "✺", xpReward: 100, shardReward: 75 },
  { slug: "streak_60", name: "60-Day Streak", description: "Two months — incredible", iconEmoji: "♛", xpReward: 200, shardReward: 150 },
  { slug: "streak_100", name: "100-Day Streak", description: "Untouchable", iconEmoji: "❖", xpReward: 500, shardReward: 400 },
];

async function main() {
  // Boards
  for (const b of BOARDS) {
    await prisma.board.upsert({ where: { slug: b.slug }, update: b, create: b });
  }

  // Achievements
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({ where: { slug: a.slug }, update: a, create: a });
  }

  // Admin user
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@pengelus.me";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "peng12345";
  const adminUsername = (process.env.ADMIN_USERNAME ?? "peng").toLowerCase();
  const adminDisplay = process.env.ADMIN_DISPLAY_NAME ?? "peng";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const existing = await prisma.user.findUnique({ where: { email: adminEmail.toLowerCase() } });

  let admin;
  if (!existing) {
    admin = await prisma.user.create({
      data: {
        username: adminUsername,
        displayName: adminDisplay,
        email: adminEmail.toLowerCase(),
        passwordHash,
        role: "ADMIN",
        emailVerified: new Date(),
        bio: "creator · streamer · chaos",
        accentColor: "#8a2be2",
        gemsUnlocked: true,
        onboarded: true,
      },
    });
    await prisma.hubProfile.create({
      data: {
        userId: admin.id,
        portalLabel: "Enter The Terminal",
        tiktokUrl: "https://tiktok.com/@peng",
        twitchUrl: "https://twitch.tv/peng",
        discordUser: "peng",
      },
    });
    await prisma.space.create({
      data: {
        userId: admin.id,
        published: true,
        blocks: JSON.stringify([
          {
            id: "intro",
            type: "TEXT",
            order: 0,
            config: { heading: "welcome to my links", body: "this is your personal canvas. customize it like a landing page - text, music, links, embeds." },
          },
          {
            id: "links",
            type: "SOCIAL_LINKS",
            order: 1,
            config: {
              links: [
                { label: "TikTok ↗", url: "https://tiktok.com/@peng" },
                { label: "Twitch ↗", url: "https://twitch.tv/peng" },
                { label: "Discord ↗", url: "https://discord.gg/peng" },
              ],
            },
          },
        ]),
      },
    });

    // Grant the Owner achievement
    const owner = await prisma.achievement.findUnique({ where: { slug: "owner" } });
    if (owner) {
      await prisma.userAchievement.upsert({
        where: { userId_achievementId: { userId: admin.id, achievementId: owner.id } },
        create: { userId: admin.id, achievementId: owner.id },
        update: {},
      });
    }
    console.log(`✓ Created admin user: ${adminEmail} / ${adminPassword}`);
  } else {
    // Keep password in sync with .env
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, role: "ADMIN" },
    });
    admin = existing;
    console.log(`✓ Updated admin user: ${adminEmail}`);
  }

  // Seed test post
  const general = await prisma.board.findUnique({ where: { slug: "general" } });
  if (general) {
    const existingPost = await prisma.post.findFirst({
      where: { boardId: general.id, authorId: admin.id, title: "welcome in" },
    });
    if (!existingPost) {
      await prisma.post.create({
        data: {
          boardId: general.id,
          authorId: admin.id,
          title: "welcome in",
          body: "post clips, talk in chat, and keep your links feeling like you.",
          flair: "ANNOUNCEMENT",
          isPinned: true,
        },
      });
      await prisma.board.update({ where: { id: general.id }, data: { postCount: { increment: 1 } } });
    }
  }

  console.log("✓ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
