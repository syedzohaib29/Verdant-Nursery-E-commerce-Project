import type { Metadata } from "next";
import Link from "next/link";
import { PackageIcon, PlusIcon } from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { FilterSelect } from "@/components/admin/filter-select";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import {
  ProductMobileSort,
  ProductsTable,
} from "@/components/admin/products-table";
import { SearchInput } from "@/components/search-input";
import { getAdminProducts } from "@/lib/data/admin-products";
import { getCategoryOptions } from "@/lib/data/categories";
import { adminProductFilterSchema } from "@/lib/validations/admin";

export const metadata: Metadata = {
  title: "Products",
};

/**
 * The catalogue, as a working list.
 *
 * The search is a GET form and the pickers write the URL directly — every
 * filter is a URL param, so a filtered list survives a refresh and can be
 * pasted into a message. Sorting rides the table headers on a desktop and the
 * compact sort select on a phone, where there are no headers to press.
 */
export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = adminProductFilterSchema.safeParse(params);
  const filters = query.success ? query.data : adminProductFilterSchema.parse({});

  const [page, categories] = await Promise.all([
    getAdminProducts({
      q: filters.q,
      categoryId: filters.categoryId,
      status: filters.status,
      stock: filters.stock,
      page: filters.page,
      sort: filters.sort,
      dir: filters.dir,
    }),
    getCategoryOptions(),
  ]);

  const hrefFor = (next: Partial<typeof filters>) => {
    const merged = { ...filters, ...next };
    const search = new URLSearchParams();

    if (merged.q) search.set("q", merged.q);
    if (merged.categoryId) search.set("categoryId", merged.categoryId);
    if (merged.status !== "all") search.set("status", merged.status);
    if (merged.stock !== "all") search.set("stock", merged.stock);
    if (merged.sort !== "newest") search.set("sort", merged.sort);
    if (merged.dir !== "desc") search.set("dir", merged.dir);
    if (merged.page > 1) search.set("page", String(merged.page));

    const queryString = search.toString();
    return queryString
      ? `/admin/products?${queryString}`
      : "/admin/products";
  };

  const hasFilters =
    Boolean(filters.q) ||
    Boolean(filters.categoryId) ||
    filters.status !== "all" ||
    filters.stock !== "all";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        description={`${page.total} ${
          page.total === 1 ? "plant" : "plants"
        } on the books.`}
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-forest px-4 text-sm font-medium text-white outline-none transition-colors duration-200 hover:bg-forest/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <PlusIcon aria-hidden="true" strokeWidth={1.75} className="size-4" />
            New product
          </Link>
        }
      />

      {/* Filter bar: the search gets a row of its own, the pickers share a
          wrapping grid — at 360px nothing squeezes anything else out. The
          hidden fields carry the pickers through a search submit, because
          searching inside a filtered list should not silently clear it. */}
      <div className="flex flex-col gap-2">
        <form
          action="/admin/products"
          className="w-full sm:max-w-xs"
          role="search"
        >
          <SearchInput
            label="Search products"
            placeholder="Search by name or SKU…"
            defaultValue={filters.q ?? ""}
          />
          {filters.categoryId ? (
            <input type="hidden" name="categoryId" value={filters.categoryId} />
          ) : null}
          {filters.status !== "all" ? (
            <input type="hidden" name="status" value={filters.status} />
          ) : null}
          {filters.stock !== "all" ? (
            <input type="hidden" name="stock" value={filters.stock} />
          ) : null}
        </form>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <FilterSelect
            param="categoryId"
            label="Filter by category"
            value={filters.categoryId ?? ""}
            options={[
              { value: "", label: "All categories" },
              ...categories.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
            className="col-span-2 sm:col-span-1"
            triggerClassName="w-full sm:w-auto sm:min-w-44"
          />

          <FilterSelect
            param="status"
            label="Filter by status"
            value={filters.status}
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "draft", label: "Draft" },
            ]}
            triggerClassName="w-full sm:w-auto sm:min-w-36"
          />

          <FilterSelect
            param="stock"
            label="Filter by stock level"
            value={filters.stock}
            options={[
              { value: "all", label: "All stock levels" },
              { value: "in", label: "In stock" },
              { value: "low", label: "Low stock" },
              { value: "out", label: "Out of stock" },
            ]}
            triggerClassName="w-full sm:w-auto sm:min-w-40"
          />
        </div>
      </div>

      <ProductMobileSort sort={filters.sort} dir={filters.dir} />

      {/* The list */}
      {page.rows.length === 0 ? (
        <section className="rounded-xl border border-ink/10 bg-white">
          <EmptyState
            icon={PackageIcon}
            title="No products match"
            description={
              hasFilters
                ? "Try a different search or clear the filters."
                : "The first plant on the books will land here."
            }
            action={
              hasFilters ? (
                <Link
                  href="/admin/products"
                  className="inline-flex h-11 items-center rounded-lg border border-ink/20 px-4 text-sm font-medium text-ink outline-none transition-colors duration-200 hover:border-ink/45 hover:bg-ink/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  Clear filters
                </Link>
              ) : undefined
            }
          />
        </section>
      ) : (
        <section className="rounded-xl border border-ink/10 bg-white p-4 sm:p-5">
          <ProductsTable
            rows={page.rows}
            sort={filters.sort}
            dir={filters.dir}
          />

          <div className="mt-4 flex flex-col gap-4 border-t border-ink/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-small text-ink/55 tabular-nums">
              {page.total} on the books
            </p>
            <div className="w-full sm:w-auto">
              <Pagination
                page={filters.page}
                pageCount={page.pageCount}
                hrefFor={(page) => hrefFor({ page })}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
