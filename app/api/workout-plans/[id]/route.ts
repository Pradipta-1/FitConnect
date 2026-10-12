import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireRole } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  const { id } = await params;

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  if (!requireRole(user.role, ["TRAINER", "ADMIN"])) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const plan = await prisma.workoutPlan.findUnique({
      where: { id }
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found" },
        { status: 404 }
      );
    }

    // Only allow the trainer who created it (or an ADMIN) to delete it
    if (user.role !== "ADMIN" && plan.trainerId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden - You can only delete your own plans" },
        { status: 403 }
      );
    }

    await prisma.workoutPlan.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Workout plan deleted" });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, error: "Failed to delete workout plan" },
      { status: 500 }
    );
  }
}
