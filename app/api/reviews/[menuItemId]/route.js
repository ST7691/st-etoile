import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { menuItemId } = await params;

    // -----------------------------------------
    // Validate menu item ID
    // -----------------------------------------
    if (!menuItemId || typeof menuItemId !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Menu item ID is required.",
        },
        { status: 400 },
      );
    }

    // -----------------------------------------
    // Check whether menu item exists
    // -----------------------------------------
    const menuItem = await prisma.menuItem.findUnique({
      where: {
        id: menuItemId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!menuItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu item not found.",
        },
        { status: 404 },
      );
    }

    // -----------------------------------------
    // Fetch reviews
    // -----------------------------------------
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

    // -----------------------------------------
    // Calculate rating statistics
    // -----------------------------------------
    const totalReviews = reviews.length;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);

    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    const ratingBreakdown = {
      5: reviews.filter((review) => review.rating === 5).length,
      4: reviews.filter((review) => review.rating === 4).length,
      3: reviews.filter((review) => review.rating === 3).length,
      2: reviews.filter((review) => review.rating === 2).length,
      1: reviews.filter((review) => review.rating === 1).length,
    };

    // -----------------------------------------
    // Response
    // -----------------------------------------
    return NextResponse.json({
      success: true,

      menuItem: {
        id: menuItem.id,
        name: menuItem.name,
      },

      data: reviews,

      stats: {
        totalReviews,
        averageRating: Number(averageRating.toFixed(1)),
        ratingBreakdown,
      },
    });
  } catch (error) {
    console.error("GET MENU ITEM REVIEWS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load reviews.",
      },
      { status: 500 },
    );
  }
}
