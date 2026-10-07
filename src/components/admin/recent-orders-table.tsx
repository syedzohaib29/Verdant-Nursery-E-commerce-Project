"use client";

import Link from "next/link";
import { ReceiptTextIcon } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { OrderRowActions } from "@/components/admin/order-row-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import type { OrderSummary } from "@/lib/data/orders";

/*
  The overview's recent-orders window.

  The page hands over the fifty newest orders; this table sorts them itself and
  shows the top ten. Sort-then-slice (rather than slice-then-sort) means
  "highest total" is the highest of the fifty it was shown, not of the ten
  that happened to be newest — and no round trip to the server for what is,
  on this card, a view of an already-fetched window.
*/

const COLUMNS: DataTableColumn<OrderSummary>[] = [
  {
    key: "order",
    header: "Order",
    sortValue: (order) => order.orderNumber,
    cell: (order) => (
      <span className="flex min-w-0 flex-col">
        <Link
          href={`/admin/orders/${order.id}`}
          className="text-sm font-medium text-forest underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {order.orderNumber}
        </Link>
        <span className="mt-0.5 truncate text-xs text-ink/45">{order.email}</span>
      </span>
    ),
  },
  {
    key: "date",
    header: "Placed",
    sortValue: (order) => order.createdAt,
    cell: (order) => <span className="text-ink/65">{order.createdAtLabel}</span>,
  },
  {
    key: "total",
    header: "Total",
    numeric: true,
    sortValue: (order) => order.totalCents,
    cell: (order) => <span className="font-medium text-ink">{order.totalLabel}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortValue: (order) => order.status,
    cell: (order) => <StatusBadge status={order.status} />,
  },
];

export function RecentOrdersTable({ orders }: { orders: OrderSummary[] }) {
  return (
    <DataTable
      columns={COLUMNS}
      rows={orders}
      rowKey={(order) => order.id}
      rowActions={(order) => <OrderRowActions order={order} />}
      limit={10}
      empty={
        <EmptyState
          icon={ReceiptTextIcon}
          title="No orders yet"
          description="The first order the shop takes will land here, newest first."
        />
      }
    />
  );
}
