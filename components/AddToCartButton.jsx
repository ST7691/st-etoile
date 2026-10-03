"use client";

import { ShoppingBag } from "lucide-react";
import Swal from "sweetalert2";

export default function AddToCartButton({ menuItemId, disabled = false }) {
  async function addToCart() {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          menuItemId,
          quantity: 1,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      await Swal.fire({
        icon: "success",
        title: "Added to Cart",
        text: "Your dish has been added to your cart.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to add",
        text: error.message || "Something went wrong.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });
    }
  }

  return (
    <button
      disabled={disabled}
      onClick={addToCart}
      className="gold-button mt-9 flex w-full items-center justify-center gap-3 rounded-full px-7 py-4 font-semibold disabled:cursor-not-allowed disabled:opacity-30"
    >
      <ShoppingBag size={19} />
      {disabled ? "Currently Unavailable" : "Add to Cart"}
    </button>
  );
}