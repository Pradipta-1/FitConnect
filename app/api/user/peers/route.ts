import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Find events where user is participant
    const events = await prisma.event.findMany({
      where: {
        participants: {
          some: { id: user.id }
        }
      },
      include: {
        organizer: { select: { id: true, name: true, avatarUrl: true } },
        participants: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true, location: true }
        },
        trainerParticipants: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true, specializations: true }
        }
      }
    });

    const peersMap = new Map();
    events.forEach(event => {
      event.participants.forEach(p => {
        if (p.id !== user.id && !peersMap.has(p.id)) {
          peersMap.set(p.id, { ...p, sharedEvent: event.title });
        }
      });
      event.trainerParticipants.forEach(tp => {
        if (tp.id !== user.id && !peersMap.has(tp.id)) {
          peersMap.set(tp.id, { ...tp, sharedEvent: event.title });
        }
      });
    });

    const peers = Array.from(peersMap.values());

    return NextResponse.json({
      success: true,
      data: {
        totalPeers: peers.length,
        sharedEventsCount: events.length,
        peers
      }
    });
  } catch (error: any) {
    console.error("Error fetching trainee peers:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch peers" }, { status: 500 });
  }
}
