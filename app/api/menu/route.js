import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");

    const where = {
      available: true,
    };

    // Category filter
    if (category && category !== "all") {
      const categorySlug = category.trim().toLowerCase().replace(/\s+/g, "-");

      where.category = {
        slug: categorySlug,
      };
    }

    // Search filter
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
          },
        },
        {
          description: {
            contains: search,
          },
        },
      ];
    }

    // Featured filter
    if (featured === "true") {
      where.featured = true;
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        category: true,
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
      count: menuItems.length,
    });
  } catch (error) {
    console.error("================================");
    console.error("MENU API ERROR");
    console.error(error);
    console.error("================================");

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load menu",
        error: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
