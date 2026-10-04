"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  ShoppingBag,
  Truck,
  WalletCards,
} from "lucide-react";

const DELIVERY_FEE = 100;

const initialForm = {
  fullName: "",
  phone: "",
  address: "",
  city: "Sylhet",
  area: "",
  postalCode: "",
  instructions: "",
  notes: "",
};

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [paymentMethod, setPaymentMethod] = useState("COD");

  useEffect(() => {
    let active = true;

    async function loadCheckout() {
      try {
        const response = await fetch("/api/cart", {
          cache: "no-store",
        });

        if (response.status === 401) {
          router.replace("/login?callbackUrl=/checkout");
          return;
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load cart.");
        }

        if (active) {
          setCart(result.data);
        }
      } catch (error) {
        console.error("CHECKOUT LOAD ERROR:", error);

        if (active) {
          Swal.fire({
            icon: "error",
            title: "Unable to load checkout",
            text: error.message || "Please try again.",
            background: "#111",
            color: "#f5f1e8",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCheckout();

    return () => {
      active = false;
    };
  }, [router]);

  const items = cart?.items || [];

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + Number(item.menuItem.price) * Number(item.quantity),
      0,
    );
  }, [items]);

  const total = subtotal + DELIVERY_FEE;

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function placeOrder(event) {
    event.preventDefault();

    if (items.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Your cart is empty",
        background: "#111",
        color: "#f5f1e8",
      });
      router.push("/menu");
      return;
    }

    if (paymentMethod !== "COD") {
      Swal.fire({
        icon: "info",
        title: "Coming soon",
        text: "Online payment will be connected in the next step. You can place the order with Cash on Delivery now.",
        background: "#111",
        color: "#f5f1e8",
        confirmButtonColor: "#d4af37",
      });
      return;
    }

    setPlacingOrder(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login?callbackUrl=/checkout");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to place order.");
      }

      window.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: {
            itemCount: 0,
          },
        }),
      );

      await Swal.fire({
        icon: "success",
        title: "Order Confirmed!",
        text: `Your order ${data.order.orderNumber} has been placed successfully.`,
        background: "#111",
        color: "#f5f1e8",
        confirmButtonColor: "#d4af37",
        confirmButtonText: "View Order",
      });

      router.push(`/orders/${data.order.id}`);
    } catch (error) {
      console.error("PLACE ORDER ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Order failed",
        text: error.message || "Something went wrong.",
        background: "#111",
        color: "#f5f1e8",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setPlacingOrder(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] pt-32">
        <div className="mx-auto max-w-7xl px-4">
          <div className="h-10 w-56 animate-pulse rounded bg-white/5" />

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px]">
            <div className="h-[650px] animate-pulse rounded-3xl bg-white/5" />
            <div className="h-[500px] animate-pulse rounded-3xl bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4 pt-24">
        <div className="text-center">
          <ShoppingBag className="mx-auto mb-5 h-16 w-16 text-[#d4af37]" />

          <h1 className="text-3xl font-semibold text-[#f5f1e8]">
            Your cart is empty
          </h1>

          <p className="mt-3 text-white/50">
            Add some delicious dishes before checking out.
          </p>

          <Link
            href="/menu"
            className="gold-button mt-7 inline-flex items-center gap-2 rounded-full px-7 py-3 font-semibold"
          >
            Explore Menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-28">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/cart"
            className="mb-5 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-[#d4af37]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>

          <p className="text-sm uppercase tracking-[0.3em] text-[#d4af37]">
            ST Restaurant
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#f5f1e8] md:text-5xl">
            Checkout
          </h1>

          <p className="mt-3 text-white/50">
            Complete your delivery information and place your order.
          </p>
        </div>

        <form
          onSubmit={placeOrder}
          className="grid gap-8 lg:grid-cols-[1fr_420px]"
        >
          {/* LEFT */}
          <div className="space-y-6">
            {/* Delivery */}
            <section className="luxury-glass rounded-3xl p-6 md:p-8">
              <div className="mb-7 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d4af37]/10 text-[#d4af37]">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-[#f5f1e8]">
                    Delivery Information
                  </h2>

                  <p className="text-sm text-white/40">
                    Where should we deliver your order?
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Full Name"
                  name="fullName"
                  value={form.fullName}
                  onChange={updateField}
                  placeholder="Your full name"
                  required
                />

                <Input
                  label="Phone Number"
                  name="phone"
                  value={form.phone}
                  onChange={updateField}
                  placeholder="+880 1XXXXXXXXX"
                  required
                />

                <div className="md:col-span-2">
                  <Input
                    label="Delivery Address"
                    name="address"
                    value={form.address}
                    onChange={updateField}
                    placeholder="House, Road, Area"
                    required
                  />
                </div>

                <Input
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={updateField}
                  placeholder="City"
                  required
                />

                <Input
                  label="Area"
                  name="area"
                  value={form.area}
                  onChange={updateField}
                  placeholder="Area / Thana"
                />

                <Input
                  label="Postal Code"
                  name="postalCode"
                  value={form.postalCode}
                  onChange={updateField}
                  placeholder="Postal code"
                />

                <Input
                  label="Delivery Instructions"
                  name="instructions"
                  value={form.instructions}
                  onChange={updateField}
                  placeholder="Example: Call when you arrive"
                />

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-white/60">
                    Order Notes
                  </label>

                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={updateField}
                    rows={4}
                    placeholder="Any special request?"
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#d4af37]/60"
                  />
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="luxury-glass rounded-3xl p-6 md:p-8">
              <div className="mb-7 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d4af37]/10 text-[#d4af37]">
                  <WalletCards className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-[#f5f1e8]">
                    Payment Method
                  </h2>

                  <p className="text-sm text-white/40">
                    Choose how you want to pay.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <PaymentOption
                  active={paymentMethod === "COD"}
                  onClick={() => setPaymentMethod("COD")}
                  icon={<Truck className="h-5 w-5" />}
                  title="Cash on Delivery"
                  description="Pay when delivered"
                />

                <PaymentOption
                  active={paymentMethod === "SSLCOMMERZ"}
                  onClick={() => setPaymentMethod("SSLCOMMERZ")}
                  icon={<CreditCard className="h-5 w-5" />}
                  title="SSLCommerz"
                  description="Coming soon"
                  disabled
                />

                <PaymentOption
                  active={paymentMethod === "STRIPE"}
                  onClick={() => setPaymentMethod("STRIPE")}
                  icon={<CreditCard className="h-5 w-5" />}
                  title="Stripe"
                  description="Coming soon"
                  disabled
                />
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <section className="luxury-glass overflow-hidden rounded-3xl">
              <div className="border-b border-white/10 p-6">
                <h2 className="text-xl font-semibold text-[#f5f1e8]">
                  Order Summary
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </p>
              </div>

              <div className="max-h-[420px] space-y-4 overflow-y-auto p-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 border-b border-white/5 pb-4 last:border-0"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={item.menuItem.image || "/images/placeholder.jpg"}
                        alt={item.menuItem.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-medium text-[#f5f1e8]">
                        {item.menuItem.name}
                      </h3>

                      <p className="mt-1 text-xs text-white/40">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-[#d4af37]">
                      ৳
                      {(
                        Number(item.menuItem.price) * Number(item.quantity)
                      ).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 p-6">
                <div className="space-y-4 text-sm">
                  <SummaryRow
                    label="Subtotal"
                    value={`৳${subtotal.toLocaleString()}`}
                  />

                  <SummaryRow
                    label="Delivery Fee"
                    value={`৳${DELIVERY_FEE.toLocaleString()}`}
                  />

                  <div className="my-4 border-t border-white/10" />

                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-white/70">
                      Total
                    </span>

                    <span className="text-2xl font-bold text-[#d4af37]">
                      ৳{total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={placingOrder}
                  className="gold-button mt-7 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-bold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {placingOrder ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Place Order
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/30">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#d4af37]" />
                  Secure order processing
                </div>
              </div>
            </section>
          </aside>
        </form>
      </div>
    </main>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-white/60">
        {label}
        {required && <span className="ml-1 text-[#d4af37]">*</span>}
      </label>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#d4af37]/60"
      />
    </div>
  );
}

function PaymentOption({
  active,
  onClick,
  icon,
  title,
  description,
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative rounded-2xl border p-4 text-left transition ${
        active
          ? "border-[#d4af37] bg-[#d4af37]/10"
          : "border-white/10 bg-white/[0.02] hover:border-white/20"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      {active && (
        <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-[#d4af37]" />
      )}

      <div className="mb-3 text-[#d4af37]">{icon}</div>

      <h3 className="text-sm font-semibold text-[#f5f1e8]">{title}</h3>

      <p className="mt-1 text-xs text-white/40">{description}</p>
    </button>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/50">{label}</span>
      <span className="text-white/80">{value}</span>
    </div>
  );
}
