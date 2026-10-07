"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/*
  Message desk actions.

  The unread state is decided here from the row, never sent by the client: the
  desk's "mark read" button carries only an id, and the server reads what the
  message actually says before answering. Same shape as every back-office
  action — who is asking, is the input real, does it work.
*/

export type MessageActionResult = {
  success: boolean;
  error: string;
  fieldErrors: Record<string, string[]>;
};

const FAILED = (error: string): MessageActionResult => ({
  success: false,
  error,
  fieldErrors: {},
});

const messageIdSchema = z.object({
  id: z.string().cuid("That message could not be read."),
});

/** The ADMIN check every action in this file starts with. */
async function requireAdmin(): Promise<string | null> {
  const session = await auth();

  if (!session?.user) return "Sign in to make that change.";
  if (session.user.role !== "ADMIN")
    return "Only an admin can answer the front door.";

  return null;
}

/**
 * Mark a message read — or, when the id was sent already-read, unread again.
 * Toggling from the row keeps the two states honest without the client being
 * able to stamp its own.
 */
export async function toggleMessageReadAction(
  input: unknown,
): Promise<MessageActionResult> {
  const denied = await requireAdmin();
  if (denied) return FAILED(denied);

  const parsed = messageIdSchema.safeParse(input);
  if (!parsed.success) return FAILED("That message could not be read.");

  const current = await prisma.contactMessage.findUnique({
    where: { id: parsed.data.id },
    select: { read: true },
  });

  if (!current) return FAILED("That message is gone.");

  await prisma.contactMessage.update({
    where: { id: parsed.data.id },
    data: { read: !current.read },
  });

  revalidatePath("/admin/messages");
  return { success: true, error: "", fieldErrors: {} };
}

/** Delete a message for good. No bin — the desk keeps what it decides to keep. */
export async function deleteMessageAction(
  input: unknown,
): Promise<MessageActionResult> {
  const denied = await requireAdmin();
  if (denied) return FAILED(denied);

  const parsed = messageIdSchema.safeParse(input);
  if (!parsed.success) return FAILED("That message could not be read.");

  const existing = await prisma.contactMessage.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });

  if (!existing) return FAILED("That message is gone.");

  await prisma.contactMessage.delete({ where: { id: parsed.data.id } });

  revalidatePath("/admin/messages");
  return { success: true, error: "", fieldErrors: {} };
}