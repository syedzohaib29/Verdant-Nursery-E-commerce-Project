"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { contactMessageSchema } from "@/lib/validations/contact";

/*
  The contact form's server action.

  No auth here on purpose: the front door is open to strangers — that is its
  job. The two guards are the honeypot (a field a human never sees, validated
  to be empty, and discarded without a trace when a bot fills it) and the shape
  of the message itself, checked again by Zod even though the client already
  checked it. Messages land in the same table the back office reads, so
  nothing an admin answers was typed by hand anywhere else.
*/

export type ContactResult = {
  success: boolean;
  error: string;
  fieldErrors: Record<string, string[]>;
};

/**
 * Accept a message from the front door.
 *
 * A honeypot hit is answered with a polite lie — the action returns success
 * without writing anything, so the bot learns nothing and moves on. Real
 * messages are stored verbatim apart from whitespace, because a message with
 * trailing newlines reads like a message nobody read.
 */
export async function submitContactAction(
  input: unknown,
): Promise<ContactResult> {
  const parsed = contactMessageSchema.safeParse(input);

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

  if (parsed.data.website !== "") {
    // Honeypot tripped. Answer as if it landed, write nothing.
    return { success: true, error: "", fieldErrors: {} };
  }

  const { name, email, topic, message } = parsed.data;

  await prisma.contactMessage.create({
    data: { name, email, topic, message },
  });

  return { success: true, error: "", fieldErrors: {} };
}