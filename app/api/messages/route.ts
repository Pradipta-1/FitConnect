import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { receiverId, content, imageUrl, eventId } = body ?? {};

  if (!eventId && !receiverId) {
    return NextResponse.json(
      { success: false, error: "Receiver or Event ID is required" },
      { status: 400 }
    );
  }

  if (!content && !imageUrl) {
    return NextResponse.json(
      { success: false, error: "Missing content or image" },
      { status: 400 }
    );
  }

  // Handle Event Group Message
  if (eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: { select: { id: true } },
        trainerParticipants: { select: { id: true } }
      }
    });

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    const isParticipant = 
      event.organizerId === user.id ||
      event.participants.some(p => p.id === user.id) ||
      event.trainerParticipants.some(p => p.id === user.id);

    if (!isParticipant) {
      return NextResponse.json({ success: false, error: "You are not a participant of this event group." }, { status: 403 });
    }

    if (event.isCancelled) {
      return NextResponse.json({ success: false, error: "This event has been cancelled. No more messages allowed." }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId: null,
        content: content || "",
        imageUrl: imageUrl || null,
        eventId: eventId
      } as any,
      include: {
        sender: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: message });
  }

  // Handle Direct Message
  if (receiverId === user.id) {
    return NextResponse.json(
      { success: false, error: "You cannot message yourself." },
      { status: 400 }
    );
  }

  // Trainers can only message clients who have already messaged them first
  if (user.role === "TRAINER") {
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { role: true }
    });
    if (receiver?.role === "USER") {
      const clientReachedOut = await prisma.message.findFirst({
        where: {
          senderId: receiverId,
          receiverId: user.id
        }
      });
      if (!clientReachedOut) {
        return NextResponse.json(
          { success: false, error: "You can only reply to clients who have messaged you first." },
          { status: 403 }
        );
      }
    }
  }

  const message = await prisma.message.create({
    data: {
      senderId: user.id,
      receiverId,
      content: content || "",
      imageUrl: imageUrl || null
    },
    include: {
      sender: {
        select: { id: true, name: true, role: true }
      }
    }
  });

  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: "NEW_MESSAGE",
      message: "You received a new message.",
      relatedUserId: user.id
    }
  });

  return NextResponse.json({ success: true, data: message });
}

