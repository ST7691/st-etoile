"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Home,
  Loader2,
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

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;

    let active = true;

    async function loadOrder() {
      try {
        const response = await fetch(`/api/orders/${params.id}`, {
          cache: "no-store",
        });

        if (response.status === 401) {
          router.replace(`/login?callbackUrl=/orders/${params.id}`);
          return;
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load order.");
        }

        if (active) {
          setOrder(result.data);
        }
      } catch (error) {
        console.error("ORDER DETAILS LOAD ERROR:", error);

        if (active) {
          Swal.fire({
            icon: "error",
            title: "Order not found",
            text: error.message || "Unable to load this order.",
            background: "#111",
            color: "#f5f1e8",
            confirmButtonColor: "#d4af37",
          }).then(() => {
            router.push("/orders");
          });
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
  }, [params?.id, router]);

  if (loading) {
    return <OrderLoading />;
  }

  if (!order) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-28">
      <div className="mx-auto max-w-6xl">
        {/* Back */}
        <Link
          href="/orders"
          className="mb-7 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-[#d4af37]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Orders
        </Link>

        {/* Header */}
        <section className="luxury-glass overflow-hidden rounded-3xl">
          <div className="border-b border-white/10 p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#d4af37]">
                  Order Details
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-wide text-[#f5f1e8] md:text-4xl">
                  {order.orderNumber}
                </h1>

                <p className="mt-2 text-sm text-white/40">
                  Placed {new Date(order.createdAt).toLocaleString("en-BD")}
                </p>
              </div>

              <StatusBadge status={order.status} />
            </div>
          </div>

          {/* Tracking */}
          <div className="p-6 md:p-10">
            <h2 className="mb-8 text-xl font-semibold text-[#f5f1e8]">
              Track Your Order
            </h2>

            <OrderTimeline status={order.status} />
          </div>
        </section>

        {/* Content */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* LEFT */}
          <div className="space-y-8">
            {/* Food */}
            <section className="luxury-glass rounded-3xl p-6 md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-[#d4af37]" />

                <h2 className="text-xl font-semibold text-[#f5f1e8]">
                  Your Items
                </h2>
              </div>

              <div className="space-y-5">
                {order.items.map((item) => (
                  <OrderItem key={item.id} item={item} />
                ))}
              </div>
            </section>

            {/* Delivery */}
            {order.deliveryAddress && (
              <section className="luxury-glass rounded-3xl p-6 md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-[#d4af37]" />

                  <h2 className="text-xl font-semibold text-[#f5f1e8]">
                    Delivery Information
                  </h2>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <InfoItem
                    icon={<User />}
                    label="Name"
                    value={order.deliveryAddress.fullName}
                  />

                  <InfoItem
                    icon={<Phone />}
                    label="Phone"
                    value={order.deliveryAddress.phone}
                  />

                  <InfoItem
                    icon={<Home />}
                    label="City"
                    value={order.deliveryAddress.city}
                  />

                  <InfoItem
                    icon={<MapPin />}
                    label="Area"
                    value={order.deliveryAddress.area || "Not provided"}
                  />

                  <div className="sm:col-span-2">
                    <InfoItem
                      icon={<MapPin />}
                      label="Address"
                      value={order.deliveryAddress.address}
                    />
                  </div>

                  {order.deliveryAddress.instructions && (
                    <div className="sm:col-span-2">
                      <InfoItem
                        icon={<Truck />}
                        label="Delivery Instructions"
                        value={order.deliveryAddress.instructions}
                      />
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT */}
          <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
            {/* Summary */}
            <section className="luxury-glass rounded-3xl p-6">
              <h2 className="mb-6 text-xl font-semibold text-[#f5f1e8]">
                Order Summary
              </h2>

              <div className="space-y-4">
                <SummaryRow
                  label="Subtotal"
                  value={`৳${Number(order.subtotal).toLocaleString()}`}
                />

                <SummaryRow
                  label="Delivery Fee"
                  value={`৳${Number(order.deliveryFee).toLocaleString()}`}
                />

                {Number(order.discount) > 0 && (
                  <SummaryRow
                    label="Discount"
                    value={`-৳${Number(order.discount).toLocaleString()}`}
                  />
                )}

                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white/60">Total</span>

                    <span className="text-2xl font-bold text-[#d4af37]">
                      ৳{Number(order.total).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="luxury-glass rounded-3xl p-6">
              <div className="mb-5 flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-[#d4af37]" />

                <h2 className="text-xl font-semibold text-[#f5f1e8]">
                  Payment
                </h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs text-white/35">Method</p>

                <p className="mt-1 font-medium text-white/80">
                  {order.paymentMethod === "COD"
                    ? "Cash on Delivery"
                    : order.paymentMethod}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-white/35">Status</span>

                  <span className="rounded-full bg-[#d4af37]/10 px-3 py-1 text-xs font-medium text-[#d4af37]">
                    {order.payment?.status || "PENDING"}
                  </span>
                </div>
              </div>
            </section>

            {/* Notes */}
            {order.notes && (
              <section className="luxury-glass rounded-3xl p-6">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#d4af37]">
                  Order Notes
                </h2>

                <p className="text-sm leading-6 text-white/50">{order.notes}</p>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function OrderTimeline({ status }) {
  const currentIndex = statusOrder.indexOf(status);

  if (status === "CANCELLED") {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
        <div className="flex items-center gap-3 text-red-400">
          <XCircle className="h-6 w-6" />

          <div>
            <p className="font-semibold">Order Cancelled</p>

            <p className="mt-1 text-sm text-white/40">
              This order has been cancelled.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[19px] top-5 hidden h-[calc(100%-40px)] w-px bg-white/10 md:block" />

      <div className="space-y-8">
        {steps.map((step, index) => {
          const Icon = step.icon;

          const completed = currentIndex >= index;

          const current = currentIndex === index;

          return (
            <div key={step.key} className="relative flex gap-5">
              <div
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
                  completed
                    ? "border-[#d4af37] bg-[#d4af37] text-black"
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

              <div className="pt-1">
                <h3
                  className={`font-semibold ${
                    completed ? "text-[#f5f1e8]" : "text-white/25"
                  }`}
                >
                  {step.title}
                </h3>

                <p className="mt-1 text-sm text-white/35">{step.description}</p>

                {current && (
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#d4af37]">
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

function OrderItem({ item }) {
  const itemTotal = Number(item.price) * Number(item.quantity);

  return (
    <div className="flex gap-4 border-b border-white/5 pb-5 last:border-0 last:pb-0">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#181818]">
        {item.menuItem.image ? (
          <Image
            src={item.menuItem.image}
            alt={item.menuItem.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-white/20" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-[#f5f1e8]">{item.menuItem.name}</h3>

        <p className="mt-1 line-clamp-2 text-sm text-white/35">
          {item.menuItem.description ||
            "Deliciously prepared by ST Restaurant."}
        </p>

        <div className="mt-3 flex items-center gap-3 text-sm">
          <span className="text-white/40">Qty: {item.quantity}</span>

          <span className="text-[#d4af37]">
            ৳{Number(item.price).toLocaleString()} each
          </span>
        </div>
      </div>

      <div className="text-right">
        <p className="font-semibold text-white/80">
          ৳{itemTotal.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-white/30">
        <span className="text-[#d4af37]">{icon}</span>

        {label}
      </div>

      <p className="text-sm leading-6 text-white/70">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/45">{label}</span>

      <span className="text-white/75">{value}</span>
    </div>
  );
}

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

function OrderLoading() {
  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-28">
      <div className="mx-auto max-w-6xl">
        <div className="h-5 w-36 animate-pulse rounded bg-white/5" />

        <div className="mt-6 h-52 animate-pulse rounded-3xl bg-white/5" />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="h-[500px] animate-pulse rounded-3xl bg-white/5" />

          <div className="h-[400px] animate-pulse rounded-3xl bg-white/5" />
        </div>
      </div>
    </main>
  );
}
