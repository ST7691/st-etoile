import { NextResponse } from "next/server";
import { auth } from "@/auth";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request) {
  try {
    // =========================
    // 1. AUTH CHECK
    // =========================
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 },
      );
    }

    // =========================
    // 2. ROLE CHECK
    // =========================
    const role = session.user.role;

    if (role !== "ADMIN" && role !== "STAFF") {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to upload images.",
        },
        { status: 403 },
      );
    }

    // =========================
    // 3. CLOUDINARY ENV CHECK
    // =========================
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("CLOUDINARY ENVIRONMENT VARIABLES ARE MISSING");

      return NextResponse.json(
        {
          success: false,
          message:
            "Cloudinary configuration is missing. Check your .env.local file.",
        },
        { status: 500 },
      );
    }

    // =========================
    // 4. GET FILE
    // =========================
    const formData = await request.formData();

    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No image file was selected.",
        },
        { status: 400 },
      );
    }

    // =========================
    // 5. FILE TYPE CHECK
    // =========================
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid image type. JPG, PNG, WebP and AVIF are allowed.",
        },
        { status: 400 },
      );
    }

    // =========================
    // 6. FILE SIZE CHECK
    // =========================
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Image size must be less than 5MB.",
        },
        { status: 400 },
      );
    }

    // =========================
    // 7. FILE -> BUFFER
    // =========================
    const arrayBuffer = await file.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    // =========================
    // 8. BUFFER -> BASE64
    // =========================
    const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;

    console.log("Uploading image to Cloudinary...");

    // =========================
    // 9. CLOUDINARY UPLOAD
    // =========================
    const uploadedImage = await cloudinary.uploader.upload(base64Image, {
      folder: "st-restaurant/menu",
      resource_type: "image",
    });

    console.log("CLOUDINARY UPLOAD SUCCESS:", uploadedImage.secure_url);

    // =========================
    // 10. SUCCESS RESPONSE
    // =========================
    return NextResponse.json({
      success: true,
      message: "Image uploaded successfully.",

      data: {
        url: uploadedImage.secure_url,
        secure_url: uploadedImage.secure_url,

        public_id: uploadedImage.public_id,

        width: uploadedImage.width,
        height: uploadedImage.height,

        format: uploadedImage.format,

        bytes: uploadedImage.bytes,
      },
    });
  } catch (error) {
    console.error("=================================");
    console.error("CLOUDINARY UPLOAD ERROR");
    console.error(error);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Image upload failed.",
      },
      { status: 500 },
    );
  }
}
