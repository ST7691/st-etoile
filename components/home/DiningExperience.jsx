"use client";

import Link from "next/link";
import { ArrowRight, Gem, Leaf, UtensilsCrossed, Wine } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const experiences = [
  {
    icon: UtensilsCrossed,
    number: "01",
    title: "Exceptional Cuisine",
    description:
      "Thoughtfully prepared dishes combining premium ingredients, timeless techniques, and modern culinary creativity.",
  },
  {
    icon: Wine,
    number: "02",
    title: "Curated Ambience",
    description:
      "An elegant atmosphere designed around warm lighting, refined details, comfortable seating, and memorable moments.",
  },
  {
    icon: Leaf,
    number: "03",
    title: "Fresh Ingredients",
    description:
      "We carefully select quality ingredients to preserve natural flavors and deliver consistency in every dish.",
  },
];

export default function DiningExperience() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headingRef.current, {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 72%",
        },
      });

      gsap.from(".experience-card", {
        y: 80,
        opacity: 0,
        duration: 1,
        stagger: 0.18,
        ease: "power3.out",
        scrollTrigger: {
          trigger: cardsRef.current,
          start: "top 78%",
        },
      });

      gsap.from(".experience-line", {
        scaleX: 0,
        transformOrigin: "center",
        duration: 1.2,
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
      className="relative overflow-hidden bg-[#111111] py-24 sm:py-28 lg:py-36"
    >
      {/* Background decoration */}
      <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-[#D4AF37]/5 blur-[130px]" />

      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        {/* Heading */}
        <div ref={headingRef} className="mx-auto max-w-3xl text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-[#D4AF37]" />

            <span className="text-xs uppercase tracking-[0.4em] text-[#D4AF37]">
              The ST Experience
            </span>

            <span className="h-px w-10 bg-[#D4AF37]" />
          </div>

          <h2 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl md:text-6xl">
            More Than
            <span className="ml-3 italic text-[#D4AF37]">A Meal.</span>
          </h2>

          <p className="mt-6 text-sm leading-7 text-white/50 sm:text-base">
            From the first welcome to the final bite, every detail at ST
            Restaurant is thoughtfully designed to create an experience worth
            remembering.
          </p>

          <div className="experience-line mx-auto mt-8 h-px w-20 bg-[#D4AF37]" />
        </div>

        {/* Experience Cards */}
        <div ref={cardsRef} className="mt-16 grid gap-5 md:grid-cols-3">
          {experiences.map((experience) => {
            const Icon = experience.icon;

            return (
              <article
                key={experience.number}
                className="experience-card group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#080808] p-7 transition duration-500 hover:-translate-y-2 hover:border-[#D4AF37]/40 sm:p-8"
              >
                {/* Hover glow */}
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#D4AF37]/5 blur-3xl transition duration-500 group-hover:bg-[#D4AF37]/10" />

                {/* Number */}
                <div className="flex items-center justify-between">
                  <span className="font-serif text-sm italic text-[#D4AF37]/70">
                    {experience.number}
                  </span>

                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 transition duration-500 group-hover:border-[#D4AF37]/60 group-hover:bg-[#D4AF37]/10">
                    <Icon
                      size={20}
                      className="text-[#D4AF37] transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                </div>

                <h3 className="relative mt-12 font-serif text-2xl font-semibold text-white sm:text-3xl">
                  {experience.title}
                </h3>

                <p className="relative mt-4 text-sm leading-7 text-white/45">
                  {experience.description}
                </p>

                <div className="mt-8 h-px w-full bg-white/10 transition duration-500 group-hover:bg-[#D4AF37]/30" />

                <div className="mt-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/30 transition group-hover:text-[#D4AF37]">
                  ST Restaurant
                  <span className="h-px w-5 bg-current" />
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 sm:flex-row">
          <div className="flex items-center gap-3">
            <Gem size={18} className="text-[#D4AF37]" />

            <p className="text-sm text-white/50">
              An experience crafted for every occasion.
            </p>
          </div>

          <Link
            href="/about"
            className="group inline-flex items-center gap-3 text-sm font-semibold text-white transition hover:text-[#D4AF37]"
          >
            Discover ST Restaurant
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 transition duration-300 group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black">
              <ArrowRight
                size={15}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
