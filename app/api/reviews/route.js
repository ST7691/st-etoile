import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

const MAX_COMMENT_LENGTH = 1000;

export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const menuItemId = searchParams.get("menuItemId");
    const mine = searchParams.get("mine") === "true";

    const where = {};

    if (menuItemId) {
      where.menuItemId = menuItemId;
    }

    if (mine) {
      where.userId = session.user.id;
    }

    const reviews = await prisma.review.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("GET REVIEWS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load reviews" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please login to submit a review" },
        { status: 401 },
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { menuItemId, rating, comment } = body;

    const parsedRating = Number(rating);

    if (!menuItemId) {
      return NextResponse.json(
        { error: "Menu item is required" },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(parsedRating) ||
      parsedRating < 1 ||
      parsedRating > 5
    ) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    if (typeof comment !== "string") {
      return NextResponse.json(
        { error: "Comment is required" },
        { status: 400 },
      );
    }

    const cleanComment = comment.trim();

    if (!cleanComment) {
      return NextResponse.json(
        { error: "Please write a review" },
        { status: 400 },
      );
    }

    if (cleanComment.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        {
          error: `Review must be ${MAX_COMMENT_LENGTH} characters or less`,
        },
        { status: 400 },
      );
    }

    // Check menu item
    const menuItem = await prisma.menuItem.findUnique({
      where: {
        id: menuItemId,
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    if (!menuItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 },
      );
    }

    // Check whether customer has a delivered order
    const purchasedItem = await prisma.orderItem.findFirst({
      where: {
        menuItemId,
        order: {
          userId: session.user.id,
          status: "DELIVERED",
        },
      },
      select: {
        id: true,
      },
    });

    if (!purchasedItem) {
      return NextResponse.json(
        {
          error: "You can review this item only after receiving your order.",
        },
        { status: 403 },
      );
    }

    // Prevent duplicate review for the same menu item
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        menuItemId,
      },
      select: {
        id: true,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        {
          error: "You have already reviewed this item.",
        },
        { status: 409 },
      );
    }

    const review = await prisma.review.create({
      data: {
        rating: parsedRating,
        comment: cleanComment,
        userId: session.user.id,
        menuItemId,
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

    // Notify admin/staff
    await createNotification({
      type: "REVIEW",
      title: "New Customer Review",
      message: `${session.user.name || "A customer"} submitted a ${parsedRating}-star review for ${menuItem.name}.`,
      link: "/dashboard/reviews",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Review submitted successfully",
        review,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST REVIEW ERROR:", error);

    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 },
    );
  }
}
