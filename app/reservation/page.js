"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarCheck,
  Clock3,
  Users,
  Phone,
  Mail,
  User,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  CircleAlert,
  XCircle,
  ClipboardList,
  Home,
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
    icon: CircleAlert,
    className: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  },
  COMPLETED: {
    label: "Completed",
    icon: CalendarCheck,
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
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export default function ReservationPage() {
  const router = useRouter();

  const { data: session, status } = useSession();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: "2",
    specialNote: "",
  });

  const [reservations, setReservations] = useState([]);

  const [loadingReservations, setLoadingReservations] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  // =========================================================
  // SESSION DATA
  // =========================================================

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/reservation")}`);

      return;
    }

    setForm((current) => ({
      ...current,
      name: current.name || session.user.name || "",
      email: current.email || session.user.email || "",
    }));
  }, [session, status, router]);

  // =========================================================
  // LOAD RESERVATIONS
  // =========================================================

  const loadReservations = async () => {
    try {
      setLoadingReservations(true);

      const response = await fetch("/api/reservations", {
        cache: "no-store",
      });

      const result = await response.json();

      if (response.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent("/reservation")}`);

        return;
      }

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to load reservations.");
      }

      setReservations(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.error("Customer reservations error:", error);
    } finally {
      setLoadingReservations(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      loadReservations();
    }
  }, [status]);

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    if (!form.name || !form.phone || !form.date || !form.time || !form.guests) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please complete all required fields.",
        background: "#111111",
        color: "#f5f1e8",
        confirmButtonColor: "#d4af37",
      });

      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (response.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent("/reservation")}`);

        return;
      }

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to create reservation.");
      }

      Swal.fire({
        icon: "success",
        title: "Reservation Submitted",
        text: "Your table reservation has been sent to ST Restaurant. We will confirm it shortly.",
        background: "#111111",
        color: "#f5f1e8",
        confirmButtonColor: "#d4af37",
        confirmButtonText: "View My Reservations",
      }).then(() => {
        loadReservations();

        setForm((current) => ({
          ...current,
          date: "",
          time: "",
          guests: "2",
          specialNote: "",
        }));
      });
    } catch (error) {
      console.error("Create reservation error:", error);

      Swal.fire({
        icon: "error",
        title: "Reservation Failed",
        text: error?.message || "Something went wrong. Please try again.",
        background: "#111111",
        color: "#f5f1e8",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // ACTIVE RESERVATIONS
  // =========================================================

  const activeReservations = useMemo(() => {
    return reservations.filter((item) => item.status !== "CANCELLED");
  }, [reservations]);

  // =========================================================
  // LOADING
  // =========================================================

  if (
    status === "loading" ||
    (status === "authenticated" &&
      loadingReservations &&
      reservations.length === 0)
  ) {
    return <ReservationPageSkeleton />;
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-28 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            TOP NAV / BACK BUTTONS
        ====================================================== */}

        <div className="mb-8 flex flex-wrap items-center gap-3">
          {/* HOME */}

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/70 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            <Home size={16} />
            Home
          </Link>

          {/* BACK */}

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/70 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {/* MY ORDERS */}

          <Link
            href="/orders"
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/70 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            <ClipboardList size={16} />
            My Orders
          </Link>
        </div>

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-10 max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#d4af37]">
            <Sparkles size={14} />
            Fine Dining Experience
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Reserve Your Table
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45 sm:text-base">
            Choose your preferred date, time and number of guests. Our team will
            review your request and confirm your reservation.
          </p>
        </div>

        {/* =====================================================
            MAIN GRID
        ====================================================== */}

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* ===================================================
              FORM
          ==================================================== */}

          <section className="rounded-3xl border border-[#d4af37]/15 bg-[#101010] p-5 shadow-2xl sm:p-8">
            <div className="mb-7">
              <h2 className="text-xl font-semibold">Reservation Details</h2>

              <p className="mt-1 text-sm text-white/35">
                Please provide your booking information.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* NAME + EMAIL */}

              <div className="grid gap-5 sm:grid-cols-2">
                {/* NAME */}

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                    Full Name *
                  </label>

                  <div className="relative">
                    <User
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]/70"
                    />

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className="h-12 w-full rounded-xl border border-white/10 bg-[#080808] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#d4af37]/40"
                      required
                    />
                  </div>
                </div>

                {/* EMAIL */}

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                    Email
                  </label>

                  <div className="relative">
                    <Mail
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]/70"
                    />

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="h-12 w-full rounded-xl border border-white/10 bg-[#080808] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#d4af37]/40"
                    />
                  </div>
                </div>
              </div>

              {/* PHONE */}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Phone Number *
                </label>

                <div className="relative">
                  <Phone
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]/70"
                  />

                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+880 1XXXXXXXXX"
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#080808] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#d4af37]/40"
                    required
                  />
                </div>
              </div>

              {/* DATE + TIME */}

              <div className="grid gap-5 sm:grid-cols-2">
                {/* DATE */}

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                    Date *
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]/70"
                    />

                    <input
                      type="date"
                      name="date"
                      min={getTodayDate()}
                      value={form.date}
                      onChange={handleChange}
                      className="h-12 w-full rounded-xl border border-white/10 bg-[#080808] pl-11 pr-4 text-sm text-white outline-none transition focus:border-[#d4af37]/40"
                      required
                    />
                  </div>
                </div>

                {/* TIME */}

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                    Time *
                  </label>

                  <div className="relative">
                    <Clock3
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]/70"
                    />

                    <select
                      name="time"
                      value={form.time}
                      onChange={handleChange}
                      className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#080808] pl-11 pr-4 text-sm text-white outline-none transition focus:border-[#d4af37]/40"
                      required
                    >
                      <option value="">Select time</option>

                      {TIME_SLOTS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* GUESTS */}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Number of Guests *
                </label>

                <div className="relative">
                  <Users
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]/70"
                  />

                  <select
                    name="guests"
                    value={form.guests}
                    onChange={handleChange}
                    className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#080808] pl-11 pr-4 text-sm text-white outline-none transition focus:border-[#d4af37]/40"
                    required
                  >
                    {Array.from({ length: 12 }, (_, index) => index + 1).map(
                      (number) => (
                        <option key={number} value={number}>
                          {number} {number === 1 ? "Guest" : "Guests"}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              {/* SPECIAL NOTE */}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Special Request
                </label>

                <div className="relative">
                  <FileText
                    size={17}
                    className="absolute left-4 top-4 text-[#d4af37]/70"
                  />

                  <textarea
                    name="specialNote"
                    value={form.specialNote}
                    onChange={handleChange}
                    rows={4}
                    maxLength={500}
                    placeholder="Birthday, anniversary, window seat, dietary request..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#080808] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#d4af37]/40"
                  />
                </div>
              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={submitting}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3.5 text-sm font-bold text-[#080808] transition hover:bg-[#f1d77a] hover:shadow-[0_15px_40px_rgba(212,175,55,0.15)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting Reservation...
                  </>
                ) : (
                  <>
                    <CalendarCheck size={18} />
                    Reserve My Table
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          </section>

          {/* ===================================================
              RESTAURANT INFO
          ==================================================== */}

          <aside className="space-y-5">
            <div className="rounded-3xl border border-[#d4af37]/15 bg-[#101010] p-6 sm:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4af37]/10 text-[#d4af37]">
                <CalendarDays size={22} />
              </div>

              <h2 className="mt-5 text-xl font-semibold">Dining at ST</h2>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Experience premium cuisine, elegant ambience and warm
                hospitality at ST Restaurant.
              </p>

              <div className="mt-6 space-y-4">
                <InfoRow
                  icon={Clock3}
                  title="Opening Hours"
                  value={
                    <>
                      Mon – Thu: 11:00 AM – 10:30 PM
                      <br />
                      Fri – Sun: 11:00 AM – 11:30 PM
                    </>
                  }
                />

                <InfoRow icon={Phone} title="Phone" value="+880 1XXX-XXXXXX" />

                <InfoRow
                  icon={Mail}
                  title="Email"
                  value="hello@strestaurant.com"
                />
              </div>
            </div>

            {/* QUICK LINKS */}

            <div className="rounded-3xl border border-white/10 bg-[#101010] p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
                Quick Access
              </p>

              <div className="mt-4 space-y-2">
                <Link
                  href="/"
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-white/65 transition hover:border-[#d4af37]/20 hover:text-[#d4af37]"
                >
                  <span className="flex items-center gap-3">
                    <Home size={16} />
                    Home
                  </span>

                  <ArrowRight size={15} />
                </Link>

                <Link
                  href="/menu"
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-white/65 transition hover:border-[#d4af37]/20 hover:text-[#d4af37]"
                >
                  <span className="flex items-center gap-3">
                    <Sparkles size={16} />
                    Explore Menu
                  </span>

                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* =====================================================
            MY RESERVATIONS
        ====================================================== */}

        <section className="mt-12">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
                Booking History
              </p>

              <h2 className="mt-2 text-2xl font-bold">My Reservations</h2>
            </div>

            <span className="text-sm text-white/35">
              {activeReservations.length} active booking
              {activeReservations.length !== 1 ? "s" : ""}
            </span>
          </div>

          {reservations.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#101010] p-10 text-center">
              <CalendarDays size={34} className="mx-auto text-white/20" />

              <h3 className="mt-4 text-lg font-semibold">
                No reservations yet
              </h3>

              <p className="mt-2 text-sm text-white/35">
                Your table reservations will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {reservations.map((reservation) => (
                <ReservationHistoryCard
                  key={reservation.id}
                  reservation={reservation}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// =============================================================
// INFO ROW
// =============================================================

function InfoRow({ icon: Icon, title, value }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-[#d4af37]">
        <Icon size={16} />
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-white/30">
          {title}
        </p>

        <div className="mt-1 text-sm leading-6 text-white/65">{value}</div>
      </div>
    </div>
  );
}

// =============================================================
// RESERVATION HISTORY CARD
// =============================================================

function ReservationHistoryCard({ reservation }) {
  const config = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.PENDING;

  const StatusIcon = config.icon;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101010] p-5 transition hover:border-[#d4af37]/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
          <CalendarCheck size={18} />
        </div>

        <div
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider ${config.className}`}
        >
          <StatusIcon size={12} />
          {config.label}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs uppercase tracking-wider text-white/30">
          Reservation Date
        </p>

        <p className="mt-1 text-base font-semibold text-white">
          {formatDate(reservation.date)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/[0.025] p-3">
          <p className="text-[9px] uppercase tracking-wider text-white/25">
            Time
          </p>

          <p className="mt-1 text-sm text-white/70">{reservation.time}</p>
        </div>

        <div className="rounded-xl bg-white/[0.025] p-3">
          <p className="text-[9px] uppercase tracking-wider text-white/25">
            Guests
          </p>

          <p className="mt-1 text-sm text-white/70">{reservation.guests}</p>
        </div>
      </div>

      {reservation.specialNote && (
        <p className="mt-4 line-clamp-2 text-xs leading-5 text-white/35">
          {reservation.specialNote}
        </p>
      )}
    </div>
  );
}

// =============================================================
// PAGE SKELETON
// =============================================================

function ReservationPageSkeleton() {
  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-8 flex gap-3">
          <div className="h-10 w-24 rounded-xl bg-white/5" />
          <div className="h-10 w-24 rounded-xl bg-white/5" />
        </div>

        <div className="mb-10">
          <div className="h-4 w-40 rounded bg-white/5" />
          <div className="mt-4 h-12 w-80 rounded bg-white/10" />
          <div className="mt-3 h-5 w-full max-w-2xl rounded bg-white/5" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="h-[700px] rounded-3xl bg-white/5" />
          <div className="space-y-5">
            <div className="h-[420px] rounded-3xl bg-white/5" />
            <div className="h-40 rounded-3xl bg-white/5" />
          </div>
        </div>
      </div>
    </main>
  );
}
