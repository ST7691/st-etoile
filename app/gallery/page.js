"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Utensils,
  Wine,
  CakeSlice,
  Sparkles,
} from "lucide-react";

const galleryItems = [
  {
    id: 1,
    title: "Signature Steak",
    category: "Main Course",
    description: "Perfectly grilled premium steak with seasonal vegetables.",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: 2,
    title: "Creamy Pasta",
    category: "Main Course",
    description: "Fresh pasta finished with a rich and elegant sauce.",
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: 3,
    title: "Premium Burger",
    category: "Main Course",
    description: "Juicy gourmet burger crafted with premium ingredients.",
    image:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: 4,
    title: "Fresh Garden Salad",
    category: "Starters",
    description: "Fresh seasonal greens with a delicate house dressing.",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: 5,
    title: "Artisan Pizza",
    category: "Main Course",
    description: "Wood-fired pizza with fresh herbs and premium toppings.",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: 6,
    title: "Fine Dining Experience",
    category: "Experience",
    description: "An elegant dining experience designed around every detail.",
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: 7,
    title: "Signature Dessert",
    category: "Desserts",
    description: "A beautifully plated dessert to finish your evening.",
    image:
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: 8,
    title: "Fresh Seafood",
    category: "Main Course",
    description: "Fresh seafood prepared with our chef's signature touch.",
    image:
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: 9,
    title: "Luxury Dining",
    category: "Experience",
    description:
      "Warm atmosphere, refined presentation and unforgettable taste.",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: 10,
    title: "Elegant Dessert",
    category: "Desserts",
    description: "A delicate sweet creation made for memorable evenings.",
    image:
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: 11,
    title: "Signature Drinks",
    category: "Drinks",
    description:
      "Refreshing signature beverages prepared to complement your meal.",
    image:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: 12,
    title: "Chef's Special",
    category: "Chef's Choice",
    description: "A special creation inspired by seasonal ingredients.",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=85",
  },
];

const categories = [
  { name: "All", icon: Sparkles },
  { name: "Main Course", icon: Utensils },
  { name: "Starters", icon: Utensils },
  { name: "Desserts", icon: CakeSlice },
  { name: "Drinks", icon: Wine },
  { name: "Experience", icon: Sparkles },
];

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState(null);

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") return galleryItems;

    return galleryItems.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  const currentIndex = selectedImage
    ? filteredItems.findIndex((item) => item.id === selectedImage.id)
    : -1;

  const openPrevious = () => {
    if (!selectedImage || filteredItems.length === 0) return;

    const previousIndex =
      currentIndex <= 0 ? filteredItems.length - 1 : currentIndex - 1;

    setSelectedImage(filteredItems[previousIndex]);
  };

  const openNext = () => {
    if (!selectedImage || filteredItems.length === 0) return;

    const nextIndex =
      currentIndex >= filteredItems.length - 1 ? 0 : currentIndex + 1;

    setSelectedImage(filteredItems[nextIndex]);
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(212,175,55,0.08),transparent_35%)]" />

        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#d4af37]/10 blur-[130px]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-32 sm:px-8 lg:px-12 lg:pb-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.3em] text-[#e5c45a]">
              <Sparkles size={14} />
              ST Restaurant Gallery
            </div>

            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-7xl">
              A Feast for the
              <span className="block bg-gradient-to-r from-[#fff1a8] via-[#d4af37] to-[#9d7b19] bg-clip-text text-transparent">
                Eyes & Soul
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
              Explore our signature dishes, elegant dining atmosphere and
              carefully crafted culinary moments at ST Restaurant.
            </p>
          </div>
        </div>
      </section>

      {/* ================= CATEGORY FILTER ================= */}
      <section className="sticky top-0 z-30 border-b border-white/10 bg-[#080808]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-4 scrollbar-hide sm:px-8 lg:px-12">
          {categories.map((category) => {
            const Icon = category.icon;
            const active = activeCategory === category.name;

            return (
              <button
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className={`group flex shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-all duration-300 ${
                  active
                    ? "border-[#d4af37] bg-[#d4af37] text-black shadow-[0_0_25px_rgba(212,175,55,0.18)]"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:border-[#d4af37]/50 hover:bg-[#d4af37]/10 hover:text-[#e5c45a]"
                }`}
              >
                <Icon size={15} />
                {category.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= GALLERY ================= */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#d4af37]">
              Our Collection
            </p>

            <h2 className="text-3xl font-semibold sm:text-4xl">
              Moments Worth
              <span className="text-[#d4af37]"> Remembering</span>
            </h2>
          </div>

          <p className="max-w-md text-sm leading-6 text-white/45">
            Every plate tells a story. Every detail is designed to make your
            experience special.
          </p>
        </div>

        {/* Masonry-like grid */}
        <div className="grid auto-rows-[240px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredItems.map((item, index) => {
            const featured = index === 0 || index === 5 || index === 8;

            return (
              <button
                key={item.id}
                onClick={() => setSelectedImage(item)}
                className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-[#111] text-left shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-[#d4af37]/40 ${
                  featured ? "sm:col-span-2 sm:row-span-2" : "row-span-1"
                }`}
              >
                <Image
                  src={item.image}
                  alt={`${item.title} - ST Restaurant`}
                  fill
                  sizes={
                    featured
                      ? "(max-width: 768px) 100vw, 50vw"
                      : "(max-width: 768px) 100vw, 25vw"
                  }
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  priority={index < 2}
                />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />

                {/* Gold glow */}
                <div className="absolute inset-0 bg-[#d4af37]/0 transition-colors duration-500 group-hover:bg-[#d4af37]/10" />

                {/* Top category */}
                <div className="absolute left-4 top-4">
                  <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/80 backdrop-blur-md">
                    {item.category}
                  </span>
                </div>

                {/* Expand */}
                <div className="absolute right-4 top-4 flex h-10 w-10 translate-y-[-8px] items-center justify-center rounded-full border border-white/20 bg-black/40 text-white opacity-0 backdrop-blur-md transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <Maximize2 size={16} />
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <div className="translate-y-3 transition-transform duration-500 group-hover:translate-y-0">
                    <h3
                      className={`font-semibold text-white ${
                        featured ? "text-2xl sm:text-3xl" : "text-lg"
                      }`}
                    >
                      {item.title}
                    </h3>

                    <p className="mt-2 max-w-lg text-xs leading-5 text-white/60 sm:text-sm">
                      {item.description}
                    </p>

                    <div className="mt-4 h-px w-0 bg-[#d4af37] transition-all duration-700 group-hover:w-16" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= EXPERIENCE BANNER ================= */}
      <section className="relative mx-auto mb-24 max-w-7xl overflow-hidden rounded-3xl border border-[#d4af37]/20 bg-gradient-to-br from-[#17130a] via-[#0d0d0d] to-[#080808] px-6 py-16 sm:px-12 lg:px-16">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#d4af37]/10 blur-[90px]" />

        <div className="relative flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#d4af37]">
              Your Table Awaits
            </p>

            <h2 className="text-3xl font-semibold sm:text-4xl">
              Turn the Moment Into
              <span className="block text-[#d4af37]">a Beautiful Memory.</span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/50">
              Join us for an unforgettable dining experience where exceptional
              food meets warm hospitality.
            </p>
          </div>

          <Link
            href="/reservation"
            className="group inline-flex shrink-0 items-center gap-3 rounded-full bg-[#d4af37] px-7 py-4 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#e5c45a] hover:shadow-[0_0_35px_rgba(212,175,55,0.25)]"
          >
            Reserve Your Table
            <ArrowRight
              size={17}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>

      {/* ================= LIGHTBOX ================= */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md sm:p-8"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:border-[#d4af37]/50 hover:bg-[#d4af37]/20 hover:text-[#e5c45a]"
            aria-label="Close image"
          >
            <X size={20} />
          </button>

          {/* Previous */}
          <button
            onClick={(event) => {
              event.stopPropagation();
              openPrevious();
            }}
            className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-md transition hover:border-[#d4af37]/50 hover:bg-[#d4af37]/20 hover:text-[#e5c45a] sm:left-8"
            aria-label="Previous image"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Next */}
          <button
            onClick={(event) => {
              event.stopPropagation();
              openNext();
            }}
            className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-md transition hover:border-[#d4af37]/50 hover:bg-[#d4af37]/20 hover:text-[#e5c45a] sm:right-8"
            aria-label="Next image"
          >
            <ChevronRight size={22} />
          </button>

          {/* Image */}
          <div
            className="relative max-h-[88vh] w-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-[0_0_80px_rgba(212,175,55,0.08)] sm:aspect-[16/10]">
              <Image
                src={selectedImage.image}
                alt={`${selectedImage.title} - ST Restaurant`}
                fill
                sizes="90vw"
                className="object-contain"
                priority
              />
            </div>

            <div className="mt-5 text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">
                {selectedImage.category}
              </p>

              <h3 className="mt-2 text-2xl font-semibold">
                {selectedImage.title}
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm text-white/50">
                {selectedImage.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
