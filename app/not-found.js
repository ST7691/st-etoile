"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Home, Utensils } from "lucide-react";
import { useEffect, useState } from "react";

// Turbopack / Next.js SSR compatible dynamic import
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

// Remote Lottie Loader Component
function RemoteNotFoundLottie() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    // 404 Animation JSON
    fetch("https://assets5.lottiefiles.com/packages/lf20_kjir32m2.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch(() => null);
  }, []);

  if (!animationData) {
    return (
      <div className="flex h-48 w-48 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#D4AF37]/20 border-t-[#D4AF37]" />
      </div>
    );
  }

  return <Lottie animationData={animationData} loop={true} autoplay={true} />;
}

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#050505] px-6 text-center text-white">
      {/* Background glow */}
      <div className="absolute h-96 w-96 rounded-full bg-[#D4AF37]/10 blur-[150px]" />

      <div className="relative z-10 flex max-w-md flex-col items-center">
        {/* Lottie Animation Container */}
        <div className="h-64 w-64 sm:h-80 sm:w-80">
          <RemoteNotFoundLottie />
        </div>

        <div className="mt-2 flex items-center justify-center gap-2">
          <Utensils size={18} className="text-[#D4AF37]" />
          <span className="font-serif text-sm tracking-[0.2em] uppercase text-[#D4AF37]">
            ST Restaurant
          </span>
        </div>

        <h1 className="mt-4 font-serif text-3xl font-bold tracking-wide text-white sm:text-4xl">
          Page Not Found
        </h1>

        <p className="mt-3 text-sm leading-6 text-white/50">
          The page you are looking for doesn't exist or has been moved to a new
          dish line-up.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="gold-button inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 text-xs font-semibold text-black transition hover:bg-[#b8972e]"
          >
            <Home size={15} />
            Back to Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-xs font-semibold text-white/70 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
          >
            <ArrowLeft size={15} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
