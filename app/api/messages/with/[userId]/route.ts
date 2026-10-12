import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const otherId = params.userId;

  // Check if it's an event group the user is participating in
  const event = await prisma.event.findUnique({
    where: { id: otherId },
    include: {
        participants: { select: { id: true, name: true, avatarUrl: true } },
        trainerParticipants: { select: { id: true, name: true, avatarUrl: true } }
    }
  });

  if (event) {
    const isParticipant = 
      event.organizerId === user.id ||
      event.participants.some(p => p.id === user.id) ||
      event.trainerParticipants.some(p => p.id === user.id);

    if (!isParticipant) {
      return NextResponse.json({ success: false, error: "Access denied to this event group." }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { eventId: otherId },
      include: {
        sender: {
          select: { id: true, name: true, role: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    const allParticipants = [
      ...event.participants.map(p => ({ ...p, role: "USER" })),
      ...event.trainerParticipants.map(tp => ({ ...tp, role: "TRAINER" }))
    ];

    const uniqueParticipants = allParticipants.filter((p, index, self) => 
      index === self.findIndex((t) => t.id === p.id)
    );

    return NextResponse.json({ 
      success: true, 
      data: messages,
      eventOrganizerId: event.organizerId,
      isCancelled: event.isCancelled,
      participants: uniqueParticipants
    });
  }

  // Otherwise, treat as direct message
  // Mark incoming unread messages as read
  await prisma.message.updateMany({
    where: {
      senderId: otherId,
      receiverId: user.id,
      read: false
    },
    data: {
      read: true
    }
  });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: otherId },
        { senderId: otherId, receiverId: user.id }
      ],
      eventId: null // Only direct messages
    },
    include: {
      sender: {
        select: { id: true, name: true, role: true, avatarUrl: true }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json({ success: true, data: messages });
}

