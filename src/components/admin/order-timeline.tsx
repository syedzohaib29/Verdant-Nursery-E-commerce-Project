"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckIcon, TruckIcon, XIcon } from "lucide-react";

import { updateOrderStatusAction } from "@/app/actions/admin-orders";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/status-badge";
import { cn } from "cn";
import {
  nextStatuses,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/constants";
import type { OrderDetail } from "@/lib/data/orders";

/**
 * The order's fulfilment timeline and the controls that move it.
 *
 * The stepper shows where the order is in the lifecycle; the buttons below
 * offer only the legal next moves. Invalid transitions are hidden, not
 * disabled — a button that cannot be pressed is a question, and the answer is
 * "this order is not in a state where that move exists".
 *
 * Shipping offers a tracking number inline — optional, because the desk can
 * box a plant before the carrier assigns the number. Cancelling explains what
 * happens to the stock.
 */
export function OrderTimeline({ order }: { order: OrderDetail }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [trackingDraft, setTrackingDraft] = useState("");

  const moves = nextStatuses(order.status);
  const showsTracking = moves.includes("SHIPPED");

  async function move(to: OrderStatus) {
    setPending(true);

    const result = await updateOrderStatusAction({
      orderId: order.id,
      to,
      // The tracking field only shows for a shipment; everywhere else the
      // number is none of the move's business.
      trackingNumber: showsTracking ? trackingDraft.trim() || null : null,
    });

    setPending(false);

    if (result.success) {
      toast.success(
        to === "CANCELLED"
          ? "Order cancelled. The stock is back on the shelf."
          : `Order moved to ${ORDER_STATUS_LABELS[to]}.`,
      );
      router.refresh();
    } else {
      toast.error(result.error || "We could not move that order.");
    }
  }

  const currentIndex = ORDER_STATUSES.indexOf(order.status);

  return (
    <div>
      {/* The stepper */}
      <ol className="flex items-start">
        {ORDER_STATUSES.map((status, index) => {
          const isCancelled = order.status === "CANCELLED";
          const isCurrent = status === order.status;
          const isDone =
            isCancelled ? index === 0 : index < currentIndex;
          const isCancelledNode = isCancelled && status === "CANCELLED";

          return (
          <li
            key={status}
            className={cn("min-w-0 flex items-start", index < ORDER_STATUSES.length - 1 && "flex-1")}
          >
            <div className="flex min-w-0 flex-col items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-[0.8125rem] leading-none font-semibold",
                  isCancelledNode
                    ? "border-destructive bg-destructive text-white"
                    : isDone
                      ? "border-forest bg-forest text-white"
                      : isCurrent
                        ? "border-forest bg-mint text-forest ring-4 ring-forest/10"
                        : "border-ink/15 bg-white text-ink/40",
                )}
              >
                {isDone ? (
                  <CheckIcon className="size-4" strokeWidth={2.5} />
                ) : isCancelledNode ? (
                  <XIcon className="size-4" strokeWidth={2.5} />
                ) : (
                  index + 1
                )}
              </span>
              <p
                className={cn(
                  "mt-2 text-center text-[0.6875rem] leading-snug font-medium sm:text-[0.8125rem]",
                  isCurrent
                    ? "text-forest"
                    : isCancelledNode
                      ? "text-destructive"
                      : isDone
                        ? "text-ink/70"
                        : "text-ink/45",
                )}
              >
                {ORDER_STATUS_LABELS[status]}
              </p>
            </div>

            {index < ORDER_STATUSES.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "relative top-4 h-0.5 min-w-2 flex-1 rounded-full sm:min-w-4",
                  isCancelled
                    ? "bg-ink/15"
                    : isDone
                      ? "bg-forest"
                      : "bg-ink/15",
                )}
              />
            ) : null}
          </li>
          );
        })}
      </ol>

      {/* The current status, spelled out */}
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-ink/10 bg-warm-white p-4">
        <StatusBadge status={order.status} />
        <p className="text-small text-ink/60">
          {order.status === "PENDING" &&
            "Waiting for a person to confirm it and start packing."}
          {order.status === "CONFIRMED" &&
            "Confirmed and being packed. Ready to ship when it is boxed."}
          {order.status === "SHIPPED" &&
            (order.trackingNumber
              ? `On the road — ${order.trackingNumber}.`
              : "On the road.")}
          {order.status === "DELIVERED" &&
            "Delivered. The plant is on the customer's shelf."}
          {order.status === "CANCELLED" &&
            "Cancelled. Nothing was taken and the stock is back."}
        </p>
      </div>

      {/* The legal next moves */}
      {moves.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3">
          {showsTracking ? (
            <div>
              <label
                htmlFor="timeline-tracking"
                className="mb-1.5 block text-small font-medium text-ink"
              >
                Tracking number (optional)
              </label>
              <input
                id="timeline-tracking"
                type="text"
                value={trackingDraft}
                onChange={(event) => setTrackingDraft(event.target.value)}
                placeholder="1Z999AA10123456784"
                className="h-12 w-full rounded-lg border border-ink/15 bg-white px-4 text-body text-ink tabular-nums outline-none transition-[color,border-color,background-color] duration-200 ease-verdant placeholder:text-ink/45 focus-visible:border-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
              <p className="mt-1.5 text-xs text-ink/45">
                The carrier's number, for the customer to follow the parcel. Add
                it now or later.
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {moves.map((status) => (
              <Button
                key={status}
                type="button"
                variant={status === "CANCELLED" ? "outline" : "default"}
                size="sm"
                onClick={() => void move(status)}
                loading={pending}
              >
                {status === "SHIPPED" ? (
                  <TruckIcon aria-hidden="true" className="size-4" />
                ) : null}
                {status === "CANCELLED"
                  ? "Cancel order"
                  : `Mark ${ORDER_STATUS_LABELS[status].toLowerCase()}`}
              </Button>
            ))}
          </div>

          {moves.includes("CANCELLED") ? (
            <p className="text-xs text-ink/45">
              Cancelling puts every line back on the shelf and cannot be undone.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-ink/10 bg-warm-white p-4 text-small text-ink/60">
          {order.status === "DELIVERED"
            ? "This order is complete. There is nothing left to move."
            : "This order was cancelled. There is nothing left to move."}
        </p>
      )}
    </div>
  );
}
