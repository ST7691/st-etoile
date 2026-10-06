"use client";

import { useState } from "react";
import Swal from "sweetalert2";

export default function StripePayButton({ orderId, disabled = false }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!orderId) {
      await Swal.fire({
        icon: "error",
        title: "Payment Error",
        text: "Order ID is missing.",
      });

      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/payments/stripe/create-session", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          orderId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to start Stripe payment.");
      }

      if (!result.data?.checkoutUrl) {
        throw new Error("Stripe checkout URL was not generated.");
      }

      // Redirect customer to Stripe Checkout
      window.location.href = result.data.checkoutUrl;
    } catch (error) {
      console.error("STRIPE PAYMENT ERROR:", error);

      await Swal.fire({
        icon: "error",
        title: "Payment Failed",
        text: error?.message || "Unable to start payment.",
        confirmButtonText: "OK",
      });

      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={disabled || loading}
      className="
        w-full
        rounded-xl
        bg-[#d4af37]
        px-6
        py-3.5
        font-semibold
        text-black
        transition
        hover:bg-[#e4c354]
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >
      {loading ? "Redirecting to Stripe..." : "Pay Securely with Stripe"}
    </button>
  );
}
