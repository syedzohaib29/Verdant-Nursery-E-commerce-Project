import "server-only";

import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  SHIPPING_FEE_CENTS,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

/*
  Store settings.

  A single-row table with a pinned id. The fallback below matters more than it
  looks: on a fresh database, before the first seed, `getSettings` would otherwise
  throw and take the whole shop down. Returning a usable default means a new
  checkout starts with sane shipping numbers instead of an error page.
*/

export const SETTINGS_ID = 1;

export type Settings = {
  storeName: string;
  shippingFeeCents: number;
  freeShippingThresholdCents: number;
  promoEnabled: boolean;
  contactEmail: string;
  contactPhone: string;
  address: string;
  /** Precomputed for display, so no caller has to remember the helper. */
  shippingFeeLabel: string;
  freeShippingThresholdLabel: string;
};

const FALLBACK: Omit<Settings, "shippingFeeLabel" | "freeShippingThresholdLabel"> = {
  storeName: "Verdant",
  shippingFeeCents: SHIPPING_FEE_CENTS,
  freeShippingThresholdCents: FREE_SHIPPING_THRESHOLD_CENTS,
  promoEnabled: true,
  contactEmail: "hello@verdant.dev",
  contactPhone: "+1 (503) 555-0148",
  address: "Bench 4, Kiln Lane, Portland, OR 97209",
};

/**
 * Never cached across a request. The shipping fee and threshold are read on every
 * cart and checkout render, and a stale fee is a real money bug.
 */
export async function getSettings(): Promise<Settings> {
  const row = await prisma.setting.findUnique({ where: { id: SETTINGS_ID } });
  const base = row ?? FALLBACK;

  return {
    storeName: base.storeName,
    shippingFeeCents: base.shippingFeeCents,
    freeShippingThresholdCents: base.freeShippingThresholdCents,
    promoEnabled: base.promoEnabled,
    contactEmail: base.contactEmail,
    contactPhone: base.contactPhone,
    address: base.address,
    shippingFeeLabel: formatPrice(base.shippingFeeCents),
    freeShippingThresholdLabel: formatPrice(base.freeShippingThresholdCents),
  };
}

/**
 * What shipping costs for a given subtotal. The free-shipping threshold is
 * inclusive, so an order landing exactly on it ships free.
 */
export async function getShippingQuote(subtotalCents: number): Promise<{
  shippingCents: number;
  shippingLabel: string;
  isFree: boolean;
  /** How much more is needed to cross into free shipping, or 0 once there. */
  remainingCents: number;
}> {
  const settings = await getSettings();

  if (subtotalCents >= settings.freeShippingThresholdCents) {
    return {
      shippingCents: 0,
      shippingLabel: "Free",
      isFree: true,
      remainingCents: 0,
    };
  }

  const remaining = settings.freeShippingThresholdCents - subtotalCents;

  return {
    shippingCents: settings.shippingFeeCents,
    shippingLabel: settings.shippingFeeLabel,
    isFree: false,
    remainingCents: remaining,
  };
}

export type PromoQuote = {
  code: string;
  discountPercent: number;
  discountCents: number;
  discountLabel: string;
  valid: boolean;
  reason: string | null;
};

/**
 * Prices a promo code against a subtotal. Returns the reason for a rejection
 * rather than just a boolean, because "this code has expired" and "spend more to
 * use it" are very different things to tell a customer.
 *
 * The discount is rounded to whole cents so a 10% code never produces a
 * half-cent, which is the kind of thing that makes totals not add up later.
 */
export async function getPromoQuote(
  code: string,
  subtotalCents: number,
): Promise<PromoQuote> {
  const normalized = code.trim().toUpperCase();

  const rejected = (reason: string): PromoQuote => ({
    code: normalized,
    discountPercent: 0,
    discountCents: 0,
    discountLabel: formatPrice(0),
    valid: false,
    reason,
  });

  const promo = await prisma.promoCode.findUnique({
    where: { code: normalized },
  });

  if (!promo) return rejected("We do not have a code by that name.");
  if (!promo.active) return rejected("That code is no longer in use.");

  const settings = await getSettings();
  if (!settings.promoEnabled) return rejected("Promotions are switched off right now.");

  const now = new Date();
  if (promo.startsAt > now) return rejected("That code is not live yet.");
  if (promo.expiresAt && promo.expiresAt < now) return rejected("That code has expired.");

  if (promo.minSubtotalCents != null && subtotalCents < promo.minSubtotalCents) {
    return rejected(
      `Spend ${formatPrice(promo.minSubtotalCents)} to use that code.`,
    );
  }

  const discountCents = Math.round(
    (subtotalCents * promo.discountPercent) / 100,
  );

  return {
    code: promo.code,
    discountPercent: promo.discountPercent,
    discountCents,
    discountLabel: formatPrice(discountCents),
    valid: true,
    reason: null,
  };
}

/**
 * Cart totals, recomputed from product prices on the server.
 *
 * This function never accepts a total, a price or a shipping cost from the
 * client. It reads the current price of every product in the cart, applies the
 * promo and the shipping threshold, and returns the arithmetic. A tampered cart
 * can change a quantity or remove a line; it cannot change what anything costs.
 */
export async function calculateTotals(
  productIds: string[],
  promoCode?: string,
): Promise<{
  lines: {
    productId: string;
    name: string;
    slug: string;
    unitCents: number;
    quantity: number;
    lineCents: number;
    lineLabel: string;
    image: string | null;
    stock: number;
    inStock: boolean;
  }[];
  itemCount: number;
  subtotalCents: number;
  subtotalLabel: string;
  discountCents: number;
  discountLabel: string;
  shippingCents: number;
  shippingLabel: string;
  totalCents: number;
  totalLabel: string;
  promo: PromoQuote | null;
}> {
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      priceCents: true,
      salePriceCents: true,
      stock: true,
      images: {
        select: { url: true },
        orderBy: { position: "asc" },
        take: 1,
      },
    },
  });

  // Quantities arrive as a parallel array of ids, one entry per unit, so repeated
  // ids collapse into a single line here.
  const quantities = new Map<string, number>();
  for (const id of productIds) {
    quantities.set(id, (quantities.get(id) ?? 0) + 1);
  }

  const lines = products.flatMap((product) => {
    const quantity = quantities.get(product.id) ?? 0;
    if (quantity === 0) return [];

    const unitCents = product.salePriceCents ?? product.priceCents;
    const lineCents = unitCents * quantity;

    return [
      {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        unitCents,
        quantity,
        lineCents,
        lineLabel: formatPrice(lineCents),
        image: product.images[0]?.url ?? null,
        stock: product.stock,
        inStock: product.stock >= quantity,
      },
    ];
  });

  // Sort by name so the order of ids in localStorage never changes the display.
  lines.sort((a, b) => a.name.localeCompare(b.name));

  const subtotalCents = lines.reduce((total, line) => total + line.lineCents, 0);
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);

  const promo = promoCode ? await getPromoQuote(promoCode, subtotalCents) : null;
  const discountCents = promo?.valid ? promo.discountCents : 0;

  const shipping = await getShippingQuote(subtotalCents - discountCents);
  const totalCents = subtotalCents - discountCents + shipping.shippingCents;

  return {
    lines,
    itemCount,
    subtotalCents,
    subtotalLabel: formatPrice(subtotalCents),
    discountCents,
    discountLabel: formatPrice(discountCents),
    shippingCents: shipping.shippingCents,
    shippingLabel: shipping.isFree ? "Free" : shipping.shippingLabel,
    totalCents,
    totalLabel: formatPrice(totalCents),
    promo: promo && promo.valid ? promo : null,
  };
}
