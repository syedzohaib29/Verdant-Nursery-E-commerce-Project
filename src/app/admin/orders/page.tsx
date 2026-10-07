import type { Metadata } from "next";
import Link from "next/link";
import { DownloadIcon, SearchXIcon } from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { OrdersTable } from "@/components/admin/orders-table";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { SearchInput } from "@/components/search-input";
import {
  ADMIN_ORDERS_PER_PAGE,
  getAdminOrdersPage,
  getAdminOrderStatusCounts,
} from "@/lib/data/admin-orders";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/constants";
import { adminOrderFilterSchema } from "@/lib/validations/admin";

import { cn } from "cn";

export const metadata: Metadata = {
  title: "Orders",
};

/**
 * Every order the shop has taken, with the controls a ledger needs: which
 * status you are looking at, a text search across number, email and name, a
 * date range, sorting on the columns, and pagination — all in the URL, so any
 * view of this list is a link that survives a refresh.
 *
 * The schema in /validations/admin.ts is the bouncer: anything unrecognised in
 * the query string falls back to the default list instead of a 500.
 */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const parsed = adminOrderFilterSchema.safeParse(params);
  const filters = parsed.success
    ? parsed.data
    : adminOrderFilterSchema.parse({});

  const [counts, result] = await Promise.all([
    getAdminOrderStatusCounts(),
    getAdminOrdersPage({
      q: filters.q,
      status: filters.status,
      from: filters.from,
      to: filters.to,
      page: filters.page,
      sort: filters.sort,
      dir: filters.dir,
    }),
  ]);

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  const hrefFor = (next: Partial<typeof filters>) => {
    const merged = { ...filters, ...next };
    const params = new URLSearchParams();

    if (merged.q) params.set("q", merged.q);
    if (merged.status) params.set("status", merged.status);
    if (merged.from) params.set("from", merged.from);
    if (merged.to) params.set("to", merged.to);
    if (merged.sort !== "date") params.set("sort", merged.sort);
    if (merged.dir !== "desc") params.set("dir", merged.dir);
    if (merged.page > 1) params.set("page", String(merged.page));

    const search = params.toString();
    return search ? `/admin/orders?${search}` : "/admin/orders";
  };

  // The export honours the same filters, minus pagination.
  const exportParams = new URLSearchParams();
  if (filters.q) exportParams.set("q", filters.q);
  if (filters.status) exportParams.set("status", filters.status);
  if (filters.from) exportParams.set("from", filters.from);
  if (filters.to) exportParams.set("to", filters.to);
  const exportHref = `/api/admin/orders/export${
    exportParams.toString() ? `?${exportParams.toString()}` : ""
  }`;

  const firstRow = (filters.page - 1) * ADMIN_ORDERS_PER_PAGE + 1;
  const lastRow = firstRow + result.rows.length - 1;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description={`${total} ${
          total === 1 ? "order" : "orders"
        } on the books${filters.status ? `, showing the ${ORDER_STATUS_LABELS[filters.status].toLowerCase()} ones` : ""}.`}
        actions={
          <a
            href={exportHref}
            download
            className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-ink/20 px-4 text-sm font-medium text-ink outline-none transition-colors duration-200 hover:border-ink/45 hover:bg-ink/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <DownloadIcon aria-hidden="true" strokeWidth={1.75} className="size-4" />
            Export CSV
          </a>
        }
      />

      {/* Status tabs: one link per status, counts included, plus "All". */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter by status">
        {(
          [
            { key: null, label: "All", count: total },
            ...ORDER_STATUSES.map((status) => ({
              key: status as OrderStatus | null,
              label: ORDER_STATUS_LABELS[status],
              count: counts[status],
            })),
          ] as { key: OrderStatus | null; label: string; count: number }[]
        ).map((chip) => {
          const isActive = chip.key === (filters.status ?? null);
          const href = (() => {
            const params = new URLSearchParams();
            if (filters.q) params.set("q", filters.q);
            if (chip.key) params.set("status", chip.key);
            if (filters.from) params.set("from", filters.from);
            if (filters.to) params.set("to", filters.to);
            if (filters.sort !== "date") params.set("sort", filters.sort);
            if (filters.dir !== "desc") params.set("dir", filters.dir);
            const search = params.toString();
            return search ? `/admin/orders?${search}` : "/admin/orders";
          })();

          return (
            <Link
              key={chip.key ?? "all"}
              href={href}
              role="tab"
              aria-selected={isActive}
              className={cn(
                "flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                isActive
                  ? "border-forest bg-forest text-white"
                  : "border-ink/15 bg-white text-ink/65 hover:border-ink/35 hover:text-ink",
              )}
            >
              {chip.label}
              <span
                className={cn(
                  "text-xs tabular-nums",
                  isActive ? "text-white/70" : "text-ink/40",
                )}
              >
                {chip.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Search + date range */}
      <div className="flex flex-wrap items-center gap-2">
        <form action="/admin/orders" className="w-full sm:max-w-xs" role="search">
          <SearchInput
            label="Search orders"
            placeholder="Search number, email or name…"
            defaultValue={filters.q ?? ""}
          />
          {/* Preserve the other filters through the search submit. */}
          {filters.status ? <input type="hidden" name="status" value={filters.status} /> : null}
          {filters.from ? <input type="hidden" name="from" value={filters.from} /> : null}
          {filters.to ? <input type="hidden" name="to" value={filters.to} /> : null}
          {filters.sort !== "date" ? <input type="hidden" name="sort" value={filters.sort} /> : null}
          {filters.dir !== "desc" ? <input type="hidden" name="dir" value={filters.dir} /> : null}
        </form>

        <form action="/admin/orders" className="flex flex-wrap items-center gap-2">
          <label htmlFor="orders-from" className="text-small text-ink/55">
            From
          </label>
          <input
            id="orders-from"
            type="date"
            name="from"
            defaultValue={filters.from ?? ""}
            className="h-11 rounded-lg border border-ink/15 bg-white px-3 text-sm text-ink outline-none focus-visible:border-forest"
          />
          <span className="text-small text-ink/40">to</span>
          <input
            id="orders-to"
            type="date"
            name="to"
            defaultValue={filters.to ?? ""}
            aria-label="To date"
            className="h-11 rounded-lg border border-ink/15 bg-white px-3 text-sm text-ink outline-none focus-visible:border-forest"
          />
          {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
          {filters.status ? <input type="hidden" name="status" value={filters.status} /> : null}
          {filters.sort !== "date" ? <input type="hidden" name="sort" value={filters.sort} /> : null}
          {filters.dir !== "desc" ? <input type="hidden" name="dir" value={filters.dir} /> : null}
          <button
            type="submit"
            className="h-11 rounded-lg border border-ink/20 px-4 text-sm font-medium text-ink outline-none transition-colors duration-200 hover:border-ink/45 hover:bg-ink/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Apply
          </button>
        </form>
      </div>

      <section className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
        {result.rows.length === 0 ? (
          <EmptyState
            icon={SearchXIcon}
            title="Nothing matches"
            description={
              filters.q || filters.status || filters.from || filters.to
                ? "No orders fit those filters. Clear them and try again."
                : "The first order the shop takes will land here."
            }
            action={
              filters.q || filters.status || filters.from || filters.to ? (
                <Link
                  href="/admin/orders"
                  className="inline-flex h-11 items-center rounded-lg border border-ink/20 px-4 text-sm font-medium text-ink outline-none transition-colors duration-200 hover:border-ink/45 hover:bg-ink/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  Clear filters
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <OrdersTable
              orders={result.rows}
              sort={filters.sort}
              dir={filters.dir}
            />

            <div className="mt-6 flex flex-col gap-4 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-small text-ink/55 tabular-nums">
                Showing {firstRow}–{lastRow} of {result.total}
              </p>
              <div className="w-full sm:w-auto">
                <Pagination
                  page={filters.page}
                  pageCount={result.pageCount}
                  hrefFor={(page) => hrefFor({ page })}
                />
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
