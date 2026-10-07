"use client";

import dynamic from "next/dynamic";

import type { SalesPoint } from "@/lib/data/admin";

/**
 * The overview's chart, loaded on demand.
 *
 * The server page stays free of the recharts bundle by shipping only this
 * client wrapper, which pulls the chart in when it actually mounts. The
 * skeleton below is what paints first, so the card has its shape before the
 * graph library has finished downloading.
 */
const SalesChart = dynamic(
  () => import("@/components/admin/sales-chart").then((mod) => mod.SalesChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] animate-pulse rounded-lg bg-mint sm:h-[320px]" />
    ),
  },
);

export function SalesChartLazy({ data }: { data: SalesPoint[] }) {
  return <SalesChart data={data} />;
}