import "server-only";

import type { Prisma } from "@/generated/prisma/client";

import {
  LOW_STOCK_THRESHOLD,
  ORDER_STATUSES,
  orderStatusSchema,
  type OrderStatus,
} from "@/lib/constants";
import { summarySelect, toSummary, type OrderSummary } from "@/lib/data/orders";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

/*
  Back-office queries.

  Every number on the dashboard is counted here so two widgets cannot disagree
  about the same morning's sales. Windows are calendar days in the server's
  local time — buckets and rows are keyed by the same local-day function, which
  keeps a shop in a non-UTC timezone from dropping its own orders off the end
  of the chart.
*/

/** YYYY-MM-DD in local time. The one bucket key used across this module. */
function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Midnight of the day `offset` days ago (0 is today). */
function dayStart(offset: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - offset);
  return date;
}

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

/* ------------------------------------------------------------------ *
 * Sales series
 * ------------------------------------------------------------------ */

export type SalesPoint = {
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  /** Axis label, "Oct 6". */
  shortLabel: string;
  /** Tooltip label, "Oct 6, 2026". */
  fullLabel: string;
  revenueCents: number;
  orders: number;
};

/**
 * Revenue and order count per day for the last `days` days, gaps zero-filled.
 *
 * The revenue rule is literal: a cancelled order never took money, so it is
 * excluded. Everything else counts, including pending and refunded orders —
 * this is the gross the shop handled, and the refund story lives on the order
 * itself. (`getRevenueByDay` in orders.ts counts only settled money; the two
 * deliberately answer different questions.)
 */
export async function getSalesSeries(days: number): Promise<SalesPoint[]> {
  const since = dayStart(days - 1);

  const buckets = new Map<string, SalesPoint>();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = dayStart(offset);
    const key = dayKey(date);
    buckets.set(key, {
      date: key,
      shortLabel: shortDateFormatter.format(date),
      fullLabel: formatDate(date),
      revenueCents: 0,
      orders: 0,
    });
  }

  const rows = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
    select: { createdAt: true, totalCents: true },
  });

  for (const row of rows) {
    const bucket = buckets.get(dayKey(row.createdAt));
    if (!bucket) continue;
    bucket.revenueCents += row.totalCents;
    bucket.orders += 1;
  }

  // Map insertion order is oldest → newest, which is the chart's axis order.
  return [...buckets.values()];
}

/* ------------------------------------------------------------------ *
 * KPI row
 * ------------------------------------------------------------------ */

export type KpiTrend = {
  /** Change against the previous window, in percent, one decimal. */
  pct: number | null;
  dir: "up" | "down" | "flat";
};

export type StatValue = {
  value: number;
  /** Render through formatPrice (cents) rather than as a plain count. */
  isMoney: boolean;
  caption: string;
  /** `null` where history does not exist (a stock count has no past). */
  trend: KpiTrend | null;
  /** Daily series for the sparkline, or `null` when there is nothing to draw. */
  spark: number[] | null;
};

export type OverviewKpis = {
  revenue: StatValue;
  orders: StatValue;
  customers: StatValue;
  lowStock: StatValue;
};

/** No previous window means no honest percentage; the card shows an em dash. */
function trend(current: number, previous: number): KpiTrend {
  if (previous === 0) return { pct: null, dir: "flat" };
  const pct = Math.round(((current - previous) / previous) * 1000) / 10;
  return { pct, dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

/** Daily counts of a list of dates over a `days` window ending today. */
function bucketDailyCounts(dates: Date[], days: number): number[] {
  const positions = new Map<string, number>();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    positions.set(dayKey(dayStart(offset)), days - 1 - offset);
  }

  const counts = new Array<number>(days).fill(0);
  for (const date of dates) {
    const position = positions.get(dayKey(date));
    if (position !== undefined) counts[position] += 1;
  }
  return counts;
}

/**
 * The four headline numbers, each against the same window one month earlier.
 *
 * Revenue follows the sales-series rule above (cancelled excluded). Orders
 * counts everything placed — a cancelled order was still an order, and hiding
 * it here would make the chart and the KPI argue. Customers are sign-ups with
 * the CUSTOMER role, so the seed's own admin and staff accounts are not
 * counted as new shoppers. The low-stock card has no trend: stock is a
 * present-tense number, and the shelves keep no diary.
 */
export async function getOverviewKpis(): Promise<OverviewKpis> {
  const currentSince = dayStart(29);
  const previousSince = dayStart(59);

  const [
    revenueNow,
    revenueBefore,
    ordersNow,
    ordersBefore,
    customersNow,
    customersBefore,
    lowStock,
    salesDaily,
    customerDates,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: { gte: currentSince }, status: { not: "CANCELLED" } },
      _sum: { totalCents: true },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: previousSince, lt: currentSince },
        status: { not: "CANCELLED" },
      },
      _sum: { totalCents: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: currentSince } } }),
    prisma.order.count({
      where: { createdAt: { gte: previousSince, lt: currentSince } },
    }),
    prisma.user.count({
      where: { role: "CUSTOMER", createdAt: { gte: currentSince } },
    }),
    prisma.user.count({
      where: { role: "CUSTOMER", createdAt: { gte: previousSince, lt: currentSince } },
    }),
    prisma.product.count({ where: { stock: { lte: LOW_STOCK_THRESHOLD } } }),
    getSalesSeries(30),
    prisma.user.findMany({
      where: { role: "CUSTOMER", createdAt: { gte: currentSince } },
      select: { createdAt: true },
    }),
  ]);

  const revenue = revenueNow._sum.totalCents ?? 0;
  const revenueBeforeCents = revenueBefore._sum.totalCents ?? 0;

  return {
    revenue: {
      value: revenue,
      isMoney: true,
      caption: "vs the previous 30 days",
      trend: trend(revenue, revenueBeforeCents),
      spark: salesDaily.map((point) => point.revenueCents),
    },
    orders: {
      value: ordersNow,
      isMoney: false,
      caption: "vs the previous 30 days",
      trend: trend(ordersNow, ordersBefore),
      spark: salesDaily.map((point) => point.orders),
    },
    customers: {
      value: customersNow,
      isMoney: false,
      caption: "vs the previous 30 days",
      trend: trend(customersNow, customersBefore),
      spark: bucketDailyCounts(
        customerDates.map((row) => row.createdAt),
        30,
      ),
    },
    lowStock: {
      value: lowStock,
      isMoney: false,
      caption: `${LOW_STOCK_THRESHOLD} or fewer on the shelf`,
      trend: null,
      spark: null,
    },
  };
}

/* ------------------------------------------------------------------ *
 * Status donut
 * ------------------------------------------------------------------ */

export type OrderStatusCounts = Record<OrderStatus, number>;

/** Every status with a slot, zero-filled, plus the total they add up to. */
export async function getOrderStatusCounts(): Promise<{
  total: number;
  counts: OrderStatusCounts;
}> {
  const rows = await prisma.order.groupBy({ by: ["status"], _count: { _all: true } });

  const counts = Object.fromEntries(
    ORDER_STATUSES.map((status) => [status, 0]),
  ) as OrderStatusCounts;

  let total = 0;
  for (const row of rows) {
    const status = orderStatusSchema.safeParse(row.status);
    if (!status.success) continue;
    counts[status.data] = row._count._all;
    total += row._count._all;
  }

  return { total, counts };
}

/* ------------------------------------------------------------------ *
 * Top products
 * ------------------------------------------------------------------ */

export type TopProduct = {
  name: string;
  image: string | null;
  /** Units sold, cancelled orders excluded (they never left the building). */
  units: number;
};

export async function getTopProducts(limit = 5): Promise<TopProduct[]> {
  const rows = await prisma.orderItem.groupBy({
    by: ["name", "image"],
    where: { order: { status: { not: "CANCELLED" } } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  return rows.map((row) => ({
    name: row.name,
    image: row.image,
    units: row._sum.quantity ?? 0,
  }));
}

/* ------------------------------------------------------------------ *
 * Low stock
 * ------------------------------------------------------------------ */

export type LowStockItem = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  image: string | null;
};

/** The shelves that need topping up, emptiest first. */
export async function getLowStockProducts(limit = 8): Promise<LowStockItem[]> {
  const rows = await prisma.product.findMany({
    where: { stock: { lte: LOW_STOCK_THRESHOLD } },
    orderBy: [{ stock: "asc" }, { name: "asc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      images: {
        orderBy: { position: "asc" },
        take: 1,
        select: { url: true },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    stock: row.stock,
    image: row.images[0]?.url ?? null,
  }));
}

/* ------------------------------------------------------------------ *
 * Order list
 * ------------------------------------------------------------------ */

export const ADMIN_ORDERS_PER_PAGE = 10;

export const ORDER_SORT_KEYS = [
  "date",
  "order",
  "total",
  "status",
  "customer",
] as const;

export type OrderSortKey = (typeof ORDER_SORT_KEYS)[number];
export type SortDir = "asc" | "desc";

export type OrdersPage = {
  rows: OrderSummary[];
  total: number;
  pageCount: number;
};

/**
 * One page of the order list, sorted by a key the URL can name.
 *
 * Sort keys mirror column keys in the table, so what a header click writes into
 * the query string and what Prisma orders by are the same word.
 */
export async function getOrdersPage(options: {
  page: number;
  status?: OrderStatus;
  sort: OrderSortKey;
  dir: SortDir;
}): Promise<OrdersPage> {
  const where = options.status ? { status: options.status } : {};

  const orderBy: Record<OrderSortKey, Prisma.OrderOrderByWithRelationInput> = {
    date: { createdAt: options.dir },
    order: { orderNumber: options.dir },
    total: { totalCents: options.dir },
    status: { status: options.dir },
    customer: { email: options.dir },
  };

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: summarySelect,
      orderBy: orderBy[options.sort],
      skip: (options.page - 1) * ADMIN_ORDERS_PER_PAGE,
      take: ADMIN_ORDERS_PER_PAGE,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    rows: rows.flatMap((row) => {
      const summary = toSummary(row);
      return summary ? [summary] : [];
    }),
    total,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_ORDERS_PER_PAGE)),
  };
}

/* ------------------------------------------------------------------ *
 * Top-bar alerts
 * ------------------------------------------------------------------ */

export type AdminAlerts = {
  lowStock: number;
  pendingOrders: number;
};

/** The two counts the bell badge promises to keep an eye on. */
export async function getAdminAlerts(): Promise<AdminAlerts> {
  const [lowStock, pendingOrders] = await Promise.all([
    prisma.product.count({ where: { stock: { lte: LOW_STOCK_THRESHOLD } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
  ]);

  return { lowStock, pendingOrders };
}
