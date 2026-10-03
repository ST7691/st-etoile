import { prisma } from "@/lib/prisma";

// ==========================================
// GET /api/menu
// ==========================================

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");

    const menuItems = await prisma.menuItem.findMany({
      where: {
        available: true,

        ...(category
          ? {
              category: {
                slug: category,
              },
            }
          : {}),
      },

      include: {
        category: true,
      },

      orderBy: [
        {
          featured: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return Response.json({
      success: true,
      data: menuItems,
    });
  } catch (error) {
    console.error("GET /api/menu error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch menu.",
      },
      {
        status: 500,
      },
    );
  }
}

// ==========================================
// POST /api/menu
// ==========================================

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      name,
      slug,
      description,
      price,
      image,
      categoryId,
      available = true,
      featured = false,
    } = body;

    // -----------------------------
    // Validation
    // -----------------------------

    if (!name || !slug || price === undefined || !categoryId) {
      return Response.json(
        {
          success: false,
          message: "Name, slug, price and categoryId are required.",
        },
        {
          status: 400,
        },
      );
    }

    // -----------------------------
    // Check category
    // -----------------------------

    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return Response.json(
        {
          success: false,
          message: "Category not found.",
        },
        {
          status: 404,
        },
      );
    }

    // -----------------------------
    // Check duplicate slug
    // -----------------------------

    const existingMenuItem = await prisma.menuItem.findUnique({
      where: {
        slug,
      },
    });

    if (existingMenuItem) {
      return Response.json(
        {
          success: false,
          message: "A menu item with this slug already exists.",
        },
        {
          status: 409,
        },
      );
    }

    // -----------------------------
    // Create menu item
    // -----------------------------

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        slug,
        description: description || null,
        price: Number(price),
        image: image || null,
        available: Boolean(available),
        featured: Boolean(featured),
        categoryId,
      },

      include: {
        category: true,
      },
    });

    return Response.json(
      {
        success: true,
        message: "Menu item created successfully.",
        data: menuItem,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("POST /api/menu error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to create menu item.",
      },
      {
        status: 500,
      },
    );
  }
}
