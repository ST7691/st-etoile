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

    const reviews = await prisma.review.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,

        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },

        menuItem: {
          select: {
            id: true,
            name: true,
            image: true,
            price: true,
          },
        },
      },
    });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews > 0
        ? reviews.reduce((total, review) => total + review.rating, 0) /
          totalReviews
        : 0;

    const ratingStats = {
      five: reviews.filter((review) => review.rating === 5).length,
      four: reviews.filter((review) => review.rating === 4).length,
      three: reviews.filter((review) => review.rating === 3).length,
      two: reviews.filter((review) => review.rating === 2).length,
      one: reviews.filter((review) => review.rating === 1).length,
    };

    return NextResponse.json({
      success: true,

      data: reviews,

      stats: {
        totalReviews,
        averageRating: Number(averageRating.toFixed(1)),
        ratingStats,
      },
    });
  } catch (error) {
    console.error("ADMIN REVIEWS GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load reviews.",
      },
      { status: 500 },
    );
  }
}
