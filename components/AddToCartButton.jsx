
"use client";

import { ShoppingBag, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function AddToCartButton({
  menuItemId,
  disabled = false,
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function addToCart() {
    try {
      setLoading(true);

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

      // ==========================================
      // NOT LOGGED IN
      // ==========================================

      if (response.status === 401) {
        const confirm = await Swal.fire({
          icon: "info",
          title: "Login Required",
          text: "Please login to add dishes to your cart.",
          background: "#111111",
          color: "#ffffff",
          confirmButtonColor: "#d4af37",
          confirmButtonText: "Login",
          showCancelButton: true,
          cancelButtonText: "Continue Browsing",
        });

        if (confirm.isConfirmed) {
          router.push("/login");
        }

        return;
      }

      // ==========================================
      // OTHER ERROR
      // ==========================================

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to add item to cart."
        );
      }

      // ==========================================
      // SUCCESS
      // ==========================================

      await Swal.fire({
        icon: "success",
        title: "Added to Cart",
        text: "Your dish has been added to your cart.",
        background: "#111111",
        color: "#ffffff",
        confirmButtonColor: "#d4af37",
        confirmButtonText: "View Cart",
        showCancelButton: true,
        cancelButtonText: "Continue Shopping",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/cart");
        }
      });
    } catch (error) {
      console.error("Add to cart error:", error);

      Swal.fire({
        icon: "error",
        title: "Unable to Add",
        text:
          error.message ||
          "Something went wrong while adding this item.",
        background: "#111111",
        color: "#ffffff",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={addToCart}
      className="gold-button mt-9 flex w-full items-center justify-center gap-3 rounded-full px-7 py-4 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
    >
      {loading ? (
        <>
          <Loader2
            size={19}
            className="animate-spin"
          />
          Adding...
        </>
      ) : (
        <>
          <ShoppingBag size={19} />

          {disabled
            ? "Currently Unavailable"
            : "Add to Cart"}
        </>
      )}
    </button>
  );
}
