import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "ALL";
    const method = searchParams.get("method")?.trim() || "ALL";

    const where = {};

    if (status !== "ALL") {
      where.status = status;
    }

    if (method !== "ALL") {
      where.method = method;
    }

    if (search) {
      where.OR = [
        {
          transactionId: {
            contains: search,
          },
        },
        {
          order: {
            orderNumber: {
              contains: search,
            },
          },
        },
        {
          order: {
            user: {
              name: {
                contains: search,
              },
            },
          },
        },
        {
          order: {
            user: {
              email: {
                contains: search,
              },
            },
          },
        },
      ];
    }

    const payments = await prisma.payment.findMany({
      where,

      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,

            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const [
      totalPayments,
      paidPayments,
      pendingPayments,
      failedPayments,
      cancelledPayments,
      paidAggregate,
    ] = await Promise.all([
      prisma.payment.count(),

      prisma.payment.count({
        where: {
          status: "PAID",
        },
      }),

      prisma.payment.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.payment.count({
        where: {
          status: "FAILED",
        },
      }),

      prisma.payment.count({
        where: {
          status: "CANCELLED",
        },
      }),

      prisma.payment.aggregate({
        where: {
          status: "PAID",
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const methodStats = await prisma.payment.groupBy({
      by: ["method"],
      _count: {
        _all: true,
      },
      _sum: {
        amount: true,
      },
    });

    const statusStats = await prisma.payment.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
      _sum: {
        amount: true,
      },
    });

    return NextResponse.json({
      success: true,

      data: {
        payments,

        stats: {
          totalPayments,
          paidPayments,
          pendingPayments,
          failedPayments,
          cancelledPayments,

          totalRevenue: paidAggregate._sum.amount || 0,
        },

        methodStats,
        statusStats,

        count: payments.length,
      },
    });
  } catch (error) {
    console.error("ADMIN PAYMENT API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load payment data.",
      },
      { status: 500 },
    );
  }
}
