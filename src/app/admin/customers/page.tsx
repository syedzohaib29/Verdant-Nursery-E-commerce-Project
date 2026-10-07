import type { Metadata } from "next";

import { CustomerTable } from "@/components/admin/customer-table";
import { PageHeader } from "@/components/admin/page-header";
import { SearchInput } from "@/components/search-input";
import { getAdminCustomers } from "@/lib/data/admin-customers";

export const metadata: Metadata = {
  title: "Customers",
};

/**
 * The customer ledger.
 *
 * A table with the name, email, order count, lifetime spend and joined date,
 * plus a search. Opening a row slides in the drawer with the summary and the
 * five most recent orders — everything a support question needs.
 */
export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q =
    typeof params.q === "string" && params.q.trim()
      ? params.q.trim()
      : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const result = await getAdminCustomers({ q, page });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="People"
        title="Customers"
        description={`${result.total} ${
          result.total === 1 ? "customer" : "customers"
        } on the books.`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <form
          action="/admin/customers"
          className="w-full sm:max-w-xs"
          role="search"
        >
          <SearchInput
            label="Search customers"
            placeholder="Search by name or email…"
            defaultValue={q ?? ""}
          />
        </form>
      </div>

      <CustomerTable
        customers={result.rows}
        page={page}
        pageCount={result.pageCount}
        q={q}
      />
    </div>
  );
}
