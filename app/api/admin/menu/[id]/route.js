import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(role) {
  return role === "ADMIN" || role === "STAFF";
}

// ======================================================
// PATCH - UPDATE MENU ITEM
// ======================================================

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    // Authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    // Authorization
    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu item ID is required",
        },
        {
          status: 400,
        },
      );
    }

    const body = await request.json();

    // --------------------------------------------------
    // FIND EXISTING ITEM
    // --------------------------------------------------

    const existing = await prisma.menuItem.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu item not found",
        },
        {
          status: 404,
        },
      );
    }

    // --------------------------------------------------
    // BODY DATA
    // --------------------------------------------------

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

    // --------------------------------------------------
    // VALIDATE NAME
    // --------------------------------------------------

    if (name !== undefined && !name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Food name cannot be empty",
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------
    // VALIDATE CATEGORY
    // --------------------------------------------------

    if (categoryId) {
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
          {
            status: 404,
          },
        );
      }
    }

    // --------------------------------------------------
    // SLUG
    // --------------------------------------------------

    let cleanSlug;

    if (slug !== undefined) {
      cleanSlug = slug?.trim().toLowerCase().replace(/\s+/g, "-");

      const slugOwner = await prisma.menuItem.findFirst({
        where: {
          slug: cleanSlug,
          NOT: {
            id,
          },
        },
      });

      if (slugOwner) {
        return NextResponse.json(
          {
            success: false,
            message: "This slug is already in use",
          },
          {
            status: 409,
          },
        );
      }
    }

    // --------------------------------------------------
    // PRICE
    // --------------------------------------------------

    let numericPrice;

    if (price !== undefined) {
      numericPrice = Number(price);

      if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid price",
          },
          {
            status: 400,
          },
        );
      }
    }

    // --------------------------------------------------
    // OLD PRICE
    // --------------------------------------------------

    let numericOldPrice;

    if (oldPrice !== undefined) {
      if (oldPrice === "" || oldPrice === null) {
        numericOldPrice = null;
      } else {
        numericOldPrice = Number(oldPrice);

        if (!Number.isFinite(numericOldPrice) || numericOldPrice < 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid old price",
            },
            {
              status: 400,
            },
          );
        }
      }
    }

    // --------------------------------------------------
    // RATING
    // --------------------------------------------------

    let numericRating;

    if (rating !== undefined) {
      numericRating = Number(rating);

      if (
        !Number.isFinite(numericRating) ||
        numericRating < 0 ||
        numericRating > 5
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Rating must be between 0 and 5",
          },
          {
            status: 400,
          },
        );
      }
    }

    // --------------------------------------------------
    // UPDATE DATA
    // --------------------------------------------------

    const updateData = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (cleanSlug !== undefined) {
      updateData.slug = cleanSlug;
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (numericPrice !== undefined) {
      updateData.price = numericPrice;
    }

    if (oldPrice !== undefined) {
      updateData.oldPrice = numericOldPrice;
    }

    if (image !== undefined) {
      updateData.image = image?.trim() || null;
    }

    if (categoryId !== undefined) {
      updateData.categoryId = categoryId;
    }

    if (numericRating !== undefined) {
      updateData.rating = numericRating;
    }

    if (available !== undefined) {
      updateData.available = Boolean(available);
    }

    if (featured !== undefined) {
      updateData.featured = Boolean(featured);
    }

    // --------------------------------------------------
    // UPDATE
    // --------------------------------------------------

    const menuItem = await prisma.menuItem.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Menu item updated successfully",
      data: menuItem,
    });
  } catch (error) {
    console.error("ADMIN MENU PATCH ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to update menu item",
      },
      {
        status: 500,
      },
    );
  }
}

// ======================================================
// DELETE - SOFT DELETE MENU ITEM
// ======================================================

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    // --------------------------------------------------
    // ADMIN / STAFF CHECK
    // --------------------------------------------------

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu item ID is required",
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------
    // FIND MENU ITEM
    // --------------------------------------------------

    const existing = await prisma.menuItem.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu item not found",
        },
        {
          status: 404,
        },
      );
    }

    // --------------------------------------------------
    // ALREADY REMOVED
    // --------------------------------------------------

    if (existing.available === false) {
      return NextResponse.json({
        success: true,
        message: "Menu item is already unavailable",
        data: existing,
      });
    }

    // ==================================================
    // SOFT DELETE
    // ==================================================
    //
    // IMPORTANT:
    //
    // We DO NOT use:
    //
    // prisma.menuItem.delete()
    //
    // because this item may already be referenced
    // by existing orders.
    //
    // Instead we mark it unavailable.
    // ==================================================

    const updatedItem = await prisma.menuItem.update({
      where: {
        id,
      },
      data: {
        available: false,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Menu item removed from the active menu successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.error("ADMIN MENU DELETE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to remove menu item",
      },
      {
        status: 500,
      },
    );
  }
}
