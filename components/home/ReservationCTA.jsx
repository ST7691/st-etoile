"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ReservationCTA() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".reservation-content", {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

      gsap.from(".reservation-info", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
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
      {/* Decorative glow */}
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7F1D2D]/10 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="overflow-hidden rounded-[32px] border border-[#D4AF37]/20 bg-[#111111]">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            {/* Main CTA */}
            <div className="reservation-content relative p-8 sm:p-12 lg:p-16">
              <div className="absolute right-0 top-0 h-32 w-32 border-r border-t border-[#D4AF37]/20" />

              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-[#D4AF37]" />

                <span className="text-xs uppercase tracking-[0.4em] text-[#D4AF37]">
                  Your Table Awaits
                </span>
              </div>

              <h2 className="mt-7 max-w-2xl font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Make Your Next
                <br />
                <span className="italic text-[#D4AF37]">
                  Moment Extraordinary.
                </span>
              </h2>

              <p className="mt-6 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
                Whether it is a romantic dinner, family celebration, business
                gathering, or simply an evening of exceptional food, we would
                love to welcome you to ST Restaurant.
              </p>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/reservation"
                  className="gold-button inline-flex items-center justify-center gap-3 rounded-full px-7 py-3.5 text-sm font-semibold"
                >
                  Reserve Your Table
                  <ArrowRight size={17} />
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                >
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Restaurant information */}
            <div className="border-t border-white/10 bg-[#0d0d0d] p-8 sm:p-12 lg:border-l lg:border-t-0">
              <h3 className="font-serif text-2xl font-semibold text-white">
                Visit ST Restaurant
              </h3>

              <div className="mt-8 space-y-7">
                <div className="reservation-info flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5">
                    <MapPin size={18} className="text-[#D4AF37]" />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                      Location
                    </p>

                    <p className="mt-2 text-sm leading-6 text-white/70">
                      ST Restaurant
                      <br />
                      Sylhet, Bangladesh
                    </p>
                  </div>
                </div>

                <div className="reservation-info flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5">
                    <Clock3 size={18} className="text-[#D4AF37]" />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                      Opening Hours
                    </p>

                    <p className="mt-2 text-sm leading-6 text-white/70">
                      Monday – Thursday
                      <br />
                      11:00 AM – 10:30 PM
                    </p>

                    <p className="mt-2 text-sm leading-6 text-white/70">
                      Friday – Sunday
                      <br />
                      11:00 AM – 11:30 PM
                    </p>
                  </div>
                </div>

                <div className="reservation-info flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5">
                    <Phone size={18} className="text-[#D4AF37]" />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                      Reservations
                    </p>

                    <p className="mt-2 text-sm text-white/70">
                      +880 1XXX-XXXXXX
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick info */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
                  <CalendarDays size={17} className="text-[#D4AF37]" />

                  <p className="mt-3 text-[10px] uppercase tracking-[0.15em] text-white/35">
                    Reservations
                  </p>

                  <p className="mt-1 text-sm font-medium text-white">
                    Available
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
                  <Users size={17} className="text-[#D4AF37]" />

                  <p className="mt-3 text-[10px] uppercase tracking-[0.15em] text-white/35">
                    Private Dining
                  </p>

                  <p className="mt-1 text-sm font-medium text-white">
                    Available
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
