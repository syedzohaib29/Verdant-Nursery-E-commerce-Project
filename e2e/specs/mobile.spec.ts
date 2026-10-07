import { expect, test } from "@playwright/test";

import { addToCart } from "../helpers";

/**
 * The small-screen flows: the menu button opens the navigation and takes a
 * shopper to the shop, and adding to the basket opens the drawer from the
 * badge.
 */
test.describe("mobile navigation and basket", () => {
  test("the menu opens and navigates", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
    await page.getByRole("button", { name: "Open menu" }).click();

    const menu = page.getByRole("dialog");
    await expect(menu).toBeVisible();
    // The menu row is an <a role="button"> (the site's base-ui convention), so
    // it is reached as a button rather than a link.
    await page.getByRole("button", { name: "Shop", exact: true }).click();
    await expect(page).toHaveURL(/\/shop/);
  });

  test("adding to the basket opens the drawer from the badge", async ({
    page,
  }) => {
    await addToCart(page, "aloe-vera");

    // The badge reports one item, and tapping it opens the drawer.
    const badge = page.getByRole("button", { name: "Basket, 1 item" });
    await expect(badge).toBeVisible();
    await badge.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Checkout" }),
    ).toBeVisible();
  });
});