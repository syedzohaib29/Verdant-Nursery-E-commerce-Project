"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BanIcon, CheckIcon, MailIcon, PhoneIcon } from "lucide-react";

import { toggleCustomerDisabledAction } from "@/app/actions/admin-customers";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AdminCustomerDetail } from "@/lib/data/admin-customers";

/**
 * The customer detail drawer.
 *
 * A drawer rather than a page because the desk's workflow is "scan the table,
 * open one customer, act, close" — a page would break that rhythm. The summary
 * and the five most recent orders are everything a support question needs.
 */
export function CustomerDrawer({
  customer,
  onOpenChange,
}: {
  customer: AdminCustomerDetail | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggleDisabled() {
    if (!customer) return;

    setPending(true);

    const result = await toggleCustomerDisabledAction({
      userId: customer.id,
    });

    setPending(false);

    if (result.success) {
      toast.success(
        customer.disabled
          ? "Account unlocked."
          : "Account locked out.",
      );
      router.refresh();
    } else {
      toast.error(result.error || "We could not change that account.");
    }
  }

  return (
    <Sheet open={customer !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto bg-white p-0 sm:max-w-lg"
      >
        {customer ? (
          <>
            <SheetHeader className="border-b border-ink/10 px-5 py-4 sm:px-6">
              <SheetTitle className="font-heading text-h3 font-semibold tracking-[-0.02em] text-ink">
                {customer.name}
              </SheetTitle>
              <SheetDescription>
                {customer.email}
                {customer.phone ? ` · ${customer.phone}` : ""}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-6 px-5 py-5 sm:px-6">
              {/* Summary */}
              <dl className="grid grid-cols-3 gap-4 rounded-xl border border-ink/10 bg-warm-white p-4">
                <div>
                  <dt className="text-xs text-ink/45">Orders</dt>
                  <dd className="mt-1 font-heading text-lg font-semibold text-ink tabular-nums">
                    {customer.orderCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink/45">Total spent</dt>
                  <dd className="mt-1 font-heading text-lg font-semibold text-ink tabular-nums">
                    {customer.totalSpentLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink/45">Joined</dt>
                  <dd className="mt-1 font-heading text-lg font-semibold text-ink">
                    {customer.joinedLabel}
                  </dd>
                </div>
              </dl>

              {/* Account state */}
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={
                    customer.disabled
                      ? "inline-flex items-center gap-1.5 rounded-full border border-destructive/25 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive"
                      : "inline-flex items-center gap-1.5 rounded-full border border-forest/20 bg-mint px-3 py-1 text-xs font-medium text-forest"
                  }
                >
                  {customer.disabled ? (
                    <>
                      <BanIcon aria-hidden="true" className="size-3.5" />
                      Locked out
                    </>
                  ) : (
                    <>
                      <CheckIcon aria-hidden="true" className="size-3.5" />
                      Active
                    </>
                  )}
                </span>
                <Button
                  type="button"
                  variant={customer.disabled ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => void toggleDisabled()}
                  loading={pending}
                  className="ml-auto"
                >
                  {customer.disabled ? "Unlock account" : "Lock out account"}
                </Button>
              </div>

              {customer.disabled ? (
                <p className="rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-small text-destructive">
                  This customer cannot sign in. Their orders and reviews are
                  still on the books.
                </p>
              ) : null}

              {/* Recent orders */}
              <div>
                <h3 className="font-heading text-base font-semibold text-ink">
                  Recent orders
                </h3>

                {customer.recentOrders.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-dashed border-ink/20 bg-warm-white p-4 text-center text-small text-ink/50">
                    No orders yet.
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-col divide-y divide-ink/10 rounded-xl border border-ink/10">
                    {customer.recentOrders.map((order) => (
                      <li key={order.id}>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="flex items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-ink/[0.03]"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-ink">
                              {order.orderNumber}
                            </p>
                            <p className="mt-0.5 text-xs text-ink/50">
                              {order.createdAtLabel} · {order.itemCount}{" "}
                              {order.itemCount === 1 ? "item" : "items"} ·{" "}
                              {order.totalLabel}
                            </p>
                          </div>
                          <StatusBadge status={order.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Contact */}
              <div>
                <h3 className="font-heading text-base font-semibold text-ink">
                  Contact
                </h3>
                <div className="mt-3 flex flex-col gap-2 text-small text-ink/70">
                  <span className="flex items-center gap-2">
                    <MailIcon aria-hidden="true" className="size-4 text-ink/40" />
                    {customer.email}
                  </span>
                  {customer.phone ? (
                    <span className="flex items-center gap-2">
                      <PhoneIcon aria-hidden="true" className="size-4 text-ink/40" />
                      {customer.phone}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
