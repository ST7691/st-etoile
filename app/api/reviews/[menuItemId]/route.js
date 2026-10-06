import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { menuItemId } = await params;

    if (!menuItemId) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu item ID is required.",
        },
        { status: 400 },
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        menuItemId,
      },
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
            image: true,
          },
        },
      },
    });

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0;

    return NextResponse.json({
      success: true,
      data: reviews,
      stats: {
        totalReviews: reviews.length,
        averageRating: Number(averageRating.toFixed(1)),
      },
    });
  } catch (error) {
    console.error("GET REVIEWS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load reviews.",
      },
      { status: 500 },
    );
  }
}
