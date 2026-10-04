"use client";

import Link from "next/link";
import { Bell, CalendarDays, Menu, Search, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";

export default function DashboardTopbar({ onMenuClick }) {
  const { data: session } = useSession();

  const name = session?.user?.name || "Sakib Ahmed";

  const role = session?.user?.role || "ADMIN";

  return (
    <header className="sticky top-0 z-50 h-[76px] border-b border-white/[0.08] bg-[#070a0c]/90 backdrop-blur-xl">
      <div className="flex h-full items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu */}

        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/60 hover:bg-white/5 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}

        <div className="relative max-w-[520px] flex-1">
          <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/30" />

          <input
            type="text"
            placeholder="Search orders, menu items, customers..."
            className="h-11 w-full rounded-full border border-white/[0.08] bg-white/[0.045] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d4af37]/30 focus:bg-white/[0.06]"
          />
        </div>

        {/* Right */}

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          {/* Notifications */}

          <button className="relative flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition hover:bg-white/5 hover:text-white">
            <Bell className="h-5 w-5" />

            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              3
            </span>
          </button>

          <div className="hidden h-7 w-px bg-white/10 sm:block" />

          {/* Profile */}

          <button className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-white/[0.04]">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-white">{name}</p>

              <p className="text-xs text-white/40">{role}</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 text-sm font-bold text-[#d4af37]">
              {name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>

            <ChevronDown className="hidden h-4 w-4 text-white/40 sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
