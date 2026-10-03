import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Star, Check } from "lucide-react";
import AddToCartButton from "@/components/AddToCartButton";

async function getMenuItem(slug) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/menu/${slug}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const result = await response.json();

  return result.data;
}

export default async function MenuDetailsPage({ params }) {
  const { slug } = await params;

  const item = await getMenuItem(slug);

  if (!item) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-6">
        <div className="text-center">
          <h1 className="font-serif text-4xl text-white">Dish Not Found</h1>

          <p className="mt-3 text-white/40">
            This dish may no longer be available.
          </p>

          <Link
            href="/menu"
            className="gold-button mt-7 inline-flex rounded-full px-6 py-3 text-sm font-semibold"
          >
            Back to Menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] px-6 pb-24 pt-32 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        {/* Back */}
        <Link
          href="/menu"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-[#d4af37]"
        >
          <ArrowLeft size={16} />
          Back to Menu
        </Link>

        <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-[#111] lg:grid-cols-2">
          {/* Image */}
          <div className="relative min-h-[400px] lg:min-h-[650px]">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                quality={80}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[#181818]">
                <ShoppingBag className="h-16 w-16 text-white/10" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
            {item.category?.name && (
              <p className="text-xs uppercase tracking-[0.4em] text-[#d4af37]">
                {item.category.name}
              </p>
            )}

            <h1 className="mt-4 font-serif text-4xl text-white sm:text-5xl">
              {item.name}
            </h1>

            {/* Rating */}
            <div className="mt-5 flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={17}
                    className="fill-[#d4af37] text-[#d4af37]"
                  />
                ))}
              </div>

              <span className="text-sm text-white/50">
                {Number(item.rating || 5).toFixed(1)}
              </span>
            </div>

            <p className="mt-7 leading-8 text-white/55">
              {item.description ||
                "A signature creation from ST Restaurant, prepared with carefully selected ingredients."}
            </p>

            {/* Price */}
            <div className="mt-8 flex items-center gap-4">
              <span className="text-3xl font-semibold text-[#d4af37]">
                ৳{Number(item.price).toLocaleString()}
              </span>

              {item.oldPrice && (
                <span className="text-lg text-white/30 line-through">
                  ৳{Number(item.oldPrice).toLocaleString()}
                </span>
              )}
            </div>

            {/* Availability */}
            <div className="mt-7 flex items-center gap-2 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10">
                <Check size={14} className="text-green-400" />
              </span>

              <span className="text-white/60">
                {item.isAvailable
                  ? "Currently available"
                  : "Currently unavailable"}
              </span>
            </div>

            {/* Add */}
            <AddToCartButton
              menuItemId={item.id}
              disabled={!item.isAvailable}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
