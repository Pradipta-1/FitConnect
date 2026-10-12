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

  const trainers = await prisma.user.findMany({
    where: {
      role: "TRAINER",
      OR: [{ isTrainerVerified: false }, { isTrainerVerified: null }]
    },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json({ success: true, data: trainers });
}

