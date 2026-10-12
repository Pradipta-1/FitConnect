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

  if (!requireRole(user.role, ["ORGANIZER"])) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const requests = await prisma.trainerEventRequest.findMany({
    where: {
      event: {
        organizerId: user.id
      },
      status: "PENDING"
    },
    include: {
      trainer: { select: { id: true, name: true } },
      event: { select: { id: true, title: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ success: true, data: requests });
}

