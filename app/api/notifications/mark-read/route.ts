import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { ids } = body ?? {};

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { success: false, error: "No ids provided" },
      { status: 400 }
    );
  }

  await prisma.notification.updateMany({
    where: {
      id: { in: ids },
      userId: user.id
    },
    data: { read: true }
  });

  return NextResponse.json({ success: true });
}

