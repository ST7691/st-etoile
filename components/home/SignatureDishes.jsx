"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart, Plus } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const dishes = [
  {
    id: 1,
    name: "Truffle Steak",
    category: "Chef's Signature",
    description:
      "Premium grilled beef tenderloin with black truffle sauce and seasonal vegetables.",
    price: 42,
    image: "/images/dishes/truffle-steak.jpg",
  },
  {
    id: 2,
    name: "Royal Salmon",
    category: "Seafood",
    description:
      "Fresh Atlantic salmon served with herbs, roasted vegetables and citrus butter.",
    price: 36,
    image: "/images/dishes/royal-salmon.jpg",
  },
  {
    id: 3,
    name: "Golden Dessert",
    category: "Signature Dessert",
    description:
      "A delicate chocolate creation finished with gold-inspired presentation.",
    price: 18,
    image: "/images/dishes/golden-dessert.jpg",
  },
];

export default function SignatureDishes() {
  const sectionRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".signature-heading", {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

      gsap.from(".dish-card", {
        y: 80,
        opacity: 0,
        duration: 1,
        stagger: 0.18,
        ease: "power3.out",
        scrollTrigger: {
          trigger: cardsRef.current,
          start: "top 80%",
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
      {/* Background Glow */}
      <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4AF37]/5 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        {/* Heading */}
        <div className="signature-heading mb-14 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-10 bg-[#D4AF37]" />

              <span className="text-xs uppercase tracking-[0.4em] text-[#D4AF37]">
                Chef's Selection
              </span>
            </div>

            <h2 className="font-serif text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
              Signature
              <span className="ml-3 italic text-[#D4AF37]">Dishes</span>
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
              Carefully crafted dishes made with exceptional ingredients and
              presented with the distinctive ST Restaurant touch.
            </p>
          </div>

          <Link
            href="/menu"
            className="group inline-flex w-fit items-center gap-3 text-sm font-medium text-white/70 transition hover:text-[#D4AF37]"
          >
            View Full Menu
            <ArrowRight
              size={17}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>

        {/* Cards */}
        <div
          ref={cardsRef}
          className="grid gap-7 md:grid-cols-2 lg:grid-cols-3"
        >
          {dishes.map((dish) => (
            <article
              key={dish.id}
              className="dish-card group overflow-hidden rounded-[28px] border border-white/10 bg-[#111111] transition duration-500 hover:-translate-y-2 hover:border-[#D4AF37]/40 hover:shadow-[0_25px_80px_rgba(0,0,0,0.45)]"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={dish.image}
                  alt={dish.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition duration-700 group-hover:scale-110"
                />

                {/* Image Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

                {/* Category */}
                <span className="absolute left-5 top-5 rounded-full border border-[#D4AF37]/30 bg-black/50 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] backdrop-blur-md">
                  {dish.category}
                </span>

                {/* Favorite */}
                <button
                  type="button"
                  aria-label={`Add ${dish.name} to favorites`}
                  className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-md transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                >
                  <Heart size={17} />
                </button>

                {/* Price */}
                <div className="absolute bottom-5 left-5">
                  <span className="font-serif text-2xl font-semibold text-white">
                    ${dish.price}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-serif text-2xl font-semibold text-white">
                    {dish.name}
                  </h3>

                  <button
                    type="button"
                    aria-label={`Add ${dish.name} to cart`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-black transition hover:bg-[#F1D77A] hover:rotate-90"
                  >
                    <Plus size={19} />
                  </button>
                </div>

                <p className="mt-3 text-sm leading-6 text-white/50">
                  {dish.description}
                </p>

                <Link
                  href={`/menu/${dish.id}`}
                  className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37] transition hover:text-[#F1D77A]"
                >
                  View Dish
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
