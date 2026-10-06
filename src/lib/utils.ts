export { cn } from "cn";

/*
  Formatting and small pure helpers.
*/

/**
 * The single place money becomes a string. Every amount in this codebase is an
 * integer number of cents, and every displayed price must come through here.
 *
 * `maximumFractionDigits: 2` is deliberate: it renders 2650 as "$26.50" but also
 * 2600 as "$26", which reads better on a price tag than "$26.00".
 */
const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(cents: number): string {
  return priceFormatter.format(cents / 100);
}

/**
 * URL-safe slug from a display name.
 *
 * Accented letters are folded rather than dropped, so "Monstera Deliciosa" and
 * "Monstera deliciosa" cannot produce two different URLs for one plant.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Human-facing order reference, VRD-10001 style.
 *
 * `sequence` is the zero-padded part. Passing a value wider than four digits
 * still works: the number is not truncated, so the sequence can grow past 9999
 * without colliding.
 */
export function generateOrderNumber(sequence: number): string {
  return `VRD-${String(sequence).padStart(5, "0")}`;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/**
 * Formats a date for display. `dateTime: true` adds the time, which matters for
 * order lists where two orders on the same day need telling apart.
 */
export function formatDate(date: Date, dateTime = false): string {
  return (dateTime ? dateTimeFormatter : dateFormatter).format(date);
}

/**
 * Clamps a number into a range. Used for stock counts and progress bars, where
 * bad data should produce an edge value rather than an overflowing layout.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
