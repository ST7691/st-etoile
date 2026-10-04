"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  FolderOpen,
  Users,
  CalendarDays,
  Star,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Plus,
  List,
  Menu,
  X,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Orders",
    href: "/dashboard/orders",
    icon: ShoppingBag,
  },
  {
    label: "Menu",
    icon: UtensilsCrossed,
    children: [
      {
        label: "Add Menu Item",
        href: "/dashboard/menu?action=add",
        icon: Plus,
      },
      {
        label: "Manage Menu",
        href: "/dashboard/menu",
        icon: List,
      },
    ],
  },
  {
    label: "Categories",
    icon: FolderOpen,
    children: [
      {
        label: "Add Category",
        href: "/dashboard/categories?action=add",
        icon: Plus,
      },
      {
        label: "Manage Categories",
        href: "/dashboard/categories",
        icon: List,
      },
    ],
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

export default function DashboardSidebar({ mobileOpen, setMobileOpen }) {
  const pathname = usePathname();
  const router = useRouter();

  const [openMenus, setOpenMenus] = useState({
    Menu: pathname.startsWith("/dashboard/menu"),
    Categories: pathname.startsWith("/dashboard/categories"),
  });

  function toggleMenu(label) {
    setOpenMenus((current) => ({
      ...current,
      [label]: !current[label],
    }));
  }

  function isActive(href) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  }

  async function handleLogout() {
    await signOut({
      callbackUrl: "/login",
    });
  }

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-[100]
          flex h-screen w-[270px] flex-col
          border-r border-white/[0.08]
          bg-[#070a0c]
          transition-transform duration-300
          lg:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}

        <div className="flex h-[88px] items-center justify-between border-b border-white/[0.08] px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d4af37] text-[#d4af37]">
              <UtensilsCrossed className="h-6 w-6" />
            </div>

            <div>
              <div className="text-2xl font-bold tracking-[0.15em] text-white">
                ST
              </div>

              <div className="-mt-1 text-[10px] font-semibold tracking-[0.28em] text-[#d4af37]">
                RESTAURANT
              </div>
            </div>
          </Link>

          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}

        <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-none">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              // Parent with submenu
              if (item.children) {
                const parentActive = item.children.some((child) =>
                  isActive(child.href),
                );

                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`
                        flex w-full items-center justify-between
                        rounded-xl px-4 py-3
                        text-sm font-medium
                        transition
                        ${
                          parentActive
                            ? "text-white"
                            : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                        }
                      `}
                    >
                      <span className="flex items-center gap-3">
                        <Icon
                          className={`h-[19px] w-[19px] ${
                            parentActive ? "text-[#d4af37]" : "text-white/50"
                          }`}
                        />

                        {item.label}
                      </span>

                      {openMenus[item.label] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {openMenus[item.label] && (
                      <div className="ml-5 mt-1 border-l border-white/10 pl-4">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;

                          const active = isActive(child.href);

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className={`
                                  group relative
                                  flex items-center gap-3
                                  rounded-lg px-3 py-2.5
                                  text-sm
                                  transition
                                  ${
                                    active
                                      ? "text-[#d4af37]"
                                      : "text-white/45 hover:text-white"
                                  }
                                `}
                            >
                              <span
                                className={`
                                    absolute -left-[21px]
                                    h-1.5 w-1.5
                                    rounded-full
                                    ${
                                      active ? "bg-[#d4af37]" : "bg-transparent"
                                    }
                                  `}
                              />

                              <ChildIcon className="h-4 w-4" />

                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    group relative
                    flex items-center gap-3
                    rounded-xl px-4 py-3
                    text-sm font-medium
                    transition-all
                    ${
                      active
                        ? "bg-gradient-to-r from-[#b28b22] to-[#d4af37] text-black shadow-[0_8px_25px_rgba(212,175,55,0.12)]"
                        : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                    }
                  `}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[#f6dc78]" />
                  )}

                  <Icon
                    className={`h-[19px] w-[19px] ${
                      active
                        ? "text-black"
                        : "text-white/50 group-hover:text-[#d4af37]"
                    }`}
                  />

                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Profile */}

        <div className="border-t border-white/[0.08] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4af37] text-sm font-bold text-black">
              SA
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                Sakib Ahmed
              </p>

              <p className="text-xs text-white/40">Administrator</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/50 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-[19px] w-[19px]" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
