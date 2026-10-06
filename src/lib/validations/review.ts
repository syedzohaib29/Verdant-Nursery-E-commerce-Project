import { z } from "zod";

import { ratingSchema } from "@/lib/validations/shared";

/*
  Review schemas.

  A review needs to be from someone who bought the plant, so it takes a product
  id rather than a name, and the ownership and purchase checks live in the server
  action. This schema only covers the shape of what the visitor typed.
*/

export const reviewSchema = z.object({
  productId: z.string().cuid("That is not a product we can find."),
  rating: ratingSchema,
  title: z.string().trim().min(3, "A few words is enough.").max(80),
  body: z
    .string()
    .trim()
    .min(20, "Tell us a bit more so the review is worth reading.")
    .max(2000),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export const reviewListSchema = z.object({
  productId: z.string().cuid(),
  page: z.coerce.number<number>().int().min(1).default(1),
});

export type ReviewListInput = z.infer<typeof reviewListSchema>;
