import { z } from "zod";

/*
  Shared request schemas.

  Every form validates on the client for instant feedback and again on the
  server, because client validation is a convenience, not a control.
*/

/**
 * Newsletter signup. Trimmed and lower-cased before it is validated so
 * "  Verdant@Example.COM " and "verdant@example.com" are one address.
 */
export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("That does not look like an email address."),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
