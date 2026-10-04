import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const role = session.user.role;

    if (role !== "ADMIN" && role !== "STAFF") {
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
          },
        },
      },
      orderBy: [
        {
          date: "asc",
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
