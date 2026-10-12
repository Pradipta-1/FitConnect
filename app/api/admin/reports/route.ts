import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: reports });
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { reason, details, reportedUserId, postId, eventId } = await req.json();

    if (!reason || typeof reason !== "string") {
      return NextResponse.json({ success: false, error: "Reason is required" }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        reason: reason.trim(),
        details: details?.trim() || null,
        reportedUserId: reportedUserId || null,
        postId: postId || null,
        eventId: eventId || null,
        status: "PENDING"
      }
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    console.error("Error creating report:", error);
    return NextResponse.json({ success: false, error: "Failed to submit report" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Report ID and status required" }, { status: 400 });
    }

    const updated = await prisma.report.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating report:", error);
    return NextResponse.json({ success: false, error: "Failed to update report" }, { status: 500 });
  }
}
