"use client";

import Image from "next/image";
import { MinusIcon, PlusIcon } from "lucide-react";

import { useCartStore, type CartItem } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

import { cn } from "cn";

/**
 * One line in the basket, shared by the drawer and the cart page.
 *
 * It takes a `variant` rather than being written twice, because the two places
 * need genuinely different things — the drawer has one column to work with and the
 * cart page has a table — and duplicating the quantity logic to avoid a prop would
 * duplicate the edge cases with it. What stays in here is the part that is easy to
 * get wrong: the stepper's ceiling.
 *
 * The stepper stops at the line's own stock, so a basket that was correct this
 * morning cannot be talked into eight of a plant with three on the shelf. The
 * *server* re-checks all of this in `revalidateCart`, because localStorage is not
 * a guarantee and neither is the number this control was rendered with.
 */
export function CartLineItem({
  item,
  variant,
  className,
}: {
  item: CartItem;
  variant: "drawer" | "page";
  className?: string;
}) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  // A line whose product sold out since it was added. The row stays, dimmed and
  // explained, rather than disappearing: a basket that silently loses a row is how
  // a customer loses track of what they meant to buy. `revalidateCart` removes it
  // with a message once the server has confirmed.
  const unavailable = item.stock <= 0;
  const cappedByStock = !unavailable && item.quantity > item.stock;

  const lineCents = item.priceCents * item.quantity;

  // A plain `div`, not an `li`, and no motion of its own.
  //
  // Both callers already wrap this in a `motion.li`, because both need the row to
  // participate in `AnimatePresence` and `layout` — the drawer to reflow when a line
  // is removed, the page for the same reason. Emitting a second `li` here produced
  // an `li` directly inside an `li`, which is invalid markup and also meant two
  // competing `layout` measurements on one row. The caller owns the list item; this
  // owns the row.
  return (
    <div
      className={cn(
        "flex gap-4",
        variant === "drawer" ? "py-4" : "py-5",
        // Dimmed only when it cannot be bought at all. A line that is merely short
        // on stock still reads at full strength — it is still a real line with a
        // real price, and greying it out would overstate how broken things are.
        unavailable && "opacity-55",
        className,
      )}
    >
      {/* 72px square, as specified. `shrink-0` because a long product name next to
          it would otherwise squeeze the thumbnail into an oval. */}
      <div className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-md bg-mint">
        {item.image ? (
          <Image
            src={item.image}
            alt=""
            fill
            sizes="72px"
            className="object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-[0.6875rem] text-forest/70">
            No photo
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.9375rem] leading-snug font-medium text-ink">
              {/* Two lines, then an ellipsis. A plant name is short enough almost
                  always, and when it is not, this is the place it has to give
                  rather than pushing the price off the row. */}
              <span className="line-clamp-2">{item.name}</span>
            </p>

            {unavailable ? (
              <p className="mt-1 text-[0.75rem] text-forest">No longer available</p>
            ) : cappedByStock ? (
              <p className="mt-1 text-[0.75rem] text-forest">
                Only {item.stock} left — we will trim this when you check out
              </p>
            ) : null}
          </div>

          <p className="tabular-nums shrink-0 text-[0.9375rem] font-medium text-ink">
            {formatPrice(lineCents)}
          </p>
        </div>

        {/* Wrapping, not squeezing. The stepper is 124px of 44px targets and
            "Remove" is about 64px; inside a 320px drawer the text column is
            ~184px wide, so the pair no longer fit on one line and were pushing
            past the panel's own padding. Letting them wrap puts Remove under the
            stepper instead of half outside the sheet, and keeps both at their
            44px targets rather than shrinking either to make room. */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <QuantityControl
            quantity={item.quantity}
            stock={item.stock}
            size={variant}
            onChange={(next) => updateQuantity(item.productId, next)}
          />

          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            className="ml-auto min-h-11 shrink-0 rounded-sm px-1 text-[0.8125rem] text-ink/55 underline-offset-4 transition-colors duration-200 hover:text-forest hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Remove
            <span className="sr-only"> {item.name} from the basket</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The stepper.
 *
 * Two 44px buttons rather than a number input, for the same reason as the one on
 * the product page: a native spinner's arrows are 16px tall and unhittable, and a
 * text field invites a quantity of four hundred.
 *
 * 44px in both variants, including in the drawer. A 420px panel on a desktop and a
 * full-width sheet on a phone both have the room, and a drawer is the last place
 * to save three pixels — it is where a phone is most likely held one-handed, with
 * the thumb nowhere near the buttons.
 */
function QuantityControl({
  quantity,
  stock,
  size,
  onChange,
}: {
  quantity: number;
  stock: number;
  size: "drawer" | "page";
  onChange: (next: number) => void;
}) {
  // Clamped against stock, but never below one: the stepper is not the way to
  // delete a line, and a product that just sold out should still be adjustable
  // until the server removes it with an explanation.
  const max = Math.max(1, stock);

  return (
    <div
      role="group"
      aria-label="Quantity"
      className={cn(
        "flex items-center rounded-md border border-ink/20",
        size === "drawer" && "h-11",
      )}
    >
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        disabled={quantity <= 1}
        aria-label="One fewer"
        className="flex size-11 items-center justify-center rounded-l-md text-ink transition-colors duration-200 hover:bg-ink/[0.05] disabled:pointer-events-none disabled:opacity-30"
      >
        <MinusIcon aria-hidden="true" className="size-3.5" />
      </button>

      <output
        aria-live="polite"
        aria-label={`Quantity: ${quantity}`}
        className={cn(
          "tabular-nums flex items-center justify-center text-[0.875rem] font-medium text-ink",
          size === "drawer" ? "h-11 w-9" : "h-11 w-11",
        )}
      >
        {quantity}
      </output>

      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= max}
        aria-label="One more"
        className="flex size-11 items-center justify-center rounded-r-md text-ink transition-colors duration-200 hover:bg-ink/[0.05] disabled:pointer-events-none disabled:opacity-30"
      >
        <PlusIcon aria-hidden="true" className="size-3.5" />
      </button>
    </div>
  );
}

