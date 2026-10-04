"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";
import {
  Search,
  RefreshCw,
  Users,
  ShoppingBag,
  CalendarDays,
  MessageSquare,
  Mail,
  Phone,
  X,
  Eye,
  Loader2,
  ShieldCheck,
  User,
} from "lucide-react";

export default function CustomersPage() {
  const { data: session, status: sessionStatus } = useSession();

  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [detailsLoading, setDetailsLoading] = useState(false);

  const isStaff =
    session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";

  /* =========================================================
     LOAD CUSTOMERS
  ========================================================= */

  async function loadCustomers(refresh = false) {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (roleFilter !== "all") {
        params.set("role", roleFilter);
      }

      const response = await fetch(
        `/api/admin/customers?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load customers");
      }

      setCustomers(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Failed to load customers",
        text: error.message,
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
    if (sessionStatus === "authenticated" && isStaff) {
      loadCustomers();
    }
  }, [sessionStatus, isStaff]);

  /* =========================================================
     SEARCH DEBOUNCE
  ========================================================= */

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !isStaff) {
      return;
    }

    const timer = setTimeout(() => {
      loadCustomers();
    }, 400);

    return () => clearTimeout(timer);
  }, [search, roleFilter]);

  /* =========================================================
     CUSTOMER DETAILS
  ========================================================= */

  async function openCustomer(customer) {
    try {
      setDetailsLoading(true);
      setSelectedCustomer(customer);

      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load customer details");
      }

      setSelectedCustomer(result.data);
    } catch (error) {
      console.error(error);

      setSelectedCustomer(null);

      Swal.fire({
        icon: "error",
        title: "Failed to load details",
        text: error.message,
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeDetails() {
    if (detailsLoading) return;

    setSelectedCustomer(null);
  }

  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(() => {
    const customersOnly = customers.filter((item) => item.role === "CUSTOMER");

    const admins = customers.filter((item) => item.role === "ADMIN");

    const staff = customers.filter((item) => item.role === "STAFF");

    const totalOrders = customers.reduce(
      (sum, customer) => sum + (customer._count?.orders || 0),
      0,
    );

    return {
      customers: customersOnly.length,
      admins: admins.length,
      staff: staff.length,
      orders: totalOrders,
    };
  }, [customers]);

  /* =========================================================
     ACCESS
  ========================================================= */

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-[#d4af37]" />
      </div>
    );
  }

  if (!session || !isStaff) {
    return (
      <main className="min-h-screen bg-[#080808] flex items-center justify-center px-5 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-[#111] p-8 text-center">
          <ShieldCheck size={40} className="mx-auto text-red-400" />

          <h1 className="mt-5 text-2xl font-bold">Access Denied</h1>

          <p className="mt-2 text-sm text-gray-500">
            ADMIN or STAFF permission is required.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#d4af37]">
              <Users size={18} />

              <span className="text-xs font-semibold uppercase tracking-[0.25em]">
                Restaurant Management
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Customers</h1>

            <p className="mt-2 text-sm text-gray-500">
              View customers, orders, reservations and account information.
            </p>
          </div>

          <button
            onClick={() => loadCustomers(true)}
            disabled={refreshing}
            className="flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* STATS */}

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Customers"
            value={stats.customers}
            icon={<Users size={20} />}
          />

          <StatCard
            title="Administrators"
            value={stats.admins}
            icon={<ShieldCheck size={20} />}
          />

          <StatCard
            title="Staff"
            value={stats.staff}
            icon={<User size={20} />}
          />

          <StatCard
            title="Total Orders"
            value={stats.orders}
            icon={<ShoppingBag size={20} />}
          />
        </div>

        {/* FILTER */}

        <div className="mb-6 rounded-2xl border border-white/10 bg-[#111] p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email or phone..."
                className="h-12 w-full rounded-xl border border-white/10 bg-[#080808] pl-11 pr-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#d4af37]/50"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="h-12 rounded-xl border border-white/10 bg-[#080808] px-4 text-sm text-white outline-none focus:border-[#d4af37]/50"
            >
              <option value="all">All Roles</option>
              <option value="CUSTOMER">Customers</option>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </div>

        {/* CUSTOMER LIST */}

        {loading ? (
          <LoadingCards />
        ) : customers.length === 0 ? (
          <EmptyCustomers />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
            {/* DESKTOP TABLE */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-left text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-4">Customer</th>

                    <th className="px-5 py-4">Contact</th>

                    <th className="px-5 py-4">Role</th>

                    <th className="px-5 py-4">Orders</th>

                    <th className="px-5 py-4">Reservations</th>

                    <th className="px-5 py-4">Joined</th>

                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer) => (
                    <CustomerRow
                      key={customer.id}
                      customer={customer}
                      onView={openCustomer}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}

            <div className="grid gap-3 p-3 lg:hidden">
              {customers.map((customer) => (
                <CustomerMobileCard
                  key={customer.id}
                  customer={customer}
                  onView={openCustomer}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DETAILS MODAL */}

      {selectedCustomer && (
        <CustomerDetails
          customer={selectedCustomer}
          loading={detailsLoading}
          onClose={closeDetails}
        />
      )}
    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ title, value, icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>

        <div className="rounded-xl bg-[#d4af37]/10 p-3 text-[#d4af37]">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CUSTOMER ROW
========================================================= */

function CustomerRow({ customer, onView }) {
  return (
    <tr className="border-b border-white/5 transition hover:bg-white/[0.02]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar customer={customer} />

          <div className="min-w-0">
            <p className="truncate font-semibold">
              {customer.name || "Unnamed User"}
            </p>

            <p className="truncate text-xs text-gray-500">{customer.email}</p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="space-y-1 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Mail size={13} />
            {customer.email}
          </div>

          {customer.phone && (
            <div className="flex items-center gap-2">
              <Phone size={13} />
              {customer.phone}
            </div>
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        <RoleBadge role={customer.role} />
      </td>

      <td className="px-5 py-4 text-sm">{customer._count?.orders || 0}</td>

      <td className="px-5 py-4 text-sm">
        {customer._count?.reservations || 0}
      </td>

      <td className="px-5 py-4 text-xs text-gray-500">
        {formatDate(customer.createdAt)}
      </td>

      <td className="px-5 py-4 text-right">
        <button
          onClick={() => onView(customer)}
          className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-[#d4af37]/10 hover:text-[#d4af37]"
        >
          <Eye size={14} />
          View
        </button>
      </td>
    </tr>
  );
}

/* =========================================================
   MOBILE CARD
========================================================= */

function CustomerMobileCard({ customer, onView }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar customer={customer} />

          <div className="min-w-0">
            <h3 className="truncate font-bold">
              {customer.name || "Unnamed User"}
            </h3>

            <p className="truncate text-xs text-gray-500">{customer.email}</p>
          </div>
        </div>

        <RoleBadge role={customer.role} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniStat label="Orders" value={customer._count?.orders || 0} />

        <MiniStat label="Bookings" value={customer._count?.reservations || 0} />

        <MiniStat label="Reviews" value={customer._count?.reviews || 0} />
      </div>

      <button
        onClick={() => onView(customer)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-semibold text-gray-300 hover:bg-[#d4af37]/10 hover:text-[#d4af37]"
      >
        <Eye size={16} />
        View Customer
      </button>
    </div>
  );
}

/* =========================================================
   AVATAR
========================================================= */

function Avatar({ customer }) {
  if (customer.image) {
    return (
      <img
        src={customer.image}
        alt={customer.name || "Customer"}
        className="h-11 w-11 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/10 text-[#d4af37]">
      <User size={19} />
    </div>
  );
}

/* =========================================================
   ROLE
========================================================= */

function RoleBadge({ role }) {
  const config = {
    ADMIN: "bg-red-500/10 text-red-400",
    STAFF: "bg-blue-500/10 text-blue-400",
    CUSTOMER: "bg-green-500/10 text-green-400",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
        config[role] || "bg-white/10 text-gray-400"
      }`}
    >
      {role || "CUSTOMER"}
    </span>
  );
}

/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3 text-center">
      <p className="text-lg font-bold">{value}</p>

      <p className="text-[10px] uppercase tracking-wider text-gray-600">
        {label}
      </p>
    </div>
  );
}

/* =========================================================
   CUSTOMER DETAILS
========================================================= */

function CustomerDetails({ customer, loading, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="my-5 w-full max-w-4xl overflow-hidden rounded-3xl border border-[#d4af37]/20 bg-[#111] shadow-2xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-7">
          <div className="flex items-center gap-4">
            <Avatar customer={customer} />

            <div>
              <h2 className="text-xl font-bold">
                {customer.name || "Unnamed User"}
              </h2>

              <p className="text-sm text-gray-500">{customer.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-white/5 p-2 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 size={35} className="animate-spin text-[#d4af37]" />
          </div>
        ) : (
          <div className="max-h-[75vh] overflow-y-auto p-5 sm:p-7">
            {/* INFO */}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoBox
                icon={<Mail size={17} />}
                label="Email"
                value={customer.email}
              />

              <InfoBox
                icon={<Phone size={17} />}
                label="Phone"
                value={customer.phone || "Not provided"}
              />

              <InfoBox
                icon={<ShoppingBag size={17} />}
                label="Orders"
                value={customer._count?.orders || 0}
              />

              <InfoBox
                icon={<CalendarDays size={17} />}
                label="Reservations"
                value={customer._count?.reservations || 0}
              />
            </div>

            {/* ORDERS */}

            <section className="mt-8">
              <div className="mb-4 flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#d4af37]" />

                <h3 className="font-bold">Recent Orders</h3>
              </div>

              {customer.orders?.length ? (
                <div className="space-y-2">
                  {customer.orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#080808] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold">{order.orderNumber}</p>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-[#d4af37]">
                          ৳{Number(order.total).toLocaleString()}
                        </span>

                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptySmall text="No orders yet." />
              )}
            </section>

            {/* RESERVATIONS */}

            <section className="mt-8">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays size={18} className="text-[#d4af37]" />

                <h3 className="font-bold">Recent Reservations</h3>
              </div>

              {customer.reservations?.length ? (
                <div className="space-y-2">
                  {customer.reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#080808] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold">
                          {reservation.guests} Guests
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(reservation.date)} · {reservation.time}
                        </p>
                      </div>

                      <StatusBadge status={reservation.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptySmall text="No reservations yet." />
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   INFO BOX
========================================================= */

function InfoBox({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#080808] p-4">
      <div className="flex items-center gap-2 text-[#d4af37]">
        {icon}

        <span className="text-xs uppercase tracking-wider text-gray-500">
          {label}
        </span>
      </div>

      <p className="mt-3 break-all text-sm font-semibold">{value}</p>
    </div>
  );
}

/* =========================================================
   STATUS
========================================================= */

function StatusBadge({ status }) {
  const styles = {
    PENDING: "bg-yellow-500/10 text-yellow-400",
    CONFIRMED: "bg-blue-500/10 text-blue-400",
    PREPARING: "bg-orange-500/10 text-orange-400",
    OUT_FOR_DELIVERY: "bg-purple-500/10 text-purple-400",
    DELIVERED: "bg-green-500/10 text-green-400",
    CANCELLED: "bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
        styles[status] || "bg-white/10 text-gray-400"
      }`}
    >
      {String(status || "").replaceAll("_", " ")}
    </span>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingCards() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111] p-5">
      <div className="space-y-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-xl bg-white/5"
          />
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyCustomers() {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#111] px-6 py-16 text-center">
      <Users size={42} className="mx-auto text-gray-600" />

      <h2 className="mt-4 text-xl font-bold">No customers found</h2>

      <p className="mt-2 text-sm text-gray-500">
        Try changing your search or role filter.
      </p>
    </div>
  );
}

/* =========================================================
   EMPTY SMALL
========================================================= */

function EmptySmall({ text }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#080808] p-5 text-center text-sm text-gray-600">
      {text}
    </div>
  );
}

/* =========================================================
   DATE
========================================================= */

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
