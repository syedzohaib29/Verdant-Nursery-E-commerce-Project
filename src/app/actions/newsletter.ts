"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/validation";

export type NewsletterResult = {
  success: boolean;
  /** Message for the form as a whole, when the field itself is fine. */
  error: string | null;
  /** Copy for the success toast. */
  message: string;
  fieldErrors: Record<string, string[]>;
};

/**
 * Newsletter signup.
 *
 * Writes to NewsletterSubscriber, which is a different promise from an order
 * receipt: this is a monthly letter, and it is the only table in the schema where
 * we hold an address belonging to somebody who has never bought anything.
 *
 * Signing up twice is not an error. Email is unique, so the second attempt finds
 * the existing row and simply confirms, rather than hitting a constraint and
 * telling somebody they are "already subscribed" — which is both a worse
 * experience and a small disclosure about who is on the list.
 */
export async function subscribeToNewsletter(
  email: string,
): Promise<NewsletterResult> {
  const parsed = newsletterSchema.safeParse({ email });

  if (!parsed.success) {
    return {
      success: false,
      error: "We could not read that address.",
      message: "",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });

    if (!existing) {
      await prisma.newsletterSubscriber.create({
        data: { email: parsed.data.email },
      });
    }

    return {
      success: true,
      error: null,
      message: "You are on the list. One letter a month, no more.",
      fieldErrors: {},
    };
  } catch {
    return {
      success: false,
      error: "That did not save. Try again in a moment.",
      message: "",
      fieldErrors: {},
    };
  }
}
