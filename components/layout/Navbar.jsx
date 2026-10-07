"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import CustomerNotificationBell from "@/components/layout/CustomerNotificationBell";

import {
  ShoppingBag,
  Menu,
  X,
  Utensils,
  User,
  LogIn,
  UserPlus,
  LogOut,
  ClipboardList,
  CalendarDays,
  LayoutDashboard,
  ChevronDown,
  Sparkles,
  CalendarCheck,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const { data: session, status } = useSession();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // =========================================================
  // NAVIGATION LINKS
  // =========================================================

  const navLinks = [
    {
      name: "Home",
      href: "/",
    },
    {
      name: "Menu",
      href: "/menu",
    },
    {
      name: "About",
      href: "/about",
    },
    {
      name: "Gallery",
      href: "/gallery",
    },
    {
      name: "Reviews",
      href: "/reviews",
    },
    {
      name: "Contact",
      href: "/contact",
    },
  ];

  // =========================================================
  // ACTIVE ROUTE
  // =========================================================

  const isActive = (href) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  // =========================================================
  // SCROLL EFFECT
  // =========================================================

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // =========================================================
  // CLOSE MENUS WHEN ROUTE CHANGES
  // =========================================================

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // =========================================================
  // LOAD CART COUNT
  // =========================================================

  const loadCartCount = async () => {
    try {
      const response = await fetch("/api/cart", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (!response.ok) {
        setCartCount(0);
        return;
      }

      const result = await response.json();

      setCartCount(result?.data?.itemCount || 0);
    } catch (error) {
      console.error("Failed to load cart count:", error);
      setCartCount(0);
    }
  };

  // =========================================================
  // LOAD CART AFTER AUTH
  // =========================================================

  useEffect(() => {
    if (status === "loading") return;

    if (session?.user) {
      loadCartCount();
    } else {
      setCartCount(0);
    }
  }, [status, session]);

  // =========================================================
  // CART UPDATED EVENT
  // =========================================================

  useEffect(() => {
    const handleCartUpdated = (event) => {
      const newCount = event?.detail?.itemCount;

      if (typeof newCount === "number") {
        setCartCount(newCount);
      } else {
        loadCartCount();
      }
    };

    window.addEventListener("cart-updated", handleCartUpdated);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, []);

  // =========================================================
  // REFRESH CART WHEN TAB GETS FOCUS
  // =========================================================

  useEffect(() => {
    const handleFocus = () => {
      if (status !== "loading" && session?.user) {
        loadCartCount();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [status, session]);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    try {
      setUserMenuOpen(false);
      setMobileOpen(false);
      setCartCount(0);

      await signOut({
        redirect: false,
      });

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // =========================================================
  // TOGGLE USER MENU
  // =========================================================

  const toggleUserMenu = () => {
    setUserMenuOpen((prev) => !prev);
  };

  // =========================================================
  // TOGGLE MOBILE MENU
  // =========================================================

  const toggleMobileMenu = () => {
    setMobileOpen((prev) => !prev);
  };

  const isAdminOrStaff = ["ADMIN", "STAFF"].includes(session?.user?.role);

  return (
    <header
      className={`fixed left-0 top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? "border-b border-[#d4af37]/20 bg-[#080808]/95 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          : "bg-gradient-to-b from-black/70 to-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* =====================================================
              LOGO
          ====================================================== */}

          <Link
            href="/"
            className="group flex items-center gap-3"
            aria-label="ST Restaurant Home"
          >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#d4af37]/50 bg-[#111]/90 transition-all duration-300 group-hover:border-[#d4af37] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.2)]">
              <Utensils
                size={20}
                className="text-[#d4af37] transition-transform duration-300 group-hover:rotate-[-8deg]"
              />

              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#d4af37]" />
            </div>

            <div className="hidden sm:block">
              <h1 className="font-serif text-xl font-bold tracking-[0.18em] text-white">
                ST
              </h1>

              <p className="text-[9px] uppercase tracking-[0.28em] text-[#d4af37]">
                Restaurant
              </p>
            </div>
          </Link>

          {/* =====================================================
              DESKTOP NAVIGATION
          ====================================================== */}

          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative py-2 text-sm font-medium transition-colors duration-300 ${
                  isActive(link.href)
                    ? "text-[#d4af37]"
                    : "text-white/75 hover:text-[#d4af37]"
                }`}
              >
                {link.name}

                <span
                  className={`absolute bottom-0 left-0 h-[1px] bg-[#d4af37] transition-all duration-300 ${
                    isActive(link.href) ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            ))}
          </nav>

          {/* =====================================================
              RIGHT ACTIONS
          ====================================================== */}

          <div className="flex items-center gap-2 sm:gap-3">
            {/* ===================================================
                CART
            ==================================================== */}

            <Link
              href="/cart"
              className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] transition-all duration-300 hover:border-[#d4af37]/40 hover:bg-[#d4af37]/10"
              aria-label="Shopping Cart"
            >
              <ShoppingBag
                size={19}
                className="text-white/80 transition-colors group-hover:text-[#d4af37]"
              />

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d4af37] px-1 text-[10px] font-bold text-[#080808] shadow-lg">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* ===================================================
                CUSTOMER NOTIFICATION BELL
                ONLY LOGGED-IN USERS
            ==================================================== */}

            {status !== "loading" && session?.user && (
              <CustomerNotificationBell />
            )}

            {/* ===================================================
                AUTH AREA
            ==================================================== */}

            {status === "loading" ? (
              <div className="hidden h-10 w-24 animate-pulse rounded-full bg-white/10 sm:block" />
            ) : session?.user ? (
              /* =================================================
                 LOGGED IN USER
              ================================================== */

              <div className="relative hidden sm:block">
                {/* USER BUTTON */}

                <button
                  type="button"
                  onClick={toggleUserMenu}
                  className="flex items-center gap-2 rounded-full border border-[#d4af37]/20 bg-white/[0.04] px-3 py-2 transition-all duration-300 hover:border-[#d4af37]/50 hover:bg-[#d4af37]/10"
                  aria-expanded={userMenuOpen}
                  aria-label="Open user menu"
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d4af37] text-[#080808]">
                      <User size={15} />
                    </span>
                  )}

                  <span className="max-w-[90px] truncate text-xs font-medium text-white">
                    {session.user.name || "Account"}
                  </span>

                  <ChevronDown
                    size={14}
                    className={`text-[#d4af37] transition-transform duration-300 ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* =================================================
                    USER DROPDOWN
                ================================================== */}

                {userMenuOpen && (
                  <div className="absolute right-0 top-14 w-72 overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#111]/95 p-2 shadow-2xl backdrop-blur-xl">
                    {/* USER INFORMATION */}

                    <div className="mb-2 border-b border-white/10 px-3 py-3">
                      <div className="flex items-center gap-3">
                        {session.user.image ? (
                          <img
                            src={session.user.image}
                            alt={session.user.name || "User"}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4af37] text-[#080808]">
                            <User size={18} />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {session.user.name || "ST Customer"}
                          </p>

                          <p className="mt-1 truncate text-xs text-white/50">
                            {session.user.email}
                          </p>
                        </div>
                      </div>

                      {session.user.role && (
                        <span className="mt-3 inline-block rounded-full border border-[#d4af37]/20 px-2 py-1 text-[9px] uppercase tracking-wider text-[#d4af37]">
                          {session.user.role}
                        </span>
                      )}
                    </div>

                    {/* =================================================
                        NOTIFICATIONS
                    ================================================== */}

                    <Link
                      href="/notifications"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-3 text-sm text-white/75 transition-all duration-300 hover:bg-white/5 hover:text-[#d4af37]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5">
                          🔔
                        </span>

                        <span>Notifications</span>
                      </div>

                      <span className="text-xs text-[#d4af37]">View</span>
                    </Link>

                    {/* =================================================
                        MY ORDERS
                    ================================================== */}

                    <Link
                      href="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/75 transition-all duration-300 hover:bg-white/5 hover:text-[#d4af37]"
                    >
                      <ClipboardList size={17} />
                      <span>My Orders</span>
                    </Link>

                    {/* =================================================
                        MY RESERVATIONS
                    ================================================== */}

                    <Link
                      href="/reservation"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/75 transition-all duration-300 hover:bg-white/5 hover:text-[#d4af37]"
                    >
                      <CalendarDays size={17} />
                      <span>My Reservations</span>
                    </Link>

                    {/* =================================================
                        ADMIN / STAFF DASHBOARD
                    ================================================== */}

                    {isAdminOrStaff && (
                      <>
                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/75 transition-all duration-300 hover:bg-white/5 hover:text-[#d4af37]"
                        >
                          <LayoutDashboard size={17} />
                          <span>Dashboard</span>
                        </Link>

                        <Link
                          href="/dashboard/reservations"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/75 transition-all duration-300 hover:bg-white/5 hover:text-[#d4af37]"
                        >
                          <CalendarCheck size={17} />
                          <span>Manage Reservations</span>
                        </Link>
                      </>
                    )}

                    {/* =================================================
                        LOGOUT
                    ================================================== */}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center gap-3 rounded-xl border-t border-white/10 px-3 py-3 text-left text-sm text-red-400 transition-all duration-300 hover:bg-red-500/10"
                    >
                      <LogOut size={17} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* =================================================
                 GUEST USER
              ================================================== */

              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/80 transition hover:text-[#d4af37]"
                >
                  <LogIn size={16} />
                  Login
                </Link>

                <Link
                  href="/register"
                  className="flex items-center gap-2 rounded-full bg-[#d4af37] px-4 py-2 text-sm font-semibold text-[#080808] transition hover:bg-[#f1d77a] hover:shadow-[0_10px_30px_rgba(212,175,55,0.18)]"
                >
                  <UserPlus size={16} />
                  Register
                </Link>
              </div>
            )}

            {/* =====================================================
                RESERVE
            ====================================================== */}

            <Link
              href="/reservation"
              className="hidden items-center gap-2 rounded-full border border-[#d4af37]/50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#d4af37] transition-all duration-300 hover:bg-[#d4af37] hover:text-[#080808] md:flex"
            >
              <Sparkles size={14} />
              Reserve
            </Link>

            {/* =====================================================
                MOBILE MENU BUTTON
            ====================================================== */}

            <button
              type="button"
              onClick={toggleMobileMenu}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition-all duration-300 hover:border-[#d4af37]/40 hover:text-[#d4af37] lg:hidden"
              aria-label={mobileOpen ? "Close Menu" : "Open Menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          MOBILE NAVIGATION
      ========================================================== */}

      {mobileOpen && (
        <div className="border-t border-[#d4af37]/10 bg-[#080808]/98 backdrop-blur-xl lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
            <nav className="space-y-1">
              {/* MAIN NAV LINKS */}

              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-xl px-4 py-3 text-sm transition ${
                    isActive(link.href)
                      ? "bg-[#d4af37]/10 text-[#d4af37]"
                      : "text-white/75 hover:bg-white/5 hover:text-[#d4af37]"
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {/* RESERVATION */}

              <Link
                href="/reservation"
                className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-4 py-3 text-sm font-bold text-[#080808]"
              >
                <Sparkles size={16} />
                Reserve Your Table
              </Link>

              {/* =================================================
                  LOGGED-IN USER
              ================================================== */}

              {session?.user ? (
                <div className="mt-4 border-t border-white/10 pt-4">
                  {/* USER INFO */}

                  <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4af37] text-[#080808]">
                        <User size={18} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {session.user.name || "ST Customer"}
                      </p>

                      <p className="truncate text-xs text-white/40">
                        {session.user.email}
                      </p>

                      {session.user.role && (
                        <span className="mt-1 inline-block text-[9px] uppercase tracking-wider text-[#d4af37]">
                          {session.user.role}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* MOBILE NOTIFICATION */}

                  <Link
                    href="/notifications"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/5 hover:text-[#d4af37]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5">
                        🔔
                      </span>

                      <span>Notifications</span>
                    </div>

                    <span className="text-xs text-[#d4af37]">View</span>
                  </Link>

                  {/* MY ORDERS */}

                  <Link
                    href="/orders"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/5 hover:text-[#d4af37]"
                  >
                    <ClipboardList size={17} />
                    <span>My Orders</span>
                  </Link>

                  {/* MY RESERVATIONS */}

                  <Link
                    href="/reservation"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/5 hover:text-[#d4af37]"
                  >
                    <CalendarDays size={17} />
                    <span>My Reservations</span>
                  </Link>

                  {/* ADMIN / STAFF */}

                  {isAdminOrStaff && (
                    <>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/5 hover:text-[#d4af37]"
                      >
                        <LayoutDashboard size={17} />
                        <span>Dashboard</span>
                      </Link>

                      <Link
                        href="/dashboard/reservations"
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/5 hover:text-[#d4af37]"
                      >
                        <CalendarCheck size={17} />
                        <span>Manage Reservations</span>
                      </Link>
                    </>
                  )}

                  {/* LOGOUT */}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 flex w-full items-center gap-3 rounded-xl border-t border-white/10 px-4 py-3 text-left text-sm text-red-400 transition hover:bg-red-500/10"
                  >
                    <LogOut size={17} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                /* =================================================
                   MOBILE GUEST
                ================================================== */

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/80 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
                  >
                    <LogIn size={16} />
                    Login
                  </Link>

                  <Link
                    href="/register"
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-4 py-3 text-sm font-bold text-[#080808] transition hover:bg-[#f1d77a]"
                  >
                    <UserPlus size={16} />
                    Register
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
