import { z } from "zod";

import { orderStatusSchema } from "@/lib/constants";
import { priceDollarsSchema } from "@/lib/validations/shared";

/*
  Admin form schemas.

  These guard the back-office forms. The product and category schemas live in
  /product.ts next to the shop filters they share; what is here is the forms that
  have no storefront counterpart.

  Money arrives in dollars — that is what a person types — and is converted to
  cents at the boundary, so the form never has to know that the database stores
  integer cents and the action never has to trust a conversion the client did.
*/

/**
 * Store settings, as the form spells them.
 *
 * `settingsSchema` in /settings.ts takes cents because the cart and checkout
 * read it that way. The admin form takes dollars and transforms, so the person
 * editing shipping types "7.95" and not "795".
 */
export const settingsFormSchema = z
  .object({
    storeName: z.string().trim().min(2, "The store needs a name.").max(80),
    shippingFeeDollars: priceDollarsSchema,
    freeShippingThresholdDollars: priceDollarsSchema,
    promoEnabled: z.coerce.boolean<boolean>(),
    contactEmail: z.string().trim().email("A real address, for order replies."),
    contactPhone: z
      .string()
      .trim()
      .min(7, "A phone number people can actually dial.")
      .max(30),
    address: z.string().trim().min(10, "A return address needs a full street.").max(300),
  })
  .refine(
    (values) => values.freeShippingThresholdDollars > values.shippingFeeDollars,
    {
      message:
        "The free-shipping line has to sit above the fee, or everything ships free.",
      path: ["freeShippingThresholdDollars"],
    },
  );

export type SettingsFormInput = z.infer<typeof settingsFormSchema>;

/**
 * Toggling a customer's account.
 *
 * Only the id crosses the wire. Whether the account is being locked or unlocked
 * is decided by the server from the row's current state — a client that could
 * send `disabled: false` on an already-unlocked account would be a second,
 * competing source of truth for the same fact.
 */
export const toggleCustomerSchema = z.object({
  userId: z.string().cuid("That customer could not be read."),
});

export type ToggleCustomerInput = z.infer<typeof toggleCustomerSchema>;

/**
 * Moving an order to its next status.
 *
 * `to` is validated against the transition table on the server, not here: the
 * legal moves depend on where the order currently is, which the schema cannot
 * know. What the schema can do is make sure the target is a real status and
 * that a tracking number, when supplied, looks like one.
 *
 * `trackingNumber` is optional and nullable: it is required when shipping (the
 * action enforces that) and cleared when cancelling.
 */
export const orderStatusFormSchema = z.object({
  orderId: z.string().cuid("That order could not be read."),
  to: orderStatusSchema,
  trackingNumber: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Z0-9-]+$/, "Letters, numbers and hyphens only.")
    .nullable()
    .optional(),
});

export type OrderStatusFormInput = z.infer<typeof orderStatusFormSchema>;

/**
 * The order list's filters, read from the URL.
 *
 * Every field is optional with a safe default, because a hand-typed query string
 * is untrusted input: `/admin/orders?status=CHAOS` has to render a list, not a
 * 500. Dates are ISO `YYYY-MM-DD` and are validated as real calendar days.
 */
const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Dates are YYYY-MM-DD.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00`)), {
    message: "That is not a real calendar day.",
  });

/**
 * A GET form submits empty inputs as "", and clearing a search box should
 * narrow nothing. This wrapper reads an empty (or whitespace-only) string as
 * "not set", so one cleared field cannot fail the whole parse and reset every
 * other filter with it.
 */
function emptyIsUndefined<T extends z.ZodType>(schema: T) {
  return z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    schema,
  );
}

export const adminOrderFilterSchema = z.object({
  q: emptyIsUndefined(z.string().trim().min(1).max(80).optional()),
  status: emptyIsUndefined(orderStatusSchema.optional()),
  from: emptyIsUndefined(isoDate.optional()),
  to: emptyIsUndefined(isoDate.optional()),
  page: z.coerce.number<number>().int().min(1).max(9999).default(1),
  sort: z
    .enum(["date", "order", "total", "status", "customer"])
    .default("date"),
  dir: z.enum(["asc", "desc"]).default("desc"),
});

export type AdminOrderFilterInput = z.infer<typeof adminOrderFilterSchema>;

/**
 * The product list's filters, read from the URL.
 *
 * Same rule as the order filters: anything unrecognised is dropped rather than
 * repaired, so a mangled URL lands on the unfiltered list. Sorting is the
 * DataTable's header model — a column key and a direction — with "newest" as
 * the list the desk expects when it first arrives.
 */
export const adminProductFilterSchema = z.object({
  q: emptyIsUndefined(z.string().trim().min(1).max(80).optional()),
  categoryId: emptyIsUndefined(z.string().trim().max(40).optional()),
  status: z.enum(["active", "draft", "all"]).default("all"),
  stock: z.enum(["in", "low", "out", "all"]).default("all"),
  page: z.coerce.number<number>().int().min(1).max(9999).default(1),
  sort: z.enum(["newest", "name", "price", "stock"]).default("newest"),
  dir: z.enum(["asc", "desc"]).default("desc"),
});

export type AdminProductFilterInput = z.infer<typeof adminProductFilterSchema>;

/** A slug uniqueness check is a database question, not a schema one. */
export const slugCheckSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "A slug is needed for the URL.")
    .max(140)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Lowercase words joined by single hyphens.",
    ),
  /** The product being edited, so it does not collide with itself. */
  productId: z.string().trim().max(40).optional(),
});

export type SlugCheckInput = z.infer<typeof slugCheckSchema>;

/** Reordering images: the product and the new order, as ids in sequence. */
export const imageOrderSchema = z.object({
  productId: z.string().cuid("That product could not be read."),
  /** Image ids in their new order. The first entry becomes the primary. */
  imageIds: z.array(z.string().cuid()).min(1).max(20),
});

export type ImageOrderInput = z.infer<typeof imageOrderSchema>;

/** Editing one image's alt text. */
export const imageAltSchema = z.object({
  imageId: z.string().cuid("That image could not be read."),
  alt: z
    .string()
    .trim()
    .min(10, "Describe the image for people who cannot see it.")
    .max(200),
});

export type ImageAltInput = z.infer<typeof imageAltSchema>;

/**
 * A journal post, as the form spells it.
 *
 * `content` is Markdown source, and the storefront renders it from the database
 * — the form never receives a rendered preview back, so no HTML crosses the
 * boundary in either direction. `id` is absent for a new post and present when
 * editing, which is how the create and update actions share one schema.
 */
export const journalPostSchema = z.object({
  id: z.string().cuid("That post could not be read.").optional(),
  title: z.string().trim().min(4, "Give the post a title.").max(140),
  slug: z
    .string()
    .trim()
    .min(2, "A slug is needed for the URL.")
    .max(160)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Lowercase words joined by single hyphens.",
    ),
  excerpt: z
    .string()
    .trim()
    .min(30, "An excerpt points readers in.")
    .max(320),
  content: z
    .string()
    .trim()
    .min(80, "A post needs more than an excerpt.")
    .max(50000, "Fifty thousand characters is a very long read."),
  coverImage: z
    .string()
    .trim()
    .min(1, "Every post needs a cover photograph.")
    .max(300),
  author: z.string().trim().min(2, "Who wrote it?").max(80),
  readMinutes: z.coerce
    .number<number>()
    .int("Whole minutes.")
    .min(1, "At least one minute of reading.")
    .max(120),
  published: z.coerce.boolean<boolean>(),
});

export type JournalPostInput = z.infer<typeof journalPostSchema>;

/** Publishing or deleting a post: only its id crosses the wire. */
export const journalPostIdSchema = z.object({
  id: z.string().cuid("That post could not be read."),
});

export type JournalPostIdInput = z.infer<typeof journalPostIdSchema>;
