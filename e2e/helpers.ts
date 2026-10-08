import { expect, type Page } from "@playwright/test";

/**
 * Shared steps for the customer journeys.
 *
 * `addToCart` buys one unit of a seeded plant and lets the drawer come up and
 * go away again, so callers start from a settled page. `checkoutOrder` walks
 * the four progressive checkout sections and returns the new order number.
 */

export async function addToCart(
  page: Page,
  slug = "aloe-vera",
): Promise<void> {
  await page.goto(`/shop/${slug}`);
  const addButton = page.getByRole("button", { name: /add to cart/i }).first();
  await expect(addButton).toBeVisible();
  await addButton.click();

  const dialog = page.getByRole("dialog");
  // Wait briefly for the drawer rather than a fire-once isVisible(): the
  // open is async, so an instant check misses it on a fast click.
  const isOpen = await dialog
    .waitFor({ state: "visible", timeout: 3_000 })
    .then(() => true)
    .catch(() => false);
  if (isOpen) {
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
  }
}

export async function checkoutOrder(
  page: Page,
  opts: { email: string; fullName: string; phone?: string },
): Promise<string> {
  await page.goto("/cart");
  // The primary checkout call-to-action is a button that pushes the route;
  // fall back to the link variant in case a future build changes that.
  // A plain isVisible() would evaluate instantly — the cart hydrates
  // client-side — so wait with an explicit timeout instead.
  const checkout = page
    .getByRole("button", { name: "Checkout", exact: true })
    .first();
  const hasButton = await checkout
    .waitFor({ state: "visible", timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
  if (hasButton) {
    await checkout.click();
  } else {
    await page.getByRole("link", { name: "Checkout" }).first().click();
  }
  await page.waitForURL(/\/checkout$/);

  // 1 — Contact
  await page.getByLabel("Email", { exact: true }).fill(opts.email);
  await page.getByLabel("Phone").fill(opts.phone ?? "503-555-0148");
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // 2 — Address
  await page.getByLabel("Full name").fill(opts.fullName);
  await page.getByLabel("Street address").fill("12 Kiln Lane");
  await page.getByLabel("City").fill("Portland");
  await page.getByLabel("State").fill("OR");
  await page.getByLabel("ZIP").fill("97209");
  // The schema wants an ISO two-letter code, uppercased.
  await page.getByLabel("Country").fill("US");
  await page.getByRole("button", { name: "Continue to delivery" }).click();

  // 3 — Delivery
  await page.getByRole("button", { name: "Continue to payment" }).click();

  // 4 — Payment (cash on delivery is the default and always offered)
  await page.getByRole("button", { name: "Place order" }).first().click();

  await page.waitForURL(/\/checkout\/success\?order=VRD-\d+/);
  const match = page.url().match(/order=(VRD-\d+)/);
  if (!match) throw new Error(`No order number in success URL: ${page.url()}`);
  return match[1];
}