"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getReviewFormState } from "@/lib/data/reviews";
import { reviewSchema, type ReviewInput } from "@/lib/validations/review";

/*
  Review submissions.

  The eligibility rules live in the data layer (`getReviewFormState`), and this
  file is where they are enforced before anything is written: only a signed-in
  customer with a paid or fulfilled order line for the product may review it,
  once, and the review comes back unapproved unless the writer is a moderator.
  Every check resolves the caller from its session, so there is no product id
  without a person attached to it.
*/

export type ReviewResult = {
  success: boolean;
  error: string | null;
  fieldErrors: Record<string, string[]>;
  review: ReviewInput & { approved: boolean } | null;
};

/**
 * The one way a review gets written.
 *
 * `approved` is false unless the writer is an ADMIN, so a customer's words never
 * reach the shop floor without a moderator having looked at them; an ADMIN's do,
 * because the person reviewing is the person deciding. The one-per-customer rule
 * is enforced here rather than by a client-side disable, and an existing row
 * simply refuses politely.
 */
export async function submitReviewAction(
  input: ReviewInput,
): Promise<ReviewResult> {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    return { success: false, error: "Sign in to leave a review.", fieldErrors: {}, review: null };
  }

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Check the review and try again.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      review: null,
    };
  }

  const { productId, rating, title, body } = parsed.data;

  try {
    const [product, { eligible, existing }] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, isActive: true, slug: true },
      }),
      getReviewFormState(productId, session.user.id),
    ]);

    if (!product || !product.isActive) {
      return { success: false, error: "That plant is no longer on the shelf.", fieldErrors: {}, review: null };
    }

    if (!eligible) {
      return {
        success: false,
        error: "Only verified buyers can review a plant. Order one first, then tell us how it does.",
        fieldErrors: {},
        review: null,
      };
    }

    if (existing) {
      return {
        success: false,
        error: "You have already reviewed this one.",
        fieldErrors: {},
        review: null,
      };
    }

    const approved = session.user.role === "ADMIN";

    await prisma.review.create({
      data: { productId, userId: session.user.id, rating, title, body, approved },
    });

    revalidatePath(`/shop/${product.slug}`);

    return {
      success: true,
      error: null,
      fieldErrors: {},
      review: { productId, rating, title, body, approved },
    };
  } catch {
    return {
      success: false,
      error: "That did not save. Try again in a moment.",
      fieldErrors: {},
      review: null,
    };
  }
}