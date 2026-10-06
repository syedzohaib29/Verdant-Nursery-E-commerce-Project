"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { getShippingPolicy, type ShippingPolicy } from "@/app/actions/cart";
import { formatPrice } from "@/lib/utils";

/**
 * The free-shipping rules, fetched once and shared by the drawer and the cart page.
 *
 * The threshold lives in a settings table, which is the right place for it. The
 * awkward part is that the drawer needs it on *every* page, and reading it in the
 * root layout would make every route dynamic — including the three that are
 * currently static and prerendered. So it is asked for here, once, and cached in a
 * module-level promise.
 *
 * A module-level promise rather than React state because the two consumers mount
 * at different times and in different orders, and a customer should not cause two
 * requests by scrolling. The in-flight promise is stored too, which is what makes
 * a second caller join the first instead of starting its own.
 */

let cached: Promise<ShippingPolicy> | null = null;

export function loadShippingPolicy(): Promise<ShippingPolicy> {
  cached ??= getShippingPolicy();

  return cached;
}

/** Drops the cache. Only used after a settings write, which this phase has none of. */
export function invalidateShippingPolicy(): void {
  cached = null;
}

/**
 * The policy, or null while it is in flight.
 *
 * Returning null rather than a default matters for the progress bar: a made-up
 * threshold would render a bar that is confidently wrong and then jump when the
 * real number arrived. Consumers reserve the height and wait.
 */
export function useShippingPolicy(): ShippingPolicy | null {
  const [policy, setPolicy] = useState<ShippingPolicy | null>(null);

  useEffect(() => {
    let live = true;

    void loadShippingPolicy().then((result) => {
      if (live) setPolicy(result);
    });

    return () => {
      live = false;
    };
  }, []);

  return policy;
}

/**
 * How far along the free-shipping meter is, as a percentage.
 *
 * Clamped, and deliberately not "the subtotal divided by the threshold" without a
 * ceiling — an overshoot must not produce a bar wider than its track.
 */
export function shippingProgress(subtotalCents: number, policy: ShippingPolicy): number {
  if (policy.freeShippingThresholdCents <= 0) return 100;

  return Math.min(100, (subtotalCents / policy.freeShippingThresholdCents) * 100);
}

/**
 * The meter itself.
 *
 * A `role="progressbar"` with the real numbers in the label, because the bar is the
 * only place a screen reader user learns how far they are from free shipping. The
 * fill animates its width on the project easing at 400ms — long enough to read as
 * movement, short enough that it never feels like the site is working.
 *
 * The wording is the part worth being careful about. "You're $12 away from free
 * shipping" is a thing you can do something about; a percentage is not. And once
 * the threshold is met the line says so plainly rather than showing a full bar and
 * leaving the customer to work out what a full bar means.
 */
export function FreeShippingMeter({
  subtotalCents,
  className,
}: {
  subtotalCents: number;
  className?: string;
}) {
  const policy = useShippingPolicy();
  const reduceMotion = useReducedMotion();

  const progress = policy ? shippingProgress(subtotalCents, policy) : 0;
  const remaining = policy
    ? Math.max(0, policy.freeShippingThresholdCents - subtotalCents)
    : 0;
  const met = Boolean(policy) && remaining === 0;

  return (
    <div className={className}>
      {/* One reserved line whether or not the policy has arrived, so the drawer
          and the cart summary do not shift when it lands. */}
      <p className="min-h-5 text-[0.8125rem] leading-5 text-ink/70">
        {policy === null ? (
          <span className="text-ink/40">Checking the shipping threshold…</span>
        ) : met ? (
          <span className="font-medium text-forest">
            Free shipping unlocked on this order.
          </span>
        ) : (
          <>
            You&rsquo;re{" "}
            <span className="tabular-nums font-medium text-forest">
              {formatPrice(remaining)}
            </span>{" "}
            away from free shipping
          </>
        )}
      </p>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={policy?.freeShippingThresholdCents ?? 0}
        aria-valuenow={Math.min(subtotalCents, policy?.freeShippingThresholdCents ?? 0)}
        aria-valuetext={
          policy === null
            ? "Checking the shipping threshold"
            : met
              ? "Free shipping unlocked"
              : `${formatPrice(remaining)} away from free shipping`
        }
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-mint"
      >
        <motion.div
          className={met ? "h-full rounded-full bg-forest" : "h-full rounded-full bg-leaf"}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
          }
        />
      </div>
    </div>
  );
}


