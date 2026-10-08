"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { CartLineItem } from "@/components/cart/cart-line-item";
import { CartEmptyState } from "@/components/cart/cart-empty-state";
import { FreeShippingMeter } from "@/components/cart/free-shipping-meter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { cartSubtotalCents, useCartStore } from "@/store/cart";
import type { CartItem } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

import { cn } from "cn";

/**
 * The basket drawer.
 *
 * Opens by itself when something is added, which is the reason it exists. On a
 * phone the quick-add button on a card is the main way anything gets into the
 * basket, and a toast that says "added" still leaves the customer with no idea
 * what is in there or what it costs.
 *
 * Full width on a phone, 420px on a desktop. The panel is `h-dvh`, not `h-screen`:
 * on iOS Safari `100vh` is the height of the viewport with the address bar
 * *collapsed*, so a footer sized against it gets its buttons pushed under the
 * browser's own chrome and "View basket" cannot be tapped. The dynamic unit tracks
 * the bar as it retracts.
 *
 * The list scrolls and the footer does not. That split is what makes a basket with
 * nine plants behave like one with a single plant: the subtotal and the buttons
 * stay exactly where they are, so the thing you came for never moves while you
 * change the quantity above it.
 */
export function CartDrawer() {
  const open = useCartStore((state) => state.drawerOpen);
  const closeDrawer = useCartStore((state) => state.closeDrawer);
  const items = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state.hydrated);
  const lastAdded = useCartStore((state) => state.lastAdded);
  const subtotalCents = useCartStore(cartSubtotalCents);

  /**
   * Clear the highlight once it has been seen.
   *
   * Left alone, `lastAdded` would keep the mint wash on that row for as long as
   * the drawer stayed open, and a customer adding two things in a row would see
   * one row permanently marked. Resetting it turns the flash back into an event.
   */
  useEffect(() => {
    if (!lastAdded) return;

    const timer = setTimeout(
      () => useCartStore.setState({ lastAdded: null }),
      1000,
    );

    return () => clearTimeout(timer);
  }, [lastAdded]);

  return (
    <Sheet open={open} onOpenChange={(next) => !next && closeDrawer()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className={cn(
          "h-dvh w-full max-w-none gap-0 p-0 duration-[350ms] ease-verdant sm:max-w-[26.25rem]",
          // Slightly tighter than the shared sheet's 2.5rem travel. A 420px panel
          // sliding a full quarter of its own width reads as being thrown rather
          // than drawn aside.
          "data-[side=right]:data-starting-style:translate-x-8 data-[side=right]:data-ending-style:translate-x-8",
        )}
      >
        <header className="flex shrink-0 items-baseline justify-between gap-4 border-b border-ink/10 px-6 pt-6 pb-5">
          <div>
            <SheetTitle className="font-heading text-xl font-semibold tracking-[-0.02em] text-ink">
              Your basket
            </SheetTitle>
            <SheetDescription className="mt-1 text-[0.8125rem] text-ink/55">
              {hydrated && items.length > 0
                ? `${items.length} ${items.length === 1 ? "plant" : "plants"}`
                : "Nothing here yet"}
            </SheetDescription>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            className="-mr-2 rounded-md px-2 py-1 text-[0.8125rem] text-ink/55 transition-colors duration-200 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Close
          </button>
        </header>

        {/* `min-h-0` is what lets this flex child shrink below its content height.
            Without it the list pushes the footer off the bottom of the panel
            instead of scrolling inside it. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6">
          {!hydrated ? (
            <p className="py-8 text-[0.9375rem] text-ink/45">
              Opening your basket&hellip;
            </p>
          ) : items.length === 0 ? (
            <CartEmptyState className="py-10" />
          ) : (
            <ul className="divide-y divide-ink/10">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <DrawerLine
                    key={item.productId}
                    item={item}
                    highlighted={lastAdded?.productId === item.productId}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        <footer className="shrink-0 border-t border-ink/10 bg-warm-white px-6 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {items.length > 0 && (
            <FreeShippingMeter subtotalCents={subtotalCents} className="mb-5" />
          )}

          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[0.9375rem] text-ink/70">Subtotal</span>
            <span className="tabular-nums font-heading text-2xl font-semibold tracking-[-0.02em] text-ink">
              {formatPrice(subtotalCents)}
            </span>
          </div>

          <p className="mt-1.5 text-[0.75rem] text-ink/50">
            Shipping and any discount are worked out on the next page.
          </p>

          <div className="mt-5 flex flex-col gap-2.5">
            {/* Checkout leads, because most drawers are opened by pressing "add"
                and the next thing wanted is usually to pay, not to read the
                basket again. The other two keep their footing underneath it. */}
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/checkout" onClick={closeDrawer} />}
              className="w-full"
            >
              Checkout
            </Button>

            {/* Stacked below `sm`, side by side above it. Two `flex-1` buttons
                share whatever the panel gives them, and the button base carries
                `whitespace-nowrap` plus `shrink-0` — so on a 320px phone each was
                handed roughly half of 272px of usable width and kept its full
                label anyway, pushing "Keep shopping" off the panel and clipping
                it. One column has room for both labels at any width a drawer
                opens at; the pair only shares a line once there is enough of it
                to go halves without either label being cut. */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Button
                size="lg"
                variant="secondary"
                nativeButton={false}
                render={<Link href="/cart" onClick={closeDrawer} />}
                className="w-full"
              >
                View basket
              </Button>

              <Button
                size="lg"
                variant="secondary"
                nativeButton
                onClick={closeDrawer}
                className="w-full"
              >
                Keep shopping
              </Button>
            </div>
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  );
}

/**
 * One line, with the mint flash for a freshly added plant.
 *
 * The flash is an absolutely positioned wash behind the row rather than a
 * background colour on it, because `layout` puts a transform on this element and a
 * transform creates a stacking context — a negative `z-index` child is then
 * trapped inside it and paints below the row's own content but above its
 * background, which is exactly the intent and only works if it is absolute.
 *
 * No exit animation on purpose. Removing a line is instant and the *survivors*
 * glide into the gap through `layout`, which reads better than four things fading
 * at once and costs one animation instead of four.
 */
function DrawerLine({
  item,
  highlighted,
}: {
  item: CartItem;
  highlighted: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.li
      layout={reduceMotion ? false : "position"}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
      }
      className="relative"
    >
      <CartLineItem item={item} variant="drawer" />

      {highlighted && !reduceMotion && (
        <motion.span
          aria-hidden="true"
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="pointer-events-none absolute -inset-x-3 -inset-y-1 -z-10 rounded-md bg-mint"
        />
      )}
    </motion.li>
  );
}
