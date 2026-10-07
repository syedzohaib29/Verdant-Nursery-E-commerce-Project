"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { RESTOCK_BATCH } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { restockSchema } from "@/lib/validations/product";

/*
  Back-office server actions.

  Same shape as every other action in the shop: who is asking, is the input
  real, and does it work — returning { success, error, fieldErrors } so the
  caller can report it without guessing.
*/

export type RestockResult =
  | { success: true; stock: number; name: string }
  | { success: false; error: string; fieldErrors: Record<string, string[]> };

/**
 * Top up a shelf by RESTOCK_BATCH units.
 *
 * The batch size never crosses the wire: the client asks only *which* product,
 * the schema checks the id, and the increment happens here. Stock is only ever
 * moved by the server, so the number on the button is a promise, not an input.
 */
export async function restockProductAction(
  input: unknown,
): Promise<RestockResult> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return {
      success: false,
      error: "Only the back office can restock the shelves.",
      fieldErrors: {},
    };
  }

  const parsed = restockSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "That shelf could not be identified.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
      select: { name: true },
    });
    if (!product) {
      return {
        success: false,
        error: "That product is no longer on the shelves.",
        fieldErrors: {},
      };
    }

    const updated = await prisma.product.update({
      where: { id: parsed.data.productId },
      data: { stock: { increment: RESTOCK_BATCH } },
      select: { stock: true },
    });

    revalidatePath("/admin");
    return { success: true, stock: updated.stock, name: product.name };
  } catch {
    return {
      success: false,
      error: "The shelf did not budge. Try that again.",
      fieldErrors: {},
    };
  }
}
