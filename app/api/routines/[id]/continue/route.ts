import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "TRAINER") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await context.params;

    // Find routine by id first, then verify ownership
    const existingRoutine = await prisma.routine.findFirst({
      where: { id }
    });

    if (!existingRoutine || existingRoutine.trainerId !== user.id) {
      return NextResponse.json({ success: false, error: "Routine not found or you do not have permission." }, { status: 404 });
    }

    // Deactivate all other routines for this user.
    // ONLY set isActive to false - do NOT change isArchived
    // so other trainers' routines stay in their own state.
    await prisma.routine.updateMany({
      where: {
        userId: existingRoutine.userId,
        id: { not: id }
      },
      data: {
        isActive: false
      }
    });

    // Set THIS routine to active so trainer immediately sees "Edit Routine"
    // @ts-ignore - Prisma type issue on this environment
    const routine = await prisma.routine.update({
      where: { id },
      data: {
        isActive: true,
        // @ts-ignore - Prisma type issue on this environment
        isArchived: false
      }
    });

    return NextResponse.json({ success: true, data: routine });
  } catch (error: any) {
    console.error("Error reactivating routine:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
