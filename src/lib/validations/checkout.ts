import { z } from "zod";

import { addressSchema } from "@/lib/validations/address";
import { emailSchema, quantitySchema } from "@/lib/validations/shared";
import {
  orderStatusSchema,
  paymentMethodSchema,
  paymentStatusSchema,
} from "@/lib/constants";

/*
  Checkout schemas.
*/

export const addToCartSchema = z.object({
  productId: z.string().cuid("That is not a product we can find."),
  quantity: quantitySchema.default(1),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartLineSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce
    .number<number>()
    .int("Whole numbers only.")
    .min(0, "Zero removes the line.")
    .max(99),
});

export type UpdateCartLineInput = z.infer<typeof updateCartLineSchema>;

export const removeCartLineSchema = z.object({
  productId: z.string().cuid(),
});

export type RemoveCartLineInput = z.infer<typeof removeCartLineSchema>;

export const applyPromoSchema = z.object({
  code: z.string().trim().min(3, "Enter the code you were given.").max(40),
});

export type ApplyPromoInput = z.infer<typeof applyPromoSchema>;

/**
 * Shipping address for checkout. Either an address from the customer's book
 * (`addressId`) or a fresh address typed into the form (`shipping`) is valid, and
 * a discriminated union makes "neither" unrepresentable rather than something to
 * discover at the point of charging a card.
 */
export const checkoutSchema = z
  .object({
    email: emailSchema,
    paymentMethod: paymentMethodSchema,
    addressId: z.string().cuid().optional(),
    shipping: addressSchema.partial({ isDefault: true }).optional(),
    shippingMethod: z.enum(["STANDARD", "EXPRESS"]).default("STANDARD"),
    saveAddress: z.coerce.boolean().default(false),
    note: z.string().trim().max(500).optional().or(z.literal("")),
    // A promo code is optional, but if one was typed it has to look plausible.
    promoCode: z.string().trim().max(40).optional().or(z.literal("")),
  })
  .refine((values) => Boolean(values.addressId ?? values.shipping), {
    message: "We need somewhere to send it.",
    path: ["shipping"],
  })
  .refine((values) => !(values.addressId && values.shipping), {
    message: "Pick a saved address or type a new one, not both.",
    path: ["shipping"],
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Guest checkout skips the address book and types everything in. */
export const guestCheckoutSchema = checkoutSchema.omit({ addressId: true });

export type GuestCheckoutInput = z.infer<typeof guestCheckoutSchema>;

/** Admin order editing. Status and payment move independently in practice. */
export const updateOrderStatusSchema = z.object({
  orderId: z.string().cuid(),
  status: orderStatusSchema,
  paymentStatus: paymentStatusSchema.optional(),
  trackingNumber: z.string().trim().max(60).optional().or(z.literal("")),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
