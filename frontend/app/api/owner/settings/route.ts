import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultBotCommands, getSiteSettings, saveSiteSettings, sanitizeSettings } from "@/lib/site-settings";

const settingsSchema = z.object({
  settings: z.object({
    liveEnabled: z.boolean(),
    liveMode: z.enum(["all", "restream_only", "native_only", "obs_only"]),
    chatEnabled: z.boolean(),
    chatBotEnabled: z.boolean(),
    clipsEnabled: z.boolean(),
    storeEnabled: z.boolean(),
    profileEffectsEnabled: z.boolean(),
    publicSignupEnabled: z.boolean(),
  }),
});

const commandSchema = z.object({
  commands: z.array(z.object({
    id: z.string().optional(),
    trigger: z.string().trim().min(2).max(32),
    response: z.string().trim().min(1).max(160),
    enabled: z.boolean(),
  })).max(20),
});

async function requireOwner() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in." }, { status: 401 }) };
  if (user.role !== "ADMIN") return { error: NextResponse.json({ error: "Owner only." }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const gate = await requireOwner();
  if (gate.error) return gate.error;
  await ensureDefaultBotCommands();
  const [settings, commands] = await Promise.all([
    getSiteSettings(),
    prisma.chatBotCommand.findMany({ orderBy: { trigger: "asc" } }),
  ]);
  return NextResponse.json({ settings, commands });
}

export async function POST(req: NextRequest) {
  const gate = await requireOwner();
  if (gate.error) return gate.error;
  const body = await req.json().catch(() => null);

  const parsedSettings = settingsSchema.safeParse(body);
  if (parsedSettings.success) {
    const settings = await saveSiteSettings(sanitizeSettings(parsedSettings.data.settings));
    return NextResponse.json({ settings });
  }

  const parsedCommands = commandSchema.safeParse(body);
  if (parsedCommands.success) {
    const incoming = parsedCommands.data.commands.map((command) => ({
      ...command,
      trigger: command.trigger.startsWith("!") ? command.trigger.toLowerCase() : `!${command.trigger.toLowerCase()}`,
    }));
    await prisma.$transaction(async (tx) => {
      for (const command of incoming) {
        await tx.chatBotCommand.upsert({
          where: { trigger: command.trigger },
          update: { response: command.response, enabled: command.enabled },
          create: { trigger: command.trigger, response: command.response, enabled: command.enabled },
        });
      }
    });
    const commands = await prisma.chatBotCommand.findMany({ orderBy: { trigger: "asc" } });
    return NextResponse.json({ commands });
  }

  return NextResponse.json({ error: "Check the owner settings payload." }, { status: 400 });
}
