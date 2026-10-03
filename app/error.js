"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function GlobalError({ reset }) {
  useEffect(() => {
    console.error("ST Restaurant application error.");
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-6">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#7f1d2d]/50 bg-[#7f1d2d]/10">
          <AlertTriangle className="h-9 w-9 text-[#d4af37]" />
        </div>

        <p className="mt-8 text-sm uppercase tracking-[0.4em] text-[#d4af37]">
          Something went wrong
        </p>

        <h1 className="mt-4 font-serif text-4xl text-white sm:text-5xl">
          Our kitchen needs a moment.
        </h1>

        <p className="mx-auto mt-5 max-w-md leading-7 text-white/50">
          An unexpected error occurred. Please try again or return to the
          restaurant homepage.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => reset()}
            className="gold-button inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold"
          >
            <RefreshCcw size={17} />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d4af37]/30 px-7 py-3 text-sm text-white transition hover:border-[#d4af37] hover:text-[#d4af37]"
          >
            <Home size={17} />
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
