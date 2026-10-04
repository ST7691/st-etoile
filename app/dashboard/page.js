"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  CalendarDays,
  Star,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Home,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Clock3,
  ChefHat,
  Truck,
  CheckCircle2,
  ArrowUpRight,
  MoreHorizontal,
  LogOut,
  UserRound,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const menuItems = [
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
    label: "Orders",
    href: "/dashboard/orders",
    icon: ShoppingBag,
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
    icon: Star,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

const statusStyles = {
  PENDING: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  CONFIRMED: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  PREPARING: "border-orange-500/20 bg-orange-500/10 text-orange-400",
  OUT_FOR_DELIVERY: "border-purple-500/20 bg-purple-500/10 text-purple-400",
  DELIVERED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  CANCELLED: "border-red-500/20 bg-red-500/10 text-red-400",
};

function formatStatus(status) {
  return String(status || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCurrency(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  async function loadDashboard(isRefresh = false) {
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

      if (!response.ok) {
        throw new Error(result?.message || "Failed to load dashboard.");
      }

      setDashboard(result?.data || null);
    } catch (err) {
      console.error("DASHBOARD ERROR:", err);
      setError(err?.message || "Something went wrong while loading dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      loadDashboard();
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-[#d4af37]/20 border-t-[#d4af37]" />
          <p className="mt-4 text-sm text-white/40">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111] p-8 text-center">
          <h1 className="text-2xl font-bold">Login Required</h1>

          <p className="mt-3 text-sm text-white/50">
            Please login to access the restaurant dashboard.
          </p>

          <Link
            href="/login?callbackUrl=/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-6 py-3 font-semibold text-black transition hover:bg-[#f1d77a]"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  const role = session.user.role;

  if (role !== "ADMIN" && role !== "STAFF") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-[#111] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <Settings size={28} />
          </div>

          <h1 className="mt-6 text-2xl font-bold">Access Denied</h1>

          <p className="mt-3 text-sm leading-6 text-white/50">
            You do not have permission to access the restaurant management
            dashboard.
          </p>

          <div className="mt-7 flex justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black"
            >
              <Home size={16} />
              Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = dashboard?.stats || {};
  const recentOrders = dashboard?.recentOrders || [];

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      change: "+12.5%",
      icon: DollarSign,
      iconBg: "bg-[#d4af37]/10",
      iconColor: "text-[#d4af37]",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders || 0,
      change: "+8.2%",
      icon: ShoppingBag,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
    },
    {
      title: "Today's Orders",
      value: stats.todayOrders || 0,
      change: "+5.4%",
      icon: TrendingUp,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
    },
    {
      title: "Customers",
      value: stats.totalCustomers || 0,
      change: "+4.8%",
      icon: Users,
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-[#0d0d0d] transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
            <Link
              href="/"
              className="flex items-center gap-3"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4af37] text-black">
                <UtensilsCrossed size={22} />
              </div>

              <div>
                <p className="text-lg font-bold tracking-wide">ST</p>

                <p className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37]">
                  Restaurant
                </p>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-white/50 hover:bg-white/5 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30">
              Management
            </p>

            <nav className="space-y-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = item.href === "/dashboard";

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                      active
                        ? "bg-[#d4af37] font-semibold text-black"
                        : "text-white/55 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={
                        active
                          ? "text-black"
                          : "text-white/40 group-hover:text-[#d4af37]"
                      }
                    />

                    <span>{item.label}</span>

                    {active && <ChevronRight size={15} className="ml-auto" />}
                  </Link>
                );
              })}
            </nav>

            <div className="my-7 h-px bg-white/10" />

            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30">
              Quick Access
            </p>

            <Link
              href="/"
              className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/55 transition hover:bg-white/5 hover:text-white"
            >
              <Home
                size={18}
                className="text-white/40 group-hover:text-[#d4af37]"
              />

              <span>Visit Website</span>

              <ArrowUpRight size={15} className="ml-auto text-white/30" />
            </Link>
          </div>

          {/* User */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4af37]/10 text-[#d4af37]">
                <UserRound size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {session.user.name || "Admin"}
                </p>

                <p className="truncate text-xs text-white/35">{role}</p>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg p-2 text-white/35 transition hover:bg-red-500/10 hover:text-red-400"
                title="Logout"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-72">
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080808]/90 backdrop-blur-xl">
          <div className="flex h-20 items-center gap-4 px-4 md:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="hidden items-center gap-2 text-sm text-white/35 md:flex">
              <span>ST Restaurant</span>
              <ChevronRight size={14} />
              <span className="text-white/70">Dashboard</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Search */}
              <button className="hidden rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/40 transition hover:border-[#d4af37]/30 hover:text-[#d4af37] sm:block">
                <Search size={18} />
              </button>

              {/* Notification */}
              <button className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/40 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]">
                <Bell size={18} />

                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#d4af37]" />
              </button>

              {/* Profile */}
              <div className="hidden items-center gap-3 border-l border-white/10 pl-4 md:flex">
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {session.user.name || "Admin"}
                  </p>

                  <p className="text-xs text-white/35">{role}</p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 text-[#d4af37]">
                  <UserRound size={17} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 py-8 md:px-8 lg:px-10">
          {/* Home + Back */}
          <div className="mb-7 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/20 bg-[#111] px-4 py-2.5 text-sm text-white transition hover:border-[#d4af37]/50 hover:bg-[#d4af37] hover:text-black"
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

            <button
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="ml-auto inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/20 bg-[#111] px-4 py-2.5 text-sm text-[#d4af37] transition hover:border-[#d4af37]/50 hover:bg-[#d4af37] hover:text-black disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* Page Heading */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#d4af37]">
              Restaurant Management
            </p>

            <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Dashboard Overview
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
                  Monitor restaurant performance, orders, customers and daily
                  operations from one premium workspace.
                </p>
              </div>

              <div className="rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 px-4 py-3">
                <p className="text-xs text-white/35">Welcome back</p>

                <p className="mt-1 text-sm font-semibold text-[#d4af37]">
                  {session.user.name || "Administrator"}
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Stats */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {loading
              ? [1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-[#111] p-5"
                  >
                    <Skeleton className="h-11 w-11" />
                    <Skeleton className="mt-6 h-8 w-28" />
                    <Skeleton className="mt-3 h-3 w-24" />
                  </div>
                ))
              : statCards.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.title}
                      className="group rounded-2xl border border-white/10 bg-[#111] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/25 hover:shadow-[0_15px_50px_rgba(0,0,0,.3)]"
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg} ${stat.iconColor}`}
                        >
                          <Icon size={20} />
                        </div>

                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-400">
                          <TrendingUp size={12} />
                          {stat.change}
                        </span>
                      </div>

                      <p className="mt-6 text-2xl font-bold">{stat.value}</p>

                      <p className="mt-1 text-xs uppercase tracking-wider text-white/35">
                        {stat.title}
                      </p>
                    </div>
                  );
                })}
          </section>

          {/* Main Grid */}
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            {/* Revenue / Performance */}
            <section className="rounded-2xl border border-white/10 bg-[#111] p-6 xl:col-span-2">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">
                    Performance
                  </p>

                  <h2 className="mt-2 text-xl font-bold">
                    Restaurant Overview
                  </h2>
                </div>

                <button className="inline-flex items-center gap-2 self-start rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 hover:text-white">
                  This Month
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Fake premium visual chart based on real revenue */}
              <div className="mt-8">
                <div className="flex h-64 items-end gap-2 sm:gap-4">
                  {[35, 48, 42, 65, 52, 78, 61, 86, 72, 91, 80, 96].map(
                    (height, index) => (
                      <div
                        key={index}
                        className="group relative flex h-full flex-1 items-end"
                      >
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-[#d4af37]/20 to-[#d4af37]/80 transition-all duration-500 group-hover:from-[#d4af37]/40 group-hover:to-[#f1d77a]"
                          style={{
                            height: `${height}%`,
                          }}
                        />

                        <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 text-[10px] text-white/50 group-hover:block">
                          {index + 1}
                        </span>
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-4 flex justify-between text-[10px] text-white/25">
                  <span>Week 1</span>
                  <span>Week 2</span>
                  <span>Week 3</span>
                  <span>Week 4</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
                <div>
                  <p className="text-xs text-white/35">Revenue</p>

                  <p className="mt-1 font-semibold text-[#d4af37]">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-white/35">Orders</p>

                  <p className="mt-1 font-semibold">{stats.totalOrders || 0}</p>
                </div>

                <div>
                  <p className="text-xs text-white/35">Avg. Order</p>

                  <p className="mt-1 font-semibold">
                    {formatCurrency(
                      stats.totalOrders
                        ? stats.totalRevenue / stats.totalOrders
                        : 0,
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* Order Summary */}
            <section className="rounded-2xl border border-white/10 bg-[#111] p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">
                  Live Operations
                </p>

                <h2 className="mt-2 text-xl font-bold">Order Summary</h2>
              </div>

              <div className="mt-7 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400">
                    <Clock3 size={20} />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium">Pending</p>

                    <p className="mt-1 text-xs text-white/35">
                      Waiting for confirmation
                    </p>
                  </div>

                  <span className="text-xl font-bold">
                    {stats.pendingOrders || 0}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                    <ChefHat size={20} />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium">Preparing</p>

                    <p className="mt-1 text-xs text-white/35">
                      Kitchen is preparing
                    </p>
                  </div>

                  <span className="text-xl font-bold">
                    {stats.preparingOrders || 0}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                    <Truck size={20} />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium">Delivery</p>

                    <p className="mt-1 text-xs text-white/35">
                      Out for delivery
                    </p>
                  </div>

                  <span className="text-xl font-bold">
                    {
                      recentOrders.filter(
                        (order) => order.status === "OUT_FOR_DELIVERY",
                      ).length
                    }
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 size={20} />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium">Delivered</p>

                    <p className="mt-1 text-xs text-white/35">
                      Successfully completed
                    </p>
                  </div>

                  <span className="text-xl font-bold">
                    {
                      recentOrders.filter(
                        (order) => order.status === "DELIVERED",
                      ).length
                    }
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Recent Orders */}
          <section className="mt-6 rounded-2xl border border-white/10 bg-[#111]">
            <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">
                  Latest Activity
                </p>

                <h2 className="mt-2 text-xl font-bold">Recent Orders</h2>
              </div>

              <Link
                href="/dashboard/orders"
                className="inline-flex items-center gap-2 self-start rounded-xl border border-[#d4af37]/20 px-4 py-2 text-sm text-[#d4af37] transition hover:bg-[#d4af37] hover:text-black"
              >
                View All
                <ArrowUpRight size={15} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-16 w-full" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-10 text-center">
                <ShoppingBag size={35} className="mx-auto text-white/20" />

                <p className="mt-4 text-sm text-white/40">
                  No recent orders found.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex flex-col gap-4 p-5 transition hover:bg-white/[0.025] md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                        <ShoppingBag size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold">{order.orderNumber}</p>

                        <p className="mt-1 truncate text-xs text-white/35">
                          {order.user?.name || order.user?.email || "Customer"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="hidden text-right sm:block">
                        <p className="text-xs text-white/35">Date</p>

                        <p className="mt-1 text-sm">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                          statusStyles[order.status] ||
                          "border-white/10 bg-white/5 text-white/50"
                        }`}
                      >
                        {formatStatus(order.status)}
                      </span>

                      <p className="min-w-[80px] text-right font-semibold text-[#d4af37]">
                        {formatCurrency(order.total)}
                      </p>

                      <MoreHorizontal size={18} className="text-white/25" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className="mt-6">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">
                Shortcuts
              </p>

              <h2 className="mt-2 text-xl font-bold">Quick Actions</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/dashboard/menu"
                className="group rounded-2xl border border-white/10 bg-[#111] p-5 transition hover:-translate-y-1 hover:border-[#d4af37]/30"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                  <UtensilsCrossed size={20} />
                </div>

                <h3 className="mt-5 font-semibold">Manage Menu</h3>

                <p className="mt-1 text-xs text-white/35">
                  Add, edit and manage food items
                </p>

                <ArrowUpRight
                  size={17}
                  className="mt-4 text-white/20 transition group-hover:text-[#d4af37]"
                />
              </Link>

              <Link
                href="/dashboard/orders"
                className="group rounded-2xl border border-white/10 bg-[#111] p-5 transition hover:-translate-y-1 hover:border-[#d4af37]/30"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <ShoppingBag size={20} />
                </div>

                <h3 className="mt-5 font-semibold">Manage Orders</h3>

                <p className="mt-1 text-xs text-white/35">
                  Track and update customer orders
                </p>

                <ArrowUpRight
                  size={17}
                  className="mt-4 text-white/20 transition group-hover:text-[#d4af37]"
                />
              </Link>

              <Link
                href="/dashboard/reservations"
                className="group rounded-2xl border border-white/10 bg-[#111] p-5 transition hover:-translate-y-1 hover:border-[#d4af37]/30"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                  <CalendarDays size={20} />
                </div>

                <h3 className="mt-5 font-semibold">Reservations</h3>

                <p className="mt-1 text-xs text-white/35">
                  Manage table reservations
                </p>

                <ArrowUpRight
                  size={17}
                  className="mt-4 text-white/20 transition group-hover:text-[#d4af37]"
                />
              </Link>

              <Link
                href="/dashboard/customers"
                className="group rounded-2xl border border-white/10 bg-[#111] p-5 transition hover:-translate-y-1 hover:border-[#d4af37]/30"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Users size={20} />
                </div>

                <h3 className="mt-5 font-semibold">Customers</h3>

                <p className="mt-1 text-xs text-white/35">
                  View restaurant customers
                </p>

                <ArrowUpRight
                  size={17}
                  className="mt-4 text-white/20 transition group-hover:text-[#d4af37]"
                />
              </Link>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-10 border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-white/25">
              © {new Date().getFullYear()} ST Restaurant. Admin Management
              System.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
