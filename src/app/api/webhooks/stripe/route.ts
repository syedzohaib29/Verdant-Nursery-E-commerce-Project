import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getOrderById } from "@/lib/data/orders";
import { buildOrderEmailData, sendOrderEmail } from "@/lib/email";
import { type PaymentMethod } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { verifyStripeWebhookSignature } from "@/lib/stripe";

/*
  Stripe webhook.

  The only job on this route is to believe Stripe's signature and then record
  that a card order has been paid. `checkout.session.completed` arrives after a
  customer finishes the hosted Checkout page; Stripe retries deliveries that do
  not get a 2xx, and the guarded `updateMany` below makes a retry harmless — the
  second delivery finds the payment already marked and does nothing, which also
  keeps the confirmation email from being sent twice.

  Payment is not fulfilment: the order stays PENDING until a person confirms it,
  so this writes `paymentStatus` and leaves `status` alone.

  Stripe signs the exact bytes of the body, so the raw text is verified with
  `node:crypto` before anything is parsed. See `verifyStripeWebhookSignature`.
*/

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Stripe webhook signing is not configured on this server." },
      { status: 400 },
    );
  }

  let event: ReturnType<typeof verifyStripeWebhookSignature>;

  try {
    event = verifyStripeWebhookSignature(
      rawBody,
      request.headers.get("stripe-signature"),
      secret,
    );
  } catch {
    return NextResponse.json(
      { error: "The webhook signature did not verify." },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const orderId =
      typeof event.data.object.client_reference_id === "string"
        ? event.data.object.client_reference_id
        : null;

    if (orderId) {
      // Guarded compare-and-swap: only an unpaid, card order can be claimed, so
      // a duplicate delivery, an expired retry or a replay can never double-run.
      const claimed = await prisma.order.updateMany({
        where: {
          id: orderId,
          paymentStatus: "PENDING",
          paymentMethod: "STRIPE",
        },
        data: { paymentStatus: "PAID" },
      });

      if (claimed.count === 1) {
        const order = await getOrderById(orderId);

        if (order) {
          // Fire and forget, same rule as the checkout action: a receipt must
          // never hold the payment it is announcing hostage.
          void sendOrderEmail(
            buildOrderEmailData({
              orderNumber: order.orderNumber,
              email: order.email,
              customerName: order.customerName,
              paymentMethod: order.paymentMethod as PaymentMethod,
              totalCents: order.totalCents,
              shippingCents: order.shippingCents,
              itemCount: order.itemCount,
              createdAt: new Date(order.createdAt),
              shippingAddress: order.shippingAddress.formatted,
              items: order.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                priceCents: item.priceCents,
              })),
            }),
          );
        }
      }
    }
  }

  // Every valid event gets a 200 — including ones this route does not act on —
  // so Stripe stops retrying. Unknown events are acknowledged, not errors.
  return NextResponse.json({ received: true });
}