import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function isStaffOrAdmin(session) {
  return session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";
}

export async function DELETE(request, { params }) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Review ID is required.",
        },
        { status: 400 },
      );
    }

    const review = await prisma.review.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        menuItemId: true,
      },
    });

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          message: "Review not found.",
        },
        { status: 404 },
      );
    }

    await prisma.review.delete({
      where: {
        id,
      },
    });

    /* Recalculate menu rating */

    if (review.menuItemId) {
      const ratingData = await prisma.review.aggregate({
        where: {
          menuItemId: review.menuItemId,
        },
        _avg: {
          rating: true,
        },
      });

      const newRating = Number(Number(ratingData._avg.rating || 0).toFixed(1));

      await prisma.menuItem.update({
        where: {
          id: review.menuItemId,
        },
        data: {
          rating: newRating,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error("ADMIN REVIEW DELETE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete review.",
      },
      { status: 500 },
    );
  }
}
