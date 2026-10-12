import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "TRAINER") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await context.params;

    // Soft-delete the routine
    const routine = await prisma.routine.update({
      where: { 
        id,
        trainerId: user.id // Ensure trainer owns the routine
      },
      data: {
        isActive: false,
        // @ts-ignore - Prisma type issue on this environment
        isArchived: true
      }
    });

    return NextResponse.json({ success: true, data: routine });
  } catch (error: any) {
    console.error("Error deleting routine:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "TRAINER") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { days } = body;

    if (!days || !Array.isArray(days) || days.length !== 7) {
      return NextResponse.json({ success: false, error: "Invalid data. Must include 7 days." }, { status: 400 });
    }

    // Update the routine's days (trainer must own the routine)
    const routine = await prisma.routine.update({
      where: {
        id,
        trainerId: user.id
      },
      data: {
        days: days,
        isActive: true,
        // @ts-ignore - Prisma type issue on this environment
        isArchived: false,
      }
    });

    return NextResponse.json({ success: true, data: routine });
  } catch (error: any) {
    console.error("Error updating routine:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
