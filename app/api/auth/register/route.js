import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const body = await request.json();

    console.log("REGISTER BODY:", body);

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim() || "";
    const password = body.password;

    if (!name || !email || !password) {
      return Response.json(
        {
          success: false,
          message: "Name, email and password are required.",
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return Response.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "CUSTOMER",
      },
    });

    console.log("USER CREATED:", user.id);

    return Response.json(
      {
        success: true,
        message: "Account created successfully.",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("========== REGISTER ERROR ==========");
    console.error(error);
    console.error("====================================");

    return Response.json(
      {
        success: false,
        message: error?.message || "Failed to create your account.",
      },
      { status: 500 },
    );
  }
}
