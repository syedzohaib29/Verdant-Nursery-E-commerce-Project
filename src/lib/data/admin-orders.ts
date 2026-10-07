import "server-only";

import { ORDER_STATUS_LABELS, ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { summarySelect, toSummary, type OrderSummary } from "@/lib/data/orders";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";

/*
  Admin order queries and the transition rules.

  The order list is the desk's working queue: search by number, email or name,
  filter by status and date, sort by any column, page through the result. The
  transition rules live here too, next to the query that reads the order, so
  "what can this order become" is answered in one place.
*/

export const ADMIN_ORDERS_PER_PAGE = 10;

export type AdminOrderSort = "date" | "order" | "total" | "status" | "customer";
export type SortDir = "asc" | "desc";

export type AdminOrdersPage = {
  rows: OrderSummary[];
  total: number;
  pageCount: number;
};

/**
 * One page of the order list.
 *
 * Search covers the three things a person actually quotes: the order number,
 * the email on the order, and the name it was shipped to. The date range is
 * inclusive on both ends and matched against the local calendar day, so
 * "today" means today where the server is.
 */
export async function getAdminOrdersPage(options: {
  q?: string;
  status?: OrderStatus;
  from?: string;
  to?: string;
  page: number;
  sort: AdminOrderSort;
  dir: SortDir;
}): Promise<AdminOrdersPage> {
  const where = {
    ...(options.q
      ? {
          OR: [
            { orderNumber: { contains: options.q.toUpperCase() } },
            { email: { contains: options.q.toLowerCase() } },
            { shipFullName: { contains: options.q } },
          ],
        }
      : {}),
    ...(options.status ? { status: options.status } : {}),
    ...(options.from || options.to
      ? {
          createdAt: {
            ...(options.from ? { gte: startOfDay(options.from) } : {}),
            ...(options.to ? { lte: endOfDay(options.to) } : {}),
          },
        }
      : {}),
  };

  const orderBy: Record<AdminOrderSort, object> = {
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

/** Count per status, for the tabs. Zero-filled so every tab shows a number. */
export async function getAdminOrderStatusCounts(): Promise<
  Record<OrderStatus, number>
> {
  const rows = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts = Object.fromEntries(
    ORDER_STATUSES.map((status) => [status, 0]),
  ) as Record<OrderStatus, number>;

  for (const row of rows) {
    if (ORDER_STATUSES.includes(row.status as OrderStatus)) {
      counts[row.status as OrderStatus] = row._count._all;
    }
  }

  return counts;
}

/* ------------------------------------------------------------------ *
 * CSV export
 * ------------------------------------------------------------------ */

export type CsvOrder = {
  orderNumber: string;
  email: string;
  customerName: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  items: number;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  trackingNumber: string;
  createdAt: string;
};

/**
 * Every order matching the filters, as flat rows for a CSV.
 *
 * The export honours the same filters as the list — a filtered list is a
 * question, and the CSV is the answer to it. Cancelled orders are included:
 * they are part of the ledger, and a CSV that quietly drops them is a report
 * that lies.
 */
export async function getOrdersForCsv(options: {
  q?: string;
  status?: OrderStatus;
  from?: string;
  to?: string;
}): Promise<CsvOrder[]> {
  const where = {
    ...(options.q
      ? {
          OR: [
            { orderNumber: { contains: options.q.toUpperCase() } },
            { email: { contains: options.q.toLowerCase() } },
            { shipFullName: { contains: options.q } },
          ],
        }
      : {}),
    ...(options.status ? { status: options.status } : {}),
    ...(options.from || options.to
      ? {
          createdAt: {
            ...(options.from ? { gte: startOfDay(options.from) } : {}),
            ...(options.to ? { lte: endOfDay(options.to) } : {}),
          },
        }
      : {}),
  };

  const rows = await prisma.order.findMany({
    where,
    select: {
      orderNumber: true,
      email: true,
      shipFullName: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      subtotalCents: true,
      discountCents: true,
      shippingCents: true,
      totalCents: true,
      trackingNumber: true,
      createdAt: true,
      items: { select: { quantity: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  return rows.map((row) => ({
    orderNumber: row.orderNumber,
    email: row.email,
    customerName: row.shipFullName,
    status: ORDER_STATUS_LABELS[row.status as OrderStatus] ?? row.status,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    items: row.items.reduce((total, item) => total + item.quantity, 0),
    subtotalCents: row.subtotalCents,
    discountCents: row.discountCents,
    shippingCents: row.shippingCents,
    totalCents: row.totalCents,
    trackingNumber: row.trackingNumber ?? "",
    createdAt: formatDate(row.createdAt, true),
  }));
}

/** The CSV text itself, with the header row a spreadsheet expects. */
export function ordersToCsv(orders: CsvOrder[]): string {
  const header = [
    "Order",
    "Email",
    "Customer",
    "Status",
    "Payment method",
    "Payment status",
    "Items",
    "Subtotal",
    "Discount",
    "Shipping",
    "Total",
    "Tracking",
    "Placed",
  ];

  const escape = (value: string | number) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const money = (cents: number) => (cents / 100).toFixed(2);

  const lines = orders.map((order) =>
    [
      order.orderNumber,
      order.email,
      order.customerName,
      order.status,
      order.paymentMethod,
      order.paymentStatus,
      String(order.items),
      money(order.subtotalCents),
      money(order.discountCents),
      money(order.shippingCents),
      money(order.totalCents),
      order.trackingNumber,
      order.createdAt,
    ]
      .map(escape)
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}

/* ------------------------------------------------------------------ *
 * Date helpers
 * ------------------------------------------------------------------ */

/** Midnight at the start of a local calendar day, from YYYY-MM-DD. */
function startOfDay(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/** The last instant of a local calendar day, from YYYY-MM-DD. */
function endOfDay(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

/** A money label for the transition log. */
export function describeMoney(cents: number): string {
  return formatPrice(cents);
}
