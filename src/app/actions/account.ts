"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { getReorderLines, type ReorderLine } from "@/lib/data/account";
import {
  changePassword,
  deleteAddress,
  getAddressById,
  saveAddress,
  setDefaultAddress,
  updateProfile,
  type UserSummary,
  type UserWithAddresses,
} from "@/lib/data/users";
import {
  addressFormSchema,
  deleteAddressSchema,
  selectAddressSchema,
  type AddressFormInput,
  type DeleteAddressInput,
  type SelectAddressInput,
} from "@/lib/validations/address";
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from "@/lib/validations/auth";

/*
  Account server actions.

  Every one of them resolves the caller from its own session. There is no
  `userId` parameter anywhere in this file, and the address and order ids that do
  arrive are checked against that caller before anything is read or written — a
  `saveAddressAction` that trusted a posted ownership would be a way to edit
  somebody else's address book.
*/

export type AccountActionResult = {
  success: boolean;
  /** Form-level message, when the field itself was fine. */
  error: string | null;
  fieldErrors: Record<string, string[]>;
};

const NOT_SIGNED_IN: AccountActionResult = {
  success: false,
  error: "Sign in to change your account.",
  fieldErrors: {},
};

const orderIdSchema = z.object({ orderId: z.string().cuid() });
type OrderIdInput = z.infer<typeof orderIdSchema>;

function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

/** The account segment re-renders after any of its pages change something. */
function touchAccount() {
  revalidatePath("/account", "layout");
}

/**
 * Edits the name and phone on the profile.
 *
 * Returns the freshly-saved profile so the form can reset its "dirty" flag to
 * what the server actually holds, instead of what it was given.
 */
export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<AccountActionResult & { profile: UserSummary | null }> {
  const session = await auth();
  if (!session?.user?.id) return { ...NOT_SIGNED_IN, profile: null };

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Check the form and try again.",
      fieldErrors: fieldErrorsFrom(parsed.error),
      profile: null,
    };
  }

  try {
    const profile = await updateProfile(session.user.id, {
      name: parsed.data.name,
      phone: parsed.data.phone ?? "",
    });
    touchAccount();
    return { success: true, error: null, fieldErrors: {}, profile };
  } catch {
    return {
      success: false,
      error: "That did not save. Try again in a moment.",
      fieldErrors: {},
      profile: null,
    };
  }
}

/** Changes the password, after checking the current one against the hash. */
export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<AccountActionResult> {
  const session = await auth();
  if (!session?.user?.id) return NOT_SIGNED_IN;

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Check the form and try again.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const result = await changePassword(session.user.id, {
    currentPassword: parsed.data.currentPassword,
    newPassword: parsed.data.newPassword,
  });

  if (!result.ok) {
    return {
      success: false,
      error: null,
      fieldErrors:
        result.reason === "current-password-wrong"
          ? { currentPassword: ["That is not the password we have on file."] }
          : {},
    };
  }

  return { success: true, error: null, fieldErrors: {} };
}

/** Creates or edits one address in the caller's address book. */
export async function saveAddressAction(
  input: AddressFormInput,
): Promise<
  AccountActionResult & { address: UserWithAddresses["addresses"][number] | null }
> {
  const session = await auth();
  if (!session?.user?.id) return { ...NOT_SIGNED_IN, address: null };

  const parsed = addressFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Check the form and try again.",
      fieldErrors: fieldErrorsFrom(parsed.error),
      address: null,
    };
  }

  const { id, isDefault, ...fields } = parsed.data;

  try {
    const result = await saveAddress(session.user.id, { ...fields, isDefault, id });

    if (!result.ok) {
      return {
        success: false,
        error: "We could not save that address.",
        fieldErrors: {},
        address: null,
      };
    }

    touchAccount();

    // Re-read the row so the caller paints exactly what the database holds,
    // trimmed and demoted, rather than a mirror of what it typed.
    const address = await getAddressById(result.addressId);

    return { success: true, error: null, fieldErrors: {}, address };
  } catch {
    return {
      success: false,
      error: "That did not save. Try again in a moment.",
      fieldErrors: {},
      address: null,
    };
  }
}

/** Removes an address after verifying it belongs to the caller. */
export async function deleteAddressAction(
  input: DeleteAddressInput,
): Promise<AccountActionResult> {
  const session = await auth();
  if (!session?.user?.id) return NOT_SIGNED_IN;

  const parsed = deleteAddressSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "We could not do that.", fieldErrors: {} };

  try {
    const result = await deleteAddress(session.user.id, parsed.data.addressId);

    if (!result.ok) {
      return { success: false, error: "We could not remove that address.", fieldErrors: {} };
    }

    touchAccount();
    return { success: true, error: null, fieldErrors: {} };
  } catch {
    return { success: false, error: "That did not save. Try again in a moment.", fieldErrors: {} };
  }
}

/** Promotes one of the caller's addresses to the default. */
export async function setDefaultAddressAction(
  input: SelectAddressInput,
): Promise<AccountActionResult> {
  const session = await auth();
  if (!session?.user?.id) return NOT_SIGNED_IN;

  const parsed = selectAddressSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "We could not do that.", fieldErrors: {} };

  try {
    const result = await setDefaultAddress(session.user.id, parsed.data.addressId);

    if (!result.ok) {
      return { success: false, error: "We could not change the default.", fieldErrors: {} };
    }

    touchAccount();
    return { success: true, error: null, fieldErrors: {} };
  } catch {
    return { success: false, error: "That did not save. Try again in a moment.", fieldErrors: {} };
  }
}

export type ReorderResult = AccountActionResult & {
  /** Basket-ready lines, priced and stocked today. */
  lines: ReorderLine[];
  /** Lines from the order left out because the product is gone or out of stock. */
  skipped: number;
};

/**
 * Builds "order it again" for one of the caller's own orders.
 *
 * Nothing is charged here and nothing is written: the customer's basket lives on
 * their device, so this returns the order's lines as basket items with today's
 * prices and stock, and the client drops them into the store the same way an
 * add-to-cart button would.
 */
export async function reorderAction(input: OrderIdInput): Promise<ReorderResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ...NOT_SIGNED_IN, lines: [], skipped: 0 };
  }

  const parsed = orderIdSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "That order could not be read.", fieldErrors: {}, lines: [], skipped: 0 };
  }

  try {
    const { lines, skipped } = await getReorderLines(
      parsed.data.orderId,
      session.user.id,
    );

    return { success: true, error: null, fieldErrors: {}, lines, skipped };
  } catch {
    return { success: false, error: "We could not read that order.", fieldErrors: {}, lines: [], skipped: 0 };
  }
}