"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, ChefHat, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ChefStory() {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const contentRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Main content reveal
      gsap.from(contentRef.current, {
        x: 80,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
      });

      // Image reveal
      gsap.from(imageRef.current, {
        x: -80,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
      });

      // Image parallax
      gsap.to(".chef-image", {
        y: -35,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      // Stats animation
      gsap.from(".chef-stat", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top 85%",
        },
      });

      // Decorative line
      gsap.from(".chef-line", {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#080808] py-24 sm:py-28 lg:py-36"
    >
      {/* Background glow */}
      <div className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-[#7F1D2D]/10 blur-[140px]" />

      <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#D4AF37]/5 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          {/* IMAGE SIDE */}
          <div ref={imageRef} className="relative">
            {/* Decorative frame */}
            <div className="absolute -left-4 -top-4 h-24 w-24 border-l border-t border-[#D4AF37]/50 sm:-left-6 sm:-top-6" />

            <div className="absolute -bottom-4 -right-4 h-24 w-24 border-b border-r border-[#D4AF37]/50 sm:-bottom-6 sm:-right-6" />

            {/* Main image */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-[30px] border border-[#D4AF37]/20 bg-[#111111]">
              <div className="chef-image absolute inset-0 h-[115%] w-full">
                <Image
                  src="/images/chef/chef.webp"
                  alt="ST Restaurant executive chef"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority={true}
                />
              </div>

              {/* Image overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

              {/* Experience badge */}
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]">
                    Executive Chef
                  </p>

                  <h3 className="mt-2 font-serif text-2xl font-semibold text-white sm:text-3xl">
                    Chef Alexander
                  </h3>
                </div>

                <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/50 bg-black/40 backdrop-blur-md sm:flex">
                  <ChefHat size={22} className="text-[#D4AF37]" />
                </div>
              </div>
            </div>

            {/* Floating award card */}
            <div className="absolute -bottom-8 -right-3 rounded-2xl border border-[#D4AF37]/20 bg-[#111111]/90 p-4 shadow-2xl backdrop-blur-xl sm:-right-8 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#D4AF37]/10">
                  <Award size={20} className="text-[#D4AF37]" />
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/40">
                    Culinary Award
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    Excellence 2026
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT SIDE */}
          <div ref={contentRef}>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-10 bg-[#D4AF37]" />

              <span className="text-xs uppercase tracking-[0.4em] text-[#D4AF37]">
                The Art Behind The Plate
              </span>
            </div>

            <h2 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Crafted with
              <br />
              <span className="italic text-[#D4AF37]">
                Passion & Precision.
              </span>
            </h2>

            <div className="chef-line mt-7 h-px w-24 bg-[#D4AF37]" />

            <p className="mt-7 text-base leading-8 text-white/55">
              At ST Restaurant, every plate tells a story. Our culinary team
              combines timeless techniques with modern creativity to create
              dishes that are as memorable as they are delicious.
            </p>

            <p className="mt-5 text-base leading-8 text-white/55">
              Led by our executive chef, our kitchen focuses on exceptional
              ingredients, balanced flavors, elegant presentation, and a dining
              experience that guests remember long after the final course.
            </p>

            {/* Quote */}
            <div className="relative mt-8 border-l border-[#D4AF37]/50 pl-5">
              <Sparkles
                size={18}
                className="absolute -left-[9px] top-0 bg-[#080808] text-[#D4AF37]"
              />

              <p className="font-serif text-lg italic leading-8 text-white/80">
                “Great food is not simply prepared. It is experienced,
                remembered, and shared.”
              </p>

              <p className="mt-3 text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
                — Executive Chef
              </p>
            </div>

            {/* Stats */}
            <div
              ref={statsRef}
              className="mt-10 grid grid-cols-3 border-y border-white/10 py-6"
            >
              <div className="chef-stat border-r border-white/10 pr-4">
                <p className="font-serif text-2xl font-semibold text-white sm:text-3xl">
                  15+
                </p>

                <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/40 sm:text-[10px]">
                  Years Experience
                </p>
              </div>

              <div className="chef-stat px-4 sm:px-6">
                <p className="font-serif text-2xl font-semibold text-white sm:text-3xl">
                  40+
                </p>

                <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/40 sm:text-[10px]">
                  Signature Dishes
                </p>
              </div>

              <div className="chef-stat border-l border-white/10 pl-4 sm:pl-6">
                <p className="font-serif text-2xl font-semibold text-white sm:text-3xl">
                  25K+
                </p>

                <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/40 sm:text-[10px]">
                  Happy Guests
                </p>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/about"
              className="group mt-9 inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.15em] text-white transition hover:text-[#D4AF37]"
            >
              Discover Our Story
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 transition duration-300 group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black">
                <ArrowRight
                  size={15}
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
