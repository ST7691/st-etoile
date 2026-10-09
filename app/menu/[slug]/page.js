
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import {
  ArrowLeft,
  Home,
  ShoppingBag,
  Star,
  Check,
  ChevronRight,
} from "lucide-react";

import AddToCartButton from "@/components/AddToCartButton";
import ReviewSection from "@/components/ReviewSection";

const SITE_URL = "https://st-etoile.vercel.app";

const DEFAULT_DESCRIPTION =
  "Discover delicious signature dishes, fresh ingredients, and premium dining at ST Restaurant.";

const DEFAULT_IMAGE = `${SITE_URL}/opengraph-image`;

const getMenuItem = cache(async (slug) => {
  try {
    const response = await fetch(
      `${SITE_URL}/api/menu/${encodeURIComponent(slug)}`,
      { cache: "no-store" }
    );

    if (!response.ok) return null;

    const result = await response.json();
    return result?.data || null;
  } catch (error) {
    console.error("MENU DETAILS FETCH ERROR:", error);
    return null;
  }
});

function getAbsoluteImageUrl(image) {
  if (!image || typeof image !== "string") {
    return DEFAULT_IMAGE;
  }

  try {
    return new URL(image, SITE_URL).toString();
  } catch {
    return DEFAULT_IMAGE;
  }
}

function getDescription(item) {
  const description = item?.description?.trim();

  return description || DEFAULT_DESCRIPTION;
}

// Dynamic SEO metadata for every menu item.
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const item = await getMenuItem(slug);

  if (!item) {
    return {
      title: "Dish Not Found",
      description: "This menu item could not be found at ST Restaurant.",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const title = `${item.name} | ST Restaurant`;
  const description = getDescription(item);
  const pageUrl = `${SITE_URL}/menu/${encodeURIComponent(slug)}`;
  const imageUrl = getAbsoluteImageUrl(item.image);

  return {
    title: {
      absolute: title,
    },

    description,

    alternates: {
      canonical: pageUrl,
    },

    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: "ST Restaurant",
      url: pageUrl,
      title,
      description,
      images: [
        {
          url: imageUrl,
          alt: `${item.name} — ST Restaurant`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: imageUrl,
          alt: `${item.name} — ST Restaurant`,
        },
      ],
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    },
  };
}

export default async function MenuDetailsPage({ params }) {
  const { slug } = await params;
  const item = await getMenuItem(slug);

  if (!item) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-6 py-32">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#111] p-10 text-center shadow-2xl sm:p-14">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5">
            <ShoppingBag className="h-9 w-9 text-[#d4af37]" />
          </div>

          <p className="mt-7 text-xs uppercase tracking-[0.4em] text-[#d4af37]">
            ST Restaurant
          </p>

          <h1 className="mt-4 font-serif text-4xl text-white sm:text-5xl">
            Dish Not Found
          </h1>

          <p className="mx-auto mt-4 max-w-md leading-7 text-white/45">
            This dish may no longer be available or the requested menu item
            could not be found.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10 hover:text-[#d4af37]"
            >
              <Home size={16} />
              Home
            </Link>

            <Link
              href="/menu"
              className="gold-button inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              <ArrowLeft size={16} />
              Back to Menu
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isAvailable = item.available !== false;
  const rating = Number(item.rating || 5);

  const reviewCount =
    item?._count?.reviews ??
    item?.reviewCount ??
    item?.reviews?.length ??
    0;

  const imageUrl = getAbsoluteImageUrl(item.image);
  const description = getDescription(item);
  const pageUrl = `${SITE_URL}/menu/${encodeURIComponent(slug)}`;

  const menuItemSchema = {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    "@id": `${pageUrl}#menu-item`,
    name: item.name,
    description,
    image: imageUrl,
    url: pageUrl,
    ...(item.category?.name
      ? { menuAddOn: item.category.name }
      : {}),
    offers: {
      "@type": "Offer",
      price: Number(item.price),
      priceCurrency: "BDT",
      availability: isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: pageUrl,
    },
  };

  return (
    <main className="min-h-screen bg-[#080808] px-5 pb-24 pt-28 sm:px-8 sm:pt-32 lg:px-12 xl:px-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(menuItemSchema).replace(/</g, "\\u003c"),
        }}
      />

      <div className="mx-auto max-w-7xl">
        {/* Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-3"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/55 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            <Home size={15} />
            Home
          </Link>

          <Link
            href="/menu"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/55 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            <ArrowLeft size={15} />
            Back
          </Link>

          <div className="hidden items-center gap-2 text-sm text-white/25 sm:flex">
            <ChevronRight size={14} />
            <Link
              href="/menu"
              className="transition hover:text-[#d4af37]"
            >
              Menu
            </Link>
            <ChevronRight size={14} />
            <span className="max-w-[180px] truncate text-white/40">
              {item.name}
            </span>
          </div>
        </nav>

        {/* Product Details */}
        <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111] shadow-2xl">
          <div className="grid lg:grid-cols-2">
            {/* Dish Image */}
            <div className="relative min-h-[380px] overflow-hidden bg-[#181818] sm:min-h-[500px] lg:min-h-[680px]">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={`${item.name} served at ST Restaurant`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition duration-700 hover:scale-[1.03]"
                  quality={85}
                />
              ) : (
                <div className="flex h-full min-h-[380px] items-center justify-center bg-[#181818]">
                  <ShoppingBag className="h-20 w-20 text-white/10" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />

              {item.category?.name && (
                <div className="absolute left-6 top-6">
                  <span className="rounded-full border border-[#d4af37]/30 bg-black/60 px-4 py-2 text-xs font-medium uppercase tracking-[0.25em] text-[#d4af37] backdrop-blur-md">
                    {item.category.name}
                  </span>
                </div>
              )}

              <div className="absolute bottom-6 left-6">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium backdrop-blur-md ${
                    isAvailable
                      ? "border-green-400/20 bg-black/60 text-green-400"
                      : "border-red-400/20 bg-black/60 text-red-400"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isAvailable ? "bg-green-400" : "bg-red-400"
                    }`}
                  />
                  {isAvailable
                    ? "Available Now"
                    : "Currently Unavailable"}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14 xl:p-16">
              {item.category?.name && (
                <p className="text-xs font-medium uppercase tracking-[0.4em] text-[#d4af37]">
                  {item.category.name}
                </p>
              )}

              <h1 className="mt-4 font-serif text-4xl leading-tight text-white sm:text-5xl xl:text-6xl">
                {item.name}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <div
                  className="flex items-center gap-1"
                  aria-label={`${rating.toFixed(1)} out of 5 stars`}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={17}
                      className="fill-[#d4af37] text-[#d4af37]"
                    />
                  ))}
                </div>

                <span className="text-sm font-medium text-white/70">
                  {rating.toFixed(1)}
                </span>

                <span className="h-1 w-1 rounded-full bg-white/20" />

                <span className="text-sm text-white/40">
                  {reviewCount} {reviewCount === 1 ? "Review" : "Reviews"}
                </span>
              </div>

              <div className="my-7 h-px w-full bg-white/10" />

              <p className="max-w-xl leading-8 text-white/55">
                {description}
              </p>

              <div className="mt-8 flex flex-wrap items-end gap-4">
                <span className="text-3xl font-semibold text-[#d4af37] sm:text-4xl">
                  ৳{Number(item.price).toLocaleString()}
                </span>

                {item.oldPrice &&
                  Number(item.oldPrice) > Number(item.price) && (
                    <>
                      <span className="mb-1 text-lg text-white/30 line-through">
                        ৳{Number(item.oldPrice).toLocaleString()}
                      </span>

                      <span className="mb-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                        Save ৳
                        {(
                          Number(item.oldPrice) - Number(item.price)
                        ).toLocaleString()}
                      </span>
                    </>
                  )}
              </div>

              <div className="mt-7 flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    isAvailable ? "bg-green-500/10" : "bg-red-500/10"
                  }`}
                >
                  {isAvailable ? (
                    <Check size={15} className="text-green-400" />
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  )}
                </span>

                <div>
                  <p
                    className={`text-sm font-medium ${
                      isAvailable ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isAvailable
                      ? "Currently available"
                      : "Currently unavailable"}
                  </p>

                  {isAvailable && (
                    <p className="mt-0.5 text-xs text-white/30">
                      Ready to order
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <AddToCartButton
                  menuItemId={item.id}
                  disabled={!isAvailable}
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  href="/menu"
                  className="text-sm text-white/40 transition hover:text-[#d4af37]"
                >
                  ← Explore more dishes
                </Link>

                <span className="h-1 w-1 rounded-full bg-white/20" />

                <Link
                  href="/cart"
                  className="inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-[#d4af37]"
                >
                  <ShoppingBag size={15} />
                  View Cart
                </Link>
              </div>
            </div>
          </div>
        </article>

        {/* Reviews */}
        <section className="mt-16">
          <ReviewSection menuItemId={item.id} />
        </section>

        {/* Bottom Navigation */}
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white/50 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            <Home size={16} />
            Back to Home
          </Link>

          <Link
            href="/menu"
            className="gold-button inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
          >
            <ArrowLeft size={16} />
            Back to Menu
          </Link>
        </div>
      </div>
    </main>
  );
}