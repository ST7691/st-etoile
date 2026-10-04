"use client";

import {
  Wallet,
  ShoppingBag,
  CalendarDays,
  Users,
  Clock3,
  ChefHat,
} from "lucide-react";

const stats = [
  {
    label: "Total Revenue",
    value: "BDT 2,180",
    change: "+12%",
    compare: "vs last week",
    icon: Wallet,
    type: "gold",
    chart: [20, 35, 28, 48, 42, 64, 78],
  },
  {
    label: "Total Orders",
    value: "1",
    change: "+100%",
    compare: "vs last week",
    icon: ShoppingBag,
    type: "gold",
    chart: [15, 22, 20, 38, 32, 55, 72],
  },
  {
    label: "Today's Orders",
    value: "1",
    change: "+100%",
    compare: "vs yesterday",
    icon: CalendarDays,
    type: "gold",
    chart: [10, 18, 15, 28, 24, 45, 70],
  },
  {
    label: "Customers",
    value: "0",
    change: "No change",
    compare: "vs last week",
    icon: Users,
    type: "gray",
    chart: [20, 30, 25, 38, 32, 40, 36],
  },
  {
    label: "Pending Reservations",
    value: "0",
    change: "No change",
    compare: "vs last week",
    icon: Clock3,
    type: "gold",
    chart: [20, 30, 26, 42, 38, 54, 66],
  },
  {
    label: "Confirmed Reservations",
    value: "0",
    change: "No change",
    compare: "vs last week",
    icon: CalendarDays,
    type: "blue",
    chart: [15, 25, 22, 40, 34, 48, 68],
  },
  {
    label: "Preparing Orders",
    value: "0",
    change: "No change",
    compare: "vs last week",
    icon: ChefHat,
    type: "orange",
    chart: [20, 35, 28, 44, 39, 50, 72],
  },
];

function Sparkline({ values, type }) {
  const width = 100;
  const height = 42;

  const max = Math.max(...values);
  const min = Math.min(...values);

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;

      const normalized = max === min ? 0.5 : (value - min) / (max - min);

      const y = height - normalized * (height - 8);

      return `${x},${y}`;
    })
    .join(" ");

  const stroke =
    type === "blue"
      ? "#38bdf8"
      : type === "orange"
        ? "#fb923c"
        : type === "gray"
          ? "#64748b"
          : "#d4af37";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-12 w-24"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.slice(0, 4).map((item) => {
        const Icon = item.icon;

        return <StatCard key={item.label} item={item} Icon={Icon} />;
      })}

      {stats.slice(4).map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.label} className="md:col-span-1 xl:col-span-1">
            <StatCard item={item} Icon={Icon} />
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ item, Icon }) {
  const iconBg =
    item.type === "blue"
      ? "bg-sky-500/10 text-sky-400"
      : item.type === "orange"
        ? "bg-orange-500/10 text-orange-400"
        : item.type === "gray"
          ? "bg-slate-500/10 text-slate-400"
          : "bg-[#d4af37]/10 text-[#d4af37]";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b1014] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/20">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBg}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <Sparkline values={item.chart} type={item.type} />
      </div>

      <p className="mt-5 text-sm text-white/55">{item.label}</p>

      <h3 className="mt-1 text-2xl font-bold tracking-tight text-white">
        {item.value}
      </h3>

      <div className="mt-2 flex items-center gap-2 text-xs">
        <span
          className={
            item.change.startsWith("+") ? "text-emerald-400" : "text-white/40"
          }
        >
          {item.change}
        </span>

        <span className="text-white/30">{item.compare}</span>
      </div>
    </div>
  );
}
