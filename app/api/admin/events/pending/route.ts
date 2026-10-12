import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !requireRole(user.role, ["ADMIN"])) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const events = await prisma.event.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      organizer: { select: { id: true, name: true } }
    }
  });

  return NextResponse.json({ success: true, data: events });
}

