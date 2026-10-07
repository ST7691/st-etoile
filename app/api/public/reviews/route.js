import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const ratingParam = searchParams.get("rating") || "ALL";
    const search = searchParams.get("search")?.trim() || "";

    const where = {};

    // Rating filter
    if (ratingParam !== "ALL") {
      const rating = Number(ratingParam);

      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid rating filter.",
          },
          { status: 400 },
        );
      }

      where.rating = rating;
    }

    // Search
    if (search) {
      where.OR = [
        {
          comment: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          user: {
            is: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          menuItem: {
            is: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    const reviews = await prisma.review.findMany({
      where,

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

    const totalRating = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0,
    );

    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

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
    console.error("PUBLIC REVIEWS GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load reviews.",
      },
      { status: 500 },
    );
  }
}
