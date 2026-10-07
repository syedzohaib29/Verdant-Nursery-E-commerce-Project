"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import type { SalesPoint } from "@/lib/data/admin";
import { formatPrice } from "@/lib/utils";

/*
  Daily revenue, drawn by hand around Recharts.

  Rules for this chart: forest stroke, leaf fill at 12% with no gradient, dotted
  horizontal grid and nothing vertical, thin axes, and a tooltip card that
  matches the dashboard's own cards. The container owns an explicit height and
  only mounts ResponsiveContainer after the first effect, so the chart never
  flashes a zero-size frame or resizes the page around it — the skeleton below
  holds the exact space the chart will occupy.
*/

const AXIS_TICK = {
  fill: "var(--color-ink)",
  fillOpacity: 0.5,
  fontSize: 11,
} as const;

/** Axis ticks stay short: "$4k" beats "$4,000" at eleven pixels. */
function moneyTick(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${Math.round(dollars / 1000)}k`;
  return `$${Math.round(dollars)}`;
}

export function SalesChart({ data }: { data: SalesPoint[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="relative h-[260px] w-full sm:h-[320px]">
      {!mounted ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex flex-col justify-between py-6"
        >
          <Skeleton className="h-1.5 w-full rounded-full opacity-60" />
          <Skeleton className="h-1.5 w-full rounded-full opacity-60" />
          <Skeleton className="h-1.5 w-full rounded-full opacity-60" />
        </div>
      ) : null}

      {mounted ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--color-ink)"
              strokeOpacity={0.08}
              strokeDasharray="1 4"
            />
            <XAxis
              dataKey="shortLabel"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
              dy={4}
            />
            <YAxis
              width={46}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              tickFormatter={moneyTick}
              domain={[0, "dataMax"]}
            />
            <Tooltip
              cursor={{
                stroke: "var(--color-ink)",
                strokeOpacity: 0.18,
                strokeDasharray: "3 3",
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as SalesPoint;
                return (
                  <div className="rounded-lg border border-ink/10 bg-white px-3.5 py-2.5 shadow-lift">
                    <p className="text-xs text-ink/55">{point.fullLabel}</p>
                    <p className="font-heading mt-1 text-lg leading-none font-semibold text-ink tabular-nums">
                      {formatPrice(point.revenueCents)}
                    </p>
                    <p className="mt-1.5 text-xs text-ink/55 tabular-nums">
                      {point.orders} {point.orders === 1 ? "order" : "orders"}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="revenueCents"
              stroke="var(--color-forest)"
              strokeWidth={2}
              fill="var(--color-leaf)"
              fillOpacity={0.12}
              dot={false}
              activeDot={{
                r: 4,
                strokeWidth: 2,
                stroke: "#FFFFFF",
                fill: "var(--color-forest)",
              }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
