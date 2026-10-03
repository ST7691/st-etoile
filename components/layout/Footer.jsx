"use client";

import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone, Utensils } from "lucide-react";
import { FaFacebookF, FaInstagram } from "react-icons/fa6";

const footerLinks = [
  {
    title: "Explore",
    links: [
      { name: "Home", href: "/" },
      { name: "Menu", href: "/menu" },
      { name: "About", href: "/about" },
      { name: "Gallery", href: "/gallery" },
    ],
  },
  {
    title: "Services",
    links: [
      { name: "Reservations", href: "/reservation" },
      { name: "Home Delivery", href: "/menu" },
      { name: "My Orders", href: "/orders" },
      { name: "Contact", href: "/contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[#D4AF37]/15 bg-[#050505]">
      {/* Background glow */}
      <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-[#D4AF37]/5 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6 pt-20 sm:px-8 lg:px-10 lg:pt-24">
        {/* Main footer */}
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D4AF37]/50">
                <Utensils size={19} className="text-[#D4AF37]" />
              </div>

              <div>
                <p className="font-serif text-2xl font-semibold tracking-[0.12em] text-[#D4AF37]">
                  ST
                </p>

                <p className="text-[9px] uppercase tracking-[0.3em] text-white/40">
                  Restaurant
                </p>
              </div>
            </Link>

            <p className="mt-6 max-w-sm text-sm leading-7 text-white/40">
              A refined dining destination where exceptional cuisine, elegant
              ambience, and genuine hospitality come together.
            </p>

            {/* Social */}
            <div className="mt-7 flex gap-3">
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                <FaInstagram size={16} />
              </a>

              <a
                href="#"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                <FaFacebookF size={15} />
              </a>

              <a
                href="#"
                aria-label="Email"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
                {group.title}
              </h3>

              <ul className="mt-6 space-y-4">
                {group.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
                    >
                      {link.name}

                      <ArrowUpRight
                        size={12}
                        className="opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
              Visit Us
            </h3>

            <div className="mt-6 space-y-5">
              <div className="flex gap-3">
                <MapPin size={17} className="mt-1 shrink-0 text-[#D4AF37]" />

                <p className="text-sm leading-6 text-white/45">
                  ST Restaurant
                  <br />
                  Sylhet, Bangladesh
                </p>
              </div>

              <div className="flex gap-3">
                <Phone size={17} className="mt-1 shrink-0 text-[#D4AF37]" />

                <p className="text-sm text-white/45">+880 1XXX-XXXXXX</p>
              </div>

              <div className="flex gap-3">
                <Mail size={17} className="mt-1 shrink-0 text-[#D4AF37]" />

                <p className="break-all text-sm text-white/45">
                  hello@strestaurant.com
                </p>
              </div>
            </div>

            <Link
              href="/reservation"
              className="gold-button mt-7 inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold"
            >
              Reserve a Table
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* Newsletter / CTA */}
        <div className="mt-20 overflow-hidden rounded-[26px] border border-[#D4AF37]/15 bg-[#0d0d0d] p-7 sm:p-9">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]">
                Stay Connected
              </p>

              <h3 className="mt-2 font-serif text-2xl font-semibold text-white">
                Get our latest offers & updates.
              </h3>
            </div>

            <Link
              href="/contact"
              className="group inline-flex items-center gap-3 text-sm font-medium text-white/70 transition hover:text-[#D4AF37]"
            >
              Contact ST Restaurant
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 transition group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black">
                <ArrowUpRight size={15} />
              </span>
            </Link>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 py-7 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} ST Restaurant. All rights reserved.
          </p>

          <div className="flex gap-5">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>

            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
