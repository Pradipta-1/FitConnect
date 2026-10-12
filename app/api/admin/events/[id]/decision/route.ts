import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireRole } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const user = await getUserFromRequest(req);
  if (!user || !requireRole(user.role, ["ADMIN"])) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const params = await context.params;

  const body = await req.json();
  const { action } = body ?? {};

  if (!["APPROVE", "REJECT"].includes(action)) {
    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  }

  const event = await prisma.event.update({
    where: { id: params.id },
    data: {
      status: action === "APPROVE" ? "APPROVED" : "REJECTED"
    }
  });

  await prisma.notification.create({
    data: {
      userId: event.organizerId,
      type: "EVENT_APPROVED",
      message:
        action === "APPROVE"
          ? "Your event was approved."
          : "Your event was rejected.",
      relatedEventId: event.id
    }
  });

  return NextResponse.json({ success: true, data: event });
}

