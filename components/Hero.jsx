"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import gsap from "gsap";

export default function Hero() {
  const heroRef = useRef(null);
  const eyebrowRef = useRef(null);
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const buttonsRef = useRef(null);
  const scrollRef = useRef(null);
  const lineRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: {
          ease: "power3.out",
        },
      });

      timeline
        .from(eyebrowRef.current, {
          y: 30,
          opacity: 0,
          duration: 0.8,
        })
        .from(
          titleRef.current,
          {
            y: 80,
            opacity: 0,
            duration: 1.2,
          },
          "-=0.4",
        )
        .from(
          descriptionRef.current,
          {
            y: 30,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.6",
        )
        .from(
          buttonsRef.current,
          {
            y: 25,
            opacity: 0,
            duration: 0.7,
          },
          "-=0.4",
        )
        .from(
          scrollRef.current,
          {
            opacity: 0,
            duration: 0.6,
          },
          "-=0.2",
        );

      gsap.to(lineRef.current, {
        height: "100%",
        duration: 1.8,
        repeat: -1,
        repeatDelay: 0.5,
        ease: "power1.inOut",
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen overflow-hidden bg-[#080808]"
    >
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/video/hero.mp4" type="video/mp4" />
      </video>

      {/* Cinematic Overlay */}
      <div className="absolute inset-0 bg-black/55" />

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/25 to-[#080808]" />

      {/* Left Gradient */}
      <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-black/70 via-black/20 to-transparent" />

      {/* Decorative Gold Glow */}
      <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-[120px]" />

      {/* Hero Content */}
      <div className="relative z-10 flex min-h-screen items-center">
        <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-32 sm:px-8 lg:px-10">
          <div className="max-w-4xl">
            {/* Eyebrow */}
            <div ref={eyebrowRef} className="mb-6 flex items-center gap-4">
              <span className="h-px w-12 bg-[#D4AF37]" />

              <span className="text-xs font-medium uppercase tracking-[0.45em] text-[#D4AF37] sm:text-sm">
                Fine Dining Experience
              </span>
            </div>

            {/* Main Title */}
            <h1
              ref={titleRef}
              className="font-serif text-6xl font-semibold leading-[0.9] tracking-tight text-white sm:text-7xl md:text-8xl lg:text-[110px]"
            >
              Taste
              <br />
              <span className="italic text-[#D4AF37]">The Extraordinary.</span>
            </h1>

            {/* Description */}
            <p
              ref={descriptionRef}
              className="mt-8 max-w-xl text-base leading-7 text-white/70 sm:text-lg"
            >
              Discover a refined dining experience where exceptional
              ingredients, thoughtful craftsmanship, and unforgettable
              hospitality come together.
            </p>

            {/* CTA Buttons */}
            <div
              ref={buttonsRef}
              className="mt-10 flex flex-col gap-4 sm:flex-row"
            >
              <Link
                href="/menu"
                className="gold-button group inline-flex items-center justify-center gap-3 rounded-full px-7 py-3.5 text-sm font-semibold"
              >
                Explore Our Menu
                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/reservation"
                className="group inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                Reserve a Table
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Scroll Indicator */}
      <div
        ref={scrollRef}
        className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3"
      >
        <span className="text-[9px] uppercase tracking-[0.35em] text-white/50">
          Scroll
        </span>

        <div className="relative h-12 w-px overflow-hidden bg-white/20">
          <div
            ref={lineRef}
            className="absolute left-0 top-0 h-0 w-full bg-[#D4AF37]"
          />
        </div>

        <ArrowDown size={14} className="text-[#D4AF37]" />
      </div>

      {/* Decorative Corners */}
      <div className="absolute bottom-10 left-6 hidden h-16 w-16 border-b border-l border-[#D4AF37]/30 lg:block" />

      <div className="absolute right-6 top-28 hidden h-16 w-16 border-r border-t border-[#D4AF37]/30 lg:block" />
    </section>
  );
}
