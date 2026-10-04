import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

export async function PATCH(request, { params }) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Reservation ID is required.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const status = String(body.status || "")
      .trim()
      .toUpperCase();

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid reservation status.",
        },
        { status: 400 },
      );
    }

    const existingReservation = await prisma.reservation.findUnique({
      where: {
        id,
      },
    });

    if (!existingReservation) {
      return NextResponse.json(
        {
          success: false,
          message: "Reservation not found.",
        },
        { status: 404 },
      );
    }

    const updatedReservation = await prisma.reservation.update({
      where: {
        id,
      },
      data: {
        status,
      },
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
    });

    return NextResponse.json({
      success: true,
      message: "Reservation status updated successfully.",
      data: updatedReservation,
    });
  } catch (error) {
    console.error("ADMIN RESERVATION PATCH ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update reservation.",
      },
      { status: 500 },
    );
  }
}
