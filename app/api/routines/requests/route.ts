import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "TRAINER") {
      // Fetch requests received by the trainer
      const requests = await prisma.routineRequest.findMany({
        where: { trainerId: user.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json({ success: true, data: requests });
    } else if (user.role === "USER") {
      // Fetch requests sent by the user
      const requests = await prisma.routineRequest.findMany({
        where: { userId: user.id },
        include: {
          trainer: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json({ success: true, data: requests });
    } else {
      return NextResponse.json({ success: false, error: "Invalid role for fetching routine requests" }, { status: 403 });
    }

  } catch (error: any) {
    console.error("Error fetching routine requests:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
