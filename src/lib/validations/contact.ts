import { z } from "zod";

import { contactTopicSchema } from "@/lib/constants";
import { emailSchema, nameSchema } from "@/lib/validations/shared";

/*
  Contact and newsletter schemas.

  Both forms are open to the public, so both are deliberately strict about length
  and content type. `message` is stored as plain text and rendered as text, so
  there is no HTML surface here to sanitise.
*/

export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  topic: contactTopicSchema,
  message: z
    .string()
    .trim()
    .min(20, "A little more detail helps us actually answer.")
    .max(4000),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const newsletterSchema = z.object({
  email: emailSchema,
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
