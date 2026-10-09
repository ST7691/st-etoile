
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "ST Restaurant — Fine Dining & Fresh Cuisine";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background:
            "radial-gradient(ellipse at center, #242016 0%, #101010 48%, #050505 100%)",
          color: "#f5f1e8",
          fontFamily: "Arial, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "28px",
            border: "2px solid #8d7227",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            color: "#d4af37",
            fontSize: 22,
            letterSpacing: 9,
            marginBottom: 24,
          }}
        >
          FINE DINING EXPERIENCE
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: 5,
            color: "#d4af37",
          }}
        >
          ST RESTAURANT
        </div>

        <div
          style={{
            width: 180,
            height: 3,
            background: "#d4af37",
            display: "flex",
            marginTop: 28,
            marginBottom: 28,
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: 32,
            letterSpacing: 2,
            color: "#f5f1e8",
          }}
        >
          Fine Dining & Fresh Cuisine
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 18,
            letterSpacing: 5,
            color: "#b7a66b",
            marginTop: 30,
          }}
        >
          TASTE THE EXTRAORDINARY
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}