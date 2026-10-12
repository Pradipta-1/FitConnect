import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "TRAINER") {
      return NextResponse.json({ success: false, error: "Unauthorized. Only trainers can submit routines" }, { status: 403 });
    }

    const body = await req.json();
    const { clientId, days } = body;

    if (!clientId || !days || !Array.isArray(days) || days.length !== 7) {
      return NextResponse.json({ success: false, error: "Invalid data. Must include clientId and 7 days of routines." }, { status: 400 });
    }

    // Wrap in transaction to ensure request is marked fulfilled when routine is created
    const result = await prisma.$transaction(async (tx) => {
      // Find the pending request (optional)
      const request = await tx.routineRequest.findUnique({
        where: {
          userId_trainerId: {
            userId: clientId,
            trainerId: user.id,
          }
        }
      });

      // Mark request as FULFILLED if it exists and is PENDING
      if (request && request.status === "PENDING") {
        await tx.routineRequest.update({
          where: { id: request.id },
          data: { status: "FULFILLED" }
        });
      }

      // Deactivate any currently active routine for this client so the new routine is active immediately
      await tx.routine.updateMany({
        where: { userId: clientId, isActive: true },
        data: { isActive: false }
      });

      // Find if this trainer already has a non-archived routine for this client
      const existingRoutine = await tx.routine.findFirst({
        where: {
          trainerId: user.id,
          userId: clientId,
          isArchived: false,
        }
      });

      let routine;
      if (existingRoutine) {
        routine = await tx.routine.update({
          where: { id: existingRoutine.id },
          data: {
            days,
            isActive: true, // Immediately active
            isArchived: false,
          }
        });
      } else {
        routine = await tx.routine.create({
          data: {
            trainerId: user.id,
            userId: clientId,
            isActive: true, // Immediately active
            isArchived: false,
            days: days,
          }
        });
      }

      // Notify trainee about the new workout plan
      try {
        await tx.notification.create({
          data: {
            userId: clientId,
            type: "TRAINER_REQUEST_ACCEPTED",
            message: `Coach ${user.name} has assigned you a 7-day workout plan! Check your dashboard to view your schedule.`,
            relatedUserId: user.id,
          }
        });

        await tx.message.create({
          data: {
            senderId: user.id,
            receiverId: clientId,
            content: `Hi! I have customized and assigned your 7-day workout plan. You can view your full weekly schedule and track your daily progress on your dashboard calendar!`,
            read: false,
          }
        });
      } catch (notifyErr) {
        console.warn("Could not create notification/message:", notifyErr);
      }

      return routine;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error creating routine:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";
    const targetUserId = searchParams.get("userId");

    if (user.role === "USER") {
      const routines = await prisma.routine.findMany({
        where: { 
          userId: user.id, 
          ...(activeOnly ? { isActive: true } : {})
        },
        include: {
          trainer: {
            select: { id: true, name: true, avatarUrl: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json({ success: true, data: routines });
    } else if (user.role === "TRAINER") {
      const routines = await prisma.routine.findMany({
        where: { 
          trainerId: user.id,
          ...(targetUserId ? { userId: targetUserId } : {})
        },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json({ success: true, data: routines });
    } else {
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 403 });
    }

  } catch (error: any) {
    console.error("Error fetching routines:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
