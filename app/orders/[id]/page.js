
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";

import PayNowButton from "@/components/PayNowButton";
import StripePayButton from "@/components/StripePayButton";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Home,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Truck,
  User,
  XCircle,
} from "lucide-react";

const steps = [
  {
    key: "PENDING",
    title: "Order Placed",
    description: "We received your order.",
    icon: ShoppingBag,
  },
  {
    key: "CONFIRMED",
    title: "Order Confirmed",
    description: "Your order has been confirmed.",
    icon: CheckCircle2,
  },
  {
    key: "PREPARING",
    title: "Preparing",
    description: "Our chefs are preparing your food.",
    icon: Package,
  },
  {
    key: "OUT_FOR_DELIVERY",
    title: "Out for Delivery",
    description: "Your order is on the way.",
    icon: Truck,
  },
  {
    key: "DELIVERED",
    title: "Delivered",
    description: "Enjoy your delicious meal.",
    icon: Home,
  },
];

const statusOrder = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const orderId = params?.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    let active = true;

    async function loadOrder() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/orders/${orderId}`,
          {
            cache: "no-store",
          }
        );

        if (response.status === 401) {
          router.replace(
            `/login?callbackUrl=/orders/${orderId}`
          );
          return;
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Failed to load order."
          );
        }

        if (active) {
          setOrder(result.data);
        }
      } catch (error) {
        console.error(
          "ORDER DETAILS LOAD ERROR:",
          error
        );

        if (active) {
          await Swal.fire({
            icon: "error",
            title: "Order Not Found",
            text:
              error?.message ||
              "Unable to load this order.",
            background: "#111111",
            color: "#f5f1e8",
            confirmButtonColor: "#d4af37",
          });

          router.push("/orders");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      active = false;
    };
  }, [orderId, router]);

  const paymentStatus = useMemo(() => {
    return order?.payment?.status || "PENDING";
  }, [order]);

  if (loading) {
    return <OrderLoading />;
  }

  if (!order) {
    return null;
  }

  /*
   * ---------------------------------------------------------
   * PAYMENT CONDITIONS
   * ---------------------------------------------------------
   */

  const canPayWithSSL =
    order.paymentMethod === "SSLCOMMERZ" &&
    paymentStatus !== "PAID" &&
    paymentStatus !== "REFUNDED" &&
    order.status !== "CANCELLED";

  const canPayWithStripe =
    order.paymentMethod === "STRIPE" &&
    paymentStatus !== "PAID" &&
    paymentStatus !== "REFUNDED" &&
    order.status !== "CANCELLED";

  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-28">
      <div className="mx-auto max-w-6xl">
        {/* =====================================================
            TOP NAVIGATION
        ====================================================== */}

        <div className="mb-8 flex flex-wrap items-center gap-3">
          {/* Home */}

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/65 transition hover:border-[#d4af37]/30 hover:bg-[#d4af37]/5 hover:text-[#d4af37]"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>

          {/* Back */}

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/65 transition hover:border-[#d4af37]/30 hover:bg-[#d4af37]/5 hover:text-[#d4af37]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {/* Orders */}

          <Link
            href="/orders"
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 px-4 py-2.5 text-sm font-medium text-[#d4af37] transition hover:bg-[#d4af37]/10"
          >
            <ShoppingBag className="h-4 w-4" />
            My Orders
          </Link>
        </div>

        {/* =====================================================
            ORDER HEADER + TRACKING
        ====================================================== */}

        <section className="luxury-glass overflow-hidden rounded-3xl">
          {/* Header */}

          <div className="border-b border-white/10 p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#d4af37]" />

                  <p className="text-xs uppercase tracking-[0.3em] text-[#d4af37]">
                    Order Details
                  </p>
                </div>

                <h1 className="mt-3 break-all text-3xl font-bold tracking-wide text-[#f5f1e8] md:text-4xl">
                  {order.orderNumber}
                </h1>

                <p className="mt-2 text-sm text-white/40">
                  Placed{" "}
                  {formatDate(order.createdAt)}
                </p>
              </div>

              <StatusBadge
                status={order.status}
              />
            </div>
          </div>

          {/* Tracking */}

          <div className="p-6 md:p-10">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">
                Live Progress
              </p>

              <h2 className="mt-2 text-xl font-semibold text-[#f5f1e8]">
                Track Your Order
              </h2>
            </div>

            <OrderTimeline
              status={order.status}
            />
          </div>
        </section>

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* ===================================================
              LEFT COLUMN
          ==================================================== */}

          <div className="space-y-8">
            {/* =================================================
                ORDER ITEMS
            ================================================== */}

            <section className="luxury-glass rounded-3xl p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 text-[#d4af37]" />

                  <div>
                    <h2 className="text-xl font-semibold text-[#f5f1e8]">
                      Your Items
                    </h2>

                    <p className="mt-1 text-xs text-white/30">
                      {order.items?.length || 0}{" "}
                      item
                      {order.items?.length === 1
                        ? ""
                        : "s"}{" "}
                      in this order
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {order.items?.map((item) => (
                  <OrderItem
                    key={item.id}
                    item={item}
                  />
                ))}
              </div>
            </section>

            {/* =================================================
                DELIVERY INFORMATION
            ================================================== */}

            {order.deliveryAddress && (
              <section className="luxury-glass rounded-3xl p-6 md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-[#d4af37]" />

                  <div>
                    <h2 className="text-xl font-semibold text-[#f5f1e8]">
                      Delivery Information
                    </h2>

                    <p className="mt-1 text-xs text-white/30">
                      Your delivery details
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <InfoItem
                    icon={<User />}
                    label="Name"
                    value={
                      order.deliveryAddress
                        .fullName
                    }
                  />

                  <InfoItem
                    icon={<Phone />}
                    label="Phone"
                    value={
                      order.deliveryAddress.phone
                    }
                  />

                  <InfoItem
                    icon={<Home />}
                    label="City"
                    value={
                      order.deliveryAddress.city
                    }
                  />

                  <InfoItem
                    icon={<MapPin />}
                    label="Area"
                    value={
                      order.deliveryAddress.area ||
                      "Not provided"
                    }
                  />

                  <div className="sm:col-span-2">
                    <InfoItem
                      icon={<MapPin />}
                      label="Address"
                      value={
                        order.deliveryAddress
                          .address
                      }
                    />
                  </div>

                  {order.deliveryAddress
                    .postalCode && (
                    <InfoItem
                      icon={<MapPin />}
                      label="Postal Code"
                      value={
                        order.deliveryAddress
                          .postalCode
                      }
                    />
                  )}

                  {order.deliveryAddress
                    .instructions && (
                    <div className="sm:col-span-2">
                      <InfoItem
                        icon={<Truck />}
                        label="Delivery Instructions"
                        value={
                          order.deliveryAddress
                            .instructions
                        }
                      />
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* =================================================
                ORDER NOTES
            ================================================== */}

            {order.notes && (
              <section className="luxury-glass rounded-3xl p-6 md:p-8">
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
                    Special Request
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-[#f5f1e8]">
                    Order Notes
                  </h2>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-sm leading-7 text-white/55">
                    {order.notes}
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* ===================================================
              RIGHT COLUMN
          ==================================================== */}

          <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
            {/* =================================================
                ORDER SUMMARY
            ================================================== */}

            <section className="luxury-glass rounded-3xl p-6">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
                  Billing
                </p>

                <h2 className="mt-2 text-xl font-semibold text-[#f5f1e8]">
                  Order Summary
                </h2>
              </div>

              <div className="space-y-4">
                <SummaryRow
                  label="Subtotal"
                  value={`৳${Number(
                    order.subtotal
                  ).toLocaleString()}`}
                />

                <SummaryRow
                  label="Delivery Fee"
                  value={`৳${Number(
                    order.deliveryFee
                  ).toLocaleString()}`}
                />

                {Number(order.discount) >
                  0 && (
                  <SummaryRow
                    label="Discount"
                    value={`-৳${Number(
                      order.discount
                    ).toLocaleString()}`}
                    valueClassName="text-emerald-400"
                  />
                )}

                <div className="border-t border-white/10 pt-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/30">
                        Total
                      </p>

                      <p className="mt-1 text-sm text-white/50">
                        Final payable amount
                      </p>
                    </div>

                    <span className="text-2xl font-bold text-[#d4af37]">
                      ৳
                      {Number(
                        order.total
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                PAYMENT
            ================================================== */}

            <section className="luxury-glass rounded-3xl p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4af37]/10">
                  <CreditCard className="h-5 w-5 text-[#d4af37]" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-white/30">
                    Payment
                  </p>

                  <h2 className="mt-1 text-xl font-semibold text-[#f5f1e8]">
                    Payment Details
                  </h2>
                </div>
              </div>

              {/* Payment Information */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                {/* Method */}

                <div>
                  <p className="text-xs text-white/30">
                    Payment Method
                  </p>

                  <p className="mt-1 font-medium text-white/80">
                    {getPaymentMethodLabel(
                      order.paymentMethod
                    )}
                  </p>
                </div>

                {/* Status */}

                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-xs text-white/35">
                    Payment Status
                  </span>

                  <PaymentStatusBadge
                    status={paymentStatus}
                  />
                </div>

                {/* Transaction ID */}

                {order.payment
                  ?.transactionId && (
                  <div className="mt-5 border-t border-white/5 pt-4">
                    <p className="text-xs text-white/30">
                      Transaction ID
                    </p>

                    <p className="mt-1 break-all font-mono text-xs text-white/55">
                      {
                        order.payment
                          .transactionId
                      }
                    </p>
                  </div>
                )}

                {/* Paid At */}

                {order.payment?.paidAt && (
                  <div className="mt-4">
                    <p className="text-xs text-white/30">
                      Paid At
                    </p>

                    <p className="mt-1 text-xs text-white/55">
                      {formatDate(
                        order.payment.paidAt
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* =================================================
                  SSLCOMMERZ PAYMENT
              ================================================== */}

              {canPayWithSSL && (
                <div className="mt-5">
                  <div className="mb-4 rounded-2xl border border-[#d4af37]/15 bg-[#d4af37]/5 p-4">
                    <div className="flex gap-3">
                      <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-[#d4af37]" />

                      <div>
                        <p className="text-sm font-medium text-white/80">
                          SSLCommerz Payment
                        </p>

                        <p className="mt-1 text-xs leading-5 text-white/40">
                          Complete your online payment
                          securely through SSLCommerz.
                        </p>
                      </div>
                    </div>
                  </div>

                  <PayNowButton
                    orderId={order.id}
                    amount={order.total}
                  />
                </div>
              )}

              {/* =================================================
                  STRIPE PAYMENT
              ================================================== */}

              {canPayWithStripe && (
                <div className="mt-5">
                  <div className="mb-4 rounded-2xl border border-[#d4af37]/15 bg-[#d4af37]/5 p-4">
                    <div className="flex gap-3">
                      <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-[#d4af37]" />

                      <div>
                        <p className="text-sm font-medium text-white/80">
                          Stripe Payment
                        </p>

                        <p className="mt-1 text-xs leading-5 text-white/40">
                          Pay securely with your card
                          through Stripe. Your card
                          information is handled securely
                          by Stripe.
                        </p>
                      </div>
                    </div>
                  </div>

                  <StripePayButton
                    orderId={order.id}
                  />
                </div>
              )}

              {/* =================================================
                  PAID
              ================================================== */}

              {paymentStatus === "PAID" && (
                <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-emerald-400">
                        Payment Completed
                      </p>

                      <p className="mt-1 text-xs text-white/35">
                        Your payment has been successfully
                        verified.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  COD
              ================================================== */}

              {order.paymentMethod ===
                "COD" &&
                paymentStatus !== "PAID" && (
                  <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="flex gap-3">
                      <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />

                      <div>
                        <p className="text-sm font-semibold text-amber-400">
                          Cash on Delivery
                        </p>

                        <p className="mt-1 text-xs leading-5 text-white/35">
                          Please keep the exact amount
                          ready when your order arrives.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* =================================================
                  FAILED
              ================================================== */}

              {paymentStatus ===
                "FAILED" &&
                order.status !== "CANCELLED" && (
                  <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                    <div className="flex gap-3">
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

                      <div>
                        <p className="text-sm font-semibold text-red-400">
                          Payment Failed
                        </p>

                        <p className="mt-1 text-xs leading-5 text-white/35">
                          Your previous payment attempt
                          failed. Please try again.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* =================================================
                  REFUNDED
              ================================================== */}

              {paymentStatus ===
                "REFUNDED" && (
                <div className="mt-5 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
                  <div className="flex gap-3">
                    <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-purple-400" />

                    <div>
                      <p className="text-sm font-semibold text-purple-400">
                        Payment Refunded
                      </p>

                      <p className="mt-1 text-xs leading-5 text-white/35">
                        This payment has been refunded.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  CANCELLED
              ================================================== */}

              {order.status ===
                "CANCELLED" && (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex gap-3">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

                    <div>
                      <p className="text-sm font-semibold text-red-400">
                        Order Cancelled
                      </p>

                      <p className="mt-1 text-xs leading-5 text-white/35">
                        Payment actions are disabled for
                        cancelled orders.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* =================================================
                QUICK ACTIONS
            ================================================== */}

            <section className="luxury-glass rounded-3xl p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
                Quick Access
              </p>

              <div className="mt-4 grid gap-3">
                <Link
                  href="/orders"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/65 transition hover:border-[#d4af37]/25 hover:bg-[#d4af37]/5 hover:text-[#d4af37]"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    My Orders
                  </span>

                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Link>

                <Link
                  href="/menu"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/65 transition hover:border-[#d4af37]/25 hover:bg-[#d4af37]/5 hover:text-[#d4af37]"
                >
                  <span className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Explore Menu
                  </span>

                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Link>

                <Link
                  href="/"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/65 transition hover:border-[#d4af37]/25 hover:bg-[#d4af37]/5 hover:text-[#d4af37]"
                >
                  <span className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Back to Home
                  </span>

                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   ORDER TIMELINE
============================================================ */

function OrderTimeline({ status }) {
  const currentIndex =
    statusOrder.indexOf(status);

  if (status === "CANCELLED") {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 md:p-6">
        <div className="flex items-start gap-4 text-red-400">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/10">
            <XCircle className="h-6 w-6" />
          </div>

          <div>
            <p className="font-semibold">
              Order Cancelled
            </p>

            <p className="mt-1 text-sm leading-6 text-white/40">
              This order has been cancelled and can no
              longer be processed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Desktop line */}

      <div className="absolute left-[20px] top-5 hidden h-[calc(100%-40px)] w-px bg-white/10 md:block" />

      <div className="space-y-8">
        {steps.map((step, index) => {
          const Icon = step.icon;

          const completed =
            currentIndex >= index;

          const current =
            currentIndex === index;

          return (
            <div
              key={step.key}
              className="relative flex gap-5"
            >
              {/* Icon */}

              <div
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
                  completed
                    ? "border-[#d4af37] bg-[#d4af37] text-black shadow-[0_0_25px_rgba(212,175,55,0.15)]"
                    : "border-white/10 bg-[#111] text-white/25"
                }`}
              >
                {completed ? (
                  current ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              {/* Text */}

              <div className="min-w-0 pt-1">
                <h3
                  className={`font-semibold ${
                    completed
                      ? "text-[#f5f1e8]"
                      : "text-white/25"
                  }`}
                >
                  {step.title}
                </h3>

                <p className="mt-1 text-sm leading-6 text-white/35">
                  {step.description}
                </p>

                {current && (
                  <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#d4af37]">
                    <Clock3 className="h-3 w-3" />
                    Current status
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   ORDER ITEM
============================================================ */

function OrderItem({ item }) {
  const itemTotal =
    Number(item.price) *
    Number(item.quantity);

  const image =
    item?.menuItem?.image || null;

  const name =
    item?.menuItem?.name ||
    "Restaurant Item";

  const description =
    item?.menuItem?.description ||
    "Deliciously prepared by ST Restaurant.";

  return (
    <div className="flex gap-4 border-b border-white/5 pb-5 last:border-0 last:pb-0">
      {/* Image */}

      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#181818] sm:h-24 sm:w-24">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-white/20" />
          </div>
        )}
      </div>

      {/* Content */}

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-[#f5f1e8]">
          {name}
        </h3>

        <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/35">
          {description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-white/40">
            Qty: {item.quantity}
          </span>

          <span className="text-[#d4af37]">
            ৳
            {Number(
              item.price
            ).toLocaleString()}{" "}
            each
          </span>
        </div>
      </div>

      {/* Price */}

      <div className="shrink-0 text-right">
        <p className="font-semibold text-white/80">
          ৳
          {itemTotal.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   INFO ITEM
============================================================ */

function InfoItem({
  icon,
  label,
  value,
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-white/30">
        <span className="text-[#d4af37]">
          {icon}
        </span>

        {label}
      </div>

      <p className="break-words text-sm leading-6 text-white/70">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   SUMMARY ROW
============================================================ */

function SummaryRow({
  label,
  value,
  valueClassName = "text-white/75",
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-white/45">
        {label}
      </span>

      <span
        className={`font-medium ${valueClassName}`}
      >
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({ status }) {
  if (status === "CANCELLED") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400">
        <XCircle className="h-4 w-4" />
        Cancelled
      </div>
    );
  }

  const labels = {
    PENDING: "Order Placed",
    CONFIRMED: "Confirmed",
    PREPARING: "Preparing",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-4 py-2 text-sm font-medium text-[#d4af37]">
      <CheckCircle2 className="h-4 w-4" />

      {labels[status] || status}
    </div>
  );
}

/* ============================================================
   PAYMENT STATUS
============================================================ */

function PaymentStatusBadge({ status }) {
  const config = {
    PAID: {
      label: "PAID",
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    },

    PENDING: {
      label: "PENDING",
      className:
        "border-amber-500/20 bg-amber-500/10 text-amber-400",
    },

    FAILED: {
      label: "FAILED",
      className:
        "border-red-500/20 bg-red-500/10 text-red-400",
    },

    CANCELLED: {
      label: "CANCELLED",
      className:
        "border-red-500/20 bg-red-500/10 text-red-400",
    },

    REFUNDED: {
      label: "REFUNDED",
      className:
        "border-purple-500/20 bg-purple-500/10 text-purple-400",
    },
  };

  const current =
    config[status] || config.PENDING;

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${current.className}`}
    >
      {current.label}
    </span>
  );
}

/* ============================================================
   PAYMENT METHOD LABEL
============================================================ */

function getPaymentMethodLabel(method) {
  const labels = {
    COD: "Cash on Delivery",
    SSLCOMMERZ: "SSLCommerz",
    STRIPE: "Stripe",
  };

  return (
    labels[method] ||
    method ||
    "Not specified"
  );
}

/* ============================================================
   DATE FORMAT
============================================================ */

function formatDate(date) {
  if (!date) {
    return "N/A";
  }

  try {
    return new Date(date).toLocaleString(
      "en-BD",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  } catch {
    return "N/A";
  }
}

/* ============================================================
   LOADING SKELETON
============================================================ */

function OrderLoading() {
  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-28">
      <div className="mx-auto max-w-6xl">
        {/* Navigation */}

        <div className="flex gap-3">
          <div className="h-10 w-24 animate-pulse rounded-xl bg-white/5" />

          <div className="h-10 w-24 animate-pulse rounded-xl bg-white/5" />
        </div>

        {/* Header */}

        <div className="mt-6 overflow-hidden rounded-3xl bg-white/5">
          <div className="h-40 animate-pulse" />

          <div className="h-72 animate-pulse border-t border-white/5" />
        </div>

        {/* Content */}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <div className="h-[420px] animate-pulse rounded-3xl bg-white/5" />

            <div className="h-[300px] animate-pulse rounded-3xl bg-white/5" />
          </div>

          <div className="space-y-8">
            <div className="h-[280px] animate-pulse rounded-3xl bg-white/5" />

            <div className="h-[360px] animate-pulse rounded-3xl bg-white/5" />
          </div>
        </div>
      </div>
    </main>
  );
}

