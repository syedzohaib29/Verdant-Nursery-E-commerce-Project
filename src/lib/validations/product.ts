import { z } from "zod";

import {
  difficultySchema,
  lightLevelSchema,
  productSortSchema,
  waterLevelSchema,
} from "@/lib/constants";
import { priceDollarsSchema, ratingSchema } from "@/lib/validations/shared";

/*
  Product and category schemas.
*/

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Give the plant a name.").max(120),
    slug: z
      .string()
      .trim()
      .min(2, "A slug is needed for the URL.")
      .max(140)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Lowercase words joined by single hyphens.",
      ),
    description: z
      .string()
      .trim()
      .min(20, "Say a little more than the plant's name.")
      .max(2000),
    priceDollars: priceDollarsSchema,
    // Null means "not on promotion". The form sends an empty string when the
    // field is cleared, which is not the same as zero.
    salePriceDollars: priceDollarsSchema.nullable().optional(),
    stock: z.coerce.number<number>().int("Whole units.").min(0, "Stock cannot be negative."),
    sku: z
      .string()
      .trim()
      .min(3, "Every product needs a SKU.")
      .max(40)
      .toUpperCase()
      .regex(/^[A-Z0-9-]+$/, "Letters, numbers and hyphens only."),
    categoryId: z.string().cuid("Pick a category."),
    featured: z.coerce.boolean().default(false),
    light: lightLevelSchema,
    water: waterLevelSchema,
    petSafe: z.coerce.boolean().default(false),
    difficulty: difficultySchema,
    heightCm: z.coerce.number<number>().int().min(1).max(500).nullable().optional(),
    careNotes: z.string().trim().min(10, "Care notes help people keep it alive.").max(2000),
    isActive: z.coerce.boolean().default(true),
  })
  // A sale price below full price is a discount; anything else is a pricing
  // mistake that would quietly show the customer a worse deal than intended.
  .refine(
    (values) =>
      values.salePriceDollars == null ||
      values.salePriceDollars < values.priceDollars,
    {
      message: "A sale price has to be lower than the full price.",
      path: ["salePriceDollars"],
    },
  );

export type ProductInput = z.infer<typeof productSchema>;

/**
 * Shop filters, read from the URL.
 *
 * Every field is optional and every field has a safe default, because a hand-typed
 * query string is exactly the kind of untrusted input that has to survive without
 * throwing: `/shop?sort=chaos` has to render a shop, not a 500.
 *
 * `flag` exists because `z.coerce.boolean()` is a trap: it runs `Boolean("false")`,
 * so `?petSafe=false` would filter *to* pet-safe products. Only the four strings
 * listed below are accepted, and anything else is rejected so the page falls back
 * to "no opinion" rather than guessing.
 */
const flag = z
  .enum(["true", "false", "1", "0"])
  .transform((value) => value === "true" || value === "1");

export const productFilterSchema = z.object({
  category: z.string().trim().max(80).optional(),
  light: lightLevelSchema.optional(),
  water: waterLevelSchema.optional(),
  difficulty: difficultySchema.optional(),
  petSafe: flag.optional(),
  /** Dollars, not cents: this is what the URL shows and what the input holds. */
  minPrice: z.coerce.number<number>().min(0).max(100_000).optional(),
  maxPrice: z.coerce.number<number>().min(0).max(100_000).optional(),
  /** Free-text search. `q` is the conventional query-string name for it. */
  q: z.string().trim().min(1).max(80).optional(),
  sort: productSortSchema.default("featured"),
  page: z.coerce.number<number>().int().min(1).max(9999).default(1),
});

export type ProductFilterInput = z.infer<typeof productFilterSchema>;

/** A single image added from the admin gallery. */
export const productImageSchema = z.object({
  url: z.string().trim().min(1, "Upload or paste an image path."),
  alt: z
    .string()
    .trim()
    .min(10, "Describe the image for people who cannot see it.")
    .max(200),
});

export type ProductImageInput = z.infer<typeof productImageSchema>;

export const productReviewSchema = z.object({
  productId: z.string().cuid(),
  rating: ratingSchema,
  title: z.string().trim().min(3, "A few words is enough.").max(80),
  body: z
    .string()
    .trim()
    .min(20, "Tell us a bit more so the review is worth reading.")
    .max(2000),
});

export type ProductReviewInput = z.infer<typeof productReviewSchema>;

/** Admin moderation: approve or reject a pending review. */
export const moderateReviewSchema = z.object({
  reviewId: z.string().cuid(),
  approved: z.coerce.boolean(),
});

export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Give the category a name.").max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Lowercase words joined by single hyphens.",
    ),
  description: z.string().trim().min(20, "Say what belongs in here.").max(400),
  image: z.string().trim().min(1, "Categories need an image."),
  sortOrder: z.coerce.number<number>().int().default(0),
});

export type CategoryInput = z.infer<typeof categorySchema>;
