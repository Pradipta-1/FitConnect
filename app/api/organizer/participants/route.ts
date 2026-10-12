import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const events = await prisma.event.findMany({
      where: { organizerId: user.id },
      include: {
        participants: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true, location: true }
        },
        trainerParticipants: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true, specializations: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      sportType: event.sportType,
      location: event.location,
      startDate: event.startDate,
      participantLimit: event.participantLimit,
      totalParticipants: event.participants.length + event.trainerParticipants.length,
      participants: event.participants,
      trainers: event.trainerParticipants
    }));

    const totalAthletes = events.reduce((sum, e) => sum + e.participants.length, 0);
    const totalTrainers = events.reduce((sum, e) => sum + e.trainerParticipants.length, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalAthletes,
        totalTrainers,
        totalEvents: events.length,
        events: formattedEvents
      }
    });
  } catch (error: any) {
    console.error("Error fetching organizer participants:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}
