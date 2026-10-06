"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RefreshCcwIcon } from "lucide-react";

import { reorderAction } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";

/**
 * "Order it again" for one order.
 *
 * The action only reads the order — there is no cart on the server to put things
 * in. It returns the lines priced and stocked *today*, and this adds them to the
 * device cart the same way the buy box does, so reordering an order from three
 * months ago cannot resurrect an old price into a new charge.
 */
export function ReorderButton({ orderId }: { orderId: string }) {
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const [pending, setPending] = useState(false);

  async function onReorder() {
    if (pending) return;
    setPending(true);

    try {
      const result = await reorderAction({ orderId });

      if (!result.success) {
        toast.error(result.error ?? "We could not read that order.");
        return;
      }

      if (result.lines.length === 0) {
        toast.error(result.skipped > 0
          ? "None of those plants are available right now."
          : "There is nothing on that order to reorder.");
        return;
      }

      for (const line of result.lines) {
        addItem(
          {
            productId: line.productId,
            slug: line.slug,
            name: line.name,
            priceCents: line.priceCents,
            image: line.image,
            stock: line.stock,
          },
          line.quantity,
        );
      }

      openDrawer();

      const word = result.lines.length === 1 ? "plant" : "plants";
      const skippedNote =
        result.skipped > 0
          ? ` ${result.skipped} ${result.skipped === 1 ? "item" : "items"} ${
              result.skipped === 1 ? "was" : "were"
            } left out — ${result.skipped === 1 ? "it's" : "they're"} sold out.`
          : "";

      toast.success(
        `${result.lines.length} ${word} back in your basket.${skippedNote}`,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="secondary" onClick={() => void onReorder()} loading={pending}>
      <RefreshCcwIcon aria-hidden="true" strokeWidth={1.75} />
      Order again
    </Button>
  );
}