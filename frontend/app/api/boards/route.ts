import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const boards = await prisma.board.findMany({ orderBy: { postCount: "desc" } });
  return NextResponse.json({ boards });
}
