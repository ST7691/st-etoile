import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["ADMIN", "STAFF"];

export async function GET() {
  try {
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

    const userId = session.user.id;

    // --------------------------------------------------
    // Get current DB user
    // --------------------------------------------------

    const dbUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    const role = String(dbUser.role || "")
      .trim()
      .toUpperCase();

    const isAdmin = ADMIN_ROLES.includes(role);

    // --------------------------------------------------
    // Notification visibility
    //
    // CUSTOMER:
    // own notifications only
    //
    // ADMIN / STAFF:
    // global notifications + own notifications
    // --------------------------------------------------

    const where = isAdmin
      ? {
          OR: [
            {
              userId: null,
            },
            {
              userId,
            },
          ],
        }
      : {
          userId,
        };

    // --------------------------------------------------
    // Notifications
    // --------------------------------------------------

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    // --------------------------------------------------
    // Unread count
    // --------------------------------------------------

    const unreadCount = await prisma.notification.count({
      where: {
        ...where,
        isRead: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        notifications,
        unreadCount,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load notifications.",
      },
      {
        status: 500,
      },
    );
  }
}

// ======================================================
// MARK SINGLE NOTIFICATION AS READ
// ======================================================

export async function PATCH(request) {
  try {
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

    const userId = session.user.id;

    // --------------------------------------------------
    // Get DB role
    // --------------------------------------------------

    const dbUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        role: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    const role = String(dbUser.role || "")
      .trim()
      .toUpperCase();

    const isAdmin = ADMIN_ROLES.includes(role);

    // --------------------------------------------------
    // Body
    // --------------------------------------------------

    const body = await request.json();

    const id = String(body?.id || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification ID is required.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // Find notification
    //
    // Customer:
    // only own notification
    //
    // Admin/Staff:
    // own OR global notification
    // --------------------------------------------------

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        ...(isAdmin
          ? {
              OR: [
                {
                  userId: null,
                },
                {
                  userId,
                },
              ],
            }
          : {
              userId,
            }),
      },
    });

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification not found.",
        },
        { status: 404 },
      );
    }

    // --------------------------------------------------
    // Mark read
    // --------------------------------------------------

    const updated = await prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      success: true,
      notification: updated,
    });
  } catch (error) {
    console.error("PATCH NOTIFICATION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark notification as read.",
      },
      { status: 500 },
    );
  }
}

// ======================================================
// MARK ALL NOTIFICATIONS AS READ
// ======================================================

export async function PUT() {
  try {
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

    const userId = session.user.id;

    // --------------------------------------------------
    // Get DB role
    // --------------------------------------------------

    const dbUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        role: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    const role = String(dbUser.role || "")
      .trim()
      .toUpperCase();

    const isAdmin = ADMIN_ROLES.includes(role);

    // --------------------------------------------------
    // Mark all visible unread notifications as read
    // --------------------------------------------------

    const result = await prisma.notification.updateMany({
      where: {
        ...(isAdmin
          ? {
              OR: [
                {
                  userId: null,
                },
                {
                  userId,
                },
              ],
            }
          : {
              userId,
            }),
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("PUT NOTIFICATIONS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark notifications as read.",
      },
      { status: 500 },
    );
  }
}
