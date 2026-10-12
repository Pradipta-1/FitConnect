import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const users = await prisma.user.findMany({
    where: {
      role: "USER",
      id: { not: user.id },
    },
    select: { id: true, name: true, email: true, avatarUrl: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ success: true, data: users });
}
