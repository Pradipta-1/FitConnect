import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  if (!requireRole(user.role, ["TRAINER"])) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { eventId, message, relevantExperience } = body ?? {};

  if (!eventId || !message || !relevantExperience) {
    return NextResponse.json(
      { success: false, error: "Missing fields" },
      { status: 400 }
    );
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event || !event.openToTrainers || event.status !== "APPROVED") {
    return NextResponse.json(
      { success: false, error: "Event is not open to trainers" },
      { status: 400 }
    );
  }

  const requestRecord = await prisma.trainerEventRequest.create({
    data: {
      trainerId: user.id,
      eventId,
      message,
      relevantExperience
    }
  });

  await prisma.notification.create({
    data: {
      userId: event.organizerId,
      type: "TRAINER_REQUEST_SUBMITTED",
      message: "Trainer requested to join your event.",
      relatedEventId: eventId,
      relatedUserId: user.id
    }
  });

  return NextResponse.json({ success: true, data: requestRecord });
}

