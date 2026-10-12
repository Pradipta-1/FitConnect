import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const currentUser = await getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, role: true, avatarUrl: true, highestStreak: true }
  }) as any;

  if (!user) {
    return NextResponse.json(
      { success: false, error: "User not found" },
      { status: 404 }
    );
  }

  // If trainer, get unique client count and best client streak
  if (user.role === 'TRAINER') {
    const uniqueClients = await prisma.routine.groupBy({
      by: ['userId'],
      where: {
        trainerId: id
      }
    });
    user.clientCount = uniqueClients.length;

    if (uniqueClients.length > 0) {
      const clientIds = uniqueClients.map(c => c.userId);
      const bestStreak = await prisma.user.aggregate({
        _max: {
          highestStreak: true
        },
        where: {
          id: {
            in: clientIds
          }
        }
      });
      user.clientHighestStreak = bestStreak._max.highestStreak || 0;
    } else {
      user.clientHighestStreak = 0;
    }
  }

  return NextResponse.json({ success: true, data: user });
}
