import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/*
  Stripe, without the Stripe SDK.

  The project rule is "no new deps without asking", and the SDK is only a client
  for the same REST API a plain fetch can reach — creating a Checkout Session is
  one form-encoded POST, and verifying a webhook signature is one HMAC. So this
  file speaks to `api.stripe.com` directly with the secret key, and verifies
  `Stripe-Signature` headers with `node:crypto`. Nothing in it runs unless a
  `STRIPE_SECRET_KEY` is present, which is also what hides the card option from
  the checkout when the store is not wired up for payment.
*/

/** Whether the shop can take cards at all, checked once per render and per action. */
export function stripeAvailable(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export type StripeSession = {
  id: string;
  url: string;
};

export type CreateCheckoutSessionArgs = {
  orderId: string;
  orderNumber: string;
  email: string;
  totalCents: number;
  successUrl: string;
  cancelUrl: string;
};

/**
 * A hosted Checkout Session for one order.
 *
 * The session itself is thin: one line item for the whole order (name carries the
 * order number, amount is the exact total), `client_reference_id` holds the order
 * id so the webhook can find what was paid, and the metadata keeps the human
 * number for email copy without a second lookup.
 *
 * Throws on any non-2xx or a missing url, so the caller decides what a card-payment
 * that cannot be set up means for the order that was just created.
 */
export async function createCheckoutSession(
  args: CreateCheckoutSessionArgs,
): Promise<StripeSession> {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) throw new Error("stripe: STRIPE_SECRET_KEY is not set");

  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("client_reference_id", args.orderId);
  body.set("customer_email", args.email);
  body.set("line_items[0][price_data][currency]", "usd");
  body.set("line_items[0][price_data][unit_amount]", String(args.totalCents));
  body.set(
    "line_items[0][price_data][product_data][name]",
    `Verdant order ${args.orderNumber}`,
  );
  body.set("line_items[0][quantity]", "1");
  body.set("success_url", args.successUrl);
  body.set("cancel_url", args.cancelUrl);
  body.set("metadata[orderNumber]", args.orderNumber);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok || typeof payload !== "object" || payload === null) {
    throw new Error("stripe: could not create a checkout session");
  }

  const session = payload as { id?: unknown; url?: unknown };

  if (typeof session.id !== "string" || typeof session.url !== "string") {
    throw new Error("stripe: checkout session response was malformed");
  }

  return { id: session.id, url: session.url };
}

export type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

/**
 * Verifies a `Stripe-Signature` header against the raw request body.
 *
 * The raw body is the point: Stripe signs exactly the bytes sent over the wire,
 * so verifying a parsed object verifies nothing. The v1 scheme is an HMAC-SHA256
 * of `timestamp.payload` with the webhook secret, compared in constant time, with
 * a five-minute tolerance against replay. Any failure throws, and the route turns
 * a throw into a 400 — Stripe treats a non-2xx as "do not mark that delivered"
 * and retries, which is the right failure mode for a webhook.
 */
export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): StripeEvent {
  if (!signatureHeader) throw new Error("stripe: missing Stripe-Signature header");

  let timestamp: string | null = null;
  let signature: string | null = null;

  for (const pair of signatureHeader.split(",")) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;

    const key = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();

    if (key === "t") timestamp = value;
    if (key === "v1") signature = value;
  }

  if (!timestamp || !signature) {
    throw new Error("stripe: malformed Stripe-Signature header");
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature.toLowerCase());

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("stripe: signature did not verify");
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (ageSeconds > 300) throw new Error("stripe: signature is stale");

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new Error("stripe: body is not valid JSON");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("stripe: body is not an object");
  }

  const event = parsed as Partial<StripeEvent>;

  if (typeof event.id !== "string" || typeof event.type !== "string") {
    throw new Error("stripe: event is missing id or type");
  }

  return parsed as StripeEvent;
}