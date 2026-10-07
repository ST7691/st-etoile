import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

/*
|--------------------------------------------------------------------------
| GET /api/reservations
|--------------------------------------------------------------------------
| Get logged-in customer's reservations
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first.",
        },
        {
          status: 401,
        },
      );
    }

    const reservations = await prisma.reservation.findMany({
      where: {
        userId: session.user.id,
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
    });
  } catch (error) {
    console.error("CUSTOMER RESERVATIONS GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load reservations.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/reservations
|--------------------------------------------------------------------------
| Create new table reservation
|--------------------------------------------------------------------------
*/

export async function POST(request) {
  try {
    /*
     * ---------------------------------------------------------------
     * 1. Authentication
     * ---------------------------------------------------------------
     */

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first.",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * ---------------------------------------------------------------
     * 2. Read request body
     * ---------------------------------------------------------------
     */

    const body = await request.json();

    const name = String(body.name || "").trim();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const phone = String(body.phone || "").trim();

    const date = String(body.date || "").trim();

    const time = String(body.time || "").trim();

    const guests = Number(body.guests);

    const specialNote = String(body.specialNote || "").trim();

    /*
     * ---------------------------------------------------------------
     * 3. Validate required fields
     * ---------------------------------------------------------------
     */

    if (!name || !phone || !date || !time) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, phone, date and time are required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ---------------------------------------------------------------
     * 4. Validate guests
     * ---------------------------------------------------------------
     */

    if (!Number.isInteger(guests) || guests < 1 || guests > 30) {
      return NextResponse.json(
        {
          success: false,
          message: "Guests must be between 1 and 30.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ---------------------------------------------------------------
     * 5. Validate reservation date
     * ---------------------------------------------------------------
     */

    const reservationDate = new Date(date);

    if (Number.isNaN(reservationDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid reservation date.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ---------------------------------------------------------------
     * 6. Prevent past date
     * ---------------------------------------------------------------
     */

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    reservationDate.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot reserve a table for a past date.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ---------------------------------------------------------------
     * 7. Check duplicate reservation
     * ---------------------------------------------------------------
     */

    const existingReservation = await prisma.reservation.findFirst({
      where: {
        userId: session.user.id,

        date: reservationDate,

        time,

        status: {
          not: "CANCELLED",
        },
      },
    });

    if (existingReservation) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have a reservation for this date and time.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * ---------------------------------------------------------------
     * 8. Create reservation
     * ---------------------------------------------------------------
     */

    const reservation = await prisma.reservation.create({
      data: {
        userId: session.user.id,

        name,

        email: email || session.user.email || null,

        phone,

        date: reservationDate,

        time,

        guests,

        specialNote: specialNote || null,

        status: "PENDING",
      },
    });

    /*
     * ---------------------------------------------------------------
     * 9. Create admin/staff notification
     * ---------------------------------------------------------------
     *
     * IMPORTANT:
     * This is a global notification.
     *
     * userId = null
     *
     * Admin/Staff notification bell
     * will receive this notification.
     * ---------------------------------------------------------------
     */

    const notification = await createNotification({
      type: "RESERVATION",

      title: "New Reservation",

      message: `${reservation.name} booked a table for ${reservation.guests} guests on ${reservation.date.toLocaleDateString()} at ${reservation.time}.`,

      /*
       * Actual dashboard route
       */
      link: "/dashboard/reservations",

      userId: null,
    });

    /*
     * ---------------------------------------------------------------
     * 10. Success response
     * ---------------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        message: "Your reservation has been submitted successfully.",

        data: reservation,

        notificationCreated: Boolean(notification),
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("CUSTOMER RESERVATION POST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create reservation.",
      },
      {
        status: 500,
      },
    );
  }
}
