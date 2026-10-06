import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { OrderStatusBadge } from "@/components/account/order-status-badge";
import type { OrderSummary } from "@/lib/data/orders";

/**
 * One order, as a link.
 *
 * Shared by the overview's "recent orders" and the full orders page so the two
 * lists cannot decide to mean different things by the same number. The number is
 * what a customer quotes on the phone, so it is the headline; the badge is the
 * second thing a returning visitor looks at.
 */
export function OrderCard({ order }: { order: OrderSummary }) {
  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="group block rounded-xl border border-ink/10 bg-white p-5 outline-none transition-[border-color,transform] duration-200 ease-verdant hover:border-forest/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.99]"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <p className="font-heading text-[1.0625rem] leading-none font-semibold tracking-[-0.01em] text-ink">
            {order.orderNumber}
          </p>
          <p className="mt-2 text-small text-text-muted">
            {order.createdAtLabel} · {order.itemCount}{" "}
            {order.itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-ink/10 pt-4">
        <p className="text-small text-text-muted">
          Total{" "}
          <span className="font-medium tracking-normal text-ink tabular-nums">
            {order.totalLabel}
          </span>
        </p>
        <span className="flex items-center gap-1 text-small font-medium text-forest">
          Details
          <ChevronRightIcon
            aria-hidden="true"
            strokeWidth={1.75}
            className="size-4 transition-transform duration-300 ease-verdant group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}