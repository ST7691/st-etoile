import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first.",
        },
        { status: 401 },
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

    const action = String(body.action || "")
      .trim()
      .toUpperCase();

    if (action !== "CANCEL") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid reservation action.",
        },
        { status: 400 },
      );
    }

    // IMPORTANT:
    // Find reservation by BOTH id and current user ID.
    // This prevents users from changing another customer's reservation.
    const reservation = await prisma.reservation.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        {
          success: false,
          message: "Reservation not found.",
        },
        { status: 404 },
      );
    }

    // Only pending and confirmed reservations can be cancelled.
    if (
      reservation.status !== "PENDING" &&
      reservation.status !== "CONFIRMED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This reservation can no longer be cancelled.",
        },
        { status: 400 },
      );
    }

    const updatedReservation = await prisma.reservation.update({
      where: {
        id: reservation.id,
      },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reservation cancelled successfully.",
      data: updatedReservation,
    });
  } catch (error) {
    console.error("CUSTOMER RESERVATION CANCEL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to cancel reservation.",
      },
      { status: 500 },
    );
  }
}
