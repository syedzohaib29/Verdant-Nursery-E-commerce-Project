import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/*
  Short-lived access for guest order pages.

  `/checkout/success` is readable by the person who placed the order and by
  nobody who guessed the URL. A signed-in customer proves ownership with their
  session; a guest cannot, so the checkout action hands them a signed, short-lived
  cookie instead. The cookie carries the order number, the order email and an
  expiry, signed with the same secret Auth.js uses — so forging one needs the
  secret, and reusing one after an hour fails closed.

  The three fields are deliberately minimal and the payload is signed rather than
  encrypted: nothing here is a secret the browser should not know, the signature
  is what makes it trustworthy, and keeping it readable keeps the format debuggable.
*/

export const ORDER_ACCESS_COOKIE = "verdant_order";

/** The cookie lives about as long as "I just bought something" needs it to. */
export const ORDER_ACCESS_TTL_MS = 60 * 60 * 1000;

type OrderAccessPayload = {
  /** Order number, VRD-10001 style. */
  o: string;
  /** Email the order was placed with, lowercased. */
  e: string;
  /** Expiry as epoch milliseconds. */
  exp: number;
};

/** Auth.js accepts a comma-separated list of secrets; the first one signs. */
function signingSecret(): string | null {
  const value = process.env.AUTH_SECRET;
  if (!value) return null;

  const first = value.split(",")[0]?.trim();
  return first || null;
}

function sign(payload: string): string {
  const secret = signingSecret();

  if (!secret) {
    throw new Error("ORDER_ACCESS: AUTH_SECRET is not set");
  }

  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function issueOrderAccess(
  orderNumber: string,
  email: string,
): string | null {
  const secret = signingSecret();
  if (!secret) return null;

  const payload = Buffer.from(
    JSON.stringify({
      o: orderNumber,
      e: email.trim().toLowerCase(),
      exp: Date.now() + ORDER_ACCESS_TTL_MS,
    } satisfies OrderAccessPayload),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function verifyOrderAccess(
  token: string | undefined,
): OrderAccessPayload | null {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const secret = signingSecret();
  if (!secret) return null;

  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);

  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let parsed: unknown;

  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;

  const body = parsed as Partial<OrderAccessPayload>;

  if (typeof body.o !== "string" || typeof body.e !== "string") return null;
  if (typeof body.exp !== "number" || !Number.isFinite(body.exp)) return null;

  if (Date.now() > body.exp) return null;

  return { o: body.o, e: body.e, exp: body.exp };
}