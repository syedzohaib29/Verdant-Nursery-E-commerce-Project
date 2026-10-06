"use client";

import { motion, useReducedMotion } from "motion/react";

import { cartCount, useCartStore } from "@/store/cart";

import { cn } from "cn";

/**
 * The unit count on the bag, read from the persisted store.
 *
 * Two things matter here. It renders nothing until `hydrated` is true, so the
 * server HTML and the first client render agree and React never warns about a
 * mismatch — and, more importantly, so the number does not appear as a confident
 * zero and then correct itself to seven. A badge that flickers from 0 to N on load
 * reads as a bug even when the final number is right.
 *
 * It is absolutely positioned inside the icon button, so a change in count
 * animates instead of nudging the icons beside it.
 *
 * The rehydrate call itself lives in the store module rather than here. This badge
 * is not the only thing that reads the basket, and a store whose rehydration
 * depends on one particular badge being mounted is a store that shows an empty
 * basket on any page that forgot to include it.
 */
export function CartBadge({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const count = useCartStore(cartCount);
  const hydrated = useCartStore((state) => state.hydrated);

  if (!hydrated || count === 0) return null;

  return (
    <motion.span
      key={count}
      initial={reduceMotion ? { scale: 1 } : { scale: 0.6 }}
      animate={{ scale: 1 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 520, damping: 18, mass: 0.6 }
      }
      className={cn(
        "tabular-nums pointer-events-none absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-leaf text-[0.625rem] leading-none font-semibold text-white",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
      <span className="sr-only"> items in your basket</span>
    </motion.span>
  );
}
