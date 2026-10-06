"use server";

import { getProductsByIds } from "@/lib/data/products";
import {
  calculateTotals,
  getPromoQuote,
  getSettings,
  getShippingQuote,
} from "@/lib/data/settings";
import { formatPrice } from "@/lib/utils";
import {
  cartPriceSchema,
  cartRevalidateSchema,
  promoCodeSchema,
} from "@/lib/validations/cart";

/*
  Cart server actions.

  The rule this file exists to enforce: **the client's basket is a list of wishes,
  not an order.** Every function here reads prices and stock from the database and
  returns what is actually true, and the client's cached copies are treated as
  display data to be corrected rather than as input to be believed.
*/

const FAILED: RevalidateResult = {
  success: false,
  lines: [],
  changes: [],
  error: "We could not check your basket just now.",
};

/** What `revalidateCart` learned that the basket did not know. */
export type CartChange =
  | { kind: "removed"; name: string; reason: string }
  | { kind: "price"; name: string; reason: string }
  | { kind: "quantity"; name: string; reason: string };

/** A basket line, described by the database rather than by the browser. */
export type ResolvedLine = {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  image: string | null;
  quantity: number;
  stock: number;
};

export type RevalidateResult = {
  success: boolean;
  /** The basket as the database describes it. Replaces the client's copy whole. */
  lines: ResolvedLine[];
  /** What changed, in plain words, ready for a toast. */
  changes: CartChange[];
  error: string | null;
};

/** The shipping rules, for the drawer's progress bar. */
export type ShippingPolicy = {
  freeShippingThresholdCents: number;
  freeShippingThresholdLabel: string;
  shippingFeeCents: number;
  shippingFeeLabel: string;
  promoEnabled: boolean;
};

/** Everything the cart page's summary card needs, all of it server-computed. */
export type CartSummary = {
  itemCount: number;
  subtotalCents: number;
  subtotalLabel: string;
  discountCents: number;
  discountLabel: string;
  shippingCents: number;
  shippingLabel: string;
  totalCents: number;
  totalLabel: string;
  freeShippingThresholdCents: number;
  freeShippingThresholdLabel: string;
  /** Cents still to spend to cross into free shipping. Zero once it is met. */
  freeShippingRemainingCents: number;
};

/**
 * Checks the basket against the catalogue and repairs it.
 *
 * Three things can have happened while the basket sat in localStorage: the plant
 * sold out, it was taken off sale, or its price moved. Each gets its own message
 * and names the plant, because "your basket has changed" is not something a
 * customer can act on.
 *
 * The result replaces the basket rather than patching it, so a stale price cannot
 * survive a check. Quantities are capped to current stock, and lines that no
 * longer resolve are dropped.
 */
export async function revalidateCart(input: {
  items: {
    productId: string;
    quantity: number;
    believedPriceCents?: number;
  }[];
}): Promise<RevalidateResult> {
  const parsed = cartRevalidateSchema.safeParse(input);

  if (!parsed.success) return FAILED;

  try {
    const requested = parsed.data.items;

    const cards = await getProductsByIds(
      requested.map((item) => item.productId),
    );
    const found = new Map(cards.map((card) => [card.id, card]));

    const lines: ResolvedLine[] = [];
    const changes: CartChange[] = [];

    for (const item of requested) {
      const card = found.get(item.productId);

      if (!card) {
        changes.push({
          kind: "removed",
          name: "One of your plants",
          reason: "is no longer on the shelf, so we took it out of the basket.",
        });
        continue;
      }

      if (!card.inStock) {
        changes.push({
          kind: "removed",
          name: card.name,
          reason: "sold out while it sat in your basket, so we took it out.",
        });
        continue;
      }

      let quantity = item.quantity;

      if (quantity > card.stock) {
        changes.push({
          kind: "quantity",
          name: card.name,
          reason:
            card.stock === 1
              ? "is down to the last one, so we set the quantity to 1."
              : `is down to ${card.stock}, so we trimmed the quantity to ${card.stock}.`,
        });
        quantity = card.stock;
      }

      // Only when the basket was holding a different number. A customer who
      // never knew the old price has nothing to be told.
      if (
        item.believedPriceCents !== undefined &&
        item.believedPriceCents !== card.effectivePriceCents
      ) {
        changes.push({
          kind: "price",
          name: card.name,
          reason: `is now ${card.priceLabel} rather than ${formatPrice(
            item.believedPriceCents,
          )}, so we have updated the price.`,
        });
      }

      lines.push({
        productId: card.id,
        slug: card.slug,
        name: card.name,
        priceCents: card.effectivePriceCents,
        image: card.image,
        quantity,
        stock: card.stock,
      });
    }

    return { success: true, lines, changes, error: null };
  } catch {
    return FAILED;
  }
}

/**
 * The shipping rules, without the basket.
 *
 * The drawer needs the free-shipping threshold on every page, but the threshold
 * lives in a settings table — and reading it in the root layout would make every
 * route dynamic, including the three that are currently static. So the drawer asks
 * once, when it mounts, and keeps the answer for the rest of the session.
 */
export async function getShippingPolicy(): Promise<ShippingPolicy> {
  const settings = await getSettings();

  return {
    freeShippingThresholdCents: settings.freeShippingThresholdCents,
    freeShippingThresholdLabel: settings.freeShippingThresholdLabel,
    shippingFeeCents: settings.shippingFeeCents,
    shippingFeeLabel: settings.shippingFeeLabel,
    promoEnabled: settings.promoEnabled,
  };
}

/**
 * The real money.
 *
 * Takes product ids and a promo code. No price, no shipping cost and no total are
 * accepted from the browser — `calculateTotals` re-reads every one of them from
 * the database and does the arithmetic itself, and it is the same function the
 * checkout will use, so there is one implementation of "what does this cost".
 *
 * Quantities are encoded as one id per unit, because that is what the pricing
 * function takes and it collapses the repeats into lines itself.
 */
export async function priceCart(input: {
  productIds: string[];
  promoCode?: string | null;
}): Promise<
  | { success: true; summary: CartSummary }
  | { success: false; error: string }
> {
  const parsed = cartPriceSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "We could not total that up." };
  }

  try {
    const [totals, settings] = await Promise.all([
      calculateTotals(parsed.data.productIds, parsed.data.promoCode ?? undefined),
      getSettings(),
    ]);

    // The threshold is judged on what is actually being charged, so a promo code
    // that pushes an order over the line gives free shipping rather than charging
    // the fee on a discounted total.
    const quote = await getShippingQuote(
      totals.subtotalCents - totals.discountCents,
    );

    return {
      success: true,
      summary: {
        itemCount: totals.itemCount,
        subtotalCents: totals.subtotalCents,
        subtotalLabel: totals.subtotalLabel,
        discountCents: totals.discountCents,
        discountLabel: totals.discountLabel,
        shippingCents: totals.shippingCents,
        shippingLabel: totals.shippingLabel,
        totalCents: totals.totalCents,
        totalLabel: totals.totalLabel,
        freeShippingThresholdCents: settings.freeShippingThresholdCents,
        freeShippingThresholdLabel: settings.freeShippingThresholdLabel,
        freeShippingRemainingCents: quote.remainingCents,
      },
    };
  } catch {
    return { success: false, error: "We could not total that up just now." };
  }
}

/**
 * Checks a promo code against the current basket.
 *
 * The basket arrives as ids rather than as a subtotal, because the discount has to
 * be worked out against what the plants cost *now* — not against what the browser
 * said they cost when the code was typed.
 */
export async function applyPromoCode(input: {
  productIds: string[];
  code: string;
}): Promise<
  | {
      success: true;
      quote: {
        code: string;
        valid: boolean;
        reason: string | null;
        discountCents: number;
        discountLabel: string;
        discountPercent: number;
      };
    }
  | { success: false; error: string }
> {
  const parsed = promoCodeSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Type a code first." };
  }

  try {
    const totals = await calculateTotals(parsed.data.productIds);
    const quote = await getPromoQuote(parsed.data.code, totals.subtotalCents);

    return {
      success: true,
      quote: {
        code: quote.code,
        valid: quote.valid,
        reason: quote.reason,
        discountCents: quote.discountCents,
        discountLabel: quote.discountLabel,
        discountPercent: quote.discountPercent,
      },
    };
  } catch {
    return { success: false, error: "We could not check that code just now." };
  }
}


