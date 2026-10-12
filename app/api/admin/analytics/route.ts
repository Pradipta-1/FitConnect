import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const [
      totalUsers,
      traineeCount,
      trainerCount,
      organizerCount,
      adminCount,
      totalEvents,
      approvedEvents,
      pendingEvents,
      totalRoutines,
      activeRoutines,
      totalLoggedWorkouts,
      totalPosts,
      totalMessages
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "TRAINER" } }),
      prisma.user.count({ where: { role: "ORGANIZER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.event.count(),
      prisma.event.count({ where: { status: "APPROVED" } }),
      prisma.event.count({ where: { status: "PENDING" } }),
      prisma.routine.count(),
      prisma.routine.count({ where: { isActive: true } }),
      prisma.dailyProgress.count({ where: { isCompleted: true } }),
      prisma.post.count(),
      prisma.message.count()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          trainees: traineeCount,
          trainers: trainerCount,
          organizers: organizerCount,
          admins: adminCount
        },
        events: {
          total: totalEvents,
          approved: approvedEvents,
          pending: pendingEvents
        },
        workouts: {
          routinesCreated: totalRoutines,
          activeRoutines,
          completedWorkouts: totalLoggedWorkouts
        },
        engagement: {
          posts: totalPosts,
          messages: totalMessages
        }
      }
    });
  } catch (error: any) {
    console.error("Error fetching admin analytics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
