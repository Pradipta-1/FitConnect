import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({
        success: true,
        data: { unreadMessages: 0, unreadNotifications: 0, latestPostAt: null }
      });
    }

    const [unreadMessages, unreadNotifications, latestPost] = await Promise.all([
      prisma.message.count({
        where: {
          receiverId: user.id,
          read: false
        }
      }),
      prisma.notification.count({
        where: {
          userId: user.id,
          read: false
        }
      }),
      prisma.post.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true }
      })
    ]);

    const hasUnseenCommunity = Boolean(
      latestPost && (!user.lastCommunityViewAt || latestPost.createdAt > user.lastCommunityViewAt)
    );

    return NextResponse.json({
      success: true,
      data: {
        unreadMessages,
        unreadNotifications,
        latestPostAt: latestPost ? latestPost.createdAt.toISOString() : null,
        hasUnseenCommunity
      }
    });
  } catch (error) {
    console.error("Error fetching unread status:", error);
    return NextResponse.json({
      success: true,
      data: { unreadMessages: 0, unreadNotifications: 0, latestPostAt: null }
    });
  }
}
