import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

type SignalPayload = Record<string, unknown>;
type PendingOffer = {
  viewerId: string;
  offer: SignalPayload;
  createdAt: number;
};
type RoomSignalState = {
  heartbeatAt: number;
  offers: Map<string, PendingOffer>;
  answers: Map<string, SignalPayload>;
};

const globalStore = globalThis as typeof globalThis & {
  __pengelusLiveSignals?: Map<string, RoomSignalState>;
};

const rooms = globalStore.__pengelusLiveSignals ?? new Map<string, RoomSignalState>();
globalStore.__pengelusLiveSignals = rooms;

function getRoom(username: string) {
  const key = username.toLowerCase();
  let room = rooms.get(key);
  if (!room) {
    room = { heartbeatAt: Date.now(), offers: new Map(), answers: new Map() };
    rooms.set(key, room);
  }
  prune(room);
  return room;
}

function prune(room: RoomSignalState) {
  const cutoff = Date.now() - 60_000;
  Array.from(room.offers.entries()).forEach(([id, offer]) => {
    if (offer.createdAt < cutoff) {
      room.offers.delete(id);
      room.answers.delete(id);
    }
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    type?: string;
    username?: string;
    viewerId?: string;
    offer?: SignalPayload;
    answer?: SignalPayload;
  } | null;

  if (!body?.type) return NextResponse.json({ error: "Missing signal type." }, { status: 400 });

  if (body.type === "viewer-offer") {
    const username = body.username?.trim().toLowerCase();
    if (!username || !body.viewerId || !body.offer) {
      return NextResponse.json({ error: "Missing viewer offer." }, { status: 400 });
    }
    const room = getRoom(username);
    room.offers.set(body.viewerId, { viewerId: body.viewerId, offer: body.offer, createdAt: Date.now() });
    room.answers.delete(body.viewerId);
    return NextResponse.json({ ok: true, viewerId: body.viewerId, broadcasterSeen: Date.now() - room.heartbeatAt < 15_000 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to broadcast." }, { status: 401 });
  const room = getRoom(user.username);

  if (body.type === "broadcaster-heartbeat") {
    room.heartbeatAt = Date.now();
    return NextResponse.json({ ok: true });
  }

  if (body.type === "broadcaster-poll") {
    room.heartbeatAt = Date.now();
    return NextResponse.json({ offers: Array.from(room.offers.values()) });
  }

  if (body.type === "broadcaster-answer") {
    if (!body.viewerId || !body.answer) return NextResponse.json({ error: "Missing answer." }, { status: 400 });
    room.heartbeatAt = Date.now();
    room.answers.set(body.viewerId, body.answer);
    room.offers.delete(body.viewerId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown signal type." }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")?.trim().toLowerCase();
  const viewerId = req.nextUrl.searchParams.get("viewerId")?.trim();
  if (!username || !viewerId) return NextResponse.json({ error: "Missing viewer." }, { status: 400 });
  const room = getRoom(username);
  const answer = room.answers.get(viewerId) ?? null;
  return NextResponse.json({
    answer,
    broadcasterSeen: Date.now() - room.heartbeatAt < 15_000,
  });
}
