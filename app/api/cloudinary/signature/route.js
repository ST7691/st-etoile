import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request) {
  try {
    const body = await request.json();

    const folder = body?.folder || "st-restaurant/menu";

    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign = {
      folder,
      timestamp,
    };

    const stringToSign = Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join("&");

    const signature = crypto
      .createHash("sha1")
      .update(stringToSign + process.env.CLOUDINARY_API_SECRET)
      .digest("hex");

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });
  } catch (error) {
    console.error("Cloudinary signature error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate Cloudinary signature.",
      },
      { status: 500 },
    );
  }
}
