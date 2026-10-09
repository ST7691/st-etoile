"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

export default function PayNowButton({ orderId, amount }) {
  const [loading, setLoading] = useState(false);

  async function handlePayment() {
    if (loading) return;

    const confirmation = await Swal.fire({
      title: "Proceed to Payment?",
      html: `<div style="font-size:14px">You will be redirected to SSLCommerz to complete your payment.<br/><br/><strong>Amount: ৳${Number(amount).toFixed(2)}</strong></div>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Pay Now",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d4af37",
      background: "#111111",
      color: "#f5f1e8",
    });

    if (!confirmation.isConfirmed) return;

    setLoading(true);

    try {
      const response = await fetch("/api/payments/sslcommerz/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            `Payment initialization failed (${response.status}).`,
        );
      }

      const gatewayUrl = data?.data?.gatewayUrl;

      if (
        typeof gatewayUrl !== "string" ||
        !gatewayUrl.startsWith("https://")
      ) {
        throw new Error("SSLCommerz did not return a valid payment URL.");
      }

      window.location.assign(gatewayUrl);
    } catch (error) {
      console.error("SSLCommerz payment error:", error);

      await Swal.fire({
        icon: "error",
        title: "Payment Failed",
        text: error?.message || "Unable to start payment.",
        confirmButtonColor: "#d4af37",
        background: "#111111",
        color: "#f5f1e8",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#f1d77a] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader2 size={17} className="animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <CreditCard size={17} />
          Pay Now
        </>
      )}
    </button>
  );
}
