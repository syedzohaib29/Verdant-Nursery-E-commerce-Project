export { cn } from "cn";

/*
  Formatting and small pure helpers.
*/

/**
 * The single place money becomes a string. Every amount in this codebase is an
 * integer number of cents, and every displayed price must come through here.
 *
 * Whole dollars drop the cipher ("$26", not "$26.00") because a price tag reads
 * cleaner without it; anything with cents keeps exactly two ("$26.50"). Without
 * the split a formatter with `maximumFractionDigits: 2` silently swallows the
 * trailing zero and renders $26.50 as "$26.5", which looks like a typo on every
 * shelf in the shop.
 */
const wholeDollarFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const centsFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(cents: number): string {
  const formatter = cents % 100 === 0 ? wholeDollarFormatter : centsFormatter;
  return formatter.format(cents / 100);
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

/**
 * When a freshly-placed order can be expected to arrive.
 *
 * The same two dates answer "when will it get here" in the checkout's Delivery
 * section and on the confirmation page, so a customer never sees one promise on
 * the form and another on the receipt.
 */
export function getDeliveryWindow(): { from: Date; to: Date; label: string } {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() + 4);
  const to = new Date(now);
  to.setDate(to.getDate() + 8);

  return {
    from,
    to,
    label: `${formatDate(from)}–${formatDate(to)}`,
  };
}
