"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function ScrollButtons() {
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowButtons(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const scrollBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  if (!showButtons) return null;

  return (
    <div className="fixed bottom-6 right-5 z-40 flex flex-col gap-2">
      <button
        type="button"
        onClick={scrollTop}
        aria-label="Scroll to top"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#080808]/85 text-white/70 shadow-xl backdrop-blur-xl transition duration-300 hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
      >
        <ArrowUp size={17} />
      </button>

      <button
        type="button"
        onClick={scrollBottom}
        aria-label="Scroll to bottom"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#080808]/85 text-white/70 shadow-xl backdrop-blur-xl transition duration-300 hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
      >
        <ArrowDown size={17} />
      </button>
    </div>
  );
}
