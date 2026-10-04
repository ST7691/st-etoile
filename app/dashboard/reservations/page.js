"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import {
  CalendarDays,
  Clock3,
  Users,
  Phone,
  Mail,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  CircleDot,
  ClipboardCheck,
  Loader2,
  User,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import Swal from "sweetalert2";

const STATUS_OPTIONS = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    icon: CircleDot,
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  COMPLETED: {
    label: "Completed",
    icon: ClipboardCheck,
    className: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusConfig(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
}

export default function ReservationsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedReservation, setSelectedReservation] = useState(null);

  // --------------------------------------------------
  // Fetch reservations
  // --------------------------------------------------

  async function fetchReservations() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/reservations", {
        cache: "no-store",
      });

      const result = await response.json();

      if (response.status === 401) {
        router.push("/login?callbackUrl=/dashboard/reservations");
        return;
      }

      if (response.status === 403) {
        setReservations([]);
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load reservations");
      }

      setReservations(result.data || []);
    } catch (error) {
      console.error("RESERVATIONS FETCH ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Failed to load reservations",
        text: error.message || "Something went wrong.",
        background: "#111",
        color: "#f5f1e8",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // Initial load
  // --------------------------------------------------

  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (!session) {
      router.push("/login?callbackUrl=/dashboard/reservations");
      return;
    }

    if (session.user?.role !== "ADMIN" && session.user?.role !== "STAFF") {
      setLoading(false);
      return;
    }

    fetchReservations();
  }, [session, sessionStatus]);

  // --------------------------------------------------
  // Update reservation status
  // --------------------------------------------------

  async function updateReservationStatus(id, newStatus) {
    try {
      setUpdatingId(id);

      const response = await fetch(`/api/admin/reservations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update reservation");
      }

      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === id
            ? {
                ...reservation,
                status: result.data?.status || newStatus,
              }
            : reservation,
        ),
      );

      setSelectedReservation((current) =>
        current?.id === id
          ? {
              ...current,
              status: result.data?.status || newStatus,
            }
          : current,
      );

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Reservation ${newStatus.toLowerCase()}`,
        showConfirmButton: false,
        timer: 1800,
        background: "#111",
        color: "#f5f1e8",
      });
    } catch (error) {
      console.error("UPDATE RESERVATION ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: error.message || "Something went wrong.",
        background: "#111",
        color: "#f5f1e8",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  // --------------------------------------------------
  // Filter reservations
  // --------------------------------------------------

  const filteredReservations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reservations.filter((reservation) => {
      const matchesStatus =
        statusFilter === "ALL" || reservation.status === statusFilter;

      if (!matchesStatus) return false;

      if (!query) return true;

      const searchableText = [
        reservation.name,
        reservation.email,
        reservation.phone,
        reservation.time,
        reservation.specialNote,
        reservation.user?.name,
        reservation.user?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [reservations, search, statusFilter]);

  // --------------------------------------------------
  // Statistics
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (sessionStatus === "loading" || loading) {
    return (
      <main className="min-h-screen bg-[#080808] px-4 py-10 text-[#f5f1e8] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-8">
            <div className="h-10 w-72 rounded-lg bg-white/5" />

            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-2xl border border-white/5 bg-white/[0.03]"
                />
              ))}
            </div>

            <div className="h-20 rounded-2xl border border-white/5 bg-white/[0.03]" />

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-72 rounded-2xl border border-white/5 bg-white/[0.03]"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // Access denied
  // --------------------------------------------------

  if (
    session &&
    session.user?.role !== "ADMIN" &&
    session.user?.role !== "STAFF"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-6 text-[#f5f1e8]">
        <div className="max-w-md rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <XCircle className="mx-auto mb-5 h-14 w-14 text-red-400" />

          <h1 className="text-2xl font-semibold">Access Denied</h1>

          <p className="mt-3 text-sm leading-6 text-white/50">
            You do not have permission to access the reservation management
            system.
          </p>

          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 rounded-xl bg-[#d4af37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#f1d77a]"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f5f1e8] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-[#d4af37]">
              <CalendarDays className="h-4 w-4" />
              <span>Restaurant Management</span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Reservations
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Manage customer table bookings, reservation times, guest counts
              and booking status from one place.
            </p>
          </div>

          <button
            onClick={fetchReservations}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 px-5 py-3 text-sm font-medium text-[#d4af37] transition hover:bg-[#d4af37]/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
  
        </div>

        {/* ================================================= */}
        {/* STATS */}
        {/* ================================================= */}

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total" value={stats.total} icon={CalendarDays} />

          <StatCard
            label="Pending"
            value={stats.pending}
            icon={CircleDot}
            iconClass="text-yellow-400"
          />

          <StatCard
            label="Confirmed"
            value={stats.confirmed}
            icon={CheckCircle2}
            iconClass="text-blue-400"
          />

          <StatCard
            label="Completed"
            value={stats.completed}
            icon={ClipboardCheck}
            iconClass="text-green-400"
          />

          <StatCard
            label="Cancelled"
            value={stats.cancelled}
            icon={XCircle}
            iconClass="text-red-400"
          />
        </div>

        {/* ================================================= */}
        {/* FILTER BAR */}
        {/* ================================================= */}

        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Search */}

            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-black/30 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d4af37]/40"
              />
            </div>

            {/* Status */}

            <div className="relative lg:w-56">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-black/30 px-4 pr-10 text-sm text-white outline-none focus:border-[#d4af37]/40"
              >
                <option value="ALL" className="bg-[#111]">
                  All Status
                </option>

                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status} className="bg-[#111]">
                    {STATUS_CONFIG[status].label}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* RESULTS INFO */}
        {/* ================================================= */}

        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-white/40">
            Showing{" "}
            <span className="text-white">{filteredReservations.length}</span> of{" "}
            <span className="text-white">{reservations.length}</span>{" "}
            reservations
          </p>
        </div>

        {/* ================================================= */}
        {/* EMPTY */}
        {/* ================================================= */}

        {!loading && filteredReservations.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] px-6 py-20 text-center">
            <CalendarDays className="mx-auto h-14 w-14 text-white/15" />

            <h2 className="mt-5 text-xl font-semibold">
              No reservations found
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Try changing your search or status filter.
            </p>
          </div>
        )}

        {/* ================================================= */}
        {/* RESERVATION GRID */}
        {/* ================================================= */}

        {filteredReservations.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredReservations.map((reservation) => {
              const status = getStatusConfig(reservation.status);

              const StatusIcon = status.icon;

              return (
                <article
                  key={reservation.id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/20 hover:bg-white/[0.04]"
                >
                  {/* Card Header */}

                  <div className="border-b border-white/10 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#d4af37]/70">
                          Reservation
                        </p>

                        <h2 className="mt-1 text-lg font-semibold">
                          {reservation.name || "Guest Customer"}
                        </h2>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${status.className}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />

                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Booking Info */}

                  <div className="space-y-4 p-5">
                    <div className="grid grid-cols-2 gap-3">
                      <InfoBox
                        icon={CalendarDays}
                        label="Date"
                        value={formatDate(reservation.date)}
                      />

                      <InfoBox
                        icon={Clock3}
                        label="Time"
                        value={reservation.time || "—"}
                      />
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#d4af37]/10 text-[#d4af37]">
                        <Users className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-xs text-white/35">Guests</p>

                        <p className="mt-0.5 text-sm font-medium">
                          {reservation.guests}{" "}
                          {reservation.guests === 1 ? "Guest" : "Guests"}
                        </p>
                      </div>
                    </div>

                    {/* Contact */}

                    <div className="space-y-2.5">
                      {reservation.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="h-4 w-4 text-[#d4af37]" />

                          <span className="truncate text-white/65">
                            {reservation.phone}
                          </span>
                        </div>
                      )}

                      {reservation.email && (
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="h-4 w-4 text-[#d4af37]" />

                          <span className="truncate text-white/65">
                            {reservation.email}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Note */}

                    {reservation.specialNote && (
                      <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                        <div className="mb-1 flex items-center gap-2 text-xs text-white/35">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Special Note
                        </div>

                        <p className="line-clamp-2 text-sm leading-5 text-white/60">
                          {reservation.specialNote}
                        </p>
                      </div>
                    )}

                    {/* Actions */}

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setSelectedReservation(reservation)}
                        className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        View Details
                      </button>

                      <div className="relative">
                        <select
                          value={reservation.status}
                          disabled={updatingId === reservation.id}
                          onChange={(event) =>
                            updateReservationStatus(
                              reservation.id,
                              event.target.value,
                            )
                          }
                          className="h-full appearance-none rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 px-4 pr-9 text-sm font-medium text-[#d4af37] outline-none transition hover:bg-[#d4af37]/10 disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option
                              key={option}
                              value={option}
                              className="bg-[#111] text-white"
                            >
                              {STATUS_CONFIG[option].label}
                            </option>
                          ))}
                        </select>

                        {updatingId === reservation.id && (
                          <Loader2 className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-[#d4af37]" />
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================= */}
      {/* DETAILS MODAL */}
      {/* ================================================= */}

      {selectedReservation && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedReservation(null)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#d4af37]/20 bg-[#111] shadow-2xl"
          >
            {/* Modal Header */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#111]/95 p-6 backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#d4af37]">
                  Reservation Details
                </p>

                <h2 className="mt-1 text-2xl font-semibold">
                  {selectedReservation.name}
                </h2>
              </div>

              <button
                onClick={() => setSelectedReservation(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:bg-white/5 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}

            <div className="space-y-6 p-6">
              {/* Status */}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div>
                  <p className="text-xs text-white/35">Current Status</p>

                  <p className="mt-1 text-sm font-medium">
                    {getStatusConfig(selectedReservation.status).label}
                  </p>
                </div>

                <div className="flex gap-2">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option}
                      disabled={updatingId === selectedReservation.id}
                      onClick={() =>
                        updateReservationStatus(selectedReservation.id, option)
                      }
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                        selectedReservation.status === option
                          ? "border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37]"
                          : "border-white/10 text-white/45 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {STATUS_CONFIG[option].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest */}

              <section>
                <h3 className="mb-3 text-sm font-semibold text-[#d4af37]">
                  Guest Information
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailItem
                    icon={User}
                    label="Name"
                    value={selectedReservation.name}
                  />

                  <DetailItem
                    icon={Phone}
                    label="Phone"
                    value={selectedReservation.phone}
                  />

                  <DetailItem
                    icon={Mail}
                    label="Email"
                    value={selectedReservation.email || "Not provided"}
                  />

                  <DetailItem
                    icon={Users}
                    label="Guests"
                    value={`${selectedReservation.guests} ${
                      selectedReservation.guests === 1 ? "Guest" : "Guests"
                    }`}
                  />
                </div>
              </section>

              {/* Booking */}

              <section>
                <h3 className="mb-3 text-sm font-semibold text-[#d4af37]">
                  Booking Information
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailItem
                    icon={CalendarDays}
                    label="Reservation Date"
                    value={formatFullDate(selectedReservation.date)}
                  />

                  <DetailItem
                    icon={Clock3}
                    label="Reservation Time"
                    value={selectedReservation.time}
                  />
                </div>
              </section>

              {/* Special Note */}

              {selectedReservation.specialNote && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-[#d4af37]">
                    Special Note
                  </h3>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm leading-6 text-white/60">
                      {selectedReservation.specialNote}
                    </p>
                  </div>
                </section>
              )}

              {/* Created */}

              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-white/30">
                  Reservation created on{" "}
                  {formatFullDate(selectedReservation.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ===================================================== */
/* STAT CARD */
/* ===================================================== */

function StatCard({ label, value, icon: Icon, iconClass = "text-[#d4af37]" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-[#d4af37]/20">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <span className="text-2xl font-semibold">{value}</span>
      </div>

      <p className="mt-4 text-sm text-white/40">{label}</p>
    </div>
  );
}

/* ===================================================== */
/* INFO BOX */
/* ===================================================== */

function InfoBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
      <div className="flex items-center gap-2 text-xs text-white/35">
        <Icon className="h-3.5 w-3.5 text-[#d4af37]" />

        {label}
      </div>

      <p className="mt-1 text-sm font-medium text-white/80">{value}</p>
    </div>
  );
}

/* ===================================================== */
/* DETAIL ITEM */
/* ===================================================== */

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-center gap-2 text-xs text-white/35">
        <Icon className="h-3.5 w-3.5 text-[#d4af37]" />

        {label}
      </div>

      <p className="mt-2 break-words text-sm font-medium text-white/80">
        {value || "—"}
      </p>
    </div>
  );
}
