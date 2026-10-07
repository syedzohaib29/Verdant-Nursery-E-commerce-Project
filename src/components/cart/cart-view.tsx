"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";

import {
  priceCart,
  revalidateCart,
  type CartChange,
  type CartSummary,
} from "@/app/actions/cart";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { CartEmptyState } from "@/components/cart/cart-empty-state";
import { FreeShippingMeter } from "@/components/cart/free-shipping-meter";
import { PromoForm } from "@/components/cart/promo-form";
import { ClearCartButton } from "@/components/cart/clear-cart-button";
import { Button } from "@/components/ui/button";
import { cartSubtotalCents, useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

import { cn } from "cn";

/**
 * The basket page.
 *
 * The lines come from the local store, so a quantity stepper responds the instant
 * it is pressed. The money comes from the server. That split is the design: a
 * subtotal computed in the browser from cached prices is a number that is wrong
 * whenever the database disagrees, and the database gets to decide. So
 * `revalidateCart` runs first to make the local lines match reality, and only then
 * does `priceCart` produce the figures shown as money.
 *
 * The server total lands a beat after the click, so while it is in flight the
 * figure is dimmed and marked `aria-busy` rather than being replaced by a
 * locally-computed guess. A total that flickers between two numbers while you are
 * reading it is worse than one that visibly waits.
 *
 * `promoCode` is not persisted. It lives in component state, which means it
 * disappears on refresh — deliberately. A discount that silently survives a reload
 * has to be re-validated against a basket that may have changed, and the honest
 * version is to ask again.
 */
export function CartView({ customerName }: { customerName: string | null }) {
  const items = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state.hydrated);
  const localSubtotalCents = useCartStore(cartSubtotalCents);
  const replaceItems = useCartStore((state) => state.replaceItems);
  const clear = useCartStore((state) => state.clear);
  const reduceMotion = useReducedMotion();

  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [pricing, setPricing] = useState(false);
  const [pricingFailed, setPricingFailed] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  /** True once the arrival check has landed, which gates the first total. */
  const [checked, setChecked] = useState(false);

  /** One id per unit, which is the shape the pricing function takes. */
  const productIds = useMemo(
    () =>
      items.flatMap((item) =>
        Array.from({ length: item.quantity }, () => item.productId),
      ),
    [items],
  );

  /**
   * Counts in flight requests so a slower earlier one cannot land on top of a
   * newer answer and put an old total back on screen.
   */
  const requestId = useRef(0);

  const price = useCallback(async (ids: string[], code: string | null) => {
    const id = ++requestId.current;

    setPricing(true);
    setPricingFailed(null);

    const result = await priceCart({ productIds: ids, promoCode: code });

    if (id !== requestId.current) return;

    setPricing(false);

    if (result.success) {
      setSummary(result.summary);
    } else {
      setPricingFailed(result.error);
    }
  }, []);

  /**
   * The check on arrival.
   *
   * Its repairs are written into the store before anything is priced, so the lines
   * the customer is looking at and the lines the server is about to add up are the
   * same set. Without that ordering a basket containing a deleted product would be
   * priced once with the deletion and again without it.
   *
   * Runs once per visit. `items` is not a dependency — it is exactly what this
   * effect is about to change.
   */
  const arrived = useRef(false);

  useEffect(() => {
    if (!hydrated || arrived.current) return;

    arrived.current = true;

    void (async () => {
      const result = await revalidateCart({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          believedPriceCents: item.priceCents,
        })),
      });

      if (!result.success) {
        toast.error(result.error ?? "We could not check your basket.");
        setChecked(true);
        return;
      }

      replaceItems(
        result.lines.map((line) => ({
          productId: line.productId,
          slug: line.slug,
          name: line.name,
          priceCents: line.priceCents,
          image: line.image,
          quantity: line.quantity,
          stock: line.stock,
        })),
      );

      announceChanges(result.changes);
      setChecked(true);
    })();
  }, [hydrated, items, replaceItems]);

  // Re-price whenever the basket or the code changes, once the arrival check has
  // landed. Debounced through a short timer so holding the stepper down is one
  // request rather than twenty.
  useEffect(() => {
    if (!checked) return;

    const timer = setTimeout(() => {
      void price(productIds, promoCode);
    }, 150);

    return () => clearTimeout(timer);
  }, [checked, productIds, promoCode, price]);

  if (!hydrated) {
    return (
      <div className="py-20 text-center">
        <p className="text-[0.9375rem] text-ink/50">Opening your basket&hellip;</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <PageHeading customerName={customerName} count={0} />
        <CartEmptyState className="py-8" />
      </>
    );
  }

  // Shipping is judged on what is actually being charged, so a code that pushes an
  // order over the threshold counts towards free shipping.
  const chargeableCents = summary
    ? summary.subtotalCents - summary.discountCents
    : localSubtotalCents;

  return (
    <>
      <PageHeading customerName={customerName} count={items.length} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_25rem]">
        {/* The lines. A real list rather than a table of divs: a basket is a list of
            things with quantities and prices, and the definition list inside the
            summary is where the comparison actually happens. On a phone each row
            stacks with the stepper and the line total sharing a baseline, which is
            the only arrangement that fits 360px without clipping anything. */}
        <section aria-label="Items in your basket">
          <ul className="divide-y divide-ink/10 border-y border-ink/10">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={item.productId}
                  layout={reduceMotion ? false : "position"}
                  exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
                  }
                >
                  <CartLineItem item={item} variant="page" />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <ClearCartButton onClear={clear} />
            <p className="text-[0.8125rem] text-ink/50">
              Everything is potted and packed before it leaves the bench.
            </p>
          </div>
        </section>

        {/* Sticky on desktop, because the total is what is being read while the
            list above it is scrolled. */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div
            aria-busy={pricing}
            className="rounded-xl border border-ink/10 bg-warm-white p-6"
          >
            <h2 className="font-heading text-lg font-semibold tracking-[-0.02em] text-ink">
              Summary
            </h2>

            <FreeShippingMeter subtotalCents={chargeableCents} className="mt-4" />

            <PromoForm
              appliedCode={promoCode}
              onApply={setPromoCode}
              onClear={() => setPromoCode(null)}
            />

            <dl className="mt-6 space-y-3 border-t border-ink/10 pt-5 text-[0.9375rem]">
              <Row
                label={
                  summary
                    ? `Subtotal (${summary.itemCount} ${
                        summary.itemCount === 1 ? "plant" : "plants"
                      })`
                    : "Subtotal"
                }
              >
                {summary ? summary.subtotalLabel : formatPrice(localSubtotalCents)}
              </Row>

              {summary && summary.discountCents > 0 && promoCode && (
                <Row label={`Discount (${promoCode})`} tone="forest">
                  &minus;{summary.discountLabel}
                </Row>
              )}

              <Row label="Shipping">
                {summary ? (
                  summary.shippingLabel
                ) : (
                  <span className="text-ink/45">Working it out…</span>
                )}
              </Row>
            </dl>

            <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-ink/10 pt-5">
              <span className="font-heading text-base font-semibold tracking-[-0.01em] text-ink">
                Total
              </span>
              <span
                className={cn(
                  "tabular-nums font-heading text-3xl font-semibold tracking-[-0.02em] transition-opacity duration-200",
                  pricing || !summary ? "text-ink/40" : "text-forest",
                )}
              >
                {summary ? summary.totalLabel : "—"}
              </span>
            </div>

            {pricingFailed && (
              <p role="status" className="mt-3 text-[0.8125rem] text-forest">
                {pricingFailed}
              </p>
            )}

            {/* The reason to be on this page. Checkout is a separate route that
                re-prices the basket from the server on arrival, so this is a plain
                link rather than a submit: nothing about the order is decided here,
                and the totals above are a preview of a number the checkout page
                works out for itself. */}
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/checkout" />}
              className="mt-6 w-full"
            >
              Checkout
            </Button>

            <Button
              size="lg"
              variant="secondary"
              nativeButton={false}
              render={<Link href="/shop" />}
              className="mt-2.5 w-full"
            >
              Keep shopping
            </Button>

            <p className="mt-3 text-center text-[0.75rem] leading-relaxed text-ink/45">
              Every figure here is worked out on the server from today&rsquo;s prices.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

/** A line in the totals, label left and value right on a shared baseline. */
function Row({
  label,
  children,
  tone = "ink",
}: {
  label: string;
  children: React.ReactNode;
  tone?: "ink" | "forest";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={tone === "forest" ? "text-forest" : "text-ink/70"}>{label}</dt>
      <dd
        className={cn(
          "tabular-nums",
          tone === "forest" ? "font-medium text-forest" : "text-ink",
        )}
      >
        {children}
      </dd>
    </div>
  );
}

function PageHeading({
  customerName,
  count,
}: {
  customerName: string | null;
  count: number;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-ink/10 pb-6">
      <div>
        <p className="eyebrow">Your basket</p>
        <h1 className="mt-2 text-h2 text-ink">
          {customerName ? `Hello, ${customerName.split(" ")[0]}.` : "Your basket."}
        </h1>
      </div>

      {count > 0 && (
        <p className="text-[0.9375rem] text-ink/55">
          {count} {count === 1 ? "plant" : "plants"}
        </p>
      )}
    </div>
  );
}

/**
 * Explains a repaired basket in at most two toasts.
 *
 * A basket with four problems has four things to say, and four stacked
 * notifications is a wall rather than a message. So the most serious change leads
 * on its own and the rest are summarised as a count — removals first, because a
 * line that can no longer be bought is the one a customer most needs to hear about.
 */
function announceChanges(changes: CartChange[]): void {
  if (changes.length === 0) return;

  const severity: Record<CartChange["kind"], number> = {
    removed: 0,
    quantity: 1,
    price: 2,
  };

  const [first, ...rest] = [...changes].sort(
    (a, b) => severity[a.kind] - severity[b.kind],
  );

  if (first.kind === "removed") {
    toast.warning(first.name, {
      description: first.reason,
      duration: 6000,
    });
  } else {
    toast.info(first.name, {
      description: first.reason,
      duration: 5000,
    });
  }

  if (rest.length === 0) return;

  toast.info(
    rest.length === 1
      ? `Also updated: ${rest[0].name}`
      : `${rest.length} other ${rest.length === 1 ? "line was" : "lines were"} updated.`,
    { duration: 5000 },
  );
}
