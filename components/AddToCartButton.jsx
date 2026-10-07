"use client";

import { ShoppingBag, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function AddToCartButton({ menuItemId, disabled = false }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function addToCart() {
    if (loading || disabled) return;

    try {
      setLoading(true);

      // ==========================================
      // INSTANT UI EVENT
      // ==========================================

      window.dispatchEvent(
        new CustomEvent("cart-loading", {
          detail: {
            menuItemId,
          },
        }),
      );

      // ==========================================
      // API REQUEST
      // ==========================================

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuItemId,
          quantity: 1,
        }),
        cache: "no-store",
      });

      // Read response safely
      const text = await response.text();

      let result = null;

      try {
        result = text ? JSON.parse(text) : null;
      } catch {
        throw new Error("Invalid response from cart server.");
      }

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
          router.push(
            `/login?callbackUrl=${encodeURIComponent(
              window.location.pathname,
            )}`,
          );
        }

        return;
      }

      // ==========================================
      // API ERROR
      // ==========================================

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Unable to add item to cart.");
      }

      // ==========================================
      // UPDATE CART STATE
      // ==========================================

      const updatedCart = result?.data || null;

      window.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: {
            cart: updatedCart,
            menuItemId,
          },
        }),
      );

      // ==========================================
      // SUCCESS
      // ==========================================

      const confirm = await Swal.fire({
        icon: "success",
        title: "Added to Cart",
        text: "Your dish has been added to your cart.",
        background: "#111111",
        color: "#ffffff",
        confirmButtonColor: "#d4af37",
        confirmButtonText: "View Cart",
        showCancelButton: true,
        cancelButtonText: "Continue Shopping",
        timer: 2500,
        timerProgressBar: true,
      });

      if (confirm.isConfirmed) {
        router.push("/cart");
      }
    } catch (error) {
      console.error("Add to cart error:", error);

      // ==========================================
      // REMOVE LOADING STATE
      // ==========================================

      window.dispatchEvent(
        new CustomEvent("cart-loading-failed", {
          detail: {
            menuItemId,
          },
        }),
      );

      await Swal.fire({
        icon: "error",
        title: "Unable to Add",
        text: error?.message || "Something went wrong while adding this item.",
        background: "#111111",
        color: "#ffffff",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setLoading(false);

      window.dispatchEvent(
        new CustomEvent("cart-loading-finished", {
          detail: {
            menuItemId,
          },
        }),
      );
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
          <Loader2 size={19} className="animate-spin" />
          Adding...
        </>
      ) : (
        <>
          <ShoppingBag size={19} />

          {disabled ? "Currently Unavailable" : "Add to Cart"}
        </>
      )}
    </button>
  );
}
