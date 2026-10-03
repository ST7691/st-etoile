import { prisma } from "@/lib/prisma";

// GET /api/categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            menuItems: true,
          },
        },
      },
    });

    return Response.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("GET categories error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch categories.",
      },
      {
        status: 500,
      },
    );
  }
}

// POST /api/categories
export async function POST(request) {
  try {
    const body = await request.json();

    const { name, slug, description, image } = body;

    if (!name || !slug) {
      return Response.json(
        {
          success: false,
          message: "Name and slug are required.",
        },
        {
          status: 400,
        },
      );
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          {
            name,
          },
          {
            slug,
          },
        ],
      },
    });

    if (existingCategory) {
      return Response.json(
        {
          success: false,
          message: "Category already exists.",
        },
        {
          status: 409,
        },
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
      },
    });

    return Response.json(
      {
        success: true,
        message: "Category created successfully.",
        data: category,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("POST category error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to create category.",
      },
      {
        status: 500,
      },
    );
  }
}
