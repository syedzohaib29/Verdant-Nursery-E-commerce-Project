"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { nextStatuses } from "@/lib/constants";
import { getOrderById } from "@/lib/data/orders";
import { prisma } from "@/lib/prisma";
import { orderStatusFormSchema } from "@/lib/validations/admin";

/*
  Order status actions.

  The one action that moves money-adjacent state. Three rules make it safe:

  1. The transition is validated against the table in constants, so an order
     can only move the way the lifecycle allows — the UI hides invalid moves
     and the server refuses them.
  2. Cancelling restocks inside a transaction with a guarded update, so a
     double-click or a retry can never restock the same plants twice.
  3. Delivering a cash-on-delivery order marks it paid in the same write, so
     the money and the plant can never disagree about whether the delivery
     happened.
 */

type Result = {
  success: boolean;
  error: string;
  fieldErrors: Record<string, string[]>;
};

const FAILED = (error: string): Result => ({
  success: false,
  error,
  fieldErrors: {},
});

/**
 * Moves an order to its next status.
 *
 * The tracking number is optional and only ever applies to a shipment — a
 * number on a cancelled order is a lie, so cancelling clears it.
 */
export async function updateOrderStatusAction(
  input: unknown,
): Promise<Result> {
  const session = await auth();

  if (!session?.user) return FAILED("Sign in to make that change.");
  if (session.user.role !== "ADMIN") return FAILED("Only an admin can move an order on.");

  const parsed = orderStatusFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Check the form and try again.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const { orderId, to, trackingNumber } = parsed.data;

  try {
    const order = await getOrderById(orderId);

    if (!order) {
      return FAILED("That order is no longer on the books.");
    }

    // The transition table is the single source of truth for what a legal
    // move is. The UI hides invalid moves; this refuses them.
    if (!nextStatuses(order.status).includes(to)) {
      return FAILED(
        `An order that is ${order.status.toLowerCase()} cannot move to ${to.toLowerCase()}.`,
      );
    }

    await prisma.$transaction(async (tx) => {
      // Guarded compare-and-swap: only an order still in its current state can
      // be claimed, so two racing clicks cannot both move it (and a cancel
      // cannot restock twice).
      const claimed = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: {
          status: to,
          trackingNumber: trackingNumber ?? null,
          // Delivering a cash-on-delivery order is the moment the money is
          // taken, so payment and fulfilment agree from here on.
          ...(to === "DELIVERED" && order.paymentMethod === "COD"
            ? { paymentStatus: "PAID" }
            : {}),
        },
      });

      if (claimed.count !== 1) {
        throw new Error("order was not claimable");
      }

      // Cancelling puts the stock back, line by line. Only lines that still
      // point at a product can be restocked — a deleted product has no shelf
      // to return to.
      if (to === "CANCELLED") {
        for (const item of order.items) {
          if (!item.productId) continue;

          await tx.product.updateMany({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    });

    revalidatePath("/admin/orders", "page");
    revalidatePath(`/admin/orders/${orderId}`, "page");
    revalidatePath("/admin", "page");
    revalidatePath("/account", "layout");

    return { success: true, error: "", fieldErrors: {} };
  } catch (error) {
    if (error instanceof Error && error.message === "order was not claimable") {
      return FAILED("That order moved on while you were looking at it. Reload and try again.");
    }

    return FAILED("We could not move that order. Try again in a moment.");
  }
}
