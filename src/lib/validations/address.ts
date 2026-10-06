import { z } from "zod";

import { nameSchema, phoneSchema, postalCodeSchema } from "@/lib/validations/shared";

/*
  Address schemas.

  One shape serves the address book and the checkout shipping form, so a customer
  who has saved an address can reuse it without the two forms disagreeing about
  what a state field looks like.
*/

export const addressSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
  line1: z.string().trim().min(3, "We need a street address.").max(120),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Which city?").max(80),
  state: z.string().trim().min(2, "Which state?").max(80),
  postalCode: postalCodeSchema,
  country: z.string().trim().length(2, "Use a two-letter country code.").toUpperCase(),
  // Required, not defaulted: a form submits the checkbox state one way or the
  // other, and a default would make this schema's input and output types differ,
  // which then fights every resolver that bridges it into a form library.
  isDefault: z.boolean(),
});

export type AddressInput = z.infer<typeof addressSchema>;

/**
 * A stored address plus its id, for the edit form. `id` is optional so the same
 * form can create and update.
 */
export const addressFormSchema = addressSchema.extend({
  id: z.string().cuid().optional(),
});

export type AddressFormInput = z.infer<typeof addressFormSchema>;

/** Addresses arrive as a choice list, so the form submits an id, not a body. */
export const selectAddressSchema = z.object({
  addressId: z.string().cuid("Pick an address from your list."),
});

export type SelectAddressInput = z.infer<typeof selectAddressSchema>;

export const deleteAddressSchema = z.object({
  addressId: z.string().cuid(),
});

export type DeleteAddressInput = z.infer<typeof deleteAddressSchema>;
