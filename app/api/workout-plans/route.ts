import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    if (requireRole(user.role, ["TRAINER"])) {
      const plans = await prisma.workoutPlan.findMany({
        where: { trainerId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          client: {
            select: { id: true, name: true }
          }
        }
      });

      return NextResponse.json({ success: true, data: plans });
    }

    if (requireRole(user.role, ["USER"])) {
      const plans = await prisma.workoutPlan.findMany({
        where: { clientId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          trainer: {
            select: { id: true, name: true }
          }
        }
      });

      return NextResponse.json({ success: true, data: plans });
    }

    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, error: "Failed to load workout plans" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  if (!requireRole(user.role, ["TRAINER"])) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const { clientId, title, description } = body ?? {};

  if (!clientId || !title || !description) {
    return NextResponse.json(
      { success: false, error: "Missing fields" },
      { status: 400 }
    );
  }

  try {
    const client = await prisma.user.findUnique({
      where: { id: clientId }
    });

    if (!client || client.role !== "USER") {
      return NextResponse.json(
        { success: false, error: "Invalid client" },
        { status: 400 }
      );
    }

    const plan = await prisma.workoutPlan.create({
      data: {
        trainerId: user.id,
        clientId,
        title,
        description
      }
    });

    return NextResponse.json({ success: true, data: plan }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, error: "Failed to create workout plan" },
      { status: 500 }
    );
  }
}

