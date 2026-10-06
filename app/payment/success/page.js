"use client";

import Link from "next/link";
import { CheckCircle, Home, ShoppingBag } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-6 py-32">
      <div className="w-full max-w-xl rounded-3xl border border-green-500/20 bg-[#111] p-10 text-center shadow-2xl sm:p-14">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle size={44} className="text-green-400" />
        </div>

        <p className="mt-7 text-xs uppercase tracking-[0.4em] text-[#d4af37]">
          ST Restaurant
        </p>

        <h1 className="mt-4 font-serif text-4xl text-white">
          Payment Successful
        </h1>

        <p className="mt-4 leading-7 text-white/40">
          Your payment has been verified successfully and your order has been
          confirmed.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/orders"
            className="gold-button inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
          >
            <ShoppingBag size={16} />
            My Orders
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm text-white/60 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            <Home size={16} />
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
