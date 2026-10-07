"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ExternalLinkIcon,
  MoreHorizontalIcon,
  PackageIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";

import {
  deleteProductAction,
  toggleProductActiveAction,
} from "@/app/actions/admin-products";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminProductRow, SortDir } from "@/lib/data/admin-products";
import { cn } from "cn";

/*
  The catalogue table.

  The server owns the order — a header click reports the next sort through the
  URL, the page re-queries, and the rows arrive already sorted (the DataTable
  re-sorts the same page locally with the same keys, so the two agree). The
  active toggle and the row menu act immediately on the row you are looking
  at; both go through server actions and refresh the list.
*/

const columns: DataTableColumn<AdminProductRow>[] = [
  {
    key: "name",
    header: "Product",
    sortValue: (product) => product.name,
    cell: (product) => (
      <Link
        href={`/admin/products/${product.id}`}
        className="flex min-w-56 items-center gap-3 rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {/* The 48px photograph a scan of the shelf expects. */}
        <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-mint">
          {product.image ? (
            <Image
              src={product.image}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-ink/25">
              <PackageIcon className="size-5" />
            </span>
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-heading text-sm font-semibold tracking-[-0.01em] text-ink">
            {product.name}
          </span>
          <span className="mt-0.5 block text-xs text-ink/45 tabular-nums">
            {product.sku}
          </span>
        </span>
      </Link>
    ),
  },
  {
    key: "price",
    header: "Price",
    numeric: true,
    sortValue: (product) => product.priceCents,
    cell: (product) => (
      <span className="inline-block">
        <span className="block text-sm font-medium text-ink">
          {product.priceLabel}
        </span>
        {product.onSale && product.salePriceLabel ? (
          <span className="mt-0.5 block text-xs text-forest tabular-nums">
            Sale {product.salePriceLabel}
          </span>
        ) : null}
      </span>
    ),
  },
  {
    key: "stock",
    header: "Stock",
    numeric: true,
    sortValue: (product) => product.stock,
    cell: (product) => (
      <span className="inline-flex flex-col items-end gap-1">
        <span className="text-sm text-ink tabular-nums">
          {product.stock} in stock
        </span>
        {product.outOfStock ? (
          <span className="rounded-full border border-destructive/25 bg-destructive/10 px-2 py-0.5 text-[0.6875rem] font-medium text-destructive">
            Out of stock
          </span>
        ) : product.lowStock ? (
          <span className="rounded-full border border-forest/20 bg-mint px-2 py-0.5 text-[0.6875rem] font-medium text-forest">
            Low stock
          </span>
        ) : null}
      </span>
    ),
  },
  {
    key: "status",
    header: "On shelf",
    cell: (product) => <ActiveToggle product={product} />,
  },
];

/** Takes one product on or off the shelf without opening the edit form. */
function ActiveToggle({ product }: { product: AdminProductRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);

    const result = await toggleProductActiveAction({
      productId: product.id,
    });

    setBusy(false);

    if (result.success) {
      toast.success(product.isActive ? "Taken off the shelf." : "On the shelf.", {
        description: product.name,
      });
      router.refresh();
    } else {
      toast.error(result.error || "We could not change that product.");
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={product.isActive}
      aria-label={
        product.isActive
          ? `Take ${product.name} off the shelf`
          : `Put ${product.name} on the shelf`
      }
      onClick={() => void toggle()}
      disabled={busy}
      className="flex h-11 w-11 items-center justify-center rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-60"
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative h-6 w-10 rounded-full transition-colors duration-200",
          product.isActive ? "bg-forest" : "bg-ink/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[left,right] duration-200",
            product.isActive ? "right-0.5" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

/** Edit, see it as a shopper does, or take it off the books. */
function ProductRowActions({
  product,
  onDelete,
}: {
  product: AdminProductRow;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${product.name}`}
            className="min-h-11 min-w-11 text-ink/60 sm:min-h-9 sm:min-w-9"
          />
        }
      >
        <MoreHorizontalIcon aria-hidden="true" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          render={<Link href={`/admin/products/${product.id}`} />}
          className="min-h-11"
        >
          <PencilIcon aria-hidden="true" strokeWidth={1.75} />
          Edit product
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<Link href={`/shop/${product.slug}`} target="_blank" />}
          className="min-h-11"
        >
          <ExternalLinkIcon aria-hidden="true" strokeWidth={1.75} />
          View on store
        </DropdownMenuItem>
        <DropdownMenuItem
          className="min-h-11 text-destructive data-[highlighted]:bg-destructive/10"
          onClick={onDelete}
        >
          <TrashIcon aria-hidden="true" strokeWidth={1.75} />
          Delete…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProductsTable({
  rows,
  sort,
  dir,
}: {
  rows: AdminProductRow[];
  sort: string;
  dir: SortDir;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [deleting, setDeleting] = useState<AdminProductRow | null>(null);

  function handleSort(next: { key: string; dir: "asc" | "desc" }) {
    const params = new URLSearchParams(searchParams);
    params.set("sort", next.key);
    params.set("dir", next.dir);
    // Page two of a different sort is a different list, not a continuation.
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  async function confirmDelete() {
    if (!deleting) return;

    const result = await deleteProductAction({ productId: deleting.id });

    if (result.success) {
      toast.success(
        deleting.hasOrders ? "Product taken off the shelf." : "Product deleted.",
        { description: deleting.name },
      );
      router.refresh();
    } else {
      toast.error(result.error || "We could not delete that product.");
    }
  }

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(product) => product.id}
        rowActions={(product) => (
          <ProductRowActions
            product={product}
            onDelete={() => setDeleting(product)}
          />
        )}
        sort={{ key: sort, dir }}
        onSortChange={handleSort}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={deleting ? `Delete “${deleting.name}”?` : "Delete product"}
        description={
          deleting?.hasOrders
            ? "This plant has orders on the books, so deleting takes it off the shop shelf and leaves its past orders intact."
            : deleting
              ? "This permanently deletes the product from the catalogue and cannot be undone."
              : ""
        }
        confirmLabel={deleting?.hasOrders ? "Take off shelf" : "Delete product"}
        onConfirm={() => confirmDelete()}
      />
    </>
  );
}

/**
 * The sort control for the phone, where there are no column headers to click.
 * On a desktop it steps aside — the headers do this job with less reading.
 */
const MOBILE_SORTS = [
  { value: "newest-desc", label: "Newest first" },
  { value: "name-asc", label: "Name, A to Z" },
  { value: "name-desc", label: "Name, Z to A" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "stock-asc", label: "Stock, low to high" },
  { value: "stock-desc", label: "Stock, high to low" },
] as const;

export function ProductMobileSort({
  sort,
  dir,
}: {
  sort: string;
  dir: SortDir;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="flex items-center gap-2 text-small text-ink/55 md:hidden">
      <span id="product-sort-label">Sort</span>
      <Select
        value={`${sort}-${dir}`}
        onValueChange={(next) => {
          if (next == null) return;
          const [nextSort = "newest", nextDir = "desc"] = next.split("-");
          const params = new URLSearchParams(searchParams);
          params.set("sort", nextSort);
          params.set("dir", nextDir);
          params.delete("page");
          router.push(`${pathname}?${params.toString()}`);
        }}
        items={[...MOBILE_SORTS]}
      >
        <SelectTrigger aria-labelledby="product-sort-label" className="min-w-0 flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MOBILE_SORTS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
