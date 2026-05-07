import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  showcase: z.array(z.any()).optional(),
  portalEnabled: z.boolean().optional(),
  portalLabel: z.string().max(40).optional(),
  tiktokUrl: z.string().nullable().optional(),
  twitchUrl: z.string().nullable().optional(),
  youtubeUrl: z.string().nullable().optional(),
  twitterUrl: z.string().nullable().optional(),
  instagramUrl: z.string().nullable().optional(),
  kickUrl: z.string().nullable().optional(),
  discordUser: z.string().nullable().optional(),
  showStats: z.boolean().optional(),
  showStreak: z.boolean().optional(),
  interests: z.array(z.string()).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hp = await prisma.hubProfile.findUnique({ where: { userId: user.id } });
  if (!hp) return NextResponse.json({ profile: null });
  return NextResponse.json({
    profile: {
      ...hp,
      showcase: JSON.parse(hp.showcase || "[]"),
      interests: JSON.parse(hp.interests || "[]"),
    },
  });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const data: any = { ...parsed.data };
  if (data.showcase) data.showcase = JSON.stringify(data.showcase);
  if (data.interests) data.interests = JSON.stringify(data.interests);

  const hp = await prisma.hubProfile.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  return NextResponse.json({
    profile: {
      ...hp,
      showcase: JSON.parse(hp.showcase || "[]"),
      interests: JSON.parse(hp.interests || "[]"),
    },
  });
}
