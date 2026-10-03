"use client";

import Image from "next/image";
import { CheckCircle2, Quote, Star } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    id: 1,
    name: "Sarah Mitchell",
    role: "Food Enthusiast",
    image: "/images/customers/customer-1.jpg",
    rating: 5,
    review:
      "An unforgettable dining experience. Every dish was beautifully presented, full of flavor, and perfectly prepared. The atmosphere made the evening even more special.",
  },
  {
    id: 2,
    name: "Daniel Carter",
    role: "Regular Guest",
    image: "/images/customers/customer-2.jpg",
    rating: 5,
    review:
      "ST Restaurant has become one of my favorite places to dine. The food is consistently excellent and the service feels genuinely thoughtful.",
  },
  {
    id: 3,
    name: "Emily Anderson",
    role: "Lifestyle Blogger",
    image: "/images/customers/customer-3.jpg",
    rating: 5,
    review:
      "Beautiful ambience, exceptional food, and wonderful hospitality. From the starter to dessert, everything felt carefully crafted and memorable.",
  },
];

export default function Testimonials() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const cardsRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headingRef.current, {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

      gsap.from(".testimonial-card", {
        y: 70,
        opacity: 0,
        duration: 0.9,
        stagger: 0.18,
        ease: "power3.out",
        scrollTrigger: {
          trigger: cardsRef.current,
          start: "top 78%",
        },
      });

      gsap.from(".review-stat", {
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
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#111111] py-24 sm:py-28 lg:py-36"
    >
      {/* Background glow */}
      <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-[#D4AF37]/5 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        {/* Heading */}
        <div ref={headingRef} className="mx-auto max-w-3xl text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-[#D4AF37]" />

            <span className="text-xs uppercase tracking-[0.4em] text-[#D4AF37]">
              Guest Stories
            </span>

            <span className="h-px w-10 bg-[#D4AF37]" />
          </div>

          <h2 className="font-serif text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
            Loved by
            <span className="ml-3 italic text-[#D4AF37]">Our Guests.</span>
          </h2>

          <p className="mt-6 text-sm leading-7 text-white/50 sm:text-base">
            Our guests are at the heart of everything we do. Here is what some
            of them have to say about their ST Restaurant experience.
          </p>
        </div>

        {/* Rating summary */}
        <div
          ref={statsRef}
          className="mx-auto mt-12 grid max-w-3xl grid-cols-2 overflow-hidden rounded-[24px] border border-white/10 bg-[#080808] sm:grid-cols-4"
        >
          <div className="review-stat border-b border-white/10 p-6 text-center sm:border-b-0 sm:border-r">
            <div className="flex items-center justify-center gap-1">
              <Star size={17} fill="currentColor" className="text-[#D4AF37]" />
              <span className="font-serif text-2xl font-semibold text-white">
                4.9
              </span>
            </div>

            <p className="mt-2 text-[9px] uppercase tracking-[0.2em] text-white/35">
              Average Rating
            </p>
          </div>

          <div className="review-stat border-b border-white/10 p-6 text-center sm:border-b-0 sm:border-r">
            <p className="font-serif text-2xl font-semibold text-white">5K+</p>

            <p className="mt-2 text-[9px] uppercase tracking-[0.2em] text-white/35">
              Reviews
            </p>
          </div>

          <div className="review-stat border-r border-white/10 p-6 text-center">
            <p className="font-serif text-2xl font-semibold text-white">98%</p>

            <p className="mt-2 text-[9px] uppercase tracking-[0.2em] text-white/35">
              Recommend
            </p>
          </div>

          <div className="review-stat p-6 text-center">
            <p className="font-serif text-2xl font-semibold text-white">25K+</p>

            <p className="mt-2 text-[9px] uppercase tracking-[0.2em] text-white/35">
              Happy Guests
            </p>
          </div>
        </div>

        {/* Testimonials */}
        <div ref={cardsRef} className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.id}
              className="testimonial-card group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#080808] p-7 transition duration-500 hover:-translate-y-2 hover:border-[#D4AF37]/40 hover:shadow-[0_25px_70px_rgba(0,0,0,0.35)] sm:p-8"
            >
              {/* Quote icon */}
              <div className="absolute right-7 top-7 flex h-11 w-11 items-center justify-center rounded-full border border-[#D4AF37]/15 bg-[#D4AF37]/5">
                <Quote size={17} className="text-[#D4AF37]" />
              </div>

              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, index) => (
                  <Star
                    key={index}
                    size={14}
                    fill="currentColor"
                    className="text-[#D4AF37]"
                  />
                ))}
              </div>

              {/* Review */}
              <p className="mt-7 min-h-[150px] text-sm leading-7 text-white/60">
                “{testimonial.review}”
              </p>

              {/* Divider */}
              <div className="my-6 h-px bg-white/10 transition group-hover:bg-[#D4AF37]/20" />

              {/* Customer */}
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#D4AF37]/20">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    sizes="48px"
                    loading="lazy"
                    className="object-cover"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      {testimonial.name}
                    </h3>

                    <CheckCircle2 size={13} className="text-[#D4AF37]" />
                  </div>

                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/30">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              {/* Bottom accent */}
              <div className="absolute bottom-0 left-0 h-px w-0 bg-[#D4AF37] transition-all duration-500 group-hover:w-full" />
            </article>
          ))}
        </div>

        {/* Bottom text */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-[#080808] px-5 py-3">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  size={13}
                  fill="currentColor"
                  className="text-[#D4AF37]"
                />
              ))}
            </div>

            <span className="text-xs text-white/40">
              Experience the ST difference
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
