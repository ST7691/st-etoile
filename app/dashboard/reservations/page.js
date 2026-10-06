"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Home,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Users,
  XCircle,
} from "lucide-react";

const STATUS_OPTIONS = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
];

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    className: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
    icon: Clock3,
  },

  CONFIRMED: {
    label: "Confirmed",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    icon: CheckCircle2,
  },

  COMPLETED: {
    label: "Completed",
    className: "border-blue-500/20 bg-blue-500/10 text-blue-400",
    icon: CheckCircle2,
  },

  CANCELLED: {
    label: "Cancelled",
    className: "border-red-500/20 bg-red-500/10 text-red-400",
    icon: XCircle,
  },
};

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-BD", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCreatedAt(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-[#111] p-6">
      <div className="flex justify-between">
        <div>
          <div className="h-5 w-40 rounded bg-white/10" />
          <div className="mt-2 h-3 w-28 rounded bg-white/5" />
        </div>

        <div className="h-7 w-24 rounded-full bg-white/5" />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="h-20 rounded-xl bg-white/5" />
        <div className="h-20 rounded-xl bg-white/5" />
        <div className="h-20 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

export default function AdminReservationsPage() {
  const router = useRouter();

  const { data: session, status: sessionStatus } = useSession();

  const [reservations, setReservations] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [updatingId, setUpdatingId] = useState(null);

  async function loadReservations(refresh = false) {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch("/api/admin/reservations", {
        cache: "no-store",
      });

      const result = await response.json();

      if (response.status === 401) {
        router.push("/login?callbackUrl=/dashboard/reservations");
        return;
      }

      if (response.status === 403) {
        return;
      }

      if (!response.ok) {
        throw new Error(result?.message || "Failed to load reservations.");
      }

      setReservations(result?.data || []);
    } catch (error) {
      console.error("LOAD ADMIN RESERVATIONS ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Unable to Load",
        text: error?.message || "Could not load reservations.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (sessionStatus !== "authenticated") {
      return;
    }

    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "STAFF") {
      return;
    }

    loadReservations();
  }, [sessionStatus, session]);

  const filteredReservations = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return reservations.filter((reservation) => {
      const matchesStatus =
        statusFilter === "ALL" || reservation.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      const customerName = reservation.name || "";

      const customerEmail = reservation.email || reservation.user?.email || "";

      const customerPhone = reservation.phone || reservation.user?.phone || "";

      const reservationId = reservation.id || "";

      const searchableText =
        `${customerName} ${customerEmail} ${customerPhone} ${reservationId} ${reservation.time}`.toLowerCase();

      return searchableText.includes(searchValue);
    });
  }, [reservations, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: reservations.length,

      pending: reservations.filter((item) => item.status === "PENDING").length,

      confirmed: reservations.filter((item) => item.status === "CONFIRMED")
        .length,

      completed: reservations.filter((item) => item.status === "COMPLETED")
        .length,

      cancelled: reservations.filter((item) => item.status === "CANCELLED")
        .length,
    };
  }, [reservations]);

  async function updateStatus(reservationId, nextStatus) {
    const previousReservations = [...reservations];

    setUpdatingId(reservationId);

    setReservations((current) =>
      current.map((reservation) =>
        reservation.id === reservationId
          ? {
              ...reservation,
              status: nextStatus,
            }
          : reservation,
      ),
    );

    try {
      const response = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to update status.");
      }

      if (result?.data) {
        setReservations((current) =>
          current.map((reservation) =>
            reservation.id === reservationId ? result.data : reservation,
          ),
        );
      }

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Status Updated",
        text: `Reservation is now ${nextStatus}.`,
        showConfirmButton: false,
        timer: 2200,
        background: "#111",
        color: "#fff",
      });
    } catch (error) {
      setReservations(previousReservations);

      console.error("UPDATE RESERVATION ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error?.message || "Could not update reservation.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  if (sessionStatus === "loading") {
    return (
      <main className="min-h-screen bg-[#080808] p-6 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 w-64 rounded bg-white/10" />
            <div className="mt-3 h-4 w-96 rounded bg-white/5" />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div key={index} className="h-28 rounded-2xl bg-white/5" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (sessionStatus === "unauthenticated" || !session?.user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111] p-8 text-center">
          <h1 className="text-2xl font-bold">Login Required</h1>

          <p className="mt-3 text-sm text-white/40">
            Please login to access the dashboard.
          </p>

          <Link
            href="/login?callbackUrl=/dashboard/reservations"
            className="mt-6 inline-flex rounded-xl bg-[#d4af37] px-6 py-3 font-semibold text-black"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-[#111] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <XCircle size={28} />
          </div>

          <h1 className="mt-5 text-2xl font-bold">Access Denied</h1>

          <p className="mt-3 text-sm leading-6 text-white/40">
            You don't have permission to access reservation management.
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm"
            >
              <Home size={16} />
              Home
            </Link>

            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-white md:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        {/* ==============================================================
            TOP ACTIONS
        =============================================================== */}

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white/60 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            <Home size={16} />
            Home
          </Link>

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white/60 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 px-4 py-2.5 text-sm text-[#d4af37] transition hover:bg-[#d4af37] hover:text-black"
          >
            Dashboard
          </Link>
        </div>

        {/* ==============================================================
            HEADER
        =============================================================== */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#d4af37]">
              Admin Management
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Reservations
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
              Manage customer table bookings, confirm reservations and track
              completed or cancelled bookings.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadReservations(true)}
            disabled={refreshing}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white/60 transition hover:border-[#d4af37]/30 hover:text-[#d4af37] disabled:opacity-50"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ==============================================================
            STATS
        =============================================================== */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Total" value={stats.total} icon={CalendarDays} />

          <StatCard title="Pending" value={stats.pending} icon={Clock3} />

          <StatCard
            title="Confirmed"
            value={stats.confirmed}
            icon={CheckCircle2}
          />

          <StatCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircle2}
          />

          <StatCard title="Cancelled" value={stats.cancelled} icon={XCircle} />
        </div>

        {/* ==============================================================
            FILTERS
        =============================================================== */}

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#111] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Search */}

            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, phone or reservation ID..."
                className="h-12 w-full rounded-xl border border-white/10 bg-[#080808] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#d4af37]/40"
              />
            </div>

            {/* Status */}

            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                    statusFilter === status
                      ? "bg-[#d4af37] text-black"
                      : "border border-white/10 bg-white/5 text-white/45 hover:text-white"
                  }`}
                >
                  {status === "ALL" ? "All" : status}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ==============================================================
            RESULTS
        =============================================================== */}

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-white/35">
            Showing{" "}
            <span className="font-semibold text-white/70">
              {filteredReservations.length}
            </span>{" "}
            reservation
            {filteredReservations.length === 1 ? "" : "s"}
          </p>

          {search || statusFilter !== "ALL" ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
              className="text-xs text-[#d4af37] hover:underline"
            >
              Clear Filters
            </button>
          ) : null}
        </div>

        {/* ==============================================================
            LOADING
        =============================================================== */}

        {loading ? (
          <div className="mt-5 space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-white/10 bg-[#111] px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-white/30">
              <CalendarDays size={28} />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              No Reservations Found
            </h2>

            <p className="mt-2 text-sm text-white/35">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {filteredReservations.map((reservation) => {
              const config =
                STATUS_CONFIG[reservation.status] || STATUS_CONFIG.PENDING;

              const StatusIcon = config.icon;

              const customerName =
                reservation.name ||
                reservation.user?.name ||
                "Unknown Customer";

              const customerEmail =
                reservation.email || reservation.user?.email || "No email";

              const customerPhone =
                reservation.phone || reservation.user?.phone || "No phone";

              return (
                <article
                  key={reservation.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-[#111] transition hover:border-[#d4af37]/20"
                >
                  {/* Card Top */}

                  <div className="flex flex-col gap-5 border-b border-white/10 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d4af37]/10 text-[#d4af37]">
                        <CalendarDays size={22} />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-lg font-semibold">
                            {customerName}
                          </h2>

                          <span className="text-xs text-white/20">
                            #{reservation.id.slice(-8)}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/35">
                          <span className="inline-flex items-center gap-1.5">
                            <Mail size={13} />
                            {customerEmail}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <Phone size={13} />
                            {customerPhone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${config.className}`}
                    >
                      <StatusIcon size={14} />

                      {config.label}
                    </span>
                  </div>

                  {/* Main Info */}

                  <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
                    <InfoBox
                      icon={CalendarDays}
                      label="Reservation Date"
                      value={formatDate(reservation.date)}
                    />

                    <InfoBox
                      icon={Clock3}
                      label="Time"
                      value={reservation.time}
                    />

                    <InfoBox
                      icon={Users}
                      label="Guests"
                      value={`${reservation.guests} ${
                        reservation.guests === 1 ? "Guest" : "Guests"
                      }`}
                    />
                  </div>

                  {/* Special Note */}

                  {reservation.specialNote && (
                    <div className="mx-5 mb-5 rounded-2xl border border-[#d4af37]/10 bg-[#d4af37]/5 p-4 sm:mx-6">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#d4af37]">
                        Special Request
                      </p>

                      <p className="mt-2 text-sm leading-6 text-white/50">
                        {reservation.specialNote}
                      </p>
                    </div>
                  )}

                  {/* Footer */}

                  <div className="flex flex-col gap-4 border-t border-white/10 bg-white/[0.015] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-white/25">
                        Created
                      </p>

                      <p className="mt-1 text-sm text-white/50">
                        {formatCreatedAt(reservation.createdAt)}
                      </p>
                    </div>

                    {/* Status Controls */}

                    <div className="flex flex-wrap items-center gap-2">
                      {updatingId === reservation.id && (
                        <Loader2
                          size={17}
                          className="animate-spin text-[#d4af37]"
                        />
                      )}

                      {["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map(
                        (status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={updatingId === reservation.id}
                            onClick={() => updateStatus(reservation.id, status)}
                            className={`rounded-xl border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              reservation.status === status
                                ? "border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37]"
                                : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white"
                            }`}
                          >
                            {status}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ==============================================================
            BOTTOM
        =============================================================== */}

        <div className="mt-10 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/20 bg-[#111] px-5 py-3 text-sm font-medium text-[#d4af37] transition hover:bg-[#d4af37] hover:text-black"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

/*
|--------------------------------------------------------------------------
| Stat Card
|--------------------------------------------------------------------------
*/

function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111] p-5 transition hover:border-[#d4af37]/20">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
          <Icon size={19} />
        </div>

        <span className="text-xs uppercase tracking-wider text-white/20">
          ST
        </span>
      </div>

      <p className="mt-5 text-xs uppercase tracking-wider text-white/30">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Info Box
|--------------------------------------------------------------------------
*/

function InfoBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#080808] p-4">
      <div className="flex items-center gap-2 text-[#d4af37]">
        <Icon size={16} />

        <span className="text-[11px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold text-white/80">{value}</p>
    </div>
  );
}
