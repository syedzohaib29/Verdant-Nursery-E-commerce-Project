import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, PackageXIcon, ReceiptTextIcon, SparklesIcon } from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { LowStockList } from "@/components/admin/low-stock-list";
import { PageHeader } from "@/components/admin/page-header";
import { RecentOrdersTable } from "@/components/admin/recent-orders-table";
import { SalesChartLazy } from "@/components/admin/sales-chart-lazy";
import { StatCard } from "@/components/admin/stat-card";
import { StatusDonut } from "@/components/admin/status-donut";
import { TopProducts } from "@/components/admin/top-products";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import {
  getOrderStatusCounts,
  getLowStockProducts,
  getOverviewKpis,
  getSalesSeries,
  getTopProducts,
} from "@/lib/data/admin";
import { getOrders } from "@/lib/data/orders";

import { cn } from "cn";

// Absolute, because a `title.template` in this segment's layout does not apply
// to this segment's own page — only to the screens beneath it.
export const metadata: Metadata = {
  title: { absolute: "Overview · Verdant back office" },
};

/** The ranges the toggle offers, as the query string spells them. */
const RANGES = { "7d": 7, "30d": 30, "90d": 90 } as const;
type RangeKey = keyof typeof RANGES;

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
];

/**
 * The back office landing page.
 *
 * Everything here is fetched on the server and rendered as markup: the KPI row,
 * the two rankings and both lists are plain HTML on the first paint, and only
 * the two charts become client components — they wait for their own mount so
 * Recharts never draws a zero-width frame that later has to grow.
 *
 * The revenue rule is the dashboard's own (cancelled orders excluded, every
 * other status counted), and it is documented once, in `lib/data/admin.ts`,
 * where the query lives.
 */
export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range: RangeKey =
    params.range && params.range in RANGES ? (params.range as RangeKey) : "30d";

  const [kpis, status, topProducts, lowStock, series, recentOrders] =
    await Promise.all([
      getOverviewKpis(),
      getOrderStatusCounts(),
      getTopProducts(5),
      getLowStockProducts(8),
      getSalesSeries(RANGES[range]),
      getOrders({ limit: 50 }),
    ]);

  const chartIsEmpty = series.every((point) => point.revenueCents === 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Good morning, desk."
        description="Thirty days of takings, what is left on the shelves, and the orders waiting on you."
      />

      {/* One orchestrated entrance for the four headline figures, and only for
          them: the rest of the page is already where it belongs. */}
      <Stagger className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem className="h-full">
          <StatCard label="Revenue" value={kpis.revenue} />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard label="Orders" value={kpis.orders} />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard label="New customers" value={kpis.customers} />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            label="Low stock"
            value={kpis.lowStock}
            className="bg-mint/60"
          />
        </StaggerItem>
      </Stagger>

      <section className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-[-0.01em] text-ink">
              Sales
            </h2>
            <p className="mt-1 text-small text-ink/55">
              Takings per day, cancelled orders left out — they never took a
              penny.
            </p>
          </div>
          <RangeToggle range={range} />
        </div>

        <div className="mt-5">
          {chartIsEmpty ? (
            <div className="flex h-[260px] items-center justify-center sm:h-[320px]">
              <EmptyState
                icon={SparklesIcon}
                title="No sales in this window"
                description="Widen the range, or enjoy the quiet — the chart fills in the moment an order lands."
              />
            </div>
          ) : (
            <SalesChartLazy data={series} />
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.01em] text-ink">
            Orders by status
          </h2>
          <p className="mt-1 text-small text-ink/55">
            Every order the shop has taken, sorted into its shelf.
          </p>

          <div className="mt-5">
            {status.total === 0 ? (
              <EmptyState
                icon={ReceiptTextIcon}
                title="No orders yet"
                description="The first order will divide itself up here."
              />
            ) : (
              <StatusDonut counts={status.counts} total={status.total} />
            )}
          </div>
        </section>

        <section className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.01em] text-ink">
            Best sellers
          </h2>
          <p className="mt-1 text-small text-ink/55">
            Units out of the door, cancelled orders not counted.
          </p>

          <div className="mt-5">
            {topProducts.length === 0 ? (
              <EmptyState
                icon={SparklesIcon}
                title="Nothing has sold yet"
                description="Once the first plant leaves, its rank starts here."
              />
            ) : (
              <TopProducts products={topProducts} />
            )}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3 pb-4">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-[-0.01em] text-ink">
              Recent orders
            </h2>
            <p className="mt-1 text-small text-ink/55">
              The fifty newest, sortable here without leaving the page.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-small font-medium text-forest outline-none transition-colors duration-200 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            All orders
            <ArrowRightIcon aria-hidden="true" strokeWidth={1.75} className="size-4" />
          </Link>
        </div>

        <RecentOrdersTable orders={recentOrders} />
      </section>

      <section
        id="low-stock"
        className="rounded-xl border border-ink/10 bg-white p-5 scroll-mt-24 sm:p-6"
      >
        <div className="pb-2">
          <p className="eyebrow">Shelves</p>
          <h2 className="font-heading mt-2 text-lg font-semibold tracking-[-0.01em] text-ink">
            Running low
          </h2>
          <p className="mt-1 text-small text-ink/55">
            Three or fewer on the shelf, emptiest first. Restocking adds a
            full batch at a time.
          </p>
        </div>

        {lowStock.length === 0 ? (
          <EmptyState
            icon={PackageXIcon}
            title="Every shelf is stocked"
            description="Nothing needs topping up today."
          />
        ) : (
          <LowStockList items={lowStock} />
        )}
      </section>
    </div>
  );
}

/**
 * The chart's range switch, as links rather than buttons.
 *
 * The range lives in the query string and the server re-renders the chart from
 * it, so each segment is a URL — back, forward and a shared link all land on
 * the same window. `scroll={false}` keeps the page where it is: the chart is
 * under the reader's eyes already, and jumping to the top to change a range
 * would take them away from the thing they just asked for.
 */
function RangeToggle({ range }: { range: RangeKey }) {
  return (
    <div
      role="group"
      aria-label="Chart range"
      className="flex flex-wrap items-center gap-2"
    >
      {RANGE_OPTIONS.map((option) => {
        const active = option.key === range;
        return (
          <Link
            key={option.key}
            href={option.key === "30d" ? "/admin" : `/admin?range=${option.key}`}
            scroll={false}
            aria-current={active ? "true" : undefined}
            className={cn(
              "flex h-11 items-center rounded-lg border px-4 text-sm font-medium outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              active
                ? "border-forest bg-forest text-white"
                : "border-ink/15 bg-white text-ink/60 hover:border-ink/35 hover:text-ink",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
