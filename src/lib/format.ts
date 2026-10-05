const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/**
 * Formats an integer cent amount for display. Money is always stored and
 * passed around as integer cents; never format prices anywhere else.
 */
export function formatPrice(cents: number): string {
  return priceFormatter.format(cents / 100);
}