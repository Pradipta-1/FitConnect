import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "TRAINER") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const invitations = await prisma.trainerInvitation.findMany({
      where: { trainerId: user.id },
      include: {
        organizer: { select: { id: true, name: true, email: true, avatarUrl: true } },
        event: { select: { id: true, title: true, sportType: true, location: true, startDate: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const accepted = invitations.filter(inv => inv.status === "ACCEPTED");
    const pending = invitations.filter(inv => inv.status === "PENDING");

    const totalEarnings = accepted.reduce((sum, inv) => sum + (inv.paymentOffered || 0), 0);
    const pendingEarnings = pending.reduce((sum, inv) => sum + (inv.paymentOffered || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalEarnings,
        pendingEarnings,
        acceptedCount: accepted.length,
        pendingCount: pending.length,
        currency: "INR",
        history: invitations
      }
    });
  } catch (error: any) {
    console.error("Error fetching trainer earnings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
