import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const menuItemId = String(body.menuItemId || "").trim();
    const rating = Number(body.rating);
    const comment = String(body.comment || "").trim();

    if (!menuItemId) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu item is required.",
        },
        { status: 400 },
      );
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Rating must be between 1 and 5.",
        },
        { status: 400 },
      );
    }

    if (!comment || comment.length < 3) {
      return NextResponse.json(
        {
          success: false,
          message: "Please write a review.",
        },
        { status: 400 },
      );
    }

    if (comment.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          message: "Review must be less than 1000 characters.",
        },
        { status: 400 },
      );
    }

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

    // Customer must have a delivered order
    const deliveredOrder = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: "DELIVERED",
        items: {
          some: {
            menuItemId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!deliveredOrder) {
      return NextResponse.json(
        {
          success: false,
          message: "You can review this item only after receiving your order.",
        },
        { status: 403 },
      );
    }

    // One review per customer per menu item
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        menuItemId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already reviewed this item.",
        },
        { status: 409 },
      );
    }

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        menuItemId,
        rating,
        comment,
      },
      include: {
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
          },
        },
      },
    });

    // Recalculate menu item rating
    const ratingData = await prisma.review.aggregate({
      where: {
        menuItemId,
      },
      _avg: {
        rating: true,
      },
    });

    await prisma.menuItem.update({
      where: {
        id: menuItemId,
      },
      data: {
        rating: Number(Number(ratingData._avg.rating || 0).toFixed(1)),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Review submitted successfully.",
        data: review,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE REVIEW ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit review.",
      },
      { status: 500 },
    );
  }
}
