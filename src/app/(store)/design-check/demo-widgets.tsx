"use client";

import { useState } from "react";
import { ShoppingBagIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CartBadge } from "@/components/layout/cart-badge";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { useCartStore } from "@/store/cart";

/**
 * Interactive pieces of /design-check.
 *
 * Temporary: this whole folder is deleted in Phase 10.
 */

/**
 * The loading variant. The pause is artificial and exists only so the state is
 * observable on a throwaway QA page — there is no action to wait for here.
 */
export function LoadingButtonDemo() {
  const [pending, setPending] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        size="lg"
        loading={pending}
        onClick={() => {
          setPending(true);
          window.setTimeout(() => setPending(false), 1600);
        }}
      >
        Add to cart
      </Button>
      <p className="text-small text-text-muted">
        Press it: the label holds, a spinner replaces the icon, and the button
        refuses a second submit.
      </p>
    </div>
  );
}

/** Badge pop and layout stability, driven through the real persisted store. */
export function CartBadgeDemo() {
  const addItem = useCartStore((state) => state.addItem);
  const clear = useCartStore((state) => state.clear);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const [added, setAdded] = useState(0);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="secondary"
        onClick={() => {
          // Not a real product: this panel exists to move the badge, and a line the
          // server could never resolve is exactly what it needs.
          addItem(
            {
              productId: `demo-plant-${added}`,
              slug: `demo-plant-${added}`,
              name: `Demo plant ${added + 1}`,
              priceCents: 2400,
              image: null,
              stock: 3,
            },
            2,
          );

          setAdded((value) => value + 1);
        }}
      >
        Add two plants
      </Button>

      <Button variant="ghost" onClick={openDrawer}>
        Open the basket
      </Button>

      <Button variant="ghost" onClick={clear}>
        Empty the cart
      </Button>

      <span className="relative inline-flex size-11 items-center justify-center rounded-lg border border-ink/10 text-ink">
        <ShoppingBagIcon aria-hidden="true" className="size-5" />
        <CartBadge />
      </span>

      <p className="text-small text-text-muted">
        The count persists in localStorage and stays hidden until it has been
        read, so the server render and the first client render agree.
      </p>
    </div>
  );
}

/** Scroll-triggered reveals, in the two shapes the primitives offer. */
export function RevealDemo() {
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div>
        <p className="eyebrow">Reveal</p>
        <div className="mt-3 flex flex-col gap-3">
          <Reveal className="rounded-lg border border-ink/10 bg-white p-4 text-small">
            Reveal, no delay
          </Reveal>
          <Reveal delay={0.12} className="rounded-lg border border-ink/10 bg-white p-4 text-small">
            Reveal, 120ms
          </Reveal>
        </div>
      </div>

      <div>
        <p className="eyebrow">Stagger</p>
        <Stagger className="mt-3 flex flex-col gap-3" interval={0.08}>
          {["Light", "Water", "Drainage"].map((note) => (
            <StaggerItem
              key={note}
              className="rounded-lg border border-ink/10 bg-white p-4 text-small"
            >
              Staggered {note}
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  );
}
