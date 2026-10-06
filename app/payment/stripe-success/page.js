"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Package, ArrowRight } from "lucide-react";

export default function StripeSuccessPage() {
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const params = new URLSearchParams(window.location.search);

        const sessionId = params.get("session_id");

        if (!sessionId) {
          setError("Stripe session ID is missing.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/payments/stripe/verify?session_id=${encodeURIComponent(
            sessionId,
          )}`,
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to verify payment.");
        }

        setPayment(result.data);
      } catch (err) {
        console.error("PAYMENT VERIFICATION ERROR:", err);

        setError(err?.message || "Unable to verify your payment.");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#0b0b0b] px-4">
        <div className="text-center">
          <Loader2 className="mx-auto mb-5 h-12 w-12 animate-spin text-[#d4af37]" />

          <h1 className="text-2xl font-semibold text-white">
            Verifying Payment
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Please wait while we confirm your Stripe payment.
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#0b0b0b] px-4">
        <div className="w-full max-w-lg rounded-3xl border border-red-500/20 bg-[#151515] p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <Package className="h-8 w-8 text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-white">
            Payment Verification Failed
          </h1>

          <p className="mt-3 text-gray-400">{error}</p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/orders"
              className="rounded-xl border border-white/10 px-6 py-3 font-medium text-white transition hover:bg-white/5"
            >
              My Orders
            </Link>

            <Link
              href="/"
              className="rounded-xl bg-[#d4af37] px-6 py-3 font-semibold text-black transition hover:bg-[#e4c354]"
            >
              Back Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-[#0b0b0b] px-4 py-16">
      <div className="w-full max-w-2xl rounded-3xl border border-[#d4af37]/20 bg-[#151515] p-8 text-center shadow-2xl sm:p-12">
        {/* Success Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#d4af37]/10">
          <CheckCircle2 className="h-12 w-12 text-[#d4af37]" />
        </div>

        {/* Heading */}
        <p className="mt-7 text-sm font-semibold uppercase tracking-[0.3em] text-[#d4af37]">
          Payment Successful
        </p>

        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Thank You for Your Order!
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-gray-400">
          Your payment has been successfully received. Your order is now being
          processed by ST Restaurant.
        </p>

        {/* Payment Details */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5 text-left">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <span className="text-sm text-gray-400">Order Number</span>

            <span className="font-semibold text-white">
              {payment?.orderNumber || "N/A"}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-white/10 py-4">
            <span className="text-sm text-gray-400">Payment Status</span>

            <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-400">
              PAID
            </span>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-gray-400">Amount Paid</span>

            <span className="text-lg font-bold text-[#d4af37]">
              {payment?.currency || "USD"}{" "}
              {payment?.amount ? Number(payment.amount).toFixed(2) : "0.00"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {payment?.orderId && (
            <Link
              href={`/orders/${payment.orderId}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-6 py-3.5 font-semibold text-black transition hover:bg-[#e4c354]"
            >
              View Order
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}

          <Link
            href="/orders"
            className="rounded-xl border border-white/10 px-6 py-3.5 font-semibold text-white transition hover:bg-white/5"
          >
            My Orders
          </Link>

          <Link
            href="/menu"
            className="rounded-xl border border-white/10 px-6 py-3.5 font-semibold text-white transition hover:bg-white/5"
          >
            Order More
          </Link>
        </div>
      </div>
    </main>
  );
}
