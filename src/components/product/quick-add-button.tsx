"use client";

import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import type { ProductCard as ProductCardData } from "@/lib/data/products";

import { cn } from "cn";

/**
 * Quick-add: one unit of a plant into the basket, from the card.
 *
 * The card is the busiest place on the site, so this stays deliberately small —
 * a single unit, no quantity stepper, no options. Choosing a size or a pot is a
 * decision that belongs on the product page, and a card that pretended otherwise
 * would be a dead control.
 *
 * Adding is the one place the basket announces itself. The quick-add button
 * hovers in on desktop and is always there on touch, so on a phone it is the main
 * way anything gets into the basket — which is exactly why it opens the drawer.
 * A confirmation toast as well would be two notifications of one event, and the
 * drawer already highlights the line that just arrived.
 *
 * Nothing here reads a price for the purpose of charging. The store caches what it
 * needs to draw a line item; the server decides what anything costs.
 */
export function QuickAddButton({
  product,
  className,
}: {
  product: ProductCardData;
  className?: string;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const markAdded = useCartStore((state) => state.markAdded);
  const openDrawer = useCartStore((state) => state.openDrawer);

  return (
    <Button
      size="sm"
      variant="inverted"
      onClick={() => {
        addItem({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          priceCents: product.effectivePriceCents,
          image: product.image,
          stock: product.stock,
        });

        // Order matters: mark first, so the drawer finds the highlight waiting, and
        // open last, so the line is already in the list on the frame it appears.
        markAdded(product.id);
        openDrawer();
      }}
      // 44px at every width. It looks like a hover affordance on a desktop, but
      // it is not only one: an iPad in landscape reports a fine pointer and is
      // still touched with a thumb, so a `lg:`-gated 36px pill would be the short
      // end on a real device. A pill that small also reads as a label rather than a
      // button, which is the wrong affordance for something you can press.
      className={cn("h-11 gap-1.5 px-3 text-[0.8125rem]", className)}
    >
      <PlusIcon aria-hidden="true" className="size-4" />
      Add
      <span className="sr-only">{product.name} to the basket</span>
    </Button>
  );
}
