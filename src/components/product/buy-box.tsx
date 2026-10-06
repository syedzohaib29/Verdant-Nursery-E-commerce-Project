"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon, ShoppingBagIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import type { CartItemInput } from "@/store/cart";

import { cn } from "cn";

/**
 * The buy box: how many, and the add-to-basket button.
 *
 * The stepper is capped at what is actually on the shelf. A spinner that will
 * happily take sixty of a plant with three in the greenhouse is a promise the
 * database cannot keep, and the honest version is a control that stops.
 *
 * The price is deliberately not repeated inside the button. It sits about forty
 * pixels above in a much larger size, and printing it again inside a
 * `whitespace-nowrap` button is what gave this row a 342px minimum width and pushed
 * the whole product page 37px off the side of a 360px screen.
 *
 * Adding opens the basket drawer rather than firing a toast. The drawer is where
 * the customer can see what is in there, adjust a quantity, and find out what
 * shipping will cost — and on this page a toast would sit directly on top of the
 * sticky bar that slides in behind it.
 */
export function BuyBox({
  item,
  className,
}: {
  item: CartItemInput;
  className?: string;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const markAdded = useCartStore((state) => state.markAdded);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const [quantity, setQuantity] = useState(1);

  if (item.stock <= 0) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <Button size="lg" disabled>
          Out of stock
        </Button>
        <p className="text-small text-text-muted">
          Nothing on the bench. Worth joining the list — we do restock the ones that
          survive a winter, and this is not one of them yet.
        </p>
      </div>
    );
  }

  function add(quantityToAdd: number) {
    addItem(item, quantityToAdd);

    // Order matters: mark first so the drawer finds the highlight waiting, and open
    // last so the line is already in the list on the frame the panel appears.
    markAdded(item.productId);
    openDrawer();
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* `min-w-0` on the row and the button: both are flex children with a
          `min-width: auto` default, so a longer label on this button in a future
          season would silently widen this column and push the page sideways. */}
      <div className="flex min-w-0 items-stretch gap-3">
        <QuantityStepper
          quantity={quantity}
          stock={item.stock}
          onDecrement={() => setQuantity(Math.max(quantity - 1, 1))}
          onIncrement={() => setQuantity(Math.min(quantity + 1, item.stock))}
        />

        <Button size="lg" className="min-w-0 flex-1" onClick={() => add(quantity)}>
          <ShoppingBagIcon aria-hidden="true" />
          Add to cart
        </Button>
      </div>
    </div>
  );
}

/**
 * Quantity.
 *
 * `role="group"` with two buttons rather than an `<input type="number">`: a spinner
 * in the corner of a native field is 16px tall and unhittable, and a text field
 * invites typing a quantity of four hundred. Two 44px targets is the whole control.
 */
function QuantityStepper({
  quantity,
  stock,
  onDecrement,
  onIncrement,
}: {
  quantity: number;
  stock: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div
      role="group"
      aria-label="Quantity"
      className="flex shrink-0 items-center rounded-lg border border-ink/20"
    >
      <button
        type="button"
        onClick={onDecrement}
        disabled={quantity <= 1}
        aria-label="One fewer"
        className="flex size-11 items-center justify-center rounded-l-lg text-ink transition-colors duration-200 hover:bg-ink/[0.05] disabled:pointer-events-none disabled:opacity-30"
      >
        <MinusIcon aria-hidden="true" className="size-4" />
      </button>

      <output
        aria-live="polite"
        aria-label={`Quantity: ${quantity}`}
        className="tabular-nums flex h-11 w-10 items-center justify-center text-[0.9375rem] font-medium text-ink"
      >
        {quantity}
      </output>

      <button
        type="button"
        onClick={onIncrement}
        disabled={quantity >= stock}
        aria-label="One more"
        className="flex size-11 items-center justify-center rounded-r-lg text-ink transition-colors duration-200 hover:bg-ink/[0.05] disabled:pointer-events-none disabled:opacity-30"
      >
        <PlusIcon aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
