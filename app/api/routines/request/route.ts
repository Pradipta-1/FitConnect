import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    // Only a normal user can request a routine
    if (user.role !== "USER") {
      return NextResponse.json({ success: false, error: "Only users can request routines" }, { status: 403 });
    }

    const { trainerId } = await req.json();

    if (!trainerId) {
      return NextResponse.json({ success: false, error: "Trainer ID is required" }, { status: 400 });
    }

    // Check if the trainer actually exists and is a trainer
    const trainer = await prisma.user.findUnique({
      where: { id: trainerId }
    });

    if (!trainer || trainer.role !== "TRAINER") {
      return NextResponse.json({ success: false, error: "Invalid trainer" }, { status: 400 });
    }

    // Check if a request already exists between this user and trainer
    const existingRequest = await prisma.routineRequest.findUnique({
      where: {
        userId_trainerId: {
          userId: user.id,
          trainerId: trainer.id,
        }
      }
    });

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: "You have already requested a routine from this trainer" },
        { status: 400 }
      );
    }

    // Create the routine request
    const request = await prisma.routineRequest.create({
      data: {
        userId: user.id,
        trainerId: trainer.id,
        status: "PENDING",
      }
    });

    // Create a notification for the trainer
    await prisma.notification.create({
      data: {
        userId: trainer.id,
        type: "TRAINER_REQUEST_SUBMITTED",
        message: `${user.name} has requested a 7-day workout routine from you.`,
        relatedUserId: user.id,
      }
    });

    return NextResponse.json({ success: true, data: request });
  } catch (error: any) {
    console.error("Error creating routine request:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
