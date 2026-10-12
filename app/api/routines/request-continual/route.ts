import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { trainerId } = await req.json();
    if (!trainerId) {
      return NextResponse.json({ success: false, error: "Missing trainerId" }, { status: 400 });
    }

    // Create a message from User to Trainer
    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId: trainerId,
        content: `${user.name || 'User'} requests continual of routine`,
      }
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error: any) {
    console.error("Error requesting routine continual:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
