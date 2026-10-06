"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  CreditCard,
  DollarSign,
  Home,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu as MenuIcon,
  MessageSquare,
  RefreshCw,
  Settings,
  ShoppingBag,
  Tags,
  TrendingUp,
  Truck,
  UserRound,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Menu",
    href: "/dashboard/menu",
    icon: UtensilsCrossed,
  },
  {
    label: "Categories",
    href: "/dashboard/categories",
    icon: Tags,
  },
  {
    label: "Orders",
    href: "/dashboard/orders",
    icon: ClipboardList,
  },
  {
    label: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    label: "Customers",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    label: "Reservations",
    href: "/dashboard/reservations",
    icon: CalendarDays,
  },
  {
    label: "Reviews",
    href: "/dashboard/reviews",
    icon: MessageSquare,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

const quickActions = [
  {
    title: "Manage Menu",
    description: "Create and manage restaurant dishes",
    href: "/dashboard/menu",
    icon: UtensilsCrossed,
  },
  {
    title: "Categories",
    description: "Organize menu categories",
    href: "/dashboard/categories",
    icon: Tags,
  },
  {
    title: "Manage Orders",
    description: "Review and update customer orders",
    href: "/dashboard/orders",
    icon: ClipboardList,
  },
  {
    title: "Payments",
    description: "Monitor payment transactions",
    href: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    title: "Analytics",
    description: "View real revenue performance",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Reservations",
    description: "Manage table reservations",
    href: "/dashboard/reservations",
    icon: CalendarDays,
  },
  {
    title: "Customers",
    description: "View customer information",
    href: "/dashboard/customers",
    icon: Users,
  },
];

const statusConfig = {
  PENDING: {
    label: "Pending",
    className: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  },
  PREPARING: {
    label: "Preparing",
    className: "border-purple-500/20 bg-purple-500/10 text-purple-300",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    className: "border-orange-500/20 bg-orange-500/10 text-orange-300",
  },
  DELIVERED: {
    label: "Delivered",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-red-500/20 bg-red-500/10 text-red-300",
  },
};

function formatMoney(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatus(status) {
  return (
    statusConfig[status] || {
      label: status || "Unknown",
      className: "border-white/10 bg-white/5 text-white/50",
    }
  );
}

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/30 hover:bg-white/[0.055]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-white/35">
            {title}
          </p>

          <h3 className="mt-3 truncate text-2xl font-bold text-white">
            {value}
          </h3>

          <p className="mt-2 text-xs text-white/35">{subtitle}</p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/10 text-[#d4af37]">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="h-7 w-32 rounded bg-white/10" />
          <div className="h-3 w-28 rounded bg-white/10" />
        </div>

        <div className="h-11 w-11 rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

function Sidebar({ mobileOpen, setMobileOpen }) {
  const router = useRouter();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Leave Dashboard?",
      text: "You can return anytime.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Go Home",
      cancelButtonText: "Stay",
      confirmButtonColor: "#d4af37",
      background: "#111111",
      color: "#f5f1e8",
    });

    if (result.isConfirmed) {
      router.push("/");
    }
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/10 bg-[#0b0b0b] transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link
            href="/"
            className="group flex items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4af37] text-black">
              <UtensilsCrossed size={20} />
            </div>

            <div>
              <p className="text-sm font-bold tracking-[0.2em] text-white">
                ST
              </p>

              <p className="text-[10px] uppercase tracking-[0.18em] text-[#d4af37]">
                Restaurant
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
            Management
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                    item.href === "/dashboard"
                      ? "border border-[#d4af37]/20 bg-[#d4af37]/10 text-[#d4af37]"
                      : "text-white/50 hover:bg-white/[0.045] hover:text-white"
                  }`}
                >
                  <Icon size={18} className="shrink-0" />

                  <span className="flex-1">{item.label}</span>

                  <ChevronRight
                    size={15}
                    className="opacity-0 transition group-hover:opacity-100"
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 p-4">
          <Link
            href="/"
            className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            <Home size={18} />
            Visit Website
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/50 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={18} />
            Exit Dashboard
          </button>
        </div>
      </aside>
    </>
  );
}

export default function DashboardPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const loadDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/admin/dashboard", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          throw new Error("Please login to access the dashboard.");
        }

        if (response.status === 403) {
          throw new Error(
            "Access denied. Admin or Staff permission is required.",
          );
        }

        throw new Error(result.message || "Failed to load dashboard.");
      }

      setDashboard(result.data);
    } catch (err) {
      console.error("DASHBOARD LOAD ERROR:", err);

      setError(err?.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = dashboard?.stats;

  const recentOrders = dashboard?.recentOrders || [];

  const revenueSummary = useMemo(() => {
    const total = Number(stats?.totalRevenue || 0);

    const today = Number(stats?.todayRevenue || 0);

    const month = Number(stats?.monthRevenue || 0);

    return {
      total,
      today,
      month,
    };
  }, [stats]);

  if (error && error.toLowerCase().includes("access denied")) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4 text-[#f5f1e8]">
        <div className="w-full max-w-lg rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
            <UserRound size={28} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-white">Access Denied</h1>

          <p className="mt-3 text-sm leading-6 text-white/45">
            Your account does not have permission to access the ST Restaurant
            admin dashboard.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70 transition hover:text-white"
            >
              <Home size={16} />
              Home
            </Link>

            <button
              type="button"
              onClick={() => loadDashboard()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#f1d77a]"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#f5f1e8]">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="min-h-screen lg:pl-[280px]">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080808]/90 backdrop-blur-xl lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/70"
            >
              <MenuIcon size={20} />
            </button>

            <div className="text-center">
              <p className="text-xs font-bold tracking-[0.2em]">
                ST RESTAURANT
              </p>

              <p className="text-[9px] uppercase tracking-[0.2em] text-[#d4af37]">
                Admin
              </p>
            </div>

            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/70"
            >
              <Home size={20} />
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Top Bar */}
          <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#d4af37]">
                <LayoutDashboard size={13} />
                Admin Control Center
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-white/40">
                Manage ST Restaurant operations, customers, orders, payments and
                revenue from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white/60 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
              >
                <Home size={16} />
                Home
              </Link>

              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white/60 transition hover:border-[#d4af37]/30 hover:text-[#d4af37] disabled:opacity-50"
              >
                {refreshing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                Refresh
              </button>
            </div>
          </div>

          {/* Error */}
          {error && !loading && (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-red-200">
                    Dashboard unavailable
                  </p>

                  <p className="mt-1 text-sm text-red-200/50">{error}</p>
                </div>

                <button
                  type="button"
                  onClick={() => loadDashboard()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-200 transition hover:bg-red-500/20"
                >
                  <RefreshCw size={15} />
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({
                length: 8,
              }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Revenue"
                value={formatMoney(revenueSummary.total)}
                subtitle="All successful payments"
                icon={DollarSign}
              />

              <StatCard
                title="Today Revenue"
                value={formatMoney(revenueSummary.today)}
                subtitle="Today's paid revenue"
                icon={TrendingUp}
              />

              <StatCard
                title="This Month"
                value={formatMoney(revenueSummary.month)}
                subtitle="Current month revenue"
                icon={CalendarDays}
              />

              <StatCard
                title="Total Orders"
                value={stats?.totalOrders || 0}
                subtitle="All restaurant orders"
                icon={ShoppingBag}
              />

              <StatCard
                title="Today's Orders"
                value={stats?.todayOrders || 0}
                subtitle="Orders created today"
                icon={ClipboardList}
              />

              <StatCard
                title="Customers"
                value={stats?.totalCustomers || 0}
                subtitle="Registered customers"
                icon={Users}
              />

              <StatCard
                title="Pending Orders"
                value={stats?.pendingOrders || 0}
                subtitle="Waiting for confirmation"
                icon={Loader2}
              />

              <StatCard
                title="Preparing"
                value={stats?.preparingOrders || 0}
                subtitle="Currently being prepared"
                icon={UtensilsCrossed}
              />
            </div>
          )}

          {/* Revenue Analytics */}
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                    <BarChart3 size={19} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Revenue Analytics
                    </h2>

                    <p className="text-xs text-white/35">
                      Real payment performance
                    </p>
                  </div>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/40">
                  Track successful payment revenue, daily performance and
                  long-term business growth using actual PostgreSQL data.
                </p>
              </div>

              <Link
                href="/dashboard/analytics"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#f1d77a]"
              >
                Open Analytics
                <ArrowUpRight size={16} />
              </Link>
            </div>

            {!loading && (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                    Total
                  </p>

                  <p className="mt-2 text-xl font-bold text-[#d4af37]">
                    {formatMoney(revenueSummary.total)}
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    All-time paid revenue
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                    Today
                  </p>

                  <p className="mt-2 text-xl font-bold text-[#d4af37]">
                    {formatMoney(revenueSummary.today)}
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    Today's successful payments
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                    This Month
                  </p>

                  <p className="mt-2 text-xl font-bold text-[#d4af37]">
                    {formatMoney(revenueSummary.month)}
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    Current month's revenue
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className="mt-8">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
                  Quick Access
                </p>

                <h2 className="mt-1 text-xl font-semibold text-white">
                  Management Tools
                </h2>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/30 hover:bg-[#d4af37]/5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                        <Icon size={20} />
                      </div>

                      <ArrowUpRight
                        size={17}
                        className="text-white/20 transition group-hover:text-[#d4af37]"
                      />
                    </div>

                    <h3 className="mt-4 font-semibold text-white">
                      {action.title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-white/35">
                      {action.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Recent Orders */}
          <section className="mt-8">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
                  Order Activity
                </p>

                <h2 className="mt-1 text-xl font-semibold text-white">
                  Recent Orders
                </h2>
              </div>

              <Link
                href="/dashboard/orders"
                className="inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-[#d4af37]"
              >
                View All
                <ArrowUpRight size={15} />
              </Link>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
              {loading ? (
                <div className="space-y-3 p-5">
                  {Array.from({
                    length: 5,
                  }).map((_, index) => (
                    <div
                      key={index}
                      className="h-20 animate-pulse rounded-2xl bg-white/5"
                    />
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/20">
                    <ShoppingBag size={25} />
                  </div>

                  <h3 className="mt-4 font-semibold text-white">
                    No orders yet
                  </h3>

                  <p className="mt-1 text-sm text-white/35">
                    New restaurant orders will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {recentOrders.map((order) => {
                    const status = getStatus(order.status);

                    return (
                      <div
                        key={order.id}
                        className="group flex flex-col gap-4 p-5 transition hover:bg-white/[0.025] lg:flex-row lg:items-center"
                      >
                        {/* Order */}
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d4af37]/15 bg-[#d4af37]/5 text-[#d4af37]">
                            <ShoppingBag size={18} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">
                              {order.orderNumber}
                            </p>

                            <p className="mt-1 truncate text-xs text-white/35">
                              {order.user?.name || "Customer"}
                            </p>

                            <p className="mt-1 truncate text-xs text-white/25">
                              {formatDateTime(order.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Payment */}
                        <div className="min-w-[130px]">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-white/25">
                            Payment
                          </p>

                          <div className="mt-1 flex items-center gap-2">
                            <span
                              className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium ${
                                order.payment?.status === "PAID"
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                  : "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                              }`}
                            >
                              {order.payment?.status || "PENDING"}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-white/30">
                            {order.paymentMethod ||
                              order.payment?.method ||
                              "—"}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="min-w-[150px]">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-white/25">
                            Status
                          </p>

                          <span
                            className={`mt-2 inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        {/* Total */}
                        <div className="min-w-[130px] lg:text-right">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-white/25">
                            Total
                          </p>

                          <p className="mt-1 font-bold text-[#d4af37]">
                            {formatMoney(order.total)}
                          </p>
                        </div>

                        {/* Action */}
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white/50 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
                        >
                          View
                          <ArrowUpRight size={14} />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-10 border-t border-white/10 pt-6">
            <div className="flex flex-col gap-3 text-xs text-white/25 sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} ST Restaurant Admin.</p>

              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard/analytics"
                  className="transition hover:text-[#d4af37]"
                >
                  Analytics
                </Link>

                <Link
                  href="/dashboard/payments"
                  className="transition hover:text-[#d4af37]"
                >
                  Payments
                </Link>

                <Link href="/" className="transition hover:text-[#d4af37]">
                  Website
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
