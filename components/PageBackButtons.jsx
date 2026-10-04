"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

export default function PageBackButtons({
  homeLabel = "Home",
  showHome = true,
}) {
  const router = useRouter();

  return (
    <div className="mb-8 flex flex-wrap items-center gap-3">
      {showHome && (
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/20 bg-[#111] px-4 py-2.5 text-sm font-medium text-white transition hover:border-[#d4af37]/50 hover:bg-[#d4af37] hover:text-black"
        >
          <Home size={16} />
          {homeLabel}
        </Link>
      )}

      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:border-[#d4af37]/40 hover:bg-white/10"
      >
        <ArrowLeft size={16} />
        Back
      </button>
    </div>
  );
}
