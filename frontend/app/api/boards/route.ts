import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const boards = await prisma.board.findMany({ orderBy: { postCount: "desc" } });
  return NextResponse.json({ boards });
}
