"use client";

import { useEffect, useState } from "react";

export default function PageLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Page loader duration
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505] transition-opacity duration-500">
      {/* Glow Effect */}
      <div className="absolute h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-[100px]" />

      <div className="relative flex flex-col items-center justify-center">
        {/* Premium Gold Loader */}
        <div className="relative flex h-44 w-44 items-center justify-center sm:h-56 sm:w-56">
          {/* Outer rotating ring */}
          <div className="absolute h-32 w-32 rounded-full border border-[#D4AF37]/10 sm:h-40 sm:w-40" />

          {/* Main rotating ring */}
          <div className="absolute h-28 w-28 animate-spin rounded-full border-2 border-[#D4AF37]/15 border-t-[#D4AF37] border-r-[#D4AF37]/60 sm:h-36 sm:w-36" />

          {/* Inner rotating ring */}
          <div className="absolute h-20 w-20 animate-[spin_2s_linear_infinite_reverse] rounded-full border border-[#D4AF37]/30 border-b-[#D4AF37] sm:h-24 sm:w-24" />

          {/* Center glow */}
          <div className="absolute h-12 w-12 animate-pulse rounded-full bg-[#D4AF37]/10 blur-md" />

          {/* ST Logo */}
          <span className="relative z-10 font-serif text-2xl font-semibold tracking-[0.18em] text-[#D4AF37]">
            ST
          </span>
        </div>

        {/* Brand Name */}
        <div className="mt-4 text-center">
          <p className="font-serif text-xl font-semibold tracking-[0.2em] text-[#D4AF37]">
            ST
          </p>

          <p className="mt-1 animate-pulse text-[10px] uppercase tracking-[0.3em] text-white/50">
            Restaurant
          </p>
        </div>

        {/* Loading dots */}
        <div className="mt-5 flex items-center gap-1.5">
          <span className="h-1 w-1 animate-pulse rounded-full bg-[#D4AF37]" />
          <span
            className="h-1 w-1 animate-pulse rounded-full bg-[#D4AF37]"
            style={{ animationDelay: "200ms" }}
          />
          <span
            className="h-1 w-1 animate-pulse rounded-full bg-[#D4AF37]"
            style={{ animationDelay: "400ms" }}
          />
        </div>
      </div>
    </div>
  );
}
