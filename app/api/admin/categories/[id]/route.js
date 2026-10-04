import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function isStaff(role) {
  return role === "ADMIN" || role === "STAFF";
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user || !isStaff(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 },
      );
    }

    const data = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            message: "Category name is required",
          },
          { status: 400 },
        );
      }

      const slug = slugify(name);

      const duplicate = await prisma.category.findFirst({
        where: {
          slug,
          NOT: {
            id,
          },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message: "Another category already uses this name",
          },
          { status: 409 },
        );
      }

      data.name = name;
      data.slug = slug;
    }

    if (body.description !== undefined) {
      data.description = String(body.description || "").trim() || null;
    }

    if (body.image !== undefined) {
      data.image = String(body.image || "").trim() || null;
    }

    const category = await prisma.category.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            menuItems: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("ADMIN CATEGORY PATCH ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update category",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user || !isStaff(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            menuItems: true,
          },
        },
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

    if (category._count.menuItems > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `This category contains ${category._count.menuItems} menu item(s). Move or delete those items first.`,
        },
        { status: 409 },
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("ADMIN CATEGORY DELETE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete category",
      },
      { status: 500 },
    );
  }
}
