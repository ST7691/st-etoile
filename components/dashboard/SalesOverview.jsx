"use client";

import { BarChart3, ChevronDown } from "lucide-react";

export default function SalesOverview({ data = [], loading = false }) {
  const values = data.map((item) => Number(item.revenue || 0));

  const maxValue = Math.max(...values, 1);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0b1014] p-5">
      {/* Header */}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4af37]/10 text-[#d4af37]">
            <BarChart3 className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-white">Sales Overview</h2>

            <p className="mt-1 text-xs text-white/35">Last 7 days revenue</p>
          </div>
        </div>

        <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60">
          Last 7 days
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Chart */}

      <div className="mt-7">
        {loading ? (
          <div className="flex h-[260px] items-end gap-3">
            {Array.from({
              length: 7,
            }).map((_, index) => (
              <div
                key={index}
                className="flex-1 animate-pulse rounded-t-lg bg-white/5"
                style={{
                  height: `${30 + index * 8}%`,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="relative h-[260px]">
            {/* Grid */}

            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3, 4].map((item) => (
                <div key={item} className="border-t border-white/[0.05]" />
              ))}
            </div>

            {/* Bars */}

            <div className="absolute inset-0 flex items-end gap-3 px-2 pb-7 pt-5">
              {data.map((item, index) => {
                const value = Number(item.revenue || 0);

                const height =
                  value === 0 ? 3 : Math.max(8, (value / maxValue) * 100);

                return (
                  <div
                    key={item.date}
                    className="group relative flex h-full flex-1 flex-col justify-end"
                  >
                    {/* Tooltip */}

                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 scale-95 whitespace-nowrap rounded-lg border border-[#d4af37]/20 bg-[#11161b] px-3 py-2 text-[10px] text-white opacity-0 shadow-xl transition group-hover:scale-100 group-hover:opacity-100">
                      BDT {value.toLocaleString()}
                    </div>

                    {/* Bar */}

                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-[#8d6d16] to-[#d4af37] opacity-80 transition-all duration-500 group-hover:opacity-100"
                      style={{
                        height: `${height}%`,
                      }}
                    />

                    {/* Date */}

                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-white/30">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
