import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;

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

    const totalParticipants = event.participants.length + event.trainerParticipants.length;
    if (totalParticipants >= event.participantLimit) {
      return NextResponse.json({ success: false, error: "Event is full" }, { status: 400 });
    }

    // Check if already participating
    const isAlreadyParticipating = 
      event.participants.some(p => p.id === user.id) || 
      event.trainerParticipants.some(p => p.id === user.id);
    
    if (isAlreadyParticipating) {
      return NextResponse.json({ success: false, error: "Already participating" }, { status: 400 });
    }

    // Add user/trainer to the event
    if (user.role === "TRAINER") {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          trainerParticipants: { connect: { id: user.id } }
        }
      });
    } else {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          participants: { connect: { id: user.id } }
        }
      });
    }

    // Create system message
    await prisma.message.create({
      data: {
        senderId: user.id, // The joined user is the one triggered the system message, or could be a neutral system user if one existed. Using joining user for now.
        eventId: event.id,
        content: `Welcome ${user.name} to the group!`,
        isSystem: true,
      }
    });

    return NextResponse.json({ success: true, message: "Joined successfully" });
  } catch (error) {
    console.error("Error joining event:", error);
    return NextResponse.json({ success: false, error: "Failed to join event" }, { status: 500 });
  }
}
