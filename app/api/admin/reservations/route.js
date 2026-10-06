import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function isStaffOrAdmin(session) {
  return session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first.",
        },
        { status: 401 },
      );
    }

    if (!isStaffOrAdmin(session)) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 },
      );
    }

    const reservations = await prisma.reservation.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
      },
      orderBy: [
        {
          date: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      data: reservations,
      count: reservations.length,
    });
  } catch (error) {
    console.error("ADMIN RESERVATIONS GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load reservations.",
      },
      { status: 500 },
    );
  }
}
