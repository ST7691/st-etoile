"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star, ArrowRight, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Swal from "sweetalert2";

gsap.registerPlugin(ScrollTrigger);

export default function FeaturedMenu() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([
    {
      label: "All",
      value: "",
    },
  ]);

  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [addingItemId, setAddingItemId] = useState(null);

  // ==========================================
  // FETCH CATEGORIES
  // ==========================================
  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setCategoriesLoading(true);

      const response = await fetch("/api/categories", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Categories API failed with status ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch categories");
      }

      const databaseCategories = Array.isArray(result.data) ? result.data : [];

      const dynamicCategories = databaseCategories
        .filter((category) => category?.slug && category?.name)
        .map((category) => ({
          label: category.name,
          value: category.slug,
        }));

      setCategories([
        {
          label: "All",
          value: "",
        },
        ...dynamicCategories,
      ]);
    } catch (error) {
      console.error("Categories fetch error:", error);

      // Keep All category available even if category API fails.
      setCategories([
        {
          label: "All",
          value: "",
        },
      ]);
    } finally {
      setCategoriesLoading(false);
    }
  }

  // ==========================================
  // FETCH MENU
  // ==========================================
  useEffect(() => {
    fetchMenu();
  }, [activeCategory]);

  async function fetchMenu() {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (activeCategory) {
        params.set("category", activeCategory);
      }

      const query = params.toString()
        ? `/api/menu?${params.toString()}`
        : "/api/menu";

      const response = await fetch(query, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Menu API failed with status ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch menu");
      }

      setMenuItems(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error("Menu fetch error:", error);

      setMenuItems([]);

      Swal.fire({
        icon: "error",
        title: "Menu Loading Failed",
        text: "We couldn't load the menu right now. Please try again.",
        background: "#111111",
        color: "#ffffff",
        confirmButtonColor: "#d4af37",
        confirmButtonText: "Try Again",
      });
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // GSAP MENU ANIMATION
  // ==========================================
  useEffect(() => {
    if (loading || menuItems.length === 0) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".menu-card",
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
          clearProps: "transform",
          scrollTrigger: {
            trigger: ".menu-grid",
            start: "top 80%",
            once: true,
          },
        },
      );
    });

    return () => ctx.revert();
  }, [loading, menuItems]);

  // ==========================================
  // FAVORITE
  // ==========================================
  function toggleFavorite(id) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  // ==========================================
  // ADD TO CART
  // ==========================================
  async function addToCart(menuItemId, itemName) {
    try {
      setAddingItemId(menuItemId);

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuItemId,
          quantity: 1,
        }),
      });

      const result = await response.json();

      if (response.status === 401) {
        const confirm = await Swal.fire({
          icon: "info",
          title: "Login Required",
          text: "Please login to add dishes to your cart.",
          background: "#111111",
          color: "#ffffff",
          confirmButtonColor: "#d4af37",
          confirmButtonText: "Login",
          showCancelButton: true,
          cancelButtonText: "Continue Browsing",
        });

        if (confirm.isConfirmed) {
          window.location.href = "/login";
        }

        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Unable to add this item.");
      }

      await Swal.fire({
        icon: "success",
        title: "Added to Cart",
        text: `${itemName} has been added to your cart.`,
        background: "#111111",
        color: "#ffffff",
        confirmButtonColor: "#d4af37",
        confirmButtonText: "View Cart",
        showCancelButton: true,
        cancelButtonText: "Continue Shopping",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/cart";
        }
      });
    } catch (error) {
      console.error("Add to cart error:", error);

      Swal.fire({
        icon: "error",
        title: "Unable to Add",
        text: error.message || "Something went wrong.",
        background: "#111111",
        color: "#ffffff",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setAddingItemId(null);
    }
  }

  // ==========================================
  // RETRY
  // ==========================================
  function handleRetry() {
    fetchMenu();
  }

  return (
    <section
      id="menu"
      className="relative overflow-hidden bg-[#080808] px-6 py-24 sm:px-10 lg:px-16"
    >
      {/* Decorative Glow */}
      <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-[#7f1d2d]/10 blur-[120px]" />

      <div className="pointer-events-none absolute bottom-20 left-0 h-80 w-80 rounded-full bg-[#d4af37]/5 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* ==========================================
            HEADER
        ========================================== */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-[#d4af37]">
            From Our Kitchen
          </p>

          <h2 className="mt-4 font-serif text-4xl text-white sm:text-5xl">
            Featured Menu
          </h2>

          <p className="mt-5 leading-7 text-white/50">
            Discover carefully crafted dishes made with premium ingredients and
            served with an unforgettable experience.
          </p>
        </div>

        {/* ==========================================
            CATEGORIES
        ========================================== */}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {categoriesLoading ? (
            <>
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-10 w-24 animate-pulse rounded-full border border-white/10 bg-white/[0.03]"
                />
              ))}
            </>
          ) : (
            categories.map((category) => {
              const isActive = activeCategory === category.value;

              return (
                <button
                  key={category.value || "all"}
                  type="button"
                  onClick={() => setActiveCategory(category.value)}
                  className={`rounded-full px-5 py-2.5 text-sm transition ${
                    isActive
                      ? "bg-[#d4af37] text-[#080808]"
                      : "border border-white/10 bg-white/[0.03] text-white/60 hover:border-[#d4af37]/50 hover:text-[#d4af37]"
                  }`}
                >
                  {category.label}
                </button>
              );
            })
          )}
        </div>

        {/* ==========================================
            LOADING
        ========================================== */}
        {loading && (
          <div className="grid gap-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#111]"
              >
                <div className="h-64 animate-pulse bg-white/5" />

                <div className="space-y-3 p-5">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-white/5" />

                  <div className="h-4 w-full animate-pulse rounded bg-white/5" />

                  <div className="h-4 w-1/2 animate-pulse rounded bg-white/5" />

                  <div className="mt-5 flex gap-2">
                    <div className="h-11 flex-1 animate-pulse rounded-full bg-white/5" />
                    <div className="h-11 w-11 animate-pulse rounded-full bg-white/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==========================================
            EMPTY
        ========================================== */}
        {!loading && menuItems.length === 0 && (
          <div className="py-20 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5">
              <ShoppingBag className="h-10 w-10 text-[#d4af37]/60" />
            </div>

            <h3 className="mt-6 text-xl text-white">No dishes found</h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-white/40">
              There are no dishes available in this category right now. Please
              try another category.
            </p>

            <button
              type="button"
              onClick={handleRetry}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 px-5 py-2.5 text-sm text-[#d4af37] transition hover:bg-[#d4af37] hover:text-[#080808]"
            >
              <RefreshCw size={15} />
              Refresh Menu
            </button>
          </div>
        )}

        {/* ==========================================
            MENU GRID
        ========================================== */}
        {!loading && menuItems.length > 0 && (
          <div className="menu-grid mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {menuItems.map((item) => {
              const isFavorite = favorites.includes(item.id);
              const isAdding = addingItemId === item.id;

              return (
                <article
                  key={item.id}
                  className="menu-card group overflow-hidden rounded-2xl border border-white/10 bg-[#111] opacity-0 transition duration-500 hover:-translate-y-2 hover:border-[#d4af37]/30 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
                >
                  {/* ==========================================
                      IMAGE
                  ========================================== */}
                  <div className="relative h-64 overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition duration-700 group-hover:scale-110"
                        quality={75}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[#181818]">
                        <ShoppingBag className="h-10 w-10 text-white/20" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                    {/* ==========================================
                        FEATURED
                    ========================================== */}
                    {item.featured && (
                      <div className="absolute left-4 top-4 rounded-full bg-[#d4af37] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
                        Chef&apos;s Choice
                      </div>
                    )}

                    {/* ==========================================
                        FAVORITE
                    ========================================== */}
                    <button
                      type="button"
                      onClick={() => toggleFavorite(item.id)}
                      className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md transition hover:border-[#d4af37]"
                      aria-label={
                        isFavorite
                          ? `Remove ${item.name} from favorites`
                          : `Add ${item.name} to favorites`
                      }
                    >
                      <Heart
                        size={18}
                        className={
                          isFavorite
                            ? "fill-[#d4af37] text-[#d4af37]"
                            : "text-white"
                        }
                      />
                    </button>

                    {/* ==========================================
                        CATEGORY
                    ========================================== */}
                    {item.category?.name && (
                      <span className="absolute bottom-4 left-4 text-xs uppercase tracking-wider text-[#d4af37]">
                        {item.category.name}
                      </span>
                    )}

                    {/* ==========================================
                        AVAILABILITY
                    ========================================== */}
                    {item.available === false && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <span className="rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs uppercase tracking-wider text-white/70 backdrop-blur-md">
                          Currently Unavailable
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ==========================================
                      CONTENT
                  ========================================== */}
                  <div className="p-5">
                    {/* Name + Price */}
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-serif text-2xl text-white">
                        {item.name}
                      </h3>

                      <div className="text-right">
                        <span className="whitespace-nowrap text-lg font-semibold text-[#d4af37]">
                          ৳{Number(item.price).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/45">
                      {item.description ||
                        "A signature dish from ST Restaurant."}
                    </p>

                    {/* Rating */}
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className="fill-[#d4af37] text-[#d4af37]"
                          />
                        ))}
                      </div>

                      <span className="text-xs text-white/40">5.0</span>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex gap-2">
                      <Link
                        href={`/menu/${item.slug}`}
                        className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm text-white transition hover:border-[#d4af37] hover:text-[#d4af37]"
                      >
                        View Details
                        <ArrowRight size={15} />
                      </Link>

                      <button
                        type="button"
                        disabled={item.available === false || isAdding}
                        onClick={() => addToCart(item.id, item.name)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d4af37] text-[#080808] transition hover:bg-[#f1d77a] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Add ${item.name} to cart`}
                      >
                        {isAdding ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#080808]/30 border-t-[#080808]" />
                        ) : (
                          <ShoppingBag size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ==========================================
            BOTTOM CTA
        ========================================== */}
        <div className="mt-14 text-center">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-[#d4af37] transition hover:text-[#f1d77a]"
          >
            View Full Menu
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
