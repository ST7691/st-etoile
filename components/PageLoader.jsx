"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Next.js Turbopack / SSR Compatible Dynamic Import
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

// Lottie Animation Data Fetch করার জন্য Helper Component
function RemoteLottieLoader() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    // ফ্রি Lottie JSON লোড করার অনলাইন URL
    fetch("https://assets2.lottiefiles.com/packages/lf20_a2chheef.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch(() => null);
  }, []);

  if (!animationData) {
    // JSON ফেচ হওয়া পর্যন্ত Tailwind Spinner Fallback
    return (
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#D4AF37]/20 border-t-[#D4AF37]" />
    );
  }

  return <Lottie animationData={animationData} loop={true} autoplay={true} />;
}

export default function PageLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // পেজ লোড বা ডেটা রেডি হওয়ার টাইমার (২ সেকেন্ড)
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
        {/* Lottie Animation */}
        <div className="flex h-44 w-44 items-center justify-center sm:h-56 sm:w-56">
          <RemoteLottieLoader />
        </div>

        {/* Brand Name */}
        <div className="mt-4 text-center">
          <p className="font-serif text-xl font-semibold tracking-[0.2em] text-[#D4AF37]">
            ST
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/50 animate-pulse">
            Restaurant
          </p>
        </div>
      </div>
    </div>
  );
}
