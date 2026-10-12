import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "USER") {
      return NextResponse.json({ success: false, error: "Unauthorized. Only users can set active routines" }, { status: 403 });
    }

    const { id: routineId } = await params;

    // Verify the routine belongs to the user
    const routine = await prisma.routine.findUnique({
      where: { id: routineId },
    });

    if (!routine || routine.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Routine not found or you do not have permission." }, { status: 404 });
    }

    // Wrap in transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // 1. Deactivate all other routines for this user - ONLY set isActive to false,
      //    DO NOT change isArchived so other trainers' routines stay in their own state
      await tx.routine.updateMany({
        where: { 
          userId: user.id,
          id: { not: routineId }
        },
        data: { 
          isActive: false
          // Note: isArchived is intentionally NOT touched here
        },
      });

      // 2. Set this routine to active
      await tx.routine.update({
        where: { id: routineId },
        // @ts-ignore - Prisma type issue on this environment
        data: { isActive: true, isArchived: false },
      });
    });

    return NextResponse.json({ success: true, message: "Routine set to active" });
  } catch (error: any) {
    console.error("Error setting routine to active:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
