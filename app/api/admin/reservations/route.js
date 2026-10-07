
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

const ALLOWED_ROLES = ["ADMIN", "STAFF"];

export async function GET(request) {
  try {
    // -----------------------------------------
    // 1. Check authentication
    // -----------------------------------------
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    // -----------------------------------------
    // 2. Check admin/staff role
    // -----------------------------------------
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 },
      );
    }

    // -----------------------------------------
    // 3. Read query parameters
    // -----------------------------------------
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search")?.trim() || "";

    // -----------------------------------------
    // 4. Build filters
    // -----------------------------------------
    const where = {};

    if (status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // -----------------------------------------
    // 5. Get reservations
    // -----------------------------------------
    const reservations = await prisma.reservation.findMany({
      where,
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
      take: 100,
    });

    // -----------------------------------------
    // 6. Get reservation statistics
    // -----------------------------------------
    const [
      total,
      pending,
      confirmed,
      completed,
      cancelled,
    ] = await Promise.all([
      prisma.reservation.count(),

      prisma.reservation.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.reservation.count({
        where: {
          status: "CONFIRMED",
        },
      }),

      prisma.reservation.count({
        where: {
          status: "COMPLETED",
        },
      }),

      prisma.reservation.count({
        where: {
          status: "CANCELLED",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      reservations,
      stats: {
        total,
        pending,
        confirmed,
        completed,
        cancelled,
      },
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

export async function PATCH(request) {
  try {
    // -----------------------------------------
    // 1. Check authentication
    // -----------------------------------------
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    // -----------------------------------------
    // 2. Check admin/staff role
    // -----------------------------------------
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 },
      );
    }

    // -----------------------------------------
    // 3. Read body
    // -----------------------------------------
    const body = await request.json();

    const reservationId = String(
      body.reservationId || "",
    ).trim();

    const newStatus = String(body.status || "")
      .trim()
      .toUpperCase();

    // -----------------------------------------
    // 4. Validate input
    // -----------------------------------------
    if (!reservationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Reservation ID is required.",
        },
        { status: 400 },
      );
    }

    const allowedStatuses = [
      "PENDING",
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid reservation status.",
        },
        { status: 400 },
      );
    }

    // -----------------------------------------
    // 5. Find reservation
    // -----------------------------------------
    const reservation =
      await prisma.reservation.findUnique({
        where: {
          id: reservationId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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

    // -----------------------------------------
    // 6. No update if same status
    // -----------------------------------------
    if (reservation.status === newStatus) {
      return NextResponse.json({
        success: true,
        message: "Reservation status is already up to date.",
        reservation,
      });
    }

    // -----------------------------------------
    // 7. Update reservation
    // -----------------------------------------
    const updatedReservation =
      await prisma.reservation.update({
        where: {
          id: reservationId,
        },
        data: {
          status: newStatus,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    // -----------------------------------------
    // 8. Create customer notification
    // -----------------------------------------
    if (reservation.user?.id) {
      const statusMessages = {
        PENDING:
          "Your reservation is waiting for confirmation.",
        CONFIRMED:
          "Your table reservation has been confirmed.",
        COMPLETED:
          "Your reservation has been marked as completed. Thank you for dining with us.",
        CANCELLED:
          "Your table reservation has been cancelled.",
      };

      await createNotification({
        type: "RESERVATION",
        title: `Reservation ${newStatus}`,
        message:
          statusMessages[newStatus] ||
          `Your reservation status is now ${newStatus}.`,
        link: "/dashboard/reservations",
        userId: reservation.user.id,
      });
    }

    // -----------------------------------------
    // 9. Create admin global notification
    // -----------------------------------------
    if (newStatus === "CONFIRMED") {
      await createNotification({
        type: "RESERVATION",
        title: "Reservation Confirmed",
        message: `${reservation.name}'s reservation has been confirmed for ${reservation.guests} guests at ${reservation.time}.`,
        link: "/dashboard/reservations",
        userId: null,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Reservation status updated successfully.",
      reservation: updatedReservation,
    });
  } catch (error) {
    console.error("ADMIN RESERVATIONS PATCH ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update reservation.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    // -----------------------------------------
    // 1. Check authentication
    // -----------------------------------------
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    // -----------------------------------------
    // 2. Check admin/staff role
    // -----------------------------------------
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 },
      );
    }

    // -----------------------------------------
    // 3. Get reservation ID
    // -----------------------------------------
    const { searchParams } = new URL(request.url);

    const reservationId = searchParams
      .get("id")
      ?.trim();

    if (!reservationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Reservation ID is required.",
        },
        { status: 400 },
      );
    }

    // -----------------------------------------
    // 4. Check reservation exists
    // -----------------------------------------
    const reservation =
      await prisma.reservation.findUnique({
        where: {
          id: reservationId,
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

    // -----------------------------------------
    // 5. Delete reservation
    // -----------------------------------------
    await prisma.reservation.delete({
      where: {
        id: reservationId,
      },
    });

    // -----------------------------------------
    // 6. Optional admin notification
    // -----------------------------------------
    await createNotification({
      type: "RESERVATION",
      title: "Reservation Deleted",
      message: `${reservation.name}'s reservation has been deleted by ${session.user.name || "an admin"}.`,
      link: "/dashboard/reservations",
      userId: null,
    });

    return NextResponse.json({
      success: true,
      message: "Reservation deleted successfully.",
    });
  } catch (error) {
    console.error("ADMIN RESERVATIONS DELETE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete reservation.",
      },
      { status: 500 },
    );
  }
}

