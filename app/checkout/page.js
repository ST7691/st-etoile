
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
  ShieldCheck,
  ShoppingBag,
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

const PAYMENT_METHODS = [
  {
    id: "COD",
    title: "Cash on Delivery",
    description:
      "Pay when your order arrives at your doorstep.",
    icon: WalletCards,
  },
  {
    id: "SSLCOMMERZ",
    title: "SSLCommerz",
    description:
      "Pay securely using cards, mobile banking and supported payment methods.",
    icon: CreditCard,
  },
  {
    id: "STRIPE",
    title: "Stripe",
    description:
      "Secure international card payment through Stripe Checkout.",
    icon: CreditCard,
  },
];

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [form, setForm] = useState(initialForm);

  const [paymentMethod, setPaymentMethod] =
    useState("COD");

  useEffect(() => {
    let active = true;

    async function loadCheckout() {
      try {
        setLoading(true);

        const response = await fetch(
          "/api/cart",
          {
            cache: "no-store",
          }
        );

        if (response.status === 401) {
          router.replace(
            "/login?callbackUrl=/checkout"
          );
          return;
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Failed to load cart."
          );
        }

        if (active) {
          setCart(result.data);
        }
      } catch (error) {
        console.error(
          "CHECKOUT LOAD ERROR:",
          error
        );

        if (active) {
          await Swal.fire({
            icon: "error",
            title: "Unable to load checkout",
            text:
              error?.message ||
              "Please try again.",
            background: "#111",
            color: "#f5f1e8",
            confirmButtonColor: "#d4af37",
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
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
        total +
        Number(item.menuItem.price) *
          Number(item.quantity),
      0
    );
  }, [items]);

  const total = subtotal + DELIVERY_FEE;

  function updateField(event) {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function selectPaymentMethod(method) {
    if (placingOrder) return;

    setPaymentMethod(method);
  }

  async function placeOrder(event) {
    event.preventDefault();

    if (placingOrder) {
      return;
    }

    if (!items.length) {
      await Swal.fire({
        icon: "warning",
        title: "Your cart is empty",
        text:
          "Please add some dishes before checkout.",
        background: "#111",
        color: "#f5f1e8",
        confirmButtonColor: "#d4af37",
      });

      router.push("/menu");
      return;
    }

    /*
     * Basic frontend validation.
     * Server-side validation must also exist
     * inside /api/orders.
     */

    if (!form.fullName.trim()) {
      await showValidationError(
        "Please enter your full name."
      );
      return;
    }

    if (!form.phone.trim()) {
      await showValidationError(
        "Please enter your phone number."
      );
      return;
    }

    if (!form.address.trim()) {
      await showValidationError(
        "Please enter your delivery address."
      );
      return;
    }

    if (!form.city.trim()) {
      await showValidationError(
        "Please enter your city."
      );
      return;
    }

    if (!paymentMethod) {
      await showValidationError(
        "Please select a payment method."
      );
      return;
    }

    setPlacingOrder(true);

    try {
      /*
       * Create the order first for ALL payment methods.
       *
       * COD:
       * Order becomes confirmed/normal according
       * to your API logic.
       *
       * SSLCommerz:
       * Order is created with paymentMethod=SSLCOMMERZ.
       * Then user goes to order details where
       * PayNowButton appears.
       *
       * Stripe:
       * Order is created with paymentMethod=STRIPE.
       * Then user goes to order details where
       * StripePayButton appears.
       */

      const response = await fetch(
        "/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            paymentMethod,
          }),
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        router.replace(
          "/login?callbackUrl=/checkout"
        );
        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to create order."
        );
      }

      if (!data.order?.id) {
        throw new Error(
          "Order was created but order ID is missing."
        );
      }

      /*
       * Update cart UI immediately.
       */

      window.dispatchEvent(
        new CustomEvent(
          "cart-updated",
          {
            detail: {
              itemCount: 0,
            },
          }
        )
      );

      /*
       * Payment-specific success message.
       */

      let title =
        "Order Created Successfully!";

      let text =
        `Your order ${
          data.order.orderNumber
        } has been created.`;

      if (paymentMethod === "COD") {
        title = "Order Confirmed!";
        text =
          `Your order ${
            data.order.orderNumber
          } has been placed successfully.`;
      }

      if (
        paymentMethod ===
        "SSLCOMMERZ"
      ) {
        title =
          "Order Created — Payment Required";

        text =
          `Your order ${
            data.order.orderNumber
          } has been created. Continue to SSLCommerz payment from the order page.`;
      }

      if (
        paymentMethod === "STRIPE"
      ) {
        title =
          "Order Created — Payment Required";

        text =
          `Your order ${
            data.order.orderNumber
          } has been created. Continue to Stripe payment from the order page.`;
      }

      await Swal.fire({
        icon: "success",
        title,
        text,
        background: "#111",
        color: "#f5f1e8",
        confirmButtonColor:
          "#d4af37",
        confirmButtonText:
          paymentMethod === "COD"
            ? "View Order"
            : "Continue to Payment",
      });

      /*
       * Always go to order details.
       *
       * Order details decides which payment
       * button should appear.
       */

      router.push(
        `/orders/${data.order.id}`
      );
    } catch (error) {
      console.error(
        "PLACE ORDER ERROR:",
        error
      );

      await Swal.fire({
        icon: "error",
        title: "Order Failed",
        text:
          error?.message ||
          "Something went wrong while creating your order.",
        background: "#111",
        color: "#f5f1e8",
        confirmButtonColor:
          "#d4af37",
        confirmButtonText: "Try Again",
      });
    } finally {
      setPlacingOrder(false);
    }
  }

  /*
   * Loading State
   */

  if (loading) {
    return <CheckoutLoading />;
  }

  /*
   * Empty Cart
   */

  if (!items.length) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4 pt-24">
        <div className="text-center">
          <ShoppingBag className="mx-auto mb-5 h-16 w-16 text-[#d4af37]" />

          <h1 className="text-3xl font-semibold text-[#f5f1e8]">
            Your cart is empty
          </h1>

          <p className="mt-3 text-white/50">
            Add some delicious dishes before
            checking out.
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
        {/* =====================================================
            HEADER
        ====================================================== */}

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
            Complete your delivery information
            and choose your preferred payment
            method.
          </p>
        </div>

        <form
          onSubmit={placeOrder}
          className="grid gap-8 lg:grid-cols-[1fr_420px]"
        >
          {/* ===================================================
              LEFT COLUMN
          ==================================================== */}

          <div className="space-y-6">
            {/* =================================================
                DELIVERY INFORMATION
            ================================================== */}

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
                    Where should we deliver your
                    order?
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

            {/* =================================================
                PAYMENT METHOD
            ================================================== */}

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

              <div className="grid gap-4">
                {PAYMENT_METHODS.map(
                  (method) => (
                    <PaymentOption
                      key={method.id}
                      method={method}
                      active={
                        paymentMethod ===
                        method.id
                      }
                      onClick={() =>
                        selectPaymentMethod(
                          method.id
                        )
                      }
                      disabled={
                        placingOrder
                      }
                    />
                  )
                )}
              </div>

              {/* Selected payment information */}

              <PaymentNotice
                paymentMethod={
                  paymentMethod
                }
              />
            </section>
          </div>

          {/* ===================================================
              RIGHT COLUMN
          ==================================================== */}

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <section className="luxury-glass overflow-hidden rounded-3xl">
              {/* SUMMARY HEADER */}

              <div className="border-b border-white/10 p-6">
                <h2 className="text-xl font-semibold text-[#f5f1e8]">
                  Order Summary
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  {items.length}{" "}
                  {items.length === 1
                    ? "item"
                    : "items"}
                </p>
              </div>

              {/* ITEMS */}

              <div className="max-h-[420px] space-y-4 overflow-y-auto p-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 border-b border-white/5 pb-4 last:border-0"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
                      <Image
                        src={
                          item.menuItem
                            .image ||
                          "/images/placeholder.jpg"
                        }
                        alt={
                          item.menuItem
                            .name
                        }
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-medium text-[#f5f1e8]">
                        {
                          item.menuItem
                            .name
                        }
                      </h3>

                      <p className="mt-1 text-xs text-white/40">
                        Qty:{" "}
                        {
                          item.quantity
                        }
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-[#d4af37]">
                      ৳
                      {(
                        Number(
                          item.menuItem
                            .price
                        ) *
                        Number(
                          item.quantity
                        )
                      ).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* TOTALS */}

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
                      ৳
                      {total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* SELECTED METHOD */}

                <div className="mt-6 rounded-2xl border border-[#d4af37]/15 bg-[#d4af37]/5 p-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-[#d4af37]" />

                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/30">
                        Payment
                      </p>

                      <p className="mt-1 text-sm font-medium text-white/75">
                        {getPaymentMethodLabel(
                          paymentMethod
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* PLACE ORDER */}

                <button
                  type="submit"
                  disabled={placingOrder}
                  className="gold-button mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-bold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {placingOrder ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />

                      Creating Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />

                      {paymentMethod ===
                      "COD"
                        ? "Place Order"
                        : "Continue to Payment"}
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/30">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#d4af37]" />

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

/* =========================================================
   INPUT COMPONENT
========================================================= */

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

        {required && (
          <span className="ml-1 text-[#d4af37]">
            *
          </span>
        )}
      </label>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={false}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#d4af37]/60"
      />
    </div>
  );
}

/* =========================================================
   PAYMENT OPTION
========================================================= */

function PaymentOption({
  method,
  active,
  onClick,
  disabled,
}) {
  const Icon = method.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition ${
        active
          ? "border-[#d4af37]/50 bg-[#d4af37]/5 shadow-[0_0_30px_rgba(212,175,55,0.05)]"
          : "border-white/10 bg-white/[0.02] hover:border-[#d4af37]/25 hover:bg-[#d4af37]/[0.02]"
      } ${
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer"
      }`}
    >
      {/* Radio */}

      <div
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          active
            ? "border-[#d4af37]"
            : "border-white/20"
        }`}
      >
        {active && (
          <span className="h-2.5 w-2.5 rounded-full bg-[#d4af37]" />
        )}
      </div>

      {/* Icon */}

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          active
            ? "bg-[#d4af37]/15 text-[#d4af37]"
            : "bg-white/5 text-white/40"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}

      <div className="min-w-0 flex-1 pr-5">
        <div className="flex items-center gap-2">
          <h3
            className={`font-semibold ${
              active
                ? "text-[#f5f1e8]"
                : "text-white/75"
            }`}
          >
            {method.title}
          </h3>

          {active && (
            <CheckCircle2 className="h-4 w-4 text-[#d4af37]" />
          )}
        </div>

        <p className="mt-1 text-xs leading-5 text-white/35">
          {method.description}
        </p>
      </div>
    </button>
  );
}

/* =========================================================
   PAYMENT NOTICE
========================================================= */

function PaymentNotice({
  paymentMethod,
}) {
  if (paymentMethod === "COD") {
    return (
      <div className="mt-5 rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4">
        <div className="flex gap-3">
          <WalletCards className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />

          <div>
            <p className="text-sm font-medium text-amber-400">
              Cash on Delivery
            </p>

            <p className="mt-1 text-xs leading-5 text-white/35">
              You will pay the delivery amount
              when your food arrives.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (
    paymentMethod ===
    "SSLCOMMERZ"
  ) {
    return (
      <div className="mt-5 rounded-2xl border border-[#d4af37]/15 bg-[#d4af37]/5 p-4">
        <div className="flex gap-3">
          <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-[#d4af37]" />

          <div>
            <p className="text-sm font-medium text-white/80">
              SSLCommerz Secure Payment
            </p>

            <p className="mt-1 text-xs leading-5 text-white/40">
              Your order will be created first.
              You can then complete payment securely
              using SSLCommerz.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (
    paymentMethod === "STRIPE"
  ) {
    return (
      <div className="mt-5 rounded-2xl border border-[#d4af37]/15 bg-[#d4af37]/5 p-4">
        <div className="flex gap-3">
          <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-[#d4af37]" />

          <div>
            <p className="text-sm font-medium text-white/80">
              Stripe Secure Payment
            </p>

            <p className="mt-1 text-xs leading-5 text-white/40">
              Your order will be created first.
              You can then continue to Stripe Checkout
              for secure card payment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/* =========================================================
   PAYMENT LABEL
========================================================= */

function getPaymentMethodLabel(
  method
) {
  const labels = {
    COD: "Cash on Delivery",
    SSLCOMMERZ: "SSLCommerz",
    STRIPE: "Stripe",
  };

  return (
    labels[method] ||
    "Select payment method"
  );
}

/* =========================================================
   VALIDATION ALERT
========================================================= */

async function showValidationError(
  message
) {
  await Swal.fire({
    icon: "warning",
    title: "Incomplete Information",
    text: message,
    background: "#111",
    color: "#f5f1e8",
    confirmButtonColor:
      "#d4af37",
  });
}

/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/50">
        {label}
      </span>

      <span className="text-white/80">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function CheckoutLoading() {
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

