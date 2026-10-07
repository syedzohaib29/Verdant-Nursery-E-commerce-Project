"use client";

import Image from "next/image";
import { ChevronDownIcon, LockIcon } from "lucide-react";

import { type CartSummary } from "@/app/actions/cart";
import { PromoForm } from "@/components/cart/promo-form";
import { type PaymentMethod } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { type CartItem } from "@/store/cart";

import { cn } from "cn";

/**
 * The right-hand column of a desktop checkout, the collapsible bar on top of a
 * mobile one.
 *
 * Its job is to keep the two numbers that matter — what is in the basket and
 * what it costs — in view the whole way down the form. The lines are drawn from
 * the client basket and the totals from `priceCart`'s authoritative summary;
 * the two disagree on a stale price or stock, and the summary is the one that
 * wins, which is exactly the correction the cart page already makes.
 *
 * The panel lives outside the checkout `<form>` so the promo input's own form
 * cannot nest inside it; the place-order button reaches back in with the HTML
 * `form` attribute.
 */
export function CheckoutOrderSummary({
  items,
  summary,
  pricing,
  promoCode,
  onPromoApply,
  onPromoClear,
  paymentMethod,
  mobileExpanded,
  onMobileToggle,
  footer,
}: {
  items: CartItem[];
  summary: CartSummary | null;
  pricing: boolean;
  promoCode: string | null;
  onPromoApply: (code: string) => void;
  onPromoClear: () => void;
  paymentMethod: PaymentMethod;
  mobileExpanded: boolean;
  onMobileToggle: () => void;
  /** The place-order button, rendered into the desktop panel. */
  footer: React.ReactNode;
}) {
  const itemCount =
    summary?.itemCount ??
    items.reduce((count, item) => count + item.quantity, 0);

  const displayTotal =
    summary?.totalLabel ?? (pricing ? "Working it out…" : "Your total");
  const freeShipping = Boolean(
    summary && summary.freeShippingRemainingCents === 0,
  );

  return (
    <div className="lg:sticky lg:top-6 lg:border-0">
      {/* Mobile: the collapsed bar still shows the total. */}
      <button
        type="button"
        onClick={onMobileToggle}
        aria-expanded={mobileExpanded}
        aria-controls="checkout-summary-panel"
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3.5 outline-none transition-colors duration-200 hover:border-ink/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-mint text-small font-semibold text-forest tabular-nums">
            {itemCount}
          </span>
          <span className="truncate text-small font-medium text-ink">
            {itemCount === 1 ? "Plant in your order" : "Plants in your order"}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="text-body font-semibold text-ink tabular-nums">
            {displayTotal}
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            strokeWidth={1.75}
            className={cn(
              "size-4 text-ink/45 transition-transform duration-300 ease-verdant",
              mobileExpanded && "rotate-180",
            )}
          />
        </span>
      </button>

      {/* The panel: expanded on mobile, always open on desktop. */}
      <div
        id="checkout-summary-panel"
        className={cn(mobileExpanded ? "mt-3 block" : "hidden", "lg:mt-0 lg:block")}
      >
        <div className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
          <p className="eyebrow">Order summary</p>

          <ul className="mt-4 space-y-4">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3">
                <span className="relative shrink-0">
                  <span className="block size-14 overflow-hidden rounded-md bg-mint">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-[0.625rem] text-forest/70">
                        No photo
                      </span>
                    )}
                  </span>
                  <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-forest px-1 py-0.5 text-[0.6875rem] font-semibold text-white tabular-nums">
                    {item.quantity}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small font-medium text-ink">
                    {item.name}
                  </span>
                  <span className="block text-small text-ink/50">
                    {formatPrice(item.priceCents)} each
                  </span>
                </span>
                <span className="shrink-0 text-small font-semibold text-ink tabular-nums">
                  {formatPrice(item.priceCents * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-ink/10 pt-5">
            <PromoForm
              appliedCode={promoCode}
              onApply={onPromoApply}
              onClear={onPromoClear}
            />
          </div>

          <dl className="mt-5 space-y-2 text-small">
            <div className="flex items-baseline justify-between gap-4 text-ink/70">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">
                {summary?.subtotalLabel ?? "…"}
              </dd>
            </div>
            {summary && summary.discountCents > 0 ? (
              <div className="flex items-baseline justify-between gap-4 font-medium text-forest">
                <dt>Discount</dt>
                <dd className="tabular-nums">−{summary.discountLabel}</dd>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between gap-4 text-ink/70">
              <dt>Shipping</dt>
              <dd className="tabular-nums">
                {summary?.shippingLabel ?? "…"}
              </dd>
            </div>
            {freeShipping ? (
              <p className="text-small font-medium text-forest">
                Free shipping unlocked.
              </p>
            ) : null}
            <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-ink/10 pt-3">
              <dt className="text-body font-semibold text-ink">Total</dt>
              <dd className="text-body font-bold text-ink tabular-nums">
                {displayTotal}
              </dd>
            </div>
          </dl>

          <p className="mt-4 flex items-start gap-2 text-small leading-relaxed text-ink/55">
            <LockIcon
              aria-hidden="true"
              strokeWidth={1.75}
              className="mt-0.5 size-3.5 shrink-0"
            />
            {paymentMethod === "COD"
              ? `You'll pay ${displayTotal} when your plants arrive — nothing is charged today.`
              : `We'll take you to Stripe's secure page to pay ${displayTotal}.`}
          </p>

          <div className="mt-5">{footer}</div>
        </div>
      </div>
    </div>
  );
}