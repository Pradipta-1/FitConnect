import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  // Omit password hash for security
  const { passwordHash, ...safeUser } = user;

  return NextResponse.json({ success: true, data: safeUser });
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const { name, password, role, avatarUrl, bio, location, specializations } = await req.json();
    
    const updateData: any = {};
    if (name) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (Array.isArray(specializations)) updateData.specializations = specializations;
    if (password && typeof password === "string" && password.trim().length > 0) {
      updateData.passwordHash = await hashPassword(password);
    }
    // Role transition logic
    if (role && role !== user.role) {
      await prisma.$transaction(async (tx) => {
        // TRAINER -> USER
        if (user.role === "TRAINER" && role === "USER") {
          // 1. Delete routines and plans created by this trainer
          await tx.routine.deleteMany({ where: { trainerId: user.id } });
          await tx.workoutPlan.deleteMany({ where: { trainerId: user.id } });
          await tx.routineRequest.deleteMany({ where: { trainerId: user.id } });

          // 2. Cancel events organized by this trainer
          const organizedEvents = await tx.event.findMany({
            where: { organizerId: user.id, isCancelled: false }
          });
          
          for (const event of organizedEvents) {
            await tx.event.update({
              where: { id: event.id },
              data: { isCancelled: true }
            });
            // Send system message
            await tx.message.create({
              data: {
                senderId: user.id,
                eventId: event.id,
                content: "Event has been cancelled",
                isSystem: true
              }
            });
          }
        }

        // USER -> TRAINER (User to Trainer transition)
        if (user.role === "USER" && role === "TRAINER") {
          // 1. Delete routines and plans assigned to this user
          await tx.routine.deleteMany({ where: { userId: user.id } });
          await tx.workoutPlan.deleteMany({ where: { clientId: user.id } });
          await tx.routineRequest.deleteMany({ where: { userId: user.id } });
        }
      });
      updateData.role = role;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    const { passwordHash, ...safeUser } = updatedUser;
    return NextResponse.json({ success: true, data: safeUser });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Data Preservation for others:
      // If trainer, update their name in DailyProgress of clients to "DELETED ACCOUNT"
      if (user.role === "TRAINER") {
        // Find all routines created by this trainer
        const trainerRoutines = await tx.routine.findMany({
          where: { trainerId: user.id },
          select: { id: true }
        });
        const routineIds = trainerRoutines.map(r => r.id);

        // Update DailyProgress records linked to these routines
        await tx.dailyProgress.updateMany({
          where: { routineId: { in: routineIds } },
          data: {
            trainerName: "DELETED ACCOUNT",
            routineId: null
          }
        });
      }

      // 2. Cascade cleanup (Prisma might handle some, but we ensure thoroughness)
      
      // Delete Posts, Likes, Comments (Likes/Comments cascade from Post, but we delete the ones user MADE)
      await tx.like.deleteMany({ where: { userId: user.id } });
      await tx.comment.deleteMany({ where: { userId: user.id } });
      await tx.post.deleteMany({ where: { userId: user.id } });

      // Delete Routine-related info
      await tx.routineRequest.deleteMany({
        where: { OR: [{ userId: user.id }, { trainerId: user.id }] }
      });
      await tx.workoutPlan.deleteMany({
        where: { OR: [{ clientId: user.id }, { trainerId: user.id }] }
      });
      await tx.routine.deleteMany({
        where: { OR: [{ userId: user.id }, { trainerId: user.id }] }
      });

      // Daily Progress (User's own history)
      await tx.dailyProgress.deleteMany({ where: { userId: user.id } });

      // Handle Events
      if (user.role === "ORGANIZER" || user.role === "TRAINER") {
        // Events organized by this user
        await tx.event.deleteMany({ where: { organizerId: user.id } });
      }
      
      // Remove from events as participant
      // Prisma handles join-table removal automatically if correctly set, 
      // but let's be safe and manually disconnected if needed (User has eventParticipants)
      // Actually deleteMany on Join table isn't directly exposed in this schema way, it depends on relations.
      // But standard relation deletion in Prisma handles the Join table.

      // Notifications
      await tx.notification.deleteMany({
        where: { OR: [{ userId: user.id }, { relatedUserId: user.id }] }
      });

      // Trainer Requests/Invitations
      await tx.trainerInvitation.deleteMany({
        where: { OR: [{ organizerId: user.id }, { trainerId: user.id }] }
      });
      await tx.trainerEventRequest.deleteMany({
        where: { trainerId: user.id }
      });

      // 3. Final Deletion
      await tx.user.delete({ where: { id: user.id } });
    });

    return NextResponse.json({ success: true, message: "Account successfully deleted" });
  } catch (error: any) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
