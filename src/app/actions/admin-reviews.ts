"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { moderateReviewSchema } from "@/lib/validations/product";

/*
  Review moderation actions.

  Approving publishes a review to the product page; deleting removes it
  outright. Both are single-purpose and both revalidate the shop, because a
  review that was just approved is a review a shopper should be able to see
  without a rebuild.
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

/** Approves or unpublishes a review. */
export async function setReviewApprovedAction(
  input: unknown,
): Promise<Result> {
  const session = await auth();

  if (!session?.user) return FAILED("Sign in to make that change.");
  if (session.user.role !== "ADMIN") return FAILED("Only an admin can moderate reviews.");

  const parsed = moderateReviewSchema.safeParse(input);

  if (!parsed.success) {
    return FAILED("That review could not be read.");
  }

  try {
    const review = await prisma.review.findUnique({
      where: { id: parsed.data.reviewId },
      select: { id: true, productId: true },
    });

    if (!review) {
      return FAILED("That review is no longer on the books.");
    }

    await prisma.review.update({
      where: { id: review.id },
      data: { approved: parsed.data.approved },
    });

    revalidatePath("/admin/reviews", "page");
    revalidatePath("/shop", "layout");
    revalidatePath("/", "page");

    return { success: true, error: "", fieldErrors: {} };
  } catch {
    return FAILED("We could not change that review. Try again in a moment.");
  }
}

/** Deletes a review. Used for the ones that should never have been posted. */
export async function deleteReviewAction(
  input: unknown,
): Promise<Result> {
  const session = await auth();

  if (!session?.user) return FAILED("Sign in to make that change.");
  if (session.user.role !== "ADMIN") return FAILED("Only an admin can delete a review.");

  const parsed = z
    .object({ reviewId: z.string().cuid() })
    .safeParse(input);

  if (!parsed.success) {
    return FAILED("That review could not be read.");
  }

  try {
    const review = await prisma.review.findUnique({
      where: { id: parsed.data.reviewId },
      select: { id: true, productId: true },
    });

    if (!review) {
      return FAILED("That review is no longer on the books.");
    }

    await prisma.review.delete({ where: { id: review.id } });

    revalidatePath("/admin/reviews", "page");
    revalidatePath("/shop", "layout");
    revalidatePath("/", "page");

    return { success: true, error: "", fieldErrors: {} };
  } catch {
    return FAILED("We could not delete that review. Try again in a moment.");
  }
}
