import { OrderStatusBadge } from "@/components/account/order-status-badge";
import type { OrderStatus } from "@/lib/constants";

/**
 * The back office's name for the shop's order pill.
 *
 * Deliberately a thin wrapper, not a second badge: the account area owns the
 * colours, and one component means "fulfilled" cannot look confident in the
 * shop and tentative in the desk. Admin screens reach for `StatusBadge`;
 * the markup and palette stay single-sourced behind it.
 */
export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return <OrderStatusBadge status={status} className={className} />;
}
