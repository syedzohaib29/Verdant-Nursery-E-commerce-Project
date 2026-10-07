"use client";

import { useState, type ReactElement, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * The pause before a state change: an explicit trigger, the consequence spelled
 * out in plain words, and a confirm button that wears the spinner while the
 * action is in flight.
 *
 * The caller owns the actual work and reports its own failures (a toast, a
 * message); the dialog owns only the open state — it closes when `onConfirm`
 * resolves and stays up if the caller throws, so a failed action never
 * disappears the explanation of what was being attempted.
 *
 * The open state can also be controlled from outside, which is how a row's
 * dropdown menu opens it: the menu item sets a row, the dialog reads it back.
 * A controlled dialog takes no `trigger` — nothing inside it should be able to
 * open it a second way.
 */
export function ConfirmDialog({
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
}: {
  /** The element that opens the dialog — a real element (a Button), because
   *  Base UI's `render` needs one to attach the trigger behaviour to. */
  trigger?: ReactElement;
  /** Controlled open state. Omit both of these for the self-managed trigger. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  function setOpen(next: boolean) {
    if (pending) return;

    if (isControlled) onOpenChangeProp?.(next);
    else setUncontrolledOpen(next);
  }

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // The caller surfaces the error; keeping the dialog open keeps the
      // context for a second attempt.
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button size="sm" onClick={() => void handleConfirm()} loading={pending}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
