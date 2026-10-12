import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  // Find all events the user is participating in
  const userEvents = await prisma.event.findMany({
    where: {
      OR: [
        { organizerId: user.id },
        { participants: { some: { id: user.id } } },
        { trainerParticipants: { some: { id: user.id } } }
      ]
    },
    select: { id: true, title: true }
  });

  const eventIds = userEvents.map(e => e.id);

  // Fetch all relevant messages
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: user.id },
        { receiverId: user.id },
        { eventId: { in: eventIds } }
      ]
    },
    orderBy: { createdAt: "desc" }
  });

  const threadsMap = new Map<
    string,
    { id: string; type: "direct" | "event"; partnerName: string; lastMessage: string; updatedAt: Date; eventId?: string }
  >();

  for (const m of messages) {
    if (m.eventId) {
      // Group Message
      if (!threadsMap.has(m.eventId)) {
        const event = userEvents.find(e => e.id === m.eventId);
        threadsMap.set(m.eventId, {
          id: m.eventId,
          type: "event",
          partnerName: event?.title || "Unknown Event",
          lastMessage: m.content || (m.imageUrl ? "Sent an image" : ""),
          updatedAt: m.createdAt,
          eventId: m.eventId
        });
      }
    } else {
      // Direct Message
      const otherId = m.senderId === user.id ? m.receiverId : m.senderId;
      if (!otherId || otherId === user.id) continue;

      if (!threadsMap.has(otherId)) {
        threadsMap.set(otherId, {
          id: otherId,
          type: "direct",
          partnerName: "Loading...", // Will be fetched below
          lastMessage: m.content || (m.imageUrl ? "Sent an image" : ""),
          updatedAt: m.createdAt
        });
      }
    }
  }

  const threadsList = Array.from(threadsMap.values());

  // Fetch names and unread counts for direct message partners
  const threads = await Promise.all(
    threadsList.map(async t => {
      if (t.type === "direct") {
        const [u, unreadCount] = await Promise.all([
          prisma.user.findUnique({
            where: { id: t.id },
            select: { id: true, name: true, role: true, avatarUrl: true }
          }),
          prisma.message.count({
            where: { senderId: t.id, receiverId: user.id, read: false }
          })
        ]);
        return {
          partner: u,
          lastMessage: t.lastMessage,
          updatedAt: t.updatedAt,
          type: "direct",
          unreadCount
        };
      } else {
        return {
          partner: { id: t.id, name: t.partnerName, isEvent: true },
          lastMessage: t.lastMessage,
          updatedAt: t.updatedAt,
          type: "event",
          eventId: t.eventId,
          unreadCount: 0
        };
      }
    })
  );

  return NextResponse.json({ success: true, data: threads });
}

