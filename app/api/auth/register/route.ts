import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role, name, specializations } = body ?? {};

    if (!email || !password || !role || !name) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedRole = String(role).toUpperCase();
    const allowedRoles = ["USER", "TRAINER", "ORGANIZER", "ADMIN"] as const;

    if (!allowedRoles.includes(normalizedRole as (typeof allowedRoles)[number])) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: normalizedRole as Role,
        name,
        specializations: Array.isArray(specializations) ? specializations : []
      }
    });

    const token = signToken({ userId: user.id, role: user.role });

    const res = NextResponse.json({
      success: true,
      token,
      data: { id: user.id, email: user.email, role: user.role, name: user.name }
    });

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/"
    });

    return res;
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "An error occurred during registration" },
      { status: 500 }
    );
  }
}
