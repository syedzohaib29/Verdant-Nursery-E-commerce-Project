import { z } from "zod";

/*
  Shared field schemas.

  Small pieces reused by several forms live here so a validation rule is written
  once. Everything below is a pure schema with no database access, which keeps
  the same function usable on the client for instant feedback and on the server
  as the actual control.
*/

/**
 * Trims before validating. A form field that hands over "  a@b.co  " should be
 * treated as an email, not rejected, so every string schema that will be stored
 * or compared starts here.
 */
const trimmed = z.string().trim();

export const emailSchema = trimmed
  .toLowerCase()
  .max(254, "That address is too long to be real.")
  .pipe(z.email("That does not look like an email address."));

export const nameSchema = trimmed
  .min(2, "We need a name to put on the label.")
  .max(80, "That name is unusually long.");

export const phoneSchema = trimmed
  .regex(/^[0-9+()\-.\s]{7,20}$/, "Use digits, spaces and + ( ) - only.");

export const postalCodeSchema = trimmed
  .min(3, "A postal code needs at least three characters.")
  .max(12, "That postal code is too long.");

/** Quantities are whole units of something, so never fractional or negative. */
export const quantitySchema = z.coerce
  .number<number>()
  .int("Whole numbers only.")
  .min(1, "At least one.")
  .max(99, "If you need more than that, email us and we will sort it out.");

/** Money crosses a form boundary as a string of dollars, never as cents. */
export const priceDollarsSchema = z.coerce
  .number<number>()
  .finite("Enter a number.")
  .min(0, "Price cannot be negative.")
  .max(100_000, "That price is too high for a plant.");

export const ratingSchema = z.coerce
  .number<number>()
  .int("Whole stars only.")
  .min(1, "At least one star.")
  .max(5, "Five stars is the maximum.");
