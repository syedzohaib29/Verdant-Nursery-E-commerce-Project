import "server-only";

import { orderStatusSchema, type OrderStatus } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";

/*
  Admin customer queries.

  A customer is a User row with the CUSTOMER role. The desk sees them as a
  ledger: how many orders, how much they have spent, when they joined, and
  whether they are currently locked out. Staff and admin accounts are not
  customers and never appear here.
*/

export type AdminCustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  disabled: boolean;
  createdAt: string;
  joinedLabel: string;
  orderCount: number;
  totalSpentCents: number;
  totalSpentLabel: string;
};

export type AdminCustomersPage = {
  rows: AdminCustomerRow[];
  total: number;
  pageCount: number;
};

export const ADMIN_CUSTOMERS_PER_PAGE = 10;

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  disabled: boolean;
  createdAt: Date;
  _count: { orders: number };
  orders: { totalCents: number }[];
};

function toRow(row: CustomerRow): AdminCustomerRow {
  const totalSpentCents = row.orders.reduce(
    (total, order) => total + order.totalCents,
    0,
  );

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    disabled: row.disabled,
    createdAt: row.createdAt.toISOString(),
    joinedLabel: formatDate(row.createdAt),
    orderCount: row._count.orders,
    totalSpentCents,
    totalSpentLabel: formatPrice(totalSpentCents),
  };
}

/**
 * One page of customers, newest first, with a search over name and email.
 *
 * The order count and lifetime spend come from the same query as the row, so a
 * page of ten customers is one round trip rather than ten.
 */
export async function getAdminCustomers(options: {
  q?: string;
  page: number;
}): Promise<AdminCustomersPage> {
  const where = {
    role: "CUSTOMER" as const,
    ...(options.q
      ? {
          OR: [
            { name: { contains: options.q } },
            { email: { contains: options.q.toLowerCase() } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        disabled: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: { select: { totalCents: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (options.page - 1) * ADMIN_CUSTOMERS_PER_PAGE,
      take: ADMIN_CUSTOMERS_PER_PAGE,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    rows: rows.map(toRow),
    total,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_CUSTOMERS_PER_PAGE)),
  };
}

export type AdminCustomerDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  disabled: boolean;
  createdAt: string;
  joinedLabel: string;
  orderCount: number;
  totalSpentCents: number;
  totalSpentLabel: string;
  recentOrders: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    totalCents: number;
    totalLabel: string;
    itemCount: number;
    createdAt: string;
    createdAtLabel: string;
  }[];
};

/** One customer with their five most recent orders, for the drawer. */
export async function getCustomerDetail(
  id: string,
): Promise<AdminCustomerDetail | null> {
  const row = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      disabled: true,
      createdAt: true,
      _count: { select: { orders: true } },
      orders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalCents: true,
          createdAt: true,
          items: { select: { quantity: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!row) return null;

  const totalSpentCents = row.orders.reduce(
    (total, order) => total + order.totalCents,
    0,
  );

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    disabled: row.disabled,
    createdAt: row.createdAt.toISOString(),
    joinedLabel: formatDate(row.createdAt),
    orderCount: row._count.orders,
    totalSpentCents,
    totalSpentLabel: formatPrice(totalSpentCents),
    recentOrders: row.orders.flatMap((order) => {
      const status = orderStatusSchema.safeParse(order.status);
      if (!status.success) return [];

      return [
        {
          id: order.id,
          orderNumber: order.orderNumber,
          status: status.data,
          totalCents: order.totalCents,
          totalLabel: formatPrice(order.totalCents),
          itemCount: order.items.reduce(
            (total, item) => total + item.quantity,
            0,
          ),
          createdAt: order.createdAt.toISOString(),
          createdAtLabel: formatDate(order.createdAt, true),
        },
      ];
    }),
  };
}
