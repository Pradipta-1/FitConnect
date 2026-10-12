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

  if (!requireRole(user.role, ["TRAINER"])) {
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

  const invitation = await prisma.trainerInvitation.findUnique({
    where: { id: params.id }
  });

  if (!invitation || invitation.trainerId !== user.id) {
    return NextResponse.json(
      { success: false, error: "Invitation not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.trainerInvitation.update({
    where: { id: invitation.id },
    data: {
      status: action === "ACCEPT" ? "ACCEPTED" : "REJECTED"
    }
  });

  if (action === "ACCEPT") {
    await prisma.event.update({
      where: { id: invitation.eventId },
      data: {
        trainerParticipants: {
          connect: { id: user.id }
        }
      }
    });

    await prisma.notification.create({
      data: {
        userId: invitation.organizerId,
        type: "TRAINER_REQUEST_ACCEPTED",
        message: "Trainer accepted your event invitation.",
        relatedEventId: invitation.eventId,
        relatedUserId: user.id
      }
    });
  }

  return NextResponse.json({ success: true, data: updated });
}

