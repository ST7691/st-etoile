
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  Phone,
  Mail,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock3,
  XCircle,
  CircleCheck,
  Trash2,
  AlertCircle,
  X,
  UserRound,
} from "lucide-react";

const STATUS_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
];

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-BD", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusClasses(status) {
  switch (status) {
    case "CONFIRMED":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

    case "COMPLETED":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";

    case "CANCELLED":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    default:
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";
  }
}

function getStatusIcon(status) {
  switch (status) {
    case "CONFIRMED":
      return CheckCircle2;

    case "COMPLETED":
      return CircleCheck;

    case "CANCELLED":
      return XCircle;

    default:
      return Clock3;
  }
}

function StatusBadge({ status }) {
  const Icon = getStatusIcon(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
        status,
      )}`}
    >
      <Icon size={13} />
      {status}
    </span>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>

          <h3 className="mt-2 text-2xl font-bold text-white">
            {value}
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            {description}
          </p>
        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3">
          <Icon size={20} className="text-yellow-400" />
        </div>
      </div>
    </div>
  );
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [updatingId, setUpdatingId] = useState(null);

  const [selectedReservation, setSelectedReservation] =
    useState(null);

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReservations = useCallback(async () => {
    try {
      setError("");

      const params = new URLSearchParams();

      if (status !== "ALL") {
        params.set("status", status);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `/api/admin/reservations?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to load reservations.",
        );
      }

      setReservations(data.reservations || []);

      setStats({
        total: data.stats?.total || 0,
        pending: data.stats?.pending || 0,
        confirmed: data.stats?.confirmed || 0,
        completed: data.stats?.completed || 0,
        cancelled: data.stats?.cancelled || 0,
      });
    } catch (err) {
      console.error(
        "ADMIN RESERVATIONS FETCH ERROR:",
        err,
      );

      setError(
        err.message || "Failed to load reservations.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReservations();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchReservations]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReservations();
  };

  const updateStatus = async (reservationId, newStatus) => {
    try {
      setUpdatingId(reservationId);

      const response = await fetch(
        "/api/admin/reservations",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reservationId,
            status: newStatus,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to update reservation.",
        );
      }

      setReservations((current) =>
        current.map((item) =>
          item.id === reservationId
            ? {
                ...item,
                ...data.reservation,
              }
            : item,
        ),
      );

      if (
        selectedReservation?.id === reservationId
      ) {
        setSelectedReservation(data.reservation);
      }

      await fetchReservations();
    } catch (err) {
      console.error(
        "UPDATE RESERVATION ERROR:",
        err,
      );

      alert(
        err.message ||
          "Failed to update reservation.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/admin/reservations?id=${deleteId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to delete reservation.",
        );
      }

      setDeleteId(null);
      setSelectedReservation(null);

      await fetchReservations();
    } catch (err) {
      console.error(
        "DELETE RESERVATION ERROR:",
        err,
      );

      alert(
        err.message ||
          "Failed to delete reservation.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090909] text-white">
      {/* HEADER */}
      <div className="border-b border-white/10 bg-[#0d0d0d]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-2.5">
                <CalendarDays size={22} className="text-yellow-400" />
              </div>

              <div>
                <h1 className="text-xl font-bold sm:text-2xl">Reservations</h1>

                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                  Manage restaurant table reservations
                </p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-300"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-medium">Unable to load reservations</p>

              <p className="mt-1 text-sm text-red-300/80">{error}</p>
            </div>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard
            title="Total"
            value={stats.total}
            icon={CalendarDays}
            description="All reservations"
          />

          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock3}
            description="Waiting confirmation"
          />

          <StatCard
            title="Confirmed"
            value={stats.confirmed}
            icon={CheckCircle2}
            description="Confirmed tables"
          />

          <StatCard
            title="Completed"
            value={stats.completed}
            icon={CircleCheck}
            description="Completed visits"
          />

          <StatCard
            title="Cancelled"
            value={stats.cancelled}
            icon={XCircle}
            description="Cancelled bookings"
          />
        </div>

        {/* FILTERS */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* SEARCH */}
            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email or phone..."
                className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-yellow-500/40 focus:ring-1 focus:ring-yellow-500/20"
              />
            </div>

            {/* STATUS FILTER */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STATUS_FILTERS.map((item) => {
                const active = status === item.value;

                return (
                  <button
                    key={item.value}
                    onClick={() => setStatus(item.value)}
                    className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-medium transition ${
                      active
                        ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                        : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RESERVATIONS */}
        <div className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
                />
              ))}
            </div>
          ) : reservations.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05]">
                <CalendarDays size={24} className="text-gray-500" />
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                No reservations found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Try changing your search or status filter.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px]">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.025]">
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Customer
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Date & Time
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Guests
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Status
                        </th>

                        <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {reservations.map((reservation) => (
                        <tr
                          key={reservation.id}
                          className="border-b border-white/5 transition hover:bg-white/[0.025]"
                        >
                          {/* CUSTOMER */}
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-yellow-500/20 bg-yellow-500/10">
                                {reservation.user?.image ? (
                                  <img
                                    src={reservation.user.image}
                                    alt={reservation.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <UserRound
                                    size={17}
                                    className="text-yellow-400"
                                  />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-medium text-white">
                                  {reservation.name}
                                </p>

                                <p className="mt-1 truncate text-xs text-gray-500">
                                  {reservation.phone}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* DATE */}
                          <td className="px-5 py-5">
                            <p className="font-medium text-gray-200">
                              {formatDate(reservation.date)}
                            </p>

                            <p className="mt-1 text-xs text-yellow-400">
                              {reservation.time}
                            </p>
                          </td>

                          {/* GUESTS */}
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-2 text-gray-300">
                              <Users size={16} className="text-gray-500" />

                              <span>
                                {reservation.guests}{" "}
                                {reservation.guests === 1 ? "Guest" : "Guests"}
                              </span>
                            </div>
                          </td>

                          {/* STATUS */}
                          <td className="px-5 py-5">
                            <select
                              value={reservation.status}
                              onChange={(e) =>
                                updateStatus(reservation.id, e.target.value)
                              }
                              disabled={updatingId === reservation.id}
                              className={`cursor-pointer appearance-none rounded-full border bg-transparent px-3 py-1.5 text-[11px] font-semibold outline-none ${getStatusClasses(
                                reservation.status,
                              )} disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option
                                  key={option}
                                  value={option}
                                  className="bg-[#111] text-white"
                                >
                                  {option}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* ACTION */}
                          <td className="px-5 py-5">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() =>
                                  setSelectedReservation(reservation)
                                }
                                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 transition hover:border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-400"
                              >
                                View
                              </button>

                              <button
                                onClick={() => setDeleteId(reservation.id)}
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MOBILE CARDS */}
              <div className="space-y-4 lg:hidden">
                {reservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    {/* CUSTOMER */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-yellow-500/20 bg-yellow-500/10">
                          {reservation.user?.image ? (
                            <img
                              src={reservation.user.image}
                              alt={reservation.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserRound size={18} className="text-yellow-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">
                            {reservation.name}
                          </p>

                          <p className="truncate text-xs text-gray-500">
                            {reservation.phone}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setDeleteId(reservation.id)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* DETAILS */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-gray-600">
                          Date
                        </p>

                        <p className="mt-1 text-sm text-gray-300">
                          {formatDate(reservation.date)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-gray-600">
                          Time
                        </p>

                        <p className="mt-1 text-sm text-yellow-400">
                          {reservation.time}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-gray-600">
                          Guests
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-300">
                          <Users size={14} className="text-gray-500" />

                          {reservation.guests}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-gray-600">
                          Status
                        </p>

                        <div className="mt-1">
                          <StatusBadge status={reservation.status} />
                        </div>
                      </div>
                    </div>

                    {/* STATUS SELECT */}
                    <div className="mt-4">
                      <label className="mb-2 block text-xs text-gray-500">
                        Change Status
                      </label>

                      <select
                        value={reservation.status}
                        onChange={(e) =>
                          updateStatus(reservation.id, e.target.value)
                        }
                        disabled={updatingId === reservation.id}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-gray-200 outline-none focus:border-yellow-500/40 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option
                            key={option}
                            value={option}
                            className="bg-[#111] text-white"
                          >
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* VIEW */}
                    <button
                      onClick={() => setSelectedReservation(reservation)}
                      className="mt-3 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-gray-300 transition hover:border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-400"
                    >
                      View Reservation
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* DETAILS MODAL */}
      {selectedReservation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setSelectedReservation(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-yellow-500">
                  Reservation Details
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  {selectedReservation.name}
                </h2>
              </div>

              <button
                onClick={() => setSelectedReservation(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* STATUS */}
            <div className="mt-5">
              <StatusBadge status={selectedReservation.status} />
            </div>

            {/* DATE/TIME */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <CalendarDays size={16} />

                  <span className="text-xs">Reservation Date</span>
                </div>

                <p className="mt-2 text-sm text-gray-200">
                  {formatFullDate(selectedReservation.date)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock3 size={16} />

                  <span className="text-xs">Reservation Time</span>
                </div>

                <p className="mt-2 text-sm text-yellow-400">
                  {selectedReservation.time}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Users size={16} />

                  <span className="text-xs">Guests</span>
                </div>

                <p className="mt-2 text-sm text-gray-200">
                  {selectedReservation.guests}{" "}
                  {selectedReservation.guests === 1 ? "Guest" : "Guests"}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Phone size={16} />

                  <span className="text-xs">Phone</span>
                </div>

                <p className="mt-2 break-all text-sm text-gray-200">
                  {selectedReservation.phone}
                </p>
              </div>
            </div>

            {/* EMAIL */}
            {selectedReservation.email && (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Mail size={16} />

                  <span className="text-xs">Email</span>
                </div>

                <p className="mt-2 break-all text-sm text-gray-200">
                  {selectedReservation.email}
                </p>
              </div>
            )}

            {/* SPECIAL NOTE */}
            {selectedReservation.specialNote && (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-gray-500">Special Note</p>

                <p className="mt-2 text-sm leading-6 text-gray-300">
                  {selectedReservation.specialNote}
                </p>
              </div>
            )}

            {/* ACTION */}
            <div className="mt-6">
              <label className="mb-2 block text-xs text-gray-500">
                Update Reservation Status
              </label>

              <select
                value={selectedReservation.status}
                onChange={(e) =>
                  updateStatus(selectedReservation.id, e.target.value)
                }
                disabled={updatingId === selectedReservation.id}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-gray-200 outline-none focus:border-yellow-500/40 disabled:opacity-50"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option
                    key={option}
                    value={option}
                    className="bg-[#111] text-white"
                  >
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* DELETE */}
            <button
              onClick={() => setDeleteId(selectedReservation.id)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/15"
            >
              <Trash2 size={16} />
              Delete Reservation
            </button>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <Trash2 size={21} className="text-red-400" />
            </div>

            <h3 className="mt-4 text-lg font-semibold">Delete reservation?</h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              This reservation will be permanently removed. This action cannot
              be undone.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting && <RefreshCw size={15} className="animate-spin" />}

                {deleting ? "Deleting..." : "Delete Reservation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

