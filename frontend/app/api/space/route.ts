import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  blocks: z.array(z.any()).optional(),
  published: z.boolean().optional(),
  customCss: z.string().max(20000).nullable().optional(),
  metaTitle: z.string().max(120).nullable().optional(),
  metaDescription: z.string().max(300).nullable().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const space = await prisma.space.findUnique({ where: { userId: user.id } });
  if (!space) return NextResponse.json({ space: null });
  return NextResponse.json({
    space: { ...space, blocks: JSON.parse(space.blocks || "[]") },
  });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const data: any = {};
  if (parsed.data.blocks !== undefined) data.blocks = JSON.stringify(parsed.data.blocks);
  if (parsed.data.published !== undefined) data.published = parsed.data.published;
  if (parsed.data.customCss !== undefined) data.customCss = parsed.data.customCss;
  if (parsed.data.metaTitle !== undefined) data.metaTitle = parsed.data.metaTitle;
  if (parsed.data.metaDescription !== undefined)
    data.metaDescription = parsed.data.metaDescription;

  const space = await prisma.space.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data, blocks: data.blocks ?? "[]" },
  });

  return NextResponse.json({
    space: { ...space, blocks: JSON.parse(space.blocks || "[]") },
  });
}
