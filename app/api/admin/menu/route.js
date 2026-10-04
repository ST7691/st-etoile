import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(role) {
  return role === "ADMIN" || role === "STAFF";
}

// GET — all menu items
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 },
      );
    }

    const menuItems = await prisma.menuItem.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
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
      data: menuItems,
    });
  } catch (error) {
    console.error("ADMIN MENU GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load menu",
      },
      { status: 500 },
    );
  }
}

// POST — create menu item
export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 },
      );
    }

    const body = await request.json();

    const {
      name,
      slug,
      description,
      price,
      oldPrice,
      image,
      categoryId,
      rating,
      available,
      featured,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Food name is required",
        },
        { status: 400 },
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        {
          success: false,
          message: "Category is required",
        },
        { status: 400 },
      );
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid price is required",
        },
        { status: 400 },
      );
    }

    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 },
      );
    }

    const cleanSlug =
      slug?.trim().toLowerCase().replace(/\s+/g, "-") ||
      name.trim().toLowerCase().replace(/\s+/g, "-");

    const existing = await prisma.menuItem.findUnique({
      where: {
        slug: cleanSlug,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "A menu item with this slug already exists",
        },
        { status: 409 },
      );
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        description: description?.trim() || null,
        price: numericPrice,
        oldPrice:
          oldPrice !== "" && oldPrice !== null && oldPrice !== undefined
            ? Number(oldPrice)
            : null,
        image: image?.trim() || null,
        categoryId,
        rating: rating !== undefined && rating !== "" ? Number(rating) : 5,
        available: available !== undefined ? Boolean(available) : true,
        featured: featured !== undefined ? Boolean(featured) : false,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Menu item created successfully",
        data: menuItem,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("ADMIN MENU POST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create menu item",
      },
      { status: 500 },
    );
  }
}
