import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastCommunityViewAt: new Date() }
    });

    return NextResponse.json({ success: true, message: "Community view recorded in database" });
  } catch (error: any) {
    console.error("Error recording community view:", error);
    return NextResponse.json({ success: false, error: "Failed to record view" }, { status: 500 });
  }
}
