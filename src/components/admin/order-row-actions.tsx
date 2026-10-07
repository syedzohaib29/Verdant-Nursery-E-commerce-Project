"use client";

import Link from "next/link";
import { toast } from "sonner";
import { CopyIcon, EyeIcon, MoreHorizontalIcon } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { OrderSummary } from "@/lib/data/orders";

/**
 * The menu at the end of every order row: open the order, or take its number
 * with you. Two actions, both real — a menu with one item is decoration, and a
 * menu with a dead item is worse than neither.
 */
export function OrderRowActions({ order }: { order: OrderSummary }) {
  async function copyOrderNumber() {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      toast.success("Order number copied", { description: order.orderNumber });
    } catch {
      toast.error("Copying is blocked here — select the number on the row instead.");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${order.orderNumber}`}
            className="min-h-11 min-w-11 text-ink/60 sm:min-h-9 sm:min-w-9"
          />
        }
      >
        <MoreHorizontalIcon aria-hidden="true" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          render={<Link href={`/admin/orders/${order.id}`} />}
          className="min-h-11"
        >
          <EyeIcon aria-hidden="true" strokeWidth={1.75} />
          View order
        </DropdownMenuItem>
        <DropdownMenuItem className="min-h-11" onClick={() => void copyOrderNumber()}>
          <CopyIcon aria-hidden="true" strokeWidth={1.75} />
          Copy order number
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
