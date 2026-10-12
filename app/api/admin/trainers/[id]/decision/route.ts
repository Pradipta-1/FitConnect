import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireRole } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  const user = await getUserFromRequest(req);
  if (!user || !requireRole(user.role, ["ADMIN"])) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { action } = body ?? {};

  if (!["APPROVE", "REJECT"].includes(action)) {
    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  }

  const trainer = await prisma.user.update({
    where: { id: params.id },
    data: {
      isTrainerVerified: action === "APPROVE"
    }
  });

  return NextResponse.json({ success: true, data: trainer });
}

