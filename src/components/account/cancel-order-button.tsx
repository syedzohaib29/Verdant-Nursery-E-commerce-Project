"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cancelOrderAction } from "@/app/actions/checkout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Cancels a pending cash-on-delivery order from the account order page.
 *
 * Cancelling restocks plants and writes off an order, so it earns a confirm
 * dialog rather than a one-click button — but the confirm is the whole cost:
 * the action itself is idempotent, so a double tap cannot restock twice.
 */
export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function onCancel() {
    if (pending) return;
    setPending(true);

    const result = await cancelOrderAction({ orderId });

    setPending(false);
    setOpen(false);

    if (!result.success) {
      toast.error(result.error ?? "We could not cancel the order.");
      return;
    }

    toast.success("Order cancelled — those plants are back on the shelf.");
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Cancel order
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>
              The plants go back on the shelf and nothing is charged. You cannot
              undo this from your account — write to us if you change your mind.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Keep the order
            </Button>
            <Button
              variant="destructive"
              loading={pending}
              onClick={() => void onCancel()}
            >
              {pending ? "Cancelling…" : "Cancel order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}