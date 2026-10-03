"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const DELIVERY_FEE = 100;

export default function CartPage() {
  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    itemCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    try {
      setLoading(true);

      const response = await fetch("/api/cart");

      if (!response.ok) {
        throw new Error("Failed to fetch cart");
      }

      const result = await response.json();

      setCart(
        result.data || {
          items: [],
          subtotal: 0,
          itemCount: 0,
        },
      );
    } catch (error) {
      console.error("Cart fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(itemId, quantity) {
    if (quantity < 1) return;

    try {
      setUpdatingId(itemId);

      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      await fetchCart();
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Unable to update",
        text: error.message || "Something went wrong.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeItem(itemId) {
    const confirmation = await Swal.fire({
      title: "Remove this dish?",
      text: "The item will be removed from your cart.",
      icon: "warning",
      background: "#111",
      color: "#fff",
      showCancelButton: true,
      confirmButtonText: "Remove",
      cancelButtonText: "Keep",
      confirmButtonColor: "#7f1d2d",
      cancelButtonColor: "#333",
    });

    if (!confirmation.isConfirmed) return;

    try {
      setUpdatingId(itemId);

      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      await fetchCart();

      Swal.fire({
        icon: "success",
        title: "Removed",
        text: "Dish removed from your cart.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  }

  const deliveryFee = cart.items.length > 0 ? DELIVERY_FEE : 0;

  const total = cart.subtotal + deliveryFee;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] px-6 pb-24 pt-32">
        <div className="mx-auto max-w-7xl">
          <div className="h-10 w-48 animate-pulse rounded bg-white/5" />

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="h-96 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-80 animate-pulse rounded-2xl bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] px-6 pb-24 pt-32 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#d4af37]">
              Your Selection
            </p>

            <h1 className="mt-3 font-serif text-4xl text-white sm:text-5xl">
              Your Cart
            </h1>
          </div>

          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-[#d4af37]"
          >
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>
        </div>

        {cart.items.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-white/10 bg-[#111] px-6 py-20 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#d4af37]/10">
              <ShoppingBag className="h-9 w-9 text-[#d4af37]" />
            </div>

            <h2 className="mt-6 font-serif text-3xl text-white">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-3 max-w-md text-white/40">
              Discover our signature dishes and add your favorites to your
              selection.
            </p>

            <Link
              href="/menu"
              className="gold-button mt-7 inline-flex rounded-full px-7 py-3 text-sm font-semibold"
            >
              Explore Menu
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Items */}
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-[#111] p-4 sm:flex-row sm:items-center"
                >
                  {/* Image */}
                  <div className="relative h-28 w-full overflow-hidden rounded-xl sm:h-28 sm:w-36">
                    {item.menuItem.image ? (
                      <Image
                        src={item.menuItem.image}
                        alt={item.menuItem.name}
                        fill
                        sizes="144px"
                        className="object-cover"
                        quality={70}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[#181818]">
                        <ShoppingBag className="text-white/20" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider text-[#d4af37]">
                      {item.menuItem.category?.name}
                    </p>

                    <h2 className="mt-1 font-serif text-2xl text-white">
                      {item.menuItem.name}
                    </h2>

                    <p className="mt-1 text-sm text-white/40">
                      ৳{Number(item.menuItem.price).toLocaleString()} each
                    </p>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center gap-3">
                    <button
                      disabled={updatingId === item.id}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-[#d4af37] hover:text-[#d4af37]"
                    >
                      <Minus size={15} />
                    </button>

                    <span className="w-6 text-center text-white">
                      {item.quantity}
                    </span>

                    <button
                      disabled={updatingId === item.id}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-[#d4af37] hover:text-[#d4af37]"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between gap-5 sm:block sm:text-right">
                    <p className="font-semibold text-[#d4af37]">
                      ৳
                      {(
                        Number(item.menuItem.price) * item.quantity
                      ).toLocaleString()}
                    </p>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="mt-2 text-white/30 transition hover:text-red-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <aside className="h-fit rounded-2xl border border-[#d4af37]/20 bg-[#111] p-6">
              <h2 className="font-serif text-2xl text-white">Order Summary</h2>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between text-white/50">
                  <span>Subtotal ({cart.itemCount} items)</span>

                  <span className="text-white">
                    ৳{cart.subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-white/50">
                  <span className="flex items-center gap-2">
                    <Truck size={15} />
                    Delivery
                  </span>

                  <span className="text-white">
                    ৳{deliveryFee.toLocaleString()}
                  </span>
                </div>

                <div className="h-px bg-white/10" />

                <div className="flex justify-between">
                  <span className="text-white">Total</span>

                  <span className="text-xl font-semibold text-[#d4af37]">
                    ৳{total.toLocaleString()}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="gold-button mt-7 flex w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold"
              >
                Proceed to Checkout
              </Link>

              <p className="mt-4 text-center text-xs leading-5 text-white/30">
                Secure checkout • Home delivery available
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
