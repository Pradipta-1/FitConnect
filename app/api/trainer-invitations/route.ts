import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
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

  const invitations = await prisma.trainerInvitation.findMany({
    where: { trainerId: user.id, status: "PENDING" },
    include: {
      event: true,
      organizer: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ success: true, data: invitations });
}

export async function POST(req: NextRequest) {
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
  const { trainerId, eventId, paymentOffered, currency, organizerMessage } =
    body ?? {};

  if (!trainerId || !eventId || !paymentOffered || !organizerMessage) {
    return NextResponse.json(
      { success: false, error: "Missing fields" },
      { status: 400 }
    );
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event || event.organizerId !== user.id || event.status !== "APPROVED") {
    return NextResponse.json(
      { success: false, error: "Invalid event" },
      { status: 400 }
    );
  }

  const invitation = await prisma.trainerInvitation.create({
    data: {
      organizerId: user.id,
      trainerId,
      eventId,
      paymentOffered,
      currency: currency ?? "INR",
      organizerMessage
    }
  });

  await prisma.notification.create({
    data: {
      userId: trainerId,
      type: "TRAINER_INVITATION_RECEIVED",
      message: "You received an invitation to coach at an event.",
      relatedEventId: eventId,
      relatedUserId: user.id
    }
  });

  return NextResponse.json({ success: true, data: invitation });
}

