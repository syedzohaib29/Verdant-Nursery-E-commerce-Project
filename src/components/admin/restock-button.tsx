"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { restockProductAction } from "@/app/actions/admin";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { RESTOCK_BATCH } from "@/lib/constants";

/**
 * One shelf's "Restock": confirm first, then ask the server to add the batch.
 *
 * The dialog quotes RESTOCK_BATCH for the exact before-and-after it is about to
 * perform, and the server adds that same constant — so the copy cannot promise
 * twelve and deliver ten. On success the router refreshes, which re-renders the
 * dashboard (and its bell count) from the database rather than from an
 * optimistic guess.
 */
export function RestockButton({
  productId,
  productName,
  stock,
}: {
  productId: string;
  productName: string;
  stock: number;
}) {
  const router = useRouter();

  async function handleRestock() {
    const result = await restockProductAction({ productId });

    if (result.success) {
      toast.success(`${productName} restocked`, {
        description: `${stock} on the shelf → ${result.stock}.`,
      });
      router.refresh();
      return;
    }

    toast.error(result.error);
  }

  return (
    <ConfirmDialog
      trigger={
        <Button variant="secondary" size="sm">
          Restock
        </Button>
      }
      title={`Restock ${productName}?`}
      description={`Adds ${RESTOCK_BATCH} units to the shelf — ${stock} in stock becomes ${stock + RESTOCK_BATCH}.`}
      confirmLabel={`Add ${RESTOCK_BATCH}`}
      onConfirm={handleRestock}
    />
  );
}
