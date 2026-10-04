import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function isStaff(role) {
  return role === "ADMIN" || role === "STAFF";
}

export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user || !isStaff(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const role = searchParams.get("role") || "all";

    const where = {};

    if (role !== "all") {
      where.role = role;
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
          },
        },
        {
          email: {
            contains: search,
          },
        },
        {
          phone: {
            contains: search,
          },
        },
      ];
    }

    const customers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,

        _count: {
          select: {
            orders: true,
            reservations: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: customers,
      count: customers.length,
    });
  } catch (error) {
    console.error("ADMIN CUSTOMERS GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load customers",
      },
      { status: 500 },
    );
  }
}
