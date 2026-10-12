import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const openToTrainers = searchParams.get("openToTrainers");

    const events = await prisma.event.findMany({
      where: {
        status: status ? (status as any) : "APPROVED",
        openToTrainers:
          openToTrainers != null ? openToTrainers === "true" : undefined,
        isCancelled: false
      },
      orderBy: { createdAt: "desc" },
      include: {
        organizer: {
          select: { id: true, name: true, avatarUrl: true }
        },
        participants: {
          select: { id: true, name: true, avatarUrl: true }
        },
        trainerParticipants: {
          select: { id: true, name: true, avatarUrl: true }
        }
      }
    });

    // Map events to include participation status for the current user
    const formattedEvents = events.map(event => ({
      ...event,
      isOrganizer: user ? event.organizerId === user.id : false,
      isParticipating: user ? (
        event.participants.some(p => p.id === user.id) || 
        event.trainerParticipants.some(p => p.id === user.id)
      ) : false
    }));

    return NextResponse.json({ success: true, data: formattedEvents });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const { 
      title, 
      sportType, 
      location, 
      startDate, 
      endDate, 
      timeRange, 
      participantLimit, 
      description 
    } = body;

    // Validation: Start date must be at least tomorrow
    if (startDate) {
      const start = new Date(startDate);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      if (start < tomorrow) {
        return NextResponse.json({ 
          success: false, 
          error: "Events can only be scheduled for dates starting from tomorrow onwards." 
        }, { status: 400 });
      }
    }

    // Create the event
    const event = await (prisma.event.create as any)({
      data: {
        title,
        sportType,
        location,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        timeRange,
        participantLimit: parseInt(participantLimit),
        description,
        organizerId: user.id,
        status: "APPROVED", // Trainer/Organizer created events are approved by default
      }
    });

    // Create a system message to initialize the group
    await (prisma.message.create as any)({
      data: {
        senderId: user.id,
        eventId: event.id,
        content: "Event created. Welcome to the group!",
        isSystem: true,
      }
    });

    return NextResponse.json({ success: true, data: event });
  } catch (error: any) {
    console.error("DETAILED ERROR creating event:", {
      message: error.message,
      stack: error.stack,
      body: typeof body !== 'undefined' ? body : 'body not parsed'
    });
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to create event" 
    }, { status: 500 });
  }
}

