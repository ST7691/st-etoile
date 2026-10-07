"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  async function fetchCart({ showLoader = true } = {}) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const response = await fetch("/api/cart", {
        method: "GET",
        cache: "no-store",
      });

      const text = await response.text();

      let result = null;

      try {
        result = text ? JSON.parse(text) : null;
      } catch {
        throw new Error("Invalid cart response from server.");
      }

      if (response.status === 401) {
        window.location.href = "/login?callbackUrl=/cart";
        return;
      }

      if (!response.ok) {
        throw new Error(result?.message || "Failed to load cart");
      }

      setCart(result?.data || null);
    } catch (error) {
      console.error("Cart error:", error);

      Swal.fire({
        icon: "error",
        title: "Cart Error",
        text: error.message || "Unable to load your cart.",
        background: "#111",
        color: "#f5f1e8",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    fetchCart();

    // Receive instant cart updates from AddToCartButton/Navbar
    function handleCartUpdated(event) {
      const updatedCart = event.detail?.cart;

      if (updatedCart) {
        setCart(updatedCart);
        setLoading(false);
      } else {
        // Fallback: silently sync from server
        fetchCart({ showLoader: false });
      }
    }

    window.addEventListener("cart-updated", handleCartUpdated);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, []);

  async function updateQuantity(itemId, quantity) {
    if (quantity < 1) {
      return removeItem(itemId);
    }

    const previousCart = cart;

    // Optimistic UI update
    setCart((currentCart) => {
      if (!currentCart) return currentCart;

      const updatedItems = currentCart.items.map((item) => {
        if (item.id !== itemId) return item;

        return {
          ...item,
          quantity,
        };
      });

      const subtotal = updatedItems.reduce(
        (total, item) =>
          total + Number(item.menuItem?.price || 0) * item.quantity,
        0,
      );

      const itemCount = updatedItems.reduce(
        (total, item) => total + item.quantity,
        0,
      );

      return {
        ...currentCart,
        items: updatedItems,
        subtotal,
        itemCount,
      };
    });

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

      const text = await response.text();

      let result = null;

      try {
        result = text ? JSON.parse(text) : null;
      } catch {
        throw new Error("Invalid cart response from server.");
      }

      if (!response.ok) {
        throw new Error(result?.message || "Failed to update cart");
      }

      setCart(result?.data || previousCart);

      window.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: {
            cart: result?.data || previousCart,
          },
        }),
      );
    } catch (error) {
      // Rollback if API fails
      setCart(previousCart);

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error.message || "Unable to update your cart.",
        background: "#111",
        color: "#f5f1e8",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeItem(itemId) {
    const previousCart = cart;

    // Optimistic remove
    setCart((currentCart) => {
      if (!currentCart) return currentCart;

      const updatedItems = currentCart.items.filter(
        (item) => item.id !== itemId,
      );

      const subtotal = updatedItems.reduce(
        (total, item) =>
          total + Number(item.menuItem?.price || 0) * item.quantity,
        0,
      );

      const itemCount = updatedItems.reduce(
        (total, item) => total + item.quantity,
        0,
      );

      return {
        ...currentCart,
        items: updatedItems,
        subtotal,
        itemCount,
      };
    });

    try {
      setUpdatingId(itemId);

      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      const text = await response.text();

      let result = null;

      try {
        result = text ? JSON.parse(text) : null;
      } catch {
        throw new Error("Invalid cart response from server.");
      }

      if (!response.ok) {
        throw new Error(result?.message || "Failed to remove item");
      }

      setCart(result?.data || previousCart);

      window.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: {
            cart: result?.data || previousCart,
          },
        }),
      );
    } catch (error) {
      // Rollback
      setCart(previousCart);

      Swal.fire({
        icon: "error",
        title: "Remove Failed",
        text: error.message || "Unable to remove item.",
        background: "#111",
        color: "#f5f1e8",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-32">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#d4af37]" />

            <p className="text-gray-400">Loading your cart...</p>
          </div>
        </div>
      </main>
    );
  }

  const items = cart?.items || [];
  const subtotal = Number(cart?.subtotal || 0);

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-32">
        <div className="mx-auto flex min-h-[550px] max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-[#d4af37]/20 bg-[#111] px-6 py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#d4af37]/10">
              <ShoppingBag className="h-10 w-10 text-[#d4af37]" />
            </div>

            <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#d4af37]">
              ST Restaurant
            </p>

            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Your Cart is Empty
            </h1>

            <p className="mx-auto mt-4 max-w-md text-gray-400">
              Looks like you haven't added any delicious dishes yet. Explore our
              menu and discover your next favorite meal.
            </p>

            <Link
              href="/menu"
              className="gold-button mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3 font-semibold"
            >
              Explore Menu
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <Link
            href="/menu"
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-[#d4af37]"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>

          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#d4af37]">
            Your Selection
          </p>

          <h1 className="text-4xl font-semibold text-white sm:text-5xl">
            Shopping <span className="text-[#d4af37]">Cart</span>
          </h1>

          <p className="mt-3 text-gray-400">
            {cart?.itemCount || items.length} item
            {(cart?.itemCount || items.length) !== 1 ? "s" : ""} in your cart
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {items.map((item) => {
              const menuItem = item.menuItem;
              const quantity = item.quantity;
              const price = Number(menuItem?.price || 0);
              const itemTotal = price * quantity;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#d4af37]/15 bg-[#111] p-4 sm:p-5"
                >
                  <div className="flex gap-4">
                    <Link
                      href={`/menu/${menuItem?.slug}`}
                      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:h-32 sm:w-32"
                    >
                      {menuItem?.image ? (
                        <Image
                          src={menuItem.image}
                          alt={menuItem.name}
                          fill
                          sizes="128px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-[#181818] text-xs text-gray-500">
                          No Image
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="mb-1 text-xs uppercase tracking-widest text-[#d4af37]">
                            {menuItem?.category?.name || "ST Restaurant"}
                          </p>

                          <Link href={`/menu/${menuItem?.slug}`}>
                            <h2 className="text-lg font-semibold text-white transition hover:text-[#d4af37] sm:text-xl">
                              {menuItem?.name}
                            </h2>
                          </Link>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={updatingId === item.id}
                          className="text-gray-500 transition hover:text-red-400 disabled:opacity-50"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      <p className="mt-2 hidden text-sm text-gray-500 sm:block">
                        ৳{price.toLocaleString()} each
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="flex items-center rounded-full border border-[#d4af37]/20 bg-[#080808]">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, quantity - 1)
                            }
                            disabled={updatingId === item.id}
                            className="flex h-9 w-9 items-center justify-center text-gray-300 transition hover:text-[#d4af37]"
                          >
                            <Minus className="h-4 w-4" />
                          </button>

                          <span className="min-w-8 text-center text-sm font-semibold text-white">
                            {updatingId === item.id ? (
                              <Loader2 className="mx-auto h-4 w-4 animate-spin text-[#d4af37]" />
                            ) : (
                              quantity
                            )}
                          </span>

                          <button
                            onClick={() =>
                              updateQuantity(item.id, quantity + 1)
                            }
                            disabled={updatingId === item.id}
                            className="flex h-9 w-9 items-center justify-center text-gray-300 transition hover:text-[#d4af37]"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <p className="text-lg font-bold text-[#d4af37]">
                          ৳{itemTotal.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-[#d4af37]/20 bg-[#111] p-6 sm:p-7">
              <p className="mb-2 text-sm uppercase tracking-[0.25em] text-[#d4af37]">
                Order Summary
              </p>

              <h2 className="text-2xl font-semibold text-white">Your Order</h2>

              <div className="my-6 border-t border-white/10" />

              <div className="space-y-4">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-gray-400">
                  <span>Delivery</span>
                  <span className="text-white">Calculated at checkout</span>
                </div>
              </div>

              <div className="my-6 border-t border-white/10" />

              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-white">
                  Estimated Total
                </span>

                <span className="text-2xl font-bold text-[#d4af37]">
                  ৳{subtotal.toLocaleString()}
                </span>
              </div>

              <Link
                href="/checkout"
                className="gold-button mt-7 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-bold"
              >
                Proceed to Checkout
                <ArrowRight className="h-5 w-5" />
              </Link>

              <p className="mt-4 text-center text-xs leading-5 text-gray-500">
                Delivery fee and final total will be calculated during checkout.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
