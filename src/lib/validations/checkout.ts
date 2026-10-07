import { z } from "zod";

import { addressSchema } from "@/lib/validations/address";
import { MAX_CART_LINES } from "@/lib/validations/cart";
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
 * The shipping half of the checkout form, exactly as the address book spells it
 * except without `isDefault`. The address form and the checkout must validate the
 * same way, or an address saved from one place would bounce in the other.
 */
export const checkoutAddressSchema = addressSchema.omit({ isDefault: true });

export type CheckoutAddressInput = z.infer<typeof checkoutAddressSchema>;

/**
 * The whole checkout form, flat: the contact details (`email`), the shipping
 * fields and the payment choice share one validation so a section cannot land
 * on the server holding something the client schema would have caught and the
 * client cannot render a section holding something the server would reject.
 */
export const checkoutFormSchema = checkoutAddressSchema.extend({
  email: emailSchema,
  paymentMethod: paymentMethodSchema,
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

/** One line the customer wants to buy. Prices never travel in this payload. */
export const checkoutLineSchema = z.object({
  productId: z.string().cuid("That is not a product we carry."),
  quantity: quantitySchema,
});

export type CheckoutLineInput = z.infer<typeof checkoutLineSchema>;

/**
 * What `createOrderAction` accepts. There is deliberately no amount in here:
 * the server prices every line from the database, quotes shipping from the
 * settings row and the discount from the promo table, and ignores whatever the
 * browser believes anything costs.
 *
 * `checkoutToken` is the client-side idempotency key (see the action); every
 * field except the lines is what the form validated on the way in.
 */
export const createOrderSchema = z.object({
  email: emailSchema,
  paymentMethod: paymentMethodSchema,
  promoCode: z.string().trim().max(32).optional().or(z.literal("")),
  saveAddress: z.coerce.boolean().default(false),
  checkoutToken: z.string().trim().min(8).max(128),
  shipping: checkoutAddressSchema,
  lines: z.array(checkoutLineSchema).min(1, "Your basket is empty.").max(MAX_CART_LINES),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** Admin order editing. Status and payment move independently in practice. */
export const updateOrderStatusSchema = z.object({
  orderId: z.string().cuid(),
  status: orderStatusSchema,
  paymentStatus: paymentStatusSchema.optional(),
  trackingNumber: z.string().trim().max(60).optional().or(z.literal("")),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

/** Cancelling is a customer action, scoped to their own order number. */
export const cancelOrderSchema = z.object({
  orderId: z.string().cuid(),
});

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
