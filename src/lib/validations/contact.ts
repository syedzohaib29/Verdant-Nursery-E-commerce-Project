import { z } from "zod";

/*
  Contact form, front door.

  `website` is the honeypot: a field no human can see but a careless bot fills
  anyway. The schema demands it stay empty, and the action throws away anything
  that arrives full — quietly, so the bot does not learn it was caught.
*/

/** The topics the dropdown offers. Labels stay warm; values stay stable slugs. */
export const CONTACT_TOPIC_VALUES = [
  "an-order",
  "a-plant-question",
  "repotting-service",
  "wholesale",
  "press",
  "something-else",
] as const;

export type ContactTopic = (typeof CONTACT_TOPIC_VALUES)[number];

export const CONTACT_TOPIC_LABELS: Record<ContactTopic, string> = {
  "an-order": "An order",
  "a-plant-question": "A question about a plant",
  "repotting-service": "The repotting service",
  wholesale: "Wholesale",
  press: "Press",
  "something-else": "Something else",
};

export const contactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tell us your name.")
    .max(80, "That name is longer than the bench."),
  email: z
    .string()
    .trim()
    .email("That email does not look right.")
    .max(200),
  topic: z.enum(CONTACT_TOPIC_VALUES, "Pick a topic."),
  message: z
    .string()
    .trim()
    .min(20, "Give us a sentence or two.")
    .max(2000, "We love enthusiasm, but two thousand characters will do."),
  /**
   * The honeypot. Hidden from humans with the `hidden` attribute; validated
   * only to be a string so the rest of the schema stays symmetrical. A bot
   * that fills it in parses fine and is then discarded silently by the
   * action — it never learns it was caught.
   */
  website: z.string().trim(),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;