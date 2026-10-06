import { cn } from "cn";

import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/constants";

/**
 * The one visual language for an order's state.
 *
 * The account pages and the admin screens both colour their statuses from here,
 * so "fulfilled" cannot look confident in the shop and tentative in the back
 * office. Colour carries the emphasis and the text carries the meaning: neutral
 * for a still-resting order, forest for money taken, filled forest for a box on
 * a van, and the system's red for the two ways an order can end on a bad note.
 */
const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "border-ink/10 bg-ink/[0.05] text-ink/70",
  PAID: "border-forest/20 bg-mint text-forest",
  FULFILLED: "border-forest bg-forest text-white",
  CANCELLED: "border-ink/10 bg-ink/[0.05] text-ink/50",
  REFUNDED: "border-destructive/25 bg-destructive/10 text-destructive",
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