import { z } from "zod";

/*
  Cart payloads.

  Shared by the server actions that repair the basket and by the client code that
  assembles the payload, so the two cannot drift apart.

  Quantities are `z.number()` and not `z.coerce.number()` on purpose. The basket
  store already turns anything a stepper or a devtools edit can produce into a
  clean integer, and coercion would quietly accept `null`, `""` and `NaN` on the
  way in — which is precisely the leniency the basket spends real effort removing
  two layers up. By the time a payload reaches an action it is meant to already be
  the good shape, and a bad one should be rejected rather than repaired silently.
*/

export const MAX_CART_LINES = 40;

export const cartQuantitySchema = z
  .number()
  .int("Whole plants only.")
  .min(1, "At least one.")
  .max(99, "If you need more than that, email us and we will sort it out.");

export const cartLineInputSchema = z.object({
  productId: z.string().min(1).max(64),
  quantity: cartQuantitySchema,
  /**
   * What the basket *believes* a unit costs. Optional, and only ever used to
   * decide whether there is something to tell the customer about — the reply
   * always carries the database's price, and nothing in the total is derived from
   * this number. Sending it is what lets `revalidateCart` say "this is now $28
   * rather than $32" instead of announcing a price every single visit.
   */
  believedPriceCents: z.number().int().min(0).max(100_000).optional(),
});

/** What a repair request carries: pairs of id and quantity, nothing else. */
export const cartRevalidateSchema = z.object({
  items: z.array(cartLineInputSchema).max(MAX_CART_LINES),
});

/**
 * What a pricing request carries: ids, one entry per unit, plus an optional code.
 *
 * No price, no shipping cost, no total — the shape is the point. There is nowhere
 * in this payload for a client to put an amount, so there is nothing to be
 * tempted to trust.
 *
 * The ceiling is the basket store's own hard limit: 40 lines of at most 99 each.
 * A basket that exceeds it is not a basket, it is a denial of service against our
 * own database, and rejecting it here is cheaper than pricing it.
 */
export const cartPriceSchema = z.object({
  productIds: z
    .array(z.string().min(1).max(64))
    .max(MAX_CART_LINES * 99, "That basket has more plants in it than we can total."),
  /**
   * `null` is accepted as well as absent.
   *
   * This is not leniency for its own sake: "no code applied" is a real state that
   * callers hold as `string | null`, and `.optional()` only admits `undefined`.
   * Rejecting `null` here fails every un-discounted basket with a bare "We could not
   * total that up", which is exactly the message a customer sees when something
   * else is wrong — so the one routine case and the one fault case look identical.
   */
  promoCode: z
    .string()
    .trim()
    .max(32)
    .nullish()
    .transform((code) => code ?? undefined),
});

export const promoCodeSchema = z.object({
  productIds: z
    .array(z.string().min(1).max(64))
    .max(MAX_CART_LINES * 99, "That basket has more plants in it than we can total."),
  code: z.string().trim().min(1, "Type a code first.").max(32),
});

export type CartLineInput = z.infer<typeof cartLineInputSchema>;
