"use client";

import Link from "next/link";
import { ArrowLeft, Home, RefreshCw, XCircle } from "lucide-react";

export default function PaymentFailedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-6 py-32">
      <div className="w-full max-w-xl rounded-3xl border border-red-500/20 bg-[#111] p-10 text-center sm:p-14">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
          <XCircle size={44} className="text-red-400" />
        </div>

        <p className="mt-7 text-xs uppercase tracking-[0.4em] text-[#d4af37]">
          ST Restaurant
        </p>

        <h1 className="mt-4 font-serif text-4xl text-white">Payment Failed</h1>

        <p className="mt-4 leading-7 text-white/40">
          We could not complete your payment. Your order has not been marked as
          paid.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm text-white/60 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            <ArrowLeft size={16} />
            My Orders
          </Link>

          <Link
            href="/checkout"
            className="gold-button inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
          >
            <RefreshCw size={16} />
            Try Again
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
