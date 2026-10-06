import { z } from "zod";

import { emailSchema, phoneSchema } from "@/lib/validations/shared";

/*
  Settings schemas.

  Settings are a single row, so these schemas guard the only place store-wide
  numbers can change. Shipping thresholds are in cents because that is what the
  checkout compares against.
*/

export const settingsSchema = z.object({
  storeName: z.string().trim().min(2, "The store needs a name.").max(80),
  shippingFeeCents: z.coerce
    .number<number>()
    .int("Whole cents.")
    .min(0, "Free shipping is set by raising the threshold instead.")
    .max(100_000),
  freeShippingThresholdCents: z.coerce
    .number<number>()
    .int("Whole cents.")
    .min(0)
    .max(10_000_000),
  promoEnabled: z.coerce.boolean(),
  contactEmail: emailSchema,
  contactPhone: phoneSchema,
  address: z.string().trim().min(10, "A return address needs a full street.").max(300),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export const promoCodeSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Codes are at least three characters.")
      .max(40)
      .toUpperCase()
      .regex(/^[A-Z0-9-]+$/, "Letters, numbers and hyphens only."),
    discountPercent: z.coerce
      .number<number>()
      .int("Whole percent.")
      .min(1, "At least one percent.")
      .max(90, "Ninety percent off is not a discount, it is a giveaway."),
    minSubtotalCents: z.coerce.number<number>().int().min(0).nullable().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
    active: z.coerce.boolean().default(true),
  })
  .refine(
    (values) =>
      values.minSubtotalCents == null ||
      values.minSubtotalCents > values.discountPercent,
    {
      message: "Set the minimum above one percent so the code can never exceed the subtotal.",
      path: ["minSubtotalCents"],
    },
  );

export type PromoCodeInput = z.infer<typeof promoCodeSchema>;
