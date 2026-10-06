"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  Home,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ShoppingBag,
  UserRound,
  XCircle,
  Truck,
  UtensilsCrossed,
} from "lucide-react";

const paymentStatusStyles = {
  PAID: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  PENDING: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  FAILED: "border-red-500/20 bg-red-500/10 text-red-400",
  CANCELLED: "border-orange-500/20 bg-orange-500/10 text-orange-400",
};

const orderStatusStyles = {
  PENDING: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  CONFIRMED: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  PREPARING: "border-orange-500/20 bg-orange-500/10 text-orange-400",
  OUT_FOR_DELIVERY: "border-purple-500/20 bg-purple-500/10 text-purple-400",
  DELIVERED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  CANCELLED: "border-red-500/20 bg-red-500/10 text-red-400",
};

function formatCurrency(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatStatus(status) {
  return String(status || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />;
}

function InfoRow({ icon: Icon, label, value, valueClass = "text-white" }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/40">
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wider text-white/30">
          {label}
        </p>

        <p className={`mt-1 break-words text-sm font-medium ${valueClass}`}>
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

export default function PaymentDetailsPage() {
  const params = useParams();

  const paymentId = params?.id;

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadPayment(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to load payment details.");
      }

      setPayment(result?.data || null);
    } catch (error) {
      console.error("PAYMENT DETAILS ERROR:", error);

      setError(error?.message || "Unable to load payment details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (paymentId) {
      loadPayment();
    }
  }, [paymentId]);

  /* --------------------------------
     LOADING
  -------------------------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] text-white">
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <div className="flex gap-3">
            <Skeleton className="h-11 w-24" />
            <Skeleton className="h-11 w-24" />
          </div>

          <div className="mt-8">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-4 h-10 w-72" />
            <Skeleton className="mt-3 h-5 w-96 max-w-full" />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-80 lg:col-span-2" />
            <Skeleton className="h-80" />
          </div>

          <div className="mt-6">
            <Skeleton className="h-72 w-full" />
          </div>
        </main>
      </div>
    );
  }

  /* --------------------------------
     ERROR
  -------------------------------- */

  if (error || !payment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-[#111] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <XCircle size={30} />
          </div>

          <h1 className="mt-6 text-2xl font-bold">Payment Not Found</h1>

          <p className="mt-3 text-sm leading-6 text-white/45">
            {error || "The requested payment could not be found."}
          </p>

          <div className="mt-7 flex justify-center gap-3">
            <Link
              href="/dashboard/payments"
              className="inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#f1d77a]"
            >
              <ArrowLeft size={16} />
              Payments
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <Home size={16} />
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const order = payment.order;
  const customer = order?.user;
  const deliveryAddress = order?.deliveryAddress;

  const paymentStatus = payment.status || "PENDING";
  const orderStatus = order?.status || "PENDING";

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 lg:px-10">
        {/* =================================
            TOP ACTIONS
        ================================= */}

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/20 bg-[#111] px-4 py-2.5 text-sm transition hover:border-[#d4af37]/50 hover:bg-[#d4af37] hover:text-black"
          >
            <Home size={16} />
            Home
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <Link
            href="/dashboard/payments"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <CreditCard size={16} />
            Payments
          </Link>

          <button
            type="button"
            onClick={() => loadPayment(true)}
            disabled={refreshing}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/20 bg-[#111] px-4 py-2.5 text-sm text-[#d4af37] transition hover:border-[#d4af37]/50 hover:bg-[#d4af37] hover:text-black disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* =================================
            HEADER
        ================================= */}

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#d4af37]">
            Payment Management
          </p>

          <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Payment Details
              </h1>

              <p className="mt-2 text-sm text-white/40">
                Review transaction, customer and order payment information.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                  paymentStatusStyles[paymentStatus] ||
                  "border-white/10 bg-white/5 text-white/50"
                }`}
              >
                {formatStatus(paymentStatus)}
              </span>

              <span
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                  orderStatusStyles[orderStatus] ||
                  "border-white/10 bg-white/5 text-white/50"
                }`}
              >
                Order: {formatStatus(orderStatus)}
              </span>
            </div>
          </div>
        </div>

        {/* =================================
            PAYMENT HERO
        ================================= */}

        <section className="mt-8 overflow-hidden rounded-3xl border border-[#d4af37]/20 bg-gradient-to-br from-[#17130a] via-[#111] to-[#0c0c0c]">
          <div className="grid lg:grid-cols-3">
            <div className="p-6 md:p-8 lg:col-span-2">
              <div className="flex items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#d4af37]/10 text-[#d4af37]">
                  <CreditCard size={25} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/35">
                    Transaction
                  </p>

                  <h2 className="mt-2 break-all text-xl font-bold md:text-2xl">
                    {payment.transactionId || "No transaction ID"}
                  </h2>

                  <p className="mt-2 text-sm text-white/35">
                    Payment ID: {payment.id}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-5 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center gap-2 text-white/35">
                    <DollarSign size={16} />
                    <span className="text-xs">Amount</span>
                  </div>

                  <p className="mt-3 text-2xl font-bold text-[#d4af37]">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center gap-2 text-white/35">
                    <CreditCard size={16} />
                    <span className="text-xs">Method</span>
                  </div>

                  <p className="mt-3 text-lg font-bold">
                    {payment.method || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center gap-2 text-white/35">
                    <CalendarDays size={16} />
                    <span className="text-xs">Created</span>
                  </div>

                  <p className="mt-3 text-sm font-semibold">
                    {formatDate(payment.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 bg-white/[0.02] p-6 lg:border-l lg:border-t-0 md:p-8">
              <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">
                Order
              </p>

              <p className="mt-3 text-2xl font-bold">
                {order?.orderNumber || "-"}
              </p>

              <p className="mt-2 text-sm text-white/35">
                Restaurant order reference
              </p>

              <Link
                href={`/orders/${order?.id}`}
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#f1d77a]"
              >
                View Customer Order
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* =================================
            MAIN GRID
        ================================= */}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Customer */}

          <section className="rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <UserRound size={20} />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
                  Customer
                </p>

                <h2 className="mt-1 text-lg font-bold">Customer Information</h2>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <InfoRow
                icon={UserRound}
                label="Name"
                value={customer?.name || "Customer"}
              />

              <InfoRow icon={Mail} label="Email" value={customer?.email} />

              <InfoRow icon={Phone} label="Phone" value={customer?.phone} />

              <InfoRow
                icon={CalendarDays}
                label="Customer Since"
                value={formatDate(customer?.createdAt)}
              />
            </div>
          </section>

          {/* Payment */}

          <section className="rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                <CreditCard size={20} />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
                  Transaction
                </p>

                <h2 className="mt-1 text-lg font-bold">Payment Information</h2>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <InfoRow
                icon={CreditCard}
                label="Payment Method"
                value={payment.method}
              />

              <InfoRow
                icon={CheckCircle2}
                label="Payment Status"
                value={formatStatus(payment.status)}
                valueClass={
                  paymentStatus === "PAID"
                    ? "text-emerald-400"
                    : paymentStatus === "FAILED"
                      ? "text-red-400"
                      : "text-yellow-400"
                }
              />

              <InfoRow
                icon={DollarSign}
                label="Amount"
                value={formatCurrency(payment.amount)}
                valueClass="text-[#d4af37]"
              />

              <InfoRow
                icon={CalendarDays}
                label="Paid At"
                value={
                  payment.paidAt
                    ? formatDateTime(payment.paidAt)
                    : "Not paid yet"
                }
              />
            </div>
          </section>

          {/* Delivery */}

          <section className="rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <MapPin size={20} />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
                  Delivery
                </p>

                <h2 className="mt-1 text-lg font-bold">Delivery Address</h2>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <InfoRow
                icon={UserRound}
                label="Recipient"
                value={deliveryAddress?.fullName}
              />

              <InfoRow
                icon={Phone}
                label="Phone"
                value={deliveryAddress?.phone}
              />

              <InfoRow
                icon={MapPin}
                label="Address"
                value={deliveryAddress?.address}
              />

              <InfoRow
                icon={MapPin}
                label="City / Area"
                value={[
                  deliveryAddress?.area,
                  deliveryAddress?.city,
                  deliveryAddress?.postalCode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />
            </div>
          </section>
        </div>

        {/* =================================
            ORDER ITEMS
        ================================= */}

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#111]">
          <div className="border-b border-white/10 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <ShoppingBag size={20} />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
                  Order Items
                </p>

                <h2 className="mt-1 text-xl font-bold">Purchased Items</h2>
              </div>
            </div>
          </div>

          {order?.items?.length ? (
            <div className="divide-y divide-white/10">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/35">
                      {item.menuItem?.image ? (
                        <img
                          src={item.menuItem.image}
                          alt={item.menuItem?.name || "Menu item"}
                          className="h-full w-full rounded-xl object-cover"
                        />
                      ) : (
                        <UtensilsCrossed size={19} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold">
                        {item.menuItem?.name || "Menu Item"}
                      </p>

                      <p className="mt-1 text-xs text-white/35">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-white/35">Unit Price</p>

                    <p className="mt-1 font-semibold">
                      {formatCurrency(item.price)}
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#d4af37]">
                      {formatCurrency(
                        Number(item.price || 0) * Number(item.quantity || 0),
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-white/35">
              No order items found.
            </div>
          )}
        </section>

        {/* =================================
            FINANCIAL SUMMARY
        ================================= */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Summary */}

          <section className="rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                <DollarSign size={20} />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
                  Financial
                </p>

                <h2 className="mt-1 text-xl font-bold">Order Summary</h2>
              </div>
            </div>

            <div className="mt-7 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Subtotal</span>

                <span>{formatCurrency(order?.subtotal)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-white/40">Delivery Fee</span>

                <span>{formatCurrency(order?.deliveryFee)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-white/40">Discount</span>

                <span className="text-emerald-400">
                  -{formatCurrency(order?.discount)}
                </span>
              </div>

              <div className="border-t border-white/10 pt-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/30">
                      Total Paid / Payable
                    </p>

                    <p className="mt-2 text-3xl font-bold text-[#d4af37]">
                      {formatCurrency(order?.total)}
                    </p>
                  </div>

                  <DollarSign size={28} className="text-[#d4af37]/30" />
                </div>
              </div>
            </div>
          </section>

          {/* Timeline */}

          <section className="rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Clock3 size={20} />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
                  Timeline
                </p>

                <h2 className="mt-1 text-xl font-bold">Payment Activity</h2>
              </div>
            </div>

            <div className="relative mt-7 space-y-7 pl-8">
              <div className="absolute bottom-3 left-[11px] top-3 w-px bg-white/10" />

              {/* Created */}

              <div className="relative">
                <div className="absolute -left-8 top-0 flex h-6 w-6 items-center justify-center rounded-full border border-[#d4af37]/30 bg-[#111] text-[#d4af37]">
                  <Package size={12} />
                </div>

                <p className="text-sm font-semibold">Payment Created</p>

                <p className="mt-1 text-xs text-white/35">
                  {formatDateTime(payment.createdAt)}
                </p>
              </div>

              {/* Paid */}

              <div className="relative">
                <div
                  className={`absolute -left-8 top-0 flex h-6 w-6 items-center justify-center rounded-full border ${
                    paymentStatus === "PAID"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/5 text-white/30"
                  }`}
                >
                  <CheckCircle2 size={12} />
                </div>

                <p className="text-sm font-semibold">Payment Completed</p>

                <p className="mt-1 text-xs text-white/35">
                  {payment.paidAt
                    ? formatDateTime(payment.paidAt)
                    : "Not completed yet"}
                </p>
              </div>

              {/* Order */}

              <div className="relative">
                <div className="absolute -left-8 top-0 flex h-6 w-6 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400">
                  <Truck size={12} />
                </div>

                <p className="text-sm font-semibold">Order Status</p>

                <p className="mt-1 text-xs text-white/35">
                  {formatStatus(orderStatus)}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* =================================
            FOOTER ACTIONS
        ================================= */}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard/payments"
            className="inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#f1d77a]"
          >
            <ArrowLeft size={16} />
            Back to Payments
          </Link>

          <Link
            href={`/orders/${order?.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ShoppingBag size={16} />
            View Order
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <LayoutDashboardIcon />
            Dashboard
          </Link>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} ST Restaurant. Payment Management
            System.
          </p>
        </div>
      </main>
    </div>
  );
}

function LayoutDashboardIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
