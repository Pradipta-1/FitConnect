import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

type RouteContext = { params: Promise<{ eventId: string; userId: string }> };

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { eventId, userId } = await context.params;
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
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

    if (event.organizerId !== user.id) {
      return NextResponse.json({ success: false, error: "Only the organizer can remove participants" }, { status: 403 });
    }

    const isUserParticipant = event.participants.some(p => p.id === userId);
    const isTrainerParticipant = event.trainerParticipants.some(tp => tp.id === userId);

    if (!isUserParticipant && !isTrainerParticipant) {
      return NextResponse.json({ success: false, error: "User is not a participant of this event" }, { status: 404 });
    }

    // Remove user from the appropriate list
    if (isUserParticipant) {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          participants: {
            disconnect: { id: userId }
          }
        }
      });
    } else {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          trainerParticipants: {
            disconnect: { id: userId }
          }
        }
      });
    }

    // Create a system message about the removal
    const removedUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    await prisma.message.create({
      data: {
        eventId,
        senderId: user.id,
        content: `ADMIN: ${removedUser?.name || "A user"} was removed from the group.`,
        isSystem: true
      } as any
    });

    return NextResponse.json({ success: true, message: "Participant removed successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
