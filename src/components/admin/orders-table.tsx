"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { OrderRowActions } from "@/components/admin/order-row-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import type { OrderSortKey, SortDir } from "@/lib/data/admin";
import type { OrderSummary } from "@/lib/data/orders";

/*
  The order list's table, sorted through the URL.

  A header click pushes ?sort= and ?dir= (and drops ?page= — page two of a
  different sort is a different list, not a continuation of this one), the
  server re-queries, and the rows arrive already ordered. The columns still
  carry sortValues so the table's own sort agrees with the database if it ever
  sorts locally; the two cannot disagree because the keys are the same words.
*/

const COLUMNS: DataTableColumn<OrderSummary>[] = [
  {
    key: "order",
    header: "Order",
    sortValue: (order) => order.orderNumber,
    cell: (order) => (
      <Link
        href={`/admin/orders/${order.id}`}
        className="font-heading text-sm font-semibold tracking-[-0.01em] text-forest underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {order.orderNumber}
      </Link>
    ),
  },
  {
    key: "customer",
    header: "Customer",
    sortValue: (order) => order.email,
    /* A long address may be longer than the column: capped and dotted, so the
       table never stretches past its card for one backstage address. */
    cell: (order) => (
      <span className="inline-block max-w-56 truncate text-ink/70 align-middle">
        {order.email}
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

export function OrdersTable({
  orders,
  sort,
  dir,
}: {
  orders: OrderSummary[];
  sort: OrderSortKey;
  dir: SortDir;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSort(next: { key: string; dir: "asc" | "desc" }) {
    const params = new URLSearchParams(searchParams);
    params.set("sort", next.key);
    params.set("dir", next.dir);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <DataTable
      columns={COLUMNS}
      rows={orders}
      rowKey={(order) => order.id}
      rowActions={(order) => <OrderRowActions order={order} />}
      sort={{ key: sort, dir }}
      onSortChange={handleSort}
    />
  );
}
