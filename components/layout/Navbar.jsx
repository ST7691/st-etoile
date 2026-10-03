"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ShoppingBag, UserRound, Utensils } from "lucide-react";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Menu", href: "/menu" },
  { name: "About", href: "/about" },
  { name: "Gallery", href: "/gallery" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 z-50 w-full transition-all duration-500 ${
        isScrolled
          ? "border-b border-[#D4AF37]/20 bg-[#080808]/85 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          onClick={closeMenu}
          className="group flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/60 transition duration-300 group-hover:border-[#D4AF37] group-hover:rotate-6">
            <Utensils size={18} className="text-[#D4AF37]" />
          </div>

          <div>
            <h1 className="font-serif text-xl font-semibold tracking-[0.12em] text-[#D4AF37]">
              ST
            </h1>

            <p className="text-[9px] uppercase tracking-[0.28em] text-white/60">
              Restaurant
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="group relative text-sm text-white/75 transition duration-300 hover:text-[#D4AF37]"
            >
              {link.name}

              <span className="absolute -bottom-2 left-0 h-px w-0 bg-[#D4AF37] transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
            aria-label="Login"
          >
            <UserRound size={17} />
          </Link>

          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
            aria-label="Shopping cart"
          >
            <ShoppingBag size={17} />

            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[9px] font-bold text-black">
              0
            </span>
          </Link>

          <Link
            href="/reservation"
            className="gold-button ml-2 rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            Reserve Table
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37] lg:hidden"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`overflow-hidden border-t border-[#D4AF37]/10 bg-[#080808]/95 backdrop-blur-xl transition-all duration-500 lg:hidden ${
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="mx-auto max-w-7xl px-5 py-5">
          <div className="flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={closeMenu}
                className="border-b border-white/5 py-4 text-sm text-white/80 transition hover:pl-2 hover:text-[#D4AF37]"
              >
                {link.name}
              </Link>
            ))}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link
                href="/login"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 rounded-full border border-white/10 py-3 text-sm text-white/80"
              >
                <UserRound size={16} />
                Login
              </Link>

              <Link
                href="/cart"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 rounded-full border border-white/10 py-3 text-sm text-white/80"
              >
                <ShoppingBag size={16} />
                Cart
              </Link>
            </div>

            <Link
              href="/reservation"
              onClick={closeMenu}
              className="gold-button mt-3 rounded-full py-3 text-center text-sm font-semibold"
            >
              Reserve a Table
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
