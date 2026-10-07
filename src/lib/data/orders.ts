import "server-only";

import {
  orderStatusSchema,
  paymentStatusSchema,
  type OrderStatus,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";

/*
  Order queries.

  Orders are read far more often than they are written, and almost every view
  wants the same three things: the number, the money, and the status. Those are
  precomputed into plain strings here so the admin tables, the customer order
  list and the dashboard charts cannot disagree about what an order was.
*/

export type OrderSummary = {
  id: string;
  orderNumber: string;
  email: string;
  status: OrderStatus;
  paymentStatus: string;
  totalCents: number;
  totalLabel: string;
  itemCount: number;
  createdAt: string;
  createdAtLabel: string;
};

export type OrderDetail = OrderSummary & {
  userId: string | null;
  customerName: string | null;
  paymentMethod: string;
  subtotalCents: number;
  subtotalLabel: string;
  discountCents: number;
  discountLabel: string;
  shippingCents: number;
  shippingLabel: string;
  trackingNumber: string | null;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    /** The address as one block, for a label. */
    formatted: string;
  };
  items: {
    id: string;
    productId: string | null;
    name: string;
    priceCents: number;
    priceLabel: string;
    quantity: number;
    image: string | null;
  }[];
};

/**
 * Turn a raw order row (with its item quantities) into the shared summary.
 * Exported because the admin data layer reads the same rows through its own
 * queries and must produce byte-identical summaries — two mappers would be two
 * opinions about what an order "is".
 */
export function toSummary(
  row: {
    id: string;
    orderNumber: string;
    email: string;
    status: string;
    paymentStatus: string;
    totalCents: number;
    createdAt: Date;
    items: { quantity: number }[];
  },
): OrderSummary | null {
  const status = orderStatusSchema.safeParse(row.status);
  if (!status.success) return null;

  const payment = paymentStatusSchema.safeParse(row.paymentStatus);
  if (!payment.success) return null;

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    email: row.email,
    status: status.data,
    paymentStatus: payment.data,
    totalCents: row.totalCents,
    totalLabel: formatPrice(row.totalCents),
    itemCount: row.items.reduce((total, item) => total + item.quantity, 0),
    createdAt: row.createdAt.toISOString(),
    createdAtLabel: formatDate(row.createdAt, true),
  };
}

export const summarySelect = {
  id: true,
  orderNumber: true,
  email: true,
  status: true,
  paymentStatus: true,
  totalCents: true,
  createdAt: true,
  items: { select: { quantity: true } },
} as const;

/**
 * Orders for a list view, newest first. `userId` returns one customer's orders;
 * omitting it returns every order, which is the admin view.
 */
export async function getOrders(
  options: {
    userId?: string;
    email?: string;
    status?: OrderStatus;
    limit?: number;
  } = {},
): Promise<OrderSummary[]> {
  const rows = await prisma.order.findMany({
    where: {
      ...(options.userId ? { userId: options.userId } : {}),
      ...(options.email ? { email: options.email } : {}),
      ...(options.status ? { status: options.status } : {}),
    },
    select: summarySelect,
    orderBy: { createdAt: "desc" },
    take: options.limit ?? 50,
  });

  return rows.flatMap((row) => {
    const summary = toSummary(row);
    return summary ? [summary] : [];
  });
}

/**
 * One order with its lines and the address it was shipped to.
 *
 * Passing `userId` narrows to that customer's own orders, which is how the account
 * pages answer "is this yours?" with one query instead of two. The admin views
 * omit it and see every order.
 */
export async function getOrderById(
  id: string,
  userId?: string,
): Promise<OrderDetail | null> {
  const row = await prisma.order.findUnique({
    where: {
      id,
      ...(userId ? { userId } : {}),
    },
    select: {
      ...summarySelect,
      userId: true,
      paymentMethod: true,
      subtotalCents: true,
      discountCents: true,
      shippingCents: true,
      trackingNumber: true,
      shipFullName: true,
      shipPhone: true,
      shipLine1: true,
      shipLine2: true,
      shipCity: true,
      shipState: true,
      shipPostalCode: true,
      shipCountry: true,
      user: { select: { name: true } },
      items: {
        select: {
          id: true,
          productId: true,
          name: true,
          priceCents: true,
          quantity: true,
          image: true,
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!row) return null;

  const summary = toSummary(row);
  if (!summary) return null;

  return {
    ...summary,
    userId: row.userId,
    customerName: row.user?.name ?? null,
    paymentMethod: row.paymentMethod,
    subtotalCents: row.subtotalCents,
    subtotalLabel: formatPrice(row.subtotalCents),
    discountCents: row.discountCents,
    discountLabel: formatPrice(row.discountCents),
    shippingCents: row.shippingCents,
    shippingLabel: formatPrice(row.shippingCents),
    trackingNumber: row.trackingNumber,
    shippingAddress: {
      fullName: row.shipFullName,
      phone: row.shipPhone,
      line1: row.shipLine1,
      line2: row.shipLine2,
      city: row.shipCity,
      state: row.shipState,
      postalCode: row.shipPostalCode,
      country: row.shipCountry,
      formatted: [
        row.shipFullName,
        row.shipLine1,
        row.shipLine2,
        `${row.shipCity}, ${row.shipState} ${row.shipPostalCode}`,
        row.shipCountry,
      ]
        .filter(Boolean)
        .join("\n"),
    },
    items: row.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      priceCents: item.priceCents,
      priceLabel: formatPrice(item.priceCents),
      quantity: item.quantity,
      image: item.image,
    })),
  };
}

/** Looked up by the human-facing number, which is what a customer quotes us. */
export async function getOrderByNumber(
  orderNumber: string,
): Promise<OrderDetail | null> {
  const row = await prisma.order.findUnique({
    where: { orderNumber },
    select: { id: true },
  });

  return row ? getOrderById(row.id) : null;
}

export type RevenuePoint = {
  /** ISO date, day granularity. */
  date: string;
  label: string;
  orders: number;
  revenueCents: number;
  revenueLabel: string;
};

/**
 * Revenue per day over a window, with empty days filled in.
 *
 * Filling the gaps matters: a 30-day chart of only the days that had orders looks
 * like a spiky, broken graph, which is a chart bug rather than a business story.
 */
export async function getRevenueByDay(days = 30): Promise<RevenuePoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const rows = await prisma.order.findMany({
    where: {
      createdAt: { gte: since },
      // Cancelled orders are not revenue. Counting them would make the chart
      // disagree with the order list on the same screen.
      status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED"] },
    },
    select: { createdAt: true, totalCents: true },
    orderBy: { createdAt: "asc" },
  });

  const byDay = new Map<string, { orders: number; revenueCents: number }>();

  for (let offset = 0; offset <= days; offset += 1) {
    const date = new Date(since);
    date.setDate(since.getDate() + offset);
    byDay.set(date.toISOString().slice(0, 10), { orders: 0, revenueCents: 0 });
  }

  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    const entry = byDay.get(key);

    if (entry) {
      entry.orders += 1;
      entry.revenueCents += row.totalCents;
    }
  }

  return [...byDay.entries()].map(([date, value]) => ({
    date,
    label: formatDate(new Date(`${date}T00:00:00`)),
    orders: value.orders,
    revenueCents: value.revenueCents,
    revenueLabel: formatPrice(value.revenueCents),
  }));
}

/** Headline numbers for the dashboard. */
export async function getOrderStats(): Promise<{
  totalOrders: number;
  revenueCents: number;
  revenueLabel: string;
  pendingCount: number;
  awaitingFulfilmentCount: number;
  averageOrderCents: number;
  averageOrderLabel: string;
}> {
  const [totalOrders, revenue, pendingCount, awaitingFulfilmentCount, aggregate] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED"] } },
        _sum: { totalCents: true },
      }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.aggregate({
        where: { status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED"] } },
        _avg: { totalCents: true },
      }),
    ]);

  const revenueCents = revenue._sum.totalCents ?? 0;
  const averageOrderCents = Math.round(aggregate._avg.totalCents ?? 0);

  return {
    totalOrders,
    revenueCents,
    revenueLabel: formatPrice(revenueCents),
    pendingCount,
    awaitingFulfilmentCount,
    averageOrderCents,
    averageOrderLabel: formatPrice(averageOrderCents),
  };
}
