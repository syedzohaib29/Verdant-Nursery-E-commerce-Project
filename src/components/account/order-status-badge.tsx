import { cn } from "cn";

import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/constants";

/**
 * The one visual language for an order's state.
 *
 * The account pages and the admin screens both colour their statuses from here,
 * so "delivered" cannot look confident in the shop and tentative in the back
 * office. Colour carries the emphasis and the text carries the meaning: neutral
 * for a still-resting order, mint for one that is confirmed and being packed,
 * leaf for a box on a van, filled forest for one that has arrived, and pale ink
 * for the one way an order can end before it began.
 */
const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "border-ink/10 bg-ink/[0.05] text-ink/70",
  CONFIRMED: "border-forest/20 bg-mint text-forest",
  SHIPPED: "border-leaf/25 bg-leaf/10 text-forest",
  DELIVERED: "border-forest bg-forest text-white",
  CANCELLED: "border-ink/10 bg-ink/[0.05] text-ink/50",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2.5 text-[0.75rem] font-medium leading-none tracking-[-0.01em]",
        STATUS_STYLES[status],
        className,
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}