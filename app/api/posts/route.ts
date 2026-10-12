import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const userId = user?.id;

    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: userId ? {
          where: { userId: userId },
          select: { id: true },
        } : false,
      },
    });

    const formattedPosts = posts.map((post: any) => ({
      ...post,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      isLikedByMe: post.likes ? post.likes.length > 0 : false,
    }));

    return NextResponse.json(
      { success: true, data: formattedPosts },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { content, imageUrl } = await req.json();

    if (!content && !imageUrl) {
      return NextResponse.json(
        { success: false, error: "Post content or image is required" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        content,
        imageUrl,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create post" },
      { status: 500 }
    );
  }
}
