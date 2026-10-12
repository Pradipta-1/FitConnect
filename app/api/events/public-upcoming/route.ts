import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      status: "APPROVED",
      date: { gte: now }
    },
    orderBy: { date: "asc" },
    take: 10
  });
  return NextResponse.json({ success: true, data: events });
}

