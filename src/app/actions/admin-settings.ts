"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { updateSettings } from "@/lib/data/admin-settings";
import { settingsFormSchema } from "@/lib/validations/admin";

/*
  Settings actions.

  The form sends dollars — that is what a person types — and the action
  converts to cents at the boundary, so the database never holds a number the
  form did not intend. The cart and checkout read the row on every render, so
  a saved change is visible on the storefront immediately.
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

/** Replaces the store settings row. */
export async function updateSettingsAction(
  input: unknown,
): Promise<Result> {
  const session = await auth();

  if (!session?.user) return FAILED("Sign in to make that change.");
  if (session.user.role !== "ADMIN") return FAILED("Only an admin can change the settings.");

  const parsed = settingsFormSchema.safeParse(input);

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

  const data = parsed.data;

  try {
    await updateSettings({
      storeName: data.storeName,
      shippingFeeCents: Math.round(data.shippingFeeDollars * 100),
      freeShippingThresholdCents: Math.round(
        data.freeShippingThresholdDollars * 100,
      ),
      promoEnabled: data.promoEnabled,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      address: data.address,
    });

    // The settings row is read all over the shop, so the whole storefront is
    // revalidated — a shipping fee that changes on the desk has to change in
    // the basket too.
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings", "page");

    return { success: true, error: "", fieldErrors: {} };
  } catch {
    return FAILED("We could not save those settings. Try again in a moment.");
  }
}
