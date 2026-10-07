import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["ADMIN", "STAFF"];

/*
 * ===============================================================
 * ADMIN / STAFF AUTHORIZATION
 * ===============================================================
 *
 * IMPORTANT:
 * Role is verified directly from PostgreSQL.
 *
 * We do NOT trust only:
 *
 * session.user.role
 *
 * ===============================================================
 */

async function getAuthorizedAdmin() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        authorized: false,
        status: 401,
        message: "Unauthorized.",
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return {
        authorized: false,
        status: 401,
        message: "User account not found.",
      };
    }

    const role = String(user.role || "")
      .trim()
      .toUpperCase();

    console.log("===== ADMIN NOTIFICATIONS AUTH =====");
    console.log("USER ID:", user.id);
    console.log("USER EMAIL:", user.email);
    console.log("SESSION ROLE:", session.user.role);
    console.log("DATABASE ROLE:", user.role);
    console.log("====================================");

    if (!ALLOWED_ROLES.includes(role)) {
      console.error("ADMIN NOTIFICATIONS ACCESS DENIED:", {
        userId: user.id,
        email: user.email,
        sessionRole: session.user.role,
        databaseRole: user.role,
      });

      return {
        authorized: false,
        status: 403,
        message: "Access denied.",
      };
    }

    return {
      authorized: true,
      user,
      role,
      session,
    };
  } catch (error) {
    console.error("ADMIN NOTIFICATIONS AUTH ERROR:", error);

    return {
      authorized: false,
      status: 500,
      message: "Authorization check failed.",
    };
  }
}

/*
 * ===============================================================
 * GET
 * ===============================================================
 *
 * ADMIN / STAFF only.
 *
 * Admin gets:
 *
 * 1. Notifications specifically assigned to admin
 * 2. Global notifications where userId = null
 *
 * CUSTOMER CAN NEVER REACH THIS API.
 * ===============================================================
 */

export async function GET() {
  try {
    const access = await getAuthorizedAdmin();

    if (!access.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: access.message,
        },
        {
          status: access.status,
        },
      );
    }

    const userId = access.user.id;

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          {
            userId: userId,
          },
          {
            userId: null,
          },
        ],
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        OR: [
          {
            userId: userId,
            isRead: false,
          },
          {
            userId: null,
            isRead: false,
          },
        ],
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
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("ADMIN NOTIFICATIONS GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load admin notifications.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * ===============================================================
 * PATCH
 * ===============================================================
 *
 * Mark ONE ADMIN notification as read.
 *
 * SECURITY:
 *
 * It can only update:
 *
 * 1. Current admin's own notification
 * OR
 * 2. Global notification (userId = null)
 *
 * Customer cannot reach this endpoint.
 * ===============================================================
 */

export async function PATCH(request) {
  try {
    const access = await getAuthorizedAdmin();

    if (!access.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: access.message,
        },
        {
          status: access.status,
        },
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        {
          status: 400,
        },
      );
    }

    const notificationId = body?.notificationId;

    if (!notificationId || typeof notificationId !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Notification ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,

        OR: [
          {
            userId: access.user.id,
          },
          {
            userId: null,
          },
        ],
      },
    });

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification not found.",
        },
        {
          status: 404,
        },
      );
    }

    const updatedNotification = await prisma.notification.update({
      where: {
        id: notificationId,
      },

      data: {
        isRead: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        notification: updatedNotification,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("ADMIN NOTIFICATIONS PATCH ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to update notification.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * ===============================================================
 * PUT
 * ===============================================================
 *
 * Mark all ADMIN / STAFF notifications as read.
 * ===============================================================
 */

export async function PUT() {
  try {
    const access = await getAuthorizedAdmin();

    if (!access.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: access.message,
        },
        {
          status: access.status,
        },
      );
    }

    const result = await prisma.notification.updateMany({
      where: {
        OR: [
          {
            userId: access.user.id,
            isRead: false,
          },
          {
            userId: null,
            isRead: false,
          },
        ],
      },

      data: {
        isRead: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "All admin notifications marked as read.",
        updatedCount: result.count,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("ADMIN NOTIFICATIONS PUT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message || "Failed to mark admin notifications as read.",
      },
      {
        status: 500,
      },
    );
  }
}
