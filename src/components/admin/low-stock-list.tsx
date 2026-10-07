import Image from "next/image";
import { LeafIcon } from "lucide-react";

import { RestockButton } from "@/components/admin/restock-button";
import type { LowStockItem } from "@/lib/data/admin";
import { cn } from "cn";

/**
 * The shelves that need topping up, emptiest first.
 *
 * Each row carries the product, its SKU, what is left (the count goes
 * destructive at zero, because "0 on the shelf" deserves to look different
 * from "3 on the shelf") and the restock control — the whole action fits on
 * one line on a desktop and folds to two on a phone without ever scrolling
 * sideways.
 */
export function LowStockList({ items }: { items: LowStockItem[] }) {
  return (
    <ul className="flex flex-col divide-y divide-ink/[0.07]">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
          <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-mint">
            {item.image ? (
              <Image
                src={item.image}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <LeafIcon aria-hidden="true" className="size-4 text-forest" strokeWidth={1.75} />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate font-heading text-sm font-semibold tracking-[-0.01em] text-ink">
                {item.name}
              </p>
              <p
                className={cn(
                  "shrink-0 text-sm font-semibold tabular-nums",
                  item.stock === 0 ? "text-destructive" : "text-ink",
                )}
              >
                {item.stock}
              </p>
            </div>

            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs text-ink/45 tabular-nums">
                {item.sku} &middot;{" "}
                {item.stock === 0 ? "out of stock" : "on the shelf"}
              </p>
              <RestockButton
                productId={item.id}
                productName={item.name}
                stock={item.stock}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
