/*
  The money maths, kept free of the database.

  Every server-side total in the shop is built from these three pure functions:
  what the lines add up to, what shipping costs for that subtotal, and what the
  grand total is once the discount has done its work. Keeping the arithmetic
  here (rather than inside a data layer that talks to the database) is what
  makes the pricing rules unit-testable, and it keeps one implementation of
  "what does this cost" for the cart page, the checkout and the invoice.

  All money is integer cents, always.
*/

export type PriceLine = {
  unitCents: number;
  quantity: number;
};

/**
 * Sums basket lines into the two numbers everything else derives from.
 *
 * Quantity is multiplied rather than assumed: a line can hold "2 of the same
 * plant" and the subtotal must count both.
 */
export function sumLines(
  lines: PriceLine[],
): { itemCount: number; subtotalCents: number } {
  let itemCount = 0;
  let subtotalCents = 0;

  for (const line of lines) {
    itemCount += line.quantity;
    subtotalCents += line.unitCents * line.quantity;
  }

  return { itemCount, subtotalCents };
}

/**
 * What shipping costs for a given subtotal, given the shop's two numbers.
 *
 * The free-shipping threshold is inclusive, so an order landing exactly on it
 * ships free — that is a promise made in the cart, so the boundary is tested
 * here rather than trusted to whoever calls.
 */
export function quoteShipping(
  subtotalCents: number,
  shippingFeeCents: number,
  freeShippingThresholdCents: number,
): {
  shippingCents: number;
  isFree: boolean;
  /** How much more is needed to cross into free shipping, or 0 once there. */
  remainingCents: number;
} {
  if (subtotalCents >= freeShippingThresholdCents) {
    return { shippingCents: 0, isFree: true, remainingCents: 0 };
  }

  return {
    shippingCents: shippingFeeCents,
    isFree: false,
    remainingCents: freeShippingThresholdCents - subtotalCents,
  };
}

/**
 * The whole order arithmetic in one place.
 *
 * `discountCents` is what a validated promo code shaves off; it is judged
 * against the subtotal *after* the discount, because a code that pushes an
 * order over the free-shipping line should give free shipping rather than
 * charging the fee on a discounted total.
 */
export function computeOrderTotals(input: {
  lines: PriceLine[];
  discountCents: number;
  shippingFeeCents: number;
  freeShippingThresholdCents: number;
}): {
  itemCount: number;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  shippingIsFree: boolean;
  totalCents: number;
} {
  const { itemCount, subtotalCents } = sumLines(input.lines);
  const { shippingCents, isFree } = quoteShipping(
    subtotalCents - input.discountCents,
    input.shippingFeeCents,
    input.freeShippingThresholdCents,
  );

  return {
    itemCount,
    subtotalCents,
    discountCents: input.discountCents,
    shippingCents,
    shippingIsFree: isFree,
    totalCents: subtotalCents - input.discountCents + shippingCents,
  };
}