import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const params = await context.params;
  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    include: {
      organizer: { select: { id: true, name: true } },
      participants: { select: { id: true, name: true } },
      trainerParticipants: { select: { id: true, name: true } }
    }
  });

  if (!event) {
    return NextResponse.json(
      { success: false, error: "Event not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: event });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { eventId } = await context.params;
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    if (event.organizerId !== user.id) {
      return NextResponse.json({ success: false, error: "Only the organizer can edit this event" }, { status: 403 });
    }

    const body = await req.json();
    const updatedEvent = await (prisma.event.update as any)({
      where: { id: eventId },
      data: {
        title: body.title,
        sportType: body.sportType,
        location: body.location,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        timeRange: body.timeRange,
        participantLimit: body.participantLimit ? parseInt(body.participantLimit) : undefined,
        description: body.description,
      }
    });

    return NextResponse.json({ success: true, data: updatedEvent });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { eventId } = await context.params;
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    if (event.organizerId !== user.id) {
      return NextResponse.json({ success: false, error: "Only the organizer can delete this event" }, { status: 403 });
    }

    // Soft-cancel the event
    await prisma.event.update({
      where: { id: eventId },
      data: { isCancelled: true }
    });

    // Create system message
    await prisma.message.create({
      data: {
        senderId: user.id,
        eventId: eventId,
        content: "Event has been cancelled",
        isSystem: true
      }
    });

    return NextResponse.json({ success: true, message: "Event cancelled successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
