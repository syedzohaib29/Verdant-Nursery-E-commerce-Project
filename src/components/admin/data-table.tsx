"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
} from "lucide-react";

import { cn } from "cn";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /**
   * Supplying a value makes the column sortable — it is both the signal and the
   * comparison itself. The value should sort the way the server would sort the
   * same key, so a controlled table and its database never disagree.
   */
  sortValue?: (row: T) => string | number;
  /** Right-aligns the column and sets tabular figures on both layouts. */
  numeric?: boolean;
};

export type DataTableSort = { key: string; dir: "asc" | "desc" };

/**
 * The admin table, twice.
 *
 * On a wide screen it is a real `<table>` with sortable headers (`aria-sort`
 * included); under `md` the same rows become stacked cards — first column as
 * the headline, the rest as label/value pairs — because a five-column table on
 * a 360px phone is a horizontal-scroll trap.
 *
 * Sorting has two modes with one control surface: hand it `sort` + `onSortChange`
 * and it reports the next state for the URL (the server is the source of truth,
 * used by the paginated order list); hand it only `sortValue` and it sorts the
 * rows it was given in place (used by the overview's recent-orders window).
 * `rowActions` renders as a trailing menu on desktop and sits beside the
 * headline on mobile.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowActions,
  sort,
  onSortChange,
  limit,
  empty,
  className,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowActions?: (row: T) => ReactNode;
  /** Controlled (server-sorted) mode. Omit to sort in place. */
  sort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;
  /** After sorting, show only the first N rows. */
  limit?: number;
  /** Rendered instead of the table when there is nothing to show. */
  empty?: ReactNode;
  className?: string;
}) {
  const [internalSort, setInternalSort] = useState<DataTableSort | null>(null);
  const active = sort ?? internalSort;

  function requestSort(column: DataTableColumn<T>) {
    if (!column.sortValue) return;

    let dir: "asc" | "desc" = column.numeric ? "desc" : "asc";
    if (active && active.key === column.key) {
      dir = active.dir === "asc" ? "desc" : "asc";
    }
    const next: DataTableSort = { key: column.key, dir };

    if (onSortChange) onSortChange(next);
    else setInternalSort(next);
  }

  const visible = useMemo(() => {
    const column = active
      ? columns.find((entry) => entry.key === active.key)
      : undefined;
    const read = column?.sortValue;

    let out = rows;
    if (read && active) {
      const factor = active.dir === "asc" ? 1 : -1;
      out = [...rows].sort((a, b) => {
        const left = read(a);
        const right = read(b);
        if (typeof left === "number" && typeof right === "number") {
          return (left - right) * factor;
        }
        return (
          String(left).localeCompare(String(right), undefined, {
            numeric: true,
            sensitivity: "base",
          }) * factor
        );
      });
    }

    return limit ? out.slice(0, limit) : out;
  }, [rows, columns, active, limit]);

  if (visible.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <>
      {/* Wide: a table, sortable by header. */}
      <div className={cn("hidden md:block", className)}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10">
              {columns.map((column) => {
                const isActive = active?.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      column.sortValue
                        ? isActive
                          ? active.dir === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                        : undefined
                    }
                    className={cn(
                      "px-3 py-2.5 first:pl-0 last:pr-0",
                      column.numeric && "text-right",
                    )}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => requestSort(column)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md text-xs font-medium tracking-[0.08em] uppercase outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                          isActive ? "text-ink" : "text-ink/45 hover:text-ink",
                        )}
                      >
                        {column.header}
                        <SortIndicator active={isActive ? active : null} />
                      </button>
                    ) : (
                      <span className="text-xs font-medium tracking-[0.08em] text-ink/45 uppercase">
                        {column.header}
                      </span>
                    )}
                  </th>
                );
              })}
              {rowActions ? (
                <th scope="col" className="w-12 pr-0 text-right">
                  <span className="sr-only">Row actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/[0.07]">
            {visible.map((row) => (
              <tr
                key={rowKey(row)}
                className="transition-colors duration-150 hover:bg-mint/60"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-3 py-3 align-middle first:pl-0 last:pr-0",
                      column.numeric && "tabular-nums text-right",
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
                {rowActions ? (
                  <td className="py-3 pr-0 text-right">{rowActions(row)}</td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Narrow: the same rows as cards, headline plus label/value pairs. */}
      <ul className={cn("flex flex-col gap-3 md:hidden", className)}>
        {visible.map((row) => (
          <li
            key={rowKey(row)}
            className="rounded-lg border border-ink/10 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">{columns[0].cell(row)}</div>
              {rowActions ? (
                <div className="shrink-0">{rowActions(row)}</div>
              ) : null}
            </div>
            {columns.length > 1 ? (
              <dl className="mt-3 flex flex-col gap-1.5 border-t border-ink/[0.07] pt-3">
                {columns.slice(1).map((column) => (
                  <div
                    key={column.key}
                    className="flex items-baseline justify-between gap-4"
                  >
                    <dt className="shrink-0 text-xs tracking-[0.06em] text-ink/45 uppercase">
                      {column.header}
                    </dt>
                    <dd
                      className={cn(
                        "min-w-0 text-right text-sm text-ink truncate",
                        column.numeric && "tabular-nums",
                      )}
                    >
                      {column.cell(row)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}

function SortIndicator({ active }: { active: DataTableSort | null }) {
  if (!active) {
    return (
      <ChevronsUpDownIcon
        aria-hidden="true"
        className="size-3.5 text-ink/30"
      />
    );
  }
  return active.dir === "asc" ? (
    <ArrowUpIcon aria-hidden="true" className="size-3.5" />
  ) : (
    <ArrowDownIcon aria-hidden="true" className="size-3.5" />
  );
}
