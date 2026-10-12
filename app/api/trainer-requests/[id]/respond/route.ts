import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireRole } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  if (!requireRole(user.role, ["ORGANIZER"])) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { action } = body ?? {};

  if (!["ACCEPT", "REJECT"].includes(action)) {
    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  }

  const requestRecord = await prisma.trainerEventRequest.findUnique({
    where: { id: params.id },
    include: { event: true }
  });

  if (
    !requestRecord ||
    !requestRecord.event ||
    requestRecord.event.organizerId !== user.id
  ) {
    return NextResponse.json(
      { success: false, error: "Request not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.trainerEventRequest.update({
    where: { id: requestRecord.id },
    data: {
      status: action === "ACCEPT" ? "ACCEPTED" : "REJECTED"
    }
  });

  if (action === "ACCEPT") {
    await prisma.event.update({
      where: { id: requestRecord.eventId },
      data: {
        trainerParticipants: {
          connect: { id: requestRecord.trainerId }
        }
      }
    });

    await prisma.notification.create({
      data: {
        userId: requestRecord.trainerId,
        type: "TRAINER_REQUEST_ACCEPTED",
        message: "Your request to join the event was accepted.",
        relatedEventId: requestRecord.eventId,
        relatedUserId: user.id
      }
    });
  }

  return NextResponse.json({ success: true, data: updated });
}

