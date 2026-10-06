"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ShoppingBagIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCartStore, type CartItemInput } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

/**
 * The mobile add-to-cart bar.
 *
 * It appears when the real buy box has scrolled past the top of the screen, and it
 * disappears again over the footer — a fixed bar that follows you onto the
 * contact page is a bar you cannot get rid of, and the footer is the one place on
 * a product page where a purchase button is actively in the way.
 *
 * Two things have to be true of a fixed element, and both are easy to get wrong:
 * it must not cover the toaster, and it must not cover the footer. The first is
 * handled by publishing its height into a custom property that the Toaster reads,
 * so every confirmation lands above the bar. The second is handled by observing
 * the footer rather than guessing at the scroll position.
 *
 * It also renders through a portal into `<body>`, which is not decoration. The bar
 * sits in the buy box, and the buy box sits inside a `Reveal` — so somewhere above
 * this element there is always a `transform` on an ancestor, and any transform at
 * all turns that ancestor into the containing block for `position: fixed`. The bar
 * then rides up the page with the content instead of staying at the bottom of the
 * screen, which looks identical at rest and completely broken the first time
 * anybody scrolls.
 */
export function AddToCartBar({
  item,
  /** The buy box to watch. */
  triggerRef,
  enabled,
}: {
  item: CartItemInput;
  triggerRef: React.RefObject<HTMLElement | null>;
  enabled: boolean;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const markAdded = useCartStore((state) => state.markAdded);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const [visible, setVisible] = useState(false);
  // `null` on the server and on the first client render, so the markup matches;
  // the bar is hidden at that point anyway, since the buy box is still on screen.
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalNode(document.body);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }

    const trigger = triggerRef.current;
    if (!trigger) return;

    // The buy box is above the fold, so only its *exit* matters.
    const triggerObserver = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );

    triggerObserver.observe(trigger);

    // A product with no footer to speak of still has one, but a page that is too
    // short to scroll leaves the bar permanently hidden, which is correct: the
    // buy box is already on screen.
    const footer = document.querySelector("footer");
    const footerObserver =
      footer &&
      new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setVisible(false);
        },
        { threshold: 0 },
      );

    if (footer && footerObserver) footerObserver.observe(footer);

    return () => {
      triggerObserver.disconnect();
      footerObserver?.disconnect();
    };
  }, [enabled, triggerRef]);

  // Publish the bar's height so the toaster can clear it while it is on screen.
  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;

    if (visible) {
      root.style.setProperty("--verdant-bottom-offset", "6.25rem");
    } else {
      root.style.removeProperty("--verdant-bottom-offset");
    }

    return () => {
      root.style.removeProperty("--verdant-bottom-offset");
    };
  }, [visible, enabled]);

  if (!enabled || item.stock <= 0 || !portalNode) return null;

  return createPortal(
    <div
      data-state={visible ? "shown" : "hidden"}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 transition-transform duration-300 ease-verdant data-[state=hidden]:translate-y-full lg:hidden"
    >
      <div className="border-t border-ink/10 bg-white/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
        <div className="pointer-events-auto flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8125rem] font-medium text-ink">
              {item.name}
            </p>
            <p className="tabular-nums text-[0.8125rem] text-text-muted">
              {formatPrice(item.priceCents)}
            </p>
          </div>

          <Button
            className="shrink-0"
            onClick={() => {
              addItem(item);

              // The bar is fixed at the bottom of the screen; the drawer comes in
              // over it. Closing the bar's job is to get out of the way, which it
              // does by unmounting as soon as the drawer has the screen.
              markAdded(item.productId);
              openDrawer();
            }}
          >
            <ShoppingBagIcon aria-hidden="true" />
            Add to cart
          </Button>
        </div>
      </div>
    </div>,
    portalNode,
  );
}
