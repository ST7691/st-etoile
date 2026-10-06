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
  ChevronDown,
  Clock3,
  ClipboardList,
  Home,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react";

const TIME_SLOTS = [
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
  "06:00 PM",
  "06:30 PM",
  "07:00 PM",
  "07:30 PM",
  "08:00 PM",
  "08:30 PM",
  "09:00 PM",
  "09:30 PM",
  "10:00 PM",
  "10:30 PM",
];

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    icon: Clock3,
    className: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  },

  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  },

  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    className: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  },

  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    className: "border-red-500/20 bg-red-500/10 text-red-400",
  },
};

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-BD", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ReservationSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-[#111] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="h-5 w-32 rounded bg-white/10" />
          <div className="mt-3 h-3 w-24 rounded bg-white/5" />
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

export default function ReservationPage() {
  const router = useRouter();

  const { data: session, status: sessionStatus } = useSession();

  const [reservations, setReservations] = useState([]);

  const [loadingReservations, setLoadingReservations] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: "2",
    specialNote: "",
  });

  const [errors, setErrors] = useState({});

  const today = useMemo(() => getTodayDate(), []);

  /*
  |--------------------------------------------------------------------------
  | Auto fill user information
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!session?.user) return;

    setForm((current) => ({
      ...current,

      name: current.name || session.user.name || "",

      email: current.email || session.user.email || "",
    }));
  }, [session]);

  /*
  |--------------------------------------------------------------------------
  | Load reservations
  |--------------------------------------------------------------------------
  */

  async function loadReservations(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoadingReservations(true);
      }

      const response = await fetch("/api/reservations", {
        cache: "no-store",
      });

      const result = await response.json();

      if (response.status === 401) {
        router.push("/login?callbackUrl=/reservation");
        return;
      }

      if (!response.ok) {
        throw new Error(result?.message || "Failed to load reservations.");
      }

      setReservations(result?.data || []);
    } catch (error) {
      console.error("LOAD RESERVATIONS ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Unable to Load",
        text: error?.message || "Could not load your reservations.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setLoadingReservations(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      loadReservations();
    }

    if (sessionStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/reservation");
    }
  }, [sessionStatus]);

  /*
  |--------------------------------------------------------------------------
  | Form change
  |--------------------------------------------------------------------------
  */

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
  }

  /*
  |--------------------------------------------------------------------------
  | Validation
  |--------------------------------------------------------------------------
  */

  function validateForm() {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Phone number is required.";
    }

    if (!form.date) {
      nextErrors.date = "Please select a reservation date.";
    }

    if (!form.time) {
      nextErrors.time = "Please select a reservation time.";
    }

    if (!form.guests) {
      nextErrors.guests = "Please select number of guests.";
    }

    if (form.date && form.date < today) {
      nextErrors.date = "You cannot select a past date.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  /*
  |--------------------------------------------------------------------------
  | Submit reservation
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          date: form.date,
          time: form.time,
          guests: Number(form.guests),
          specialNote: form.specialNote.trim(),
        }),
      });

      const result = await response.json();

      if (response.status === 401) {
        router.push("/login?callbackUrl=/reservation");
        return;
      }

      if (!response.ok) {
        throw new Error(result?.message || "Failed to create reservation.");
      }

      /*
      |--------------------------------------------------------------------------
      | Add newly created reservation immediately
      |--------------------------------------------------------------------------
      */

      if (result?.data) {
        setReservations((current) => [result.data, ...current]);
      } else {
        await loadReservations(true);
      }

      /*
      |--------------------------------------------------------------------------
      | Reset form
      |--------------------------------------------------------------------------
      */

      setForm((current) => ({
        ...current,
        phone: "",
        date: "",
        time: "",
        guests: "2",
        specialNote: "",
      }));

      setErrors({});

      await Swal.fire({
        icon: "success",
        title: "Reservation Submitted",
        text: "Your table reservation has been submitted successfully.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
        confirmButtonText: "Great",
      });
    } catch (error) {
      console.error("CREATE RESERVATION ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Reservation Failed",
        text:
          error?.message ||
          "Something went wrong while creating your reservation.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setSubmitting(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Cancel reservation
  |--------------------------------------------------------------------------
  */

  async function cancelReservation(reservationId) {
    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Cancel Reservation?",
      text: "Are you sure you want to cancel this reservation?",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel",
      cancelButtonText: "Keep Reservation",
      background: "#111",
      color: "#fff",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#333",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Optimistic UI
    |--------------------------------------------------------------------------
    */

    const previousReservations = [...reservations];

    setReservations((current) =>
      current.map((reservation) =>
        reservation.id === reservationId
          ? {
              ...reservation,
              status: "CANCELLED",
            }
          : reservation,
      ),
    );

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "CANCEL",
        }),
      });

      const result = await response.json();

      if (response.status === 401) {
        router.push("/login?callbackUrl=/reservation");
        return;
      }

      if (!response.ok) {
        throw new Error(result?.message || "Failed to cancel reservation.");
      }

      /*
      |--------------------------------------------------------------------------
      | Update with server response
      |--------------------------------------------------------------------------
      */

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
        title: "Reservation Cancelled",
        text: "Your reservation has been cancelled.",
        showConfirmButton: false,
        timer: 2200,
        background: "#111",
        color: "#fff",
      });
    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | Rollback UI
      |--------------------------------------------------------------------------
      */

      setReservations(previousReservations);

      console.error("CANCEL RESERVATION ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Cancellation Failed",
        text: error?.message || "Could not cancel reservation.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (sessionStatus === "loading" || sessionStatus === "unauthenticated") {
    return (
      <main className="min-h-screen bg-[#080808] px-4 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-5 w-32 rounded bg-white/10" />

            <div className="mt-5 h-12 w-72 rounded bg-white/10" />

            <div className="mt-3 h-5 w-full max-w-xl rounded bg-white/5" />
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="h-[650px] rounded-3xl bg-white/5" />

            <div className="h-[500px] rounded-3xl bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Main UI
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-10 text-white md:px-8 lg:py-14">
      <div className="mx-auto max-w-7xl">
        {/* ================================================================
            TOP NAVIGATION
        ================================================================= */}

        <div className="mb-8 flex flex-wrap items-center gap-3">
          {/* Home */}

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/20 bg-[#111] px-4 py-2.5 text-sm font-medium text-white/80 transition hover:border-[#d4af37]/50 hover:bg-[#d4af37] hover:text-black"
          >
            <Home size={16} />
            Home
          </Link>

          {/* Back */}

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {/* My Orders */}

          <Link
            href="/orders"
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/20 bg-[#111] px-4 py-2.5 text-sm font-medium text-[#d4af37] transition hover:bg-[#d4af37] hover:text-black"
          >
            <ClipboardList size={16} />
            My Orders
          </Link>
        </div>

        {/* ================================================================
            PAGE HEADER
        ================================================================= */}

        <section className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#d4af37]">
            ST Restaurant
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Reserve Your Table
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45 sm:text-base">
            Make your dining experience special. Choose your preferred date,
            time and number of guests, and we will take care of the rest.
          </p>
        </section>

        {/* ================================================================
            MAIN GRID
        ================================================================= */}

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          {/* ==============================================================
              RESERVATION FORM
          =============================================================== */}

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#111]">
            {/* Form Header */}

            <div className="border-b border-white/10 p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4af37]/10 text-[#d4af37]">
                  <CalendarDays size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-semibold">Book a Table</h2>

                  <p className="mt-1 text-sm text-white/35">
                    Fill in your reservation details
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}

            <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
              {/* Name + Email */}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className={`h-12 w-full rounded-xl border bg-[#080808] px-4 text-sm text-white outline-none transition placeholder:text-white/20 ${
                      errors.name
                        ? "border-red-500/50"
                        : "border-white/10 focus:border-[#d4af37]/50"
                    }`}
                  />

                  {errors.name && (
                    <p className="mt-2 text-xs text-red-400">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#080808] px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#d4af37]/50"
                  />
                </div>
              </div>

              {/* Phone */}

              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  Phone Number
                </label>

                <div className="relative">
                  <Phone
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]"
                  />

                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="01XXXXXXXXX"
                    className={`h-12 w-full rounded-xl border bg-[#080808] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 ${
                      errors.phone
                        ? "border-red-500/50"
                        : "border-white/10 focus:border-[#d4af37]/50"
                    }`}
                  />
                </div>

                {errors.phone && (
                  <p className="mt-2 text-xs text-red-400">{errors.phone}</p>
                )}
              </div>

              {/* Date + Time */}

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Date */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Reservation Date
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]"
                    />

                    <input
                      type="date"
                      name="date"
                      min={today}
                      value={form.date}
                      onChange={handleChange}
                      className={`h-12 w-full rounded-xl border bg-[#080808] pl-11 pr-4 text-sm text-white outline-none transition ${
                        errors.date
                          ? "border-red-500/50"
                          : "border-white/10 focus:border-[#d4af37]/50"
                      }`}
                    />
                  </div>

                  {errors.date && (
                    <p className="mt-2 text-xs text-red-400">{errors.date}</p>
                  )}
                </div>

                {/* Time */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Preferred Time
                  </label>

                  <div className="relative">
                    <Clock3
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]"
                    />

                    <select
                      name="time"
                      value={form.time}
                      onChange={handleChange}
                      className={`h-12 w-full appearance-none rounded-xl border bg-[#080808] pl-11 pr-10 text-sm text-white outline-none transition ${
                        errors.time
                          ? "border-red-500/50"
                          : "border-white/10 focus:border-[#d4af37]/50"
                      }`}
                    >
                      <option value="">Select time</option>

                      {TIME_SLOTS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30"
                    />
                  </div>

                  {errors.time && (
                    <p className="mt-2 text-xs text-red-400">{errors.time}</p>
                  )}
                </div>
              </div>

              {/* Guests */}

              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  Number of Guests
                </label>

                <div className="relative">
                  <Users
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]"
                  />

                  <select
                    name="guests"
                    value={form.guests}
                    onChange={handleChange}
                    className={`h-12 w-full appearance-none rounded-xl border bg-[#080808] pl-11 pr-10 text-sm text-white outline-none transition ${
                      errors.guests
                        ? "border-red-500/50"
                        : "border-white/10 focus:border-[#d4af37]/50"
                    }`}
                  >
                    {Array.from({ length: 30 }, (_, index) => index + 1).map(
                      (number) => (
                        <option key={number} value={number}>
                          {number} {number === 1 ? "Guest" : "Guests"}
                        </option>
                      ),
                    )}
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30"
                  />
                </div>

                {errors.guests && (
                  <p className="mt-2 text-xs text-red-400">{errors.guests}</p>
                )}
              </div>

              {/* Special Note */}

              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  Special Request{" "}
                  <span className="text-white/25">(Optional)</span>
                </label>

                <textarea
                  name="specialNote"
                  value={form.specialNote}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Birthday, anniversary, window seat, dietary request..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#080808] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-[#d4af37]/50"
                />
              </div>

              {/* Submit */}

              <button
                type="submit"
                disabled={submitting}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-5 font-semibold text-black transition hover:bg-[#f1d77a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Booking Table...
                  </>
                ) : (
                  <>
                    <CalendarDays size={18} />
                    Reserve My Table
                  </>
                )}
              </button>

              <p className="text-center text-xs leading-5 text-white/25">
                Your reservation will be submitted for confirmation by our
                restaurant team.
              </p>
            </form>
          </section>

          {/* ==============================================================
              RESTAURANT INFO
          =============================================================== */}

          <section className="space-y-6">
            {/* Restaurant Card */}

            <div className="overflow-hidden rounded-3xl border border-[#d4af37]/15 bg-gradient-to-br from-[#15130d] to-[#0d0d0d]">
              <div className="p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d4af37]">
                  Fine Dining
                </p>

                <h2 className="mt-3 text-3xl font-bold">ST Restaurant</h2>

                <p className="mt-3 text-sm leading-7 text-white/40">
                  Experience premium dining, carefully crafted cuisine and
                  unforgettable hospitality.
                </p>

                <div className="mt-7 space-y-4">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                      <MapPin size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-medium">Location</p>

                      <p className="mt-1 text-sm text-white/35">
                        Sylhet, Bangladesh
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                      <Phone size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-medium">Phone</p>

                      <p className="mt-1 text-sm text-white/35">
                        +880 1XXX-XXXXXX
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                      <Clock3 size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-medium">Opening Hours</p>

                      <p className="mt-1 text-sm leading-6 text-white/35">
                        Mon - Thu: 11:00 AM - 10:30 PM
                        <br />
                        Fri - Sun: 11:00 AM - 11:30 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}

            <div className="rounded-3xl border border-white/10 bg-[#111] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/30">
                Quick Access
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <Link
                  href="/menu"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-sm text-white/65 transition hover:border-[#d4af37]/30 hover:bg-[#d4af37]/5 hover:text-[#d4af37]"
                >
                  <span>Explore Our Menu</span>

                  <ArrowLeft size={16} className="rotate-180" />
                </Link>

                <Link
                  href="/orders"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-sm text-white/65 transition hover:border-[#d4af37]/30 hover:bg-[#d4af37]/5 hover:text-[#d4af37]"
                >
                  <span>My Orders</span>

                  <ArrowLeft size={16} className="rotate-180" />
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* ================================================================
            MY RESERVATIONS
        ================================================================= */}

        <section className="mt-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d4af37]">
                Your Bookings
              </p>

              <h2 className="mt-2 text-2xl font-bold">My Reservations</h2>

              <p className="mt-2 text-sm text-white/35">
                View and manage your restaurant reservations.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadReservations(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white/60 transition hover:border-[#d4af37]/30 hover:text-[#d4af37] disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* Reservation list */}

          {loadingReservations ? (
            <div className="space-y-4">
              <ReservationSkeleton />
              <ReservationSkeleton />
            </div>
          ) : reservations.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#111] px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d4af37]/10 text-[#d4af37]">
                <CalendarDays size={28} />
              </div>

              <h3 className="mt-5 text-xl font-semibold">
                No Reservations Yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
                You haven't made any table reservations yet. Use the form above
                to book your next dining experience.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {reservations.map((reservation) => {
                const config =
                  STATUS_CONFIG[reservation.status] || STATUS_CONFIG.PENDING;

                const StatusIcon = config.icon;

                const canCancel =
                  reservation.status === "PENDING" ||
                  reservation.status === "CONFIRMED";

                return (
                  <article
                    key={reservation.id}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-[#111] transition hover:border-[#d4af37]/20"
                  >
                    {/* Card Header */}

                    <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-white/25">
                          Reservation
                        </p>

                        <h3 className="mt-1 text-lg font-semibold">
                          ST Restaurant
                        </h3>

                        <p className="mt-1 text-xs text-white/30">
                          Booking #{reservation.id.slice(-8)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${config.className}`}
                      >
                        <StatusIcon size={14} />

                        {config.label}
                      </span>
                    </div>

                    {/* Booking Details */}

                    <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
                      <div className="rounded-2xl border border-white/5 bg-[#080808] p-4">
                        <div className="flex items-center gap-2 text-[#d4af37]">
                          <CalendarDays size={16} />

                          <span className="text-xs uppercase tracking-wider">
                            Date
                          </span>
                        </div>

                        <p className="mt-3 text-sm font-semibold">
                          {formatDate(reservation.date)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/5 bg-[#080808] p-4">
                        <div className="flex items-center gap-2 text-[#d4af37]">
                          <Clock3 size={16} />

                          <span className="text-xs uppercase tracking-wider">
                            Time
                          </span>
                        </div>

                        <p className="mt-3 text-sm font-semibold">
                          {reservation.time}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/5 bg-[#080808] p-4">
                        <div className="flex items-center gap-2 text-[#d4af37]">
                          <Users size={16} />

                          <span className="text-xs uppercase tracking-wider">
                            Guests
                          </span>
                        </div>

                        <p className="mt-3 text-sm font-semibold">
                          {reservation.guests}{" "}
                          {reservation.guests === 1 ? "Guest" : "Guests"}
                        </p>
                      </div>
                    </div>

                    {/* Contact */}

                    <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 sm:px-6 sm:pb-6">
                      <div className="rounded-xl bg-white/[0.025] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-wider text-white/25">
                          Name
                        </p>

                        <p className="mt-1 text-sm text-white/65">
                          {reservation.name || session?.user?.name || "Guest"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/[0.025] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-wider text-white/25">
                          Phone
                        </p>

                        <p className="mt-1 text-sm text-white/65">
                          {reservation.phone || "Not provided"}
                        </p>
                      </div>
                    </div>

                    {/* Special Note */}

                    {reservation.specialNote && (
                      <div className="mx-5 mb-5 rounded-xl border border-[#d4af37]/10 bg-[#d4af37]/5 p-4 sm:mx-6">
                        <p className="text-[11px] uppercase tracking-wider text-[#d4af37]">
                          Special Request
                        </p>

                        <p className="mt-2 text-sm leading-6 text-white/50">
                          {reservation.specialNote}
                        </p>
                      </div>
                    )}

                    {/* Footer */}

                    <div className="flex flex-col gap-4 border-t border-white/10 bg-white/[0.015] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div>
                        <p className="text-xs text-white/25">Booking Status</p>

                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${config.className}`}
                          >
                            <StatusIcon size={13} />

                            {config.label}
                          </span>
                        </div>
                      </div>

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => cancelReservation(reservation.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:border-red-500/40 hover:bg-red-500/10"
                        >
                          <XCircle size={16} />
                          Cancel Reservation
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ================================================================
            BOTTOM HOME CTA
        ================================================================= */}

        <div className="mt-12 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/20 bg-[#111] px-6 py-3 text-sm font-medium text-[#d4af37] transition hover:bg-[#d4af37] hover:text-black"
          >
            <Home size={17} />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
