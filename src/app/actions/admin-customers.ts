"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import {
  getCustomerDetail,
  type AdminCustomerDetail,
} from "@/lib/data/admin-customers";
import { prisma } from "@/lib/prisma";
import { toggleCustomerSchema } from "@/lib/validations/admin";

/*
  Customer actions.

  The one action here is the disable toggle, and it is deliberately a toggle
  rather than a delete: a customer's orders and reviews are part of the shop's
  history, and locking an account keeps that history intact while closing the
  door. `verifyCredentials` in /data/users.ts already refuses a disabled account
  at sign-in, so flipping the flag is the whole mechanism.
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
 * Loads one customer's detail for the drawer.
 *
 * An action rather than an import of the data layer because the drawer is a
 * client component and cannot pull in a server-only module. The drawer calls
 * this on row-open and renders what comes back; the server also checks the
 * caller is an admin, the same as every other action here.
 */
export async function getCustomerDetailAction(
  input: unknown,
): Promise<{ customer: AdminCustomerDetail | null; error: string }> {
  const session = await auth();

  if (!session?.user) return { customer: null, error: "Sign in to view customers." };
  if (session.user.role !== "ADMIN") {
    return { customer: null, error: "Only an admin can look at customers." };
  }

  const parsed = toggleCustomerSchema.safeParse(input);

  if (!parsed.success) {
    return { customer: null, error: "That customer could not be read." };
  }

  return { customer: await getCustomerDetail(parsed.data.userId), error: "" };
}

/** Locks or unlocks a customer account. */
export async function toggleCustomerDisabledAction(
  input: unknown,
): Promise<Result> {
  const session = await auth();

  if (!session?.user) return FAILED("Sign in to make that change.");
  if (session.user.role !== "ADMIN") return FAILED("Only an admin can lock an account.");

  const parsed = toggleCustomerSchema.safeParse(input);

  if (!parsed.success) {
    return FAILED("That customer could not be read.");
  }

  try {
    const customer = await getCustomerDetail(parsed.data.userId);

    if (!customer) {
      return FAILED("That customer is no longer on the books.");
    }

    await prisma.user.update({
      where: { id: customer.id },
      data: { disabled: !customer.disabled },
    });

    revalidatePath("/admin/customers", "page");

    return { success: true, error: "", fieldErrors: {} };
  } catch {
    return FAILED("We could not change that account. Try again in a moment.");
  }
}
