import { describe, expect, it } from "vitest";

import {
  computeOrderTotals,
  quoteShipping,
  sumLines,
} from "@/lib/pricing";

const FEE = 795;
const THRESHOLD = 7500;

describe("sumLines", () => {
  it("counts units and multiplies quantity", () => {
    const { itemCount, subtotalCents } = sumLines([
      { unitCents: 2300, quantity: 2 },
      { unitCents: 950, quantity: 1 },
    ]);
    expect(itemCount).toBe(3);
    expect(subtotalCents).toBe(5550);
  });

  it("sums nothing to zero", () => {
    expect(sumLines([])).toEqual({ itemCount: 0, subtotalCents: 0 });
  });
});

describe("quoteShipping", () => {
  it("charges the fee below the threshold", () => {
    const quote = quoteShipping(4000, FEE, THRESHOLD);
    expect(quote.shippingCents).toBe(FEE);
    expect(quote.isFree).toBe(false);
    expect(quote.remainingCents).toBe(3500);
  });

  it("ships free at exactly the threshold — inclusive", () => {
    const quote = quoteShipping(THRESHOLD, FEE, THRESHOLD);
    expect(quote.shippingCents).toBe(0);
    expect(quote.isFree).toBe(true);
    expect(quote.remainingCents).toBe(0);
  });

  it("ships free above the threshold", () => {
    expect(quoteShipping(9000, FEE, THRESHOLD).isFree).toBe(true);
  });
});

describe("computeOrderTotals", () => {
  it("adds shipping to a small order", () => {
    const totals = computeOrderTotals({
      lines: [{ unitCents: 2300, quantity: 2 }],
      discountCents: 0,
      shippingFeeCents: FEE,
      freeShippingThresholdCents: THRESHOLD,
    });
    expect(totals).toMatchObject({
      itemCount: 2,
      subtotalCents: 4600,
      discountCents: 0,
      shippingCents: FEE,
      shippingIsFree: false,
      totalCents: 5395,
    });
  });

  it("a discount large enough to drop below the threshold still pays shipping", () => {
    const totals = computeOrderTotals({
      lines: [{ unitCents: 4000, quantity: 2 }],
      discountCents: 1000,
      shippingFeeCents: FEE,
      freeShippingThresholdCents: THRESHOLD,
    });
    // 8000 - 1000 = 7000, which is under the 7500 threshold.
    expect(totals.shippingCents).toBe(FEE);
    expect(totals.totalCents).toBe(8000 - 1000 + FEE);
  });

  it("a discount that leaves the chargeable total at the threshold ships free", () => {
    const totals = computeOrderTotals({
      lines: [{ unitCents: 4000, quantity: 2 }],
      discountCents: 500,
      shippingFeeCents: FEE,
      freeShippingThresholdCents: THRESHOLD,
    });
    expect(totals.shippingIsFree).toBe(true);
    expect(totals.totalCents).toBe(7500);
  });

  it("an empty basket still carries the quoted shipping, never a negative total", () => {
    const totals = computeOrderTotals({
      lines: [],
      discountCents: 0,
      shippingFeeCents: FEE,
      freeShippingThresholdCents: THRESHOLD,
    });
    expect(totals.subtotalCents).toBe(0);
    expect(totals.totalCents).toBe(FEE);
  });
});