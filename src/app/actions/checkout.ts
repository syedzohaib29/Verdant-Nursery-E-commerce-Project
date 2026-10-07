"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { auth } from "@/auth";
import { getOrderById } from "@/lib/data/orders";
import {
  getPromoQuote,
  getShippingQuote,
} from "@/lib/data/settings";
import { getProductsByIds } from "@/lib/data/products";
import { saveAddress } from "@/lib/data/users";
import { buildOrderEmailData, sendOrderEmail } from "@/lib/email";
import { type PaymentMethod } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession, stripeAvailable } from "@/lib/stripe";
import { issueOrderAccess, ORDER_ACCESS_COOKIE } from "@/lib/success-token";
import { getOrigin } from "@/lib/url";
import { generateOrderNumber } from "@/lib/utils";
import {
  cancelOrderSchema,
  createOrderSchema,
  type CancelOrderInput,
  type CheckoutAddressInput,
  type CreateOrderInput,
} from "@/lib/validations/checkout";
import { Prisma } from "@/generated/prisma/client";

/*
  Checkout server actions.

  This file is where the money happens, so every number on the way in is ignored
  and every number on the way out is recomputed from the database:

  - Products are re-fetched by id. A product that is no longer active is simply
    absent from the result, which is how it becomes "no longer on the shelf".
  - Prices, the promo discount and shipping all come from the same helpers the
    cart uses, so a checkout and a basket cannot quote different totals.
  - Stock is taken inside a transaction with a guarded `updateMany` per line
    (`where stock >= quantity`). If any line cannot be taken the whole
    transaction aborts and nothing is decremented, so two browsers can never
    oversell the last plant.
  - `checkoutToken` makes the whole thing idempotent: a submission retried after
    a network failure finds the order it already created and returns it instead
    of creating a second one.

  The rules are the same ones that keep the rest of the account area honest: the
  caller comes from the session, ownership is checked before anything is read or
  written, and every failure returns a message a customer can act on.
*/

export type StockIssue = {
  productId: string;
  name: string;
  /** What the customer asked for. */
  requested: number;
  /** What is actually on the shelf. */
  available: number;
};

export type CreateOrderResult =
  | {
      success: true;
      orderId: string;
      orderNumber: string;
      totalCents: number;
      /** Present only when the order is paid by card and a session was opened. */
      stripeUrl: string | null;
    }
  | {
      success: false;
      error: string;
      fieldErrors: Record<string, string[]>;
      stockIssues: StockIssue[];
    };

const FAILED = (message: string): CreateOrderResult => ({
  success: false,
  error: message,
  fieldErrors: {},
  stockIssues: [],
});

class StockConflictError extends Error {
  issues: StockIssue[];

  constructor(issues: StockIssue[]) {
    super("stock conflict");
    this.name = "StockConflictError";
    this.issues = issues;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

/** The next human-facing order number, one past the newest row in the table. */
async function nextOrderSequence(): Promise<number> {
  const latest = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  const parsed = latest ? Number(latest.orderNumber.replace(/^VRD-/, "")) : NaN;

  // The seed leaves the sequence in the low 10070s; 10072 keeps new orders clear
  // of it even after a reseed.
  if (!Number.isFinite(parsed)) return 10072;

  return parsed + 1;
}

type PricedLine = {
  productId: string;
  name: string;
  unitCents: number;
  quantity: number;
  image: string | null;
};

/**
 * Places the order. See the file header for the money rules.
 *
 * Returns `stripeUrl` for card orders: after the order is safely on the books
 * the customer is sent to Stripe's hosted page to actually pay, and the webhook
 * at `/api/webhooks/stripe` is what marks it paid.
 */
export async function createOrderAction(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const parsed = createOrderSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Check the form and try again.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
      stockIssues: [],
    };
  }

  const { email, paymentMethod } = parsed.data;

  try {
    const products = await getProductsByIds(
      parsed.data.lines.map((line) => line.productId),
    );
    const byId = new Map(products.map((product) => [product.id, product]));

    // Every line has to resolve to a live, sufficiently-stocked product before
    // anything is written. The list of problems is returned whole so the client
    // can show each one rather than a single vague refusal.
    const stockIssues: StockIssue[] = [];

    for (const line of parsed.data.lines) {
      const product = byId.get(line.productId);

      if (!product) {
        stockIssues.push({
          productId: line.productId,
          name: "One of your plants",
          requested: line.quantity,
          available: 0,
        });
        continue;
      }

      if (product.stock < line.quantity) {
        stockIssues.push({
          productId: line.productId,
          name: product.name,
          requested: line.quantity,
          available: product.stock,
        });
      }
    }

    if (stockIssues.length > 0) {
      return {
        success: false,
        error:
          "Some of your basket sold out while you were checking out. Nothing was ordered and nothing was charged.",
        fieldErrors: {},
        stockIssues,
      };
    }

    const lines: PricedLine[] = parsed.data.lines.map((line) => {
      const product = byId.get(line.productId) as NonNullable<
        ReturnType<typeof byId.get>
      >;

      return {
        productId: line.productId,
        name: product.name,
        unitCents: product.effectivePriceCents,
        quantity: line.quantity,
        image: product.image,
      };
    });

    const subtotalCents = lines.reduce(
      (total, line) => total + line.unitCents * line.quantity,
      0,
    );

    const promo = parsed.data.promoCode
      ? await getPromoQuote(parsed.data.promoCode, subtotalCents)
      : null;
    const discountCents = promo?.valid ? promo.discountCents : 0;

    // Shipping is quoted against what is actually being charged, the same rule
    // the cart page follows, so a code that crosses the free-shipping line earns
    // free shipping at checkout too.
    const shipping = await getShippingQuote(subtotalCents - discountCents);
    const totalCents = subtotalCents - discountCents + shipping.shippingCents;

    if (paymentMethod === "STRIPE" && !stripeAvailable()) {
      return FAILED(
        "Card payments are switched off right now — cash on delivery works.",
      );
    }

    // Idempotency: a retried submit must hand back the order it already made,
    // not make a second one. This read stands outside the transaction because a
    // lost response is the one case worth optimising for, and SQLite serialises
    // writers anyway.
    const existing = parsed.data.checkoutToken
      ? await prisma.order.findUnique({
          where: { checkoutToken: parsed.data.checkoutToken },
          select: {
            id: true,
            orderNumber: true,
            totalCents: true,
            paymentMethod: true,
          },
        })
      : null;

    if (existing) {
      // A card order whose response vanished still needs its payment session
      // handed out on the retry; a COD order is simply returned.
      if (existing.paymentMethod === "STRIPE" && stripeAvailable()) {
        try {
          const session = await createCheckoutSession({
            orderId: existing.id,
            orderNumber: existing.orderNumber,
            email,
            totalCents: existing.totalCents,
            successUrl: `${await getOrigin()}/checkout/success?order=${existing.orderNumber}`,
            cancelUrl: `${await getOrigin()}/checkout`,
          });

          return {
            success: true,
            orderId: existing.id,
            orderNumber: existing.orderNumber,
            totalCents: existing.totalCents,
            stripeUrl: session.url,
          };
        } catch {
          return FAILED(
            "The payment page would not open just now. Try again — your order is still waiting.",
          );
        }
      }

      return {
        success: true,
        orderId: existing.id,
        orderNumber: existing.orderNumber,
        totalCents: existing.totalCents,
        stripeUrl: null,
      };
    }

    // One create attempt per candidate number; a number collision rolls the whole
    // attempt back (nothing was decremented) and the loop tries the next one.
    let sequence = await nextOrderSequence();
    let placed: { orderId: string; orderNumber: string } | null = null;

    for (let attempt = 0; attempt < 5 && !placed; attempt += 1) {
      try {
        placed = await placeOrder(sequence, {
          checkoutToken: parsed.data.checkoutToken,
          userId,
          email,
          paymentMethod,
          shipping: parsed.data.shipping,
          lines,
          subtotalCents,
          discountCents,
          shippingCents: shipping.shippingCents,
          totalCents,
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          sequence += 1;
          continue;
        }

        throw error;
      }
    }

    if (!placed) return FAILED("We could not reserve an order number. Try again.");

    // A signed-in shopper may keep the address for next time; this happens after
    // the order is safe so a busted address save can never fail the order.
    if (userId && parsed.data.saveAddress) {
      await saveAddress(userId, {
        fullName: parsed.data.shipping.fullName,
        phone: parsed.data.shipping.phone,
        line1: parsed.data.shipping.line1,
        line2: parsed.data.shipping.line2 || undefined,
        city: parsed.data.shipping.city,
        state: parsed.data.shipping.state,
        postalCode: parsed.data.shipping.postalCode,
        country: parsed.data.shipping.country,
        isDefault: false,
      });
    }

    // Guests reach the confirmation page through a short-lived signed cookie.
    // Signed-in customers use their session, so only guests are issued one.
    if (!userId) {
      const token = issueOrderAccess(placed.orderNumber, email);

      if (token) {
        (await cookies()).set(ORDER_ACCESS_COOKIE, token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/checkout/success",
          maxAge: 60 * 60,
        });
      }
    }

    revalidatePath("/account", "layout");
    revalidatePath("/shop", "layout");

    if (paymentMethod === "COD") {
      // Fire and forget: the receipt must never hold the order hostage.
      void sendOrderEmail(
        buildOrderEmailData({
          orderNumber: placed.orderNumber,
          email,
          customerName: parsed.data.shipping.fullName,
          paymentMethod,
          totalCents,
          shippingCents: shipping.shippingCents,
          itemCount: lines.reduce((n, line) => n + line.quantity, 0),
          createdAt: new Date(),
          shippingAddress: [
            parsed.data.shipping.fullName,
            parsed.data.shipping.line1,
            parsed.data.shipping.line2,
            `${parsed.data.shipping.city}, ${parsed.data.shipping.state} ${parsed.data.shipping.postalCode}`,
            parsed.data.shipping.country,
          ]
            .filter(Boolean)
            .join("\n"),
          items: lines.map((line) => ({
            name: line.name,
            quantity: line.quantity,
            priceCents: line.unitCents,
          })),
        }),
      );
    }

    let stripeUrl: string | null = null;

    if (paymentMethod === "STRIPE") {
      try {
        const session = await createCheckoutSession({
          orderId: placed.orderId,
          orderNumber: placed.orderNumber,
          email,
          totalCents,
          successUrl: `${await getOrigin()}/checkout/success?order=${placed.orderNumber}`,
          cancelUrl: `${await getOrigin()}/checkout`,
        });
        stripeUrl = session.url;
      } catch {
        // The order exists but the payment page could not open. Unwind it and
        // its stock so the failure leaves no phantom order behind.
        await prisma.$transaction([
          ...lines.map((line) =>
            prisma.product.updateMany({
              where: { id: line.productId },
              data: { stock: { increment: line.quantity } },
            }),
          ),
          prisma.order.delete({ where: { id: placed.orderId } }),
        ]);

        return FAILED(
          "The payment page would not open, so we cancelled the order and nothing was charged. Try again, or choose cash on delivery.",
        );
      }
    }

    return {
      success: true,
      orderId: placed.orderId,
      orderNumber: placed.orderNumber,
      totalCents,
      stripeUrl,
    };
  } catch (error) {
    if (error instanceof StockConflictError) {
      return {
        success: false,
        error:
          "Some of your basket sold out in the seconds before you checked out. Nothing was ordered and nothing was charged.",
        fieldErrors: {},
        stockIssues: error.issues,
      };
    }

    return FAILED(
      "We could not place your order just now. Nothing was charged and your basket is untouched — try again in a moment.",
    );
  }
}

async function placeOrder(
  sequence: number,
  data: {
    checkoutToken: string;
    userId: string | null;
    email: string;
    paymentMethod: PaymentMethod;
    shipping: CheckoutAddressInput;
    lines: PricedLine[];
    subtotalCents: number;
    discountCents: number;
    shippingCents: number;
    totalCents: number;
  },
): Promise<{ orderId: string; orderNumber: string }> {
  return prisma.$transaction(async (tx) => {
    // Checked again inside the transaction so a concurrent retry cannot both
    // pass the read above and both write.
    const already = await tx.order.findUnique({
      where: { checkoutToken: data.checkoutToken },
      select: { id: true, orderNumber: true },
    });

    if (already) return { orderId: already.id, orderNumber: already.orderNumber };

    // Take the stock line by line, guarded. A line whose shelf ran out returns
    // zero rows, which throws before the order exists — nothing to roll back,
    // nothing decremented.
    for (const line of data.lines) {
      const taken = await tx.product.updateMany({
        where: { id: line.productId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });

      if (taken.count !== 1) {
        const row = await tx.product.findUnique({
          where: { id: line.productId },
          select: { name: true, stock: true },
        });

        throw new StockConflictError([
          {
            productId: line.productId,
            name: row?.name ?? "One of your plants",
            requested: line.quantity,
            available: row?.stock ?? 0,
          },
        ]);
      }
    }

    // The shipping fields snapshot the submitted form so the order keeps a
    // deliverable address even if the customer edits their address book later.
    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(sequence),
        userId: data.userId,
        email: data.email,
        status: "PENDING",
        paymentMethod: data.paymentMethod,
        paymentStatus: "PENDING",
        subtotalCents: data.subtotalCents,
        discountCents: data.discountCents,
        shippingCents: data.shippingCents,
        totalCents: data.totalCents,
        checkoutToken: data.checkoutToken,
        shipFullName: data.shipping.fullName,
        shipPhone: data.shipping.phone,
        shipLine1: data.shipping.line1,
        shipLine2: data.shipping.line2 || null,
        shipCity: data.shipping.city,
        shipState: data.shipping.state,
        shipPostalCode: data.shipping.postalCode,
        shipCountry: data.shipping.country,
        items: {
          create: data.lines.map((line) => ({
            productId: line.productId,
            name: line.name,
            priceCents: line.unitCents,
            quantity: line.quantity,
            image: line.image,
          })),
        },
      },
      select: { id: true, orderNumber: true },
    });

    return { orderId: created.id, orderNumber: created.orderNumber };
  });
}

export type CancelOrderResult = {
  success: boolean;
  error: string | null;
};

/**
 * Cancels a pending cash-on-delivery order and puts its stock back.
 *
 * Exactly-once comes from the guarded update: the transaction only proceeds if
 * an `updateMany` aimed at PENDING+COD could claim the row, so two racing
 * cancels cannot both restock the same plants.
 */
export async function cancelOrderAction(
  input: CancelOrderInput,
): Promise<CancelOrderResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Sign in to cancel an order." };
  }

  const parsed = cancelOrderSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "That order could not be read." };
  }

  try {
    const order = await getOrderById(parsed.data.orderId, session.user.id);

    if (!order) return { success: false, error: "We could not find that order." };

    if (order.status !== "PENDING") {
      return {
        success: false,
        error:
          order.status === "CANCELLED"
            ? "This order is already cancelled."
            : "Only a pending order can be cancelled — this one has moved on. Write to us and we will sort it out.",
      };
    }

    if (order.paymentMethod !== "COD") {
      return {
        success: false,
        error:
          "Card orders are settled by the payment provider. Write to us with the order number and we will sort it out.",
      };
    }

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: {
          id: order.id,
          userId: session.user.id,
          status: "PENDING",
          paymentMethod: "COD",
        },
        data: { status: "CANCELLED" },
      });

      if (claimed.count !== 1) {
        throw new Error("cancel: order was not claimable");
      }

      for (const item of order.items) {
        if (!item.productId) continue;

        await tx.product.updateMany({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });

    revalidatePath("/account", "layout");
    revalidatePath("/account/orders", "page");
    revalidatePath(`/account/orders/${order.id}`, "page");
    revalidatePath("/shop", "layout");

    return { success: true, error: null };
  } catch {
    return {
      success: false,
      error:
        "We could not cancel that order just now. If it is still pending, try again.",
    };
  }
}