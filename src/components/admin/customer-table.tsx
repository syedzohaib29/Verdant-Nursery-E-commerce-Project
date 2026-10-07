"use client";

import { useState } from "react";
import { UsersIcon } from "lucide-react";

import { CustomerDrawer } from "@/components/admin/customer-drawer";
import { EmptyState } from "@/components/admin/empty-state";
import { Pagination } from "@/components/admin/pagination";
import type { AdminCustomerRow, AdminCustomerDetail } from "@/lib/data/admin-customers";
import { getCustomerDetailAction } from "@/app/actions/admin-customers";

/**
 * The customer table, with the drawer state.
 *
 * A client component because the drawer is interactive. The table itself is
 * presentational; clicking a row fetches the customer's detail and opens the
 * drawer.
 */
export function CustomerTable({
  customers,
  page,
  pageCount,
  q,
}: {
  customers: AdminCustomerRow[];
  page: number;
  pageCount: number;
  q?: string;
}) {
  const [selected, setSelected] = useState<AdminCustomerDetail | null>(null);

  function hrefFor(nextPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (nextPage > 1) params.set("page", String(nextPage));
    const search = params.toString();
    return search ? `/admin/customers?${search}` : "/admin/customers";
  }

  async function openCustomer(id: string) {
    const result = await getCustomerDetailAction({ userId: id });
    setSelected(result.customer);
  }

  if (customers.length === 0) {
    return (
      <section className="rounded-xl border border-ink/10 bg-white">
        <EmptyState
          icon={UsersIcon}
          title="No customers match"
          description="Try a different search."
        />
      </section>
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-ink/10 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs tracking-[0.06em] text-ink/45 uppercase">
                <th scope="col" className="px-5 py-3 font-medium">Customer</th>
                <th scope="col" className="hidden px-5 py-3 font-medium md:table-cell">Orders</th>
                <th scope="col" className="hidden px-5 py-3 font-medium sm:table-cell">Total spent</th>
                <th scope="col" className="hidden px-5 py-3 font-medium lg:table-cell">Joined</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.07]">
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  tabIndex={0}
                  aria-label={`View details for ${customer.name}`}
                  onClick={() => void openCustomer(customer.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      void openCustomer(customer.id);
                    }
                  }}
                  className="cursor-pointer transition-colors duration-150 hover:bg-mint/40 focus-visible:bg-mint/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-forest"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-heading text-sm font-semibold tracking-[-0.01em] text-ink">{customer.name}</p>
                    <p className="mt-0.5 text-xs text-ink/50">{customer.email}</p>
                  </td>
                  <td className="hidden px-5 py-3.5 text-ink/70 tabular-nums md:table-cell">
                    {customer.orderCount}
                  </td>
                  <td className="hidden px-5 py-3.5 text-ink/70 tabular-nums sm:table-cell">
                    {customer.totalSpentLabel}
                  </td>
                  <td className="hidden px-5 py-3.5 text-ink/50 lg:table-cell">
                    {customer.joinedLabel}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span
                      className={
                        customer.disabled
                          ? "inline-flex items-center rounded-full border border-destructive/25 bg-destructive/10 px-2.5 py-0.5 text-[0.75rem] font-medium text-destructive"
                          : "inline-flex items-center rounded-full border border-forest/20 bg-mint px-2.5 py-0.5 text-[0.75rem] font-medium text-forest"
                      }
                    >
                      {customer.disabled ? "Locked out" : "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-ink/10 px-5 py-4">
          <Pagination page={page} pageCount={pageCount} hrefFor={hrefFor} />
        </div>
      </section>

      <CustomerDrawer
        customer={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
