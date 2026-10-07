"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ORDER_STATUS_LABELS, ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import type { OrderStatusCounts } from "@/lib/data/admin";

/*
  Orders by status as a doughnut.

  One monochrome green ramp: delivered (forest), shipped (deep green), confirmed
  (leaf), pending (mid green), cancelled (pale forest). Colour carries the arc,
  the legend carries the numbers — counts and one-decimal percentages on dotted
  leaders, because a donut alone is a shape and a shape is not a figure.

  The ring's footprint is reserved before mount (the bordered circle below the
  number), so the centre total is already honest on first paint and the chart
  slots into space the layout never has to re-measure.
*/

const SLICE_COLORS: Record<OrderStatus, string> = {
  DELIVERED: "var(--color-forest)",
  SHIPPED: "var(--color-chart-5)",
  CONFIRMED: "var(--color-leaf)",
  PENDING: "var(--color-chart-3)",
  // forest at 30% — the palest slice, for an order that never began.
  CANCELLED: "oklch(0.3925 0.0896 152.54 / 0.3)",
};

export function StatusDonut({
  counts,
  total,
}: {
  counts: OrderStatusCounts;
  total: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = ORDER_STATUSES.filter((status) => counts[status] > 0).map(
    (status) => ({
      status,
      label: ORDER_STATUS_LABELS[status],
      value: counts[status],
    }),
  );

  const percent = (count: number) =>
    total > 0 ? (Math.round((count / total) * 1000) / 10).toFixed(1) : "0.0";

  return (
    <div>
      <div className="relative mx-auto h-[210px] w-full max-w-[260px]">
        {/* Reserved ring: holds the exact outer diameter until Recharts mounts. */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[34px] border-ink/[0.05]"
        />

        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius={61}
                outerRadius={95}
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
              >
                {data.map((entry) => (
                  <Cell key={entry.status} fill={SLICE_COLORS[entry.status]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const entry = payload[0].payload as (typeof data)[number];
                  return (
                    <div className="rounded-lg border border-ink/10 bg-white px-3.5 py-2.5 shadow-lift">
                      <p className="text-sm font-medium text-ink">{entry.label}</p>
                      <p className="mt-0.5 text-xs text-ink/55 tabular-nums">
                        {entry.value} orders &middot; {percent(entry.value)}%
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : null}

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-3xl leading-none font-semibold text-ink tabular-nums">
            {total}
          </span>
          <span className="mt-1.5 text-xs text-ink/50">
            {total === 1 ? "order" : "orders"}
          </span>
        </div>
      </div>

      <ul className="mt-5 flex flex-col gap-2.5">
        {ORDER_STATUSES.map((status) => (
          <li key={status} className="flex items-baseline gap-2.5 text-sm">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 self-center rounded-full"
              style={{ backgroundColor: SLICE_COLORS[status] }}
            />
            <span className="text-ink/70">{ORDER_STATUS_LABELS[status]}</span>
            <span
              aria-hidden="true"
              className="h-0 min-w-4 flex-1 self-center border-t border-dotted border-ink/25"
            />
            <span className="font-medium text-ink tabular-nums">
              {counts[status]}
            </span>
            <span className="w-14 text-right text-ink/45 tabular-nums">
              {percent(counts[status])}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
