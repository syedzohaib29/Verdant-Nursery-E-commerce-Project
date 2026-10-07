import { expect, test } from "@playwright/test";

import { addToCart, checkoutOrder } from "../helpers";

/**
 * The happy path through the storefront: browse the greenhouse, filter it down
 * to one shelf, open a plant, put it in the basket and pay by cash on delivery
 * as a guest.
 */
test.describe("storefront journey", () => {
  test("browse → filter → product → basket → guest COD checkout", async ({
    page,
  }) => {
    // Browse
    await page.goto("/shop");
    await expect(
      page.getByRole("heading", { name: "The greenhouse" }),
    ).toBeVisible();

    // Filter: succulents only
    await page.getByRole("button", { name: "Succulents and Cacti" }).click();
    await expect(page).toHaveURL(/category=succulents-and-cacti/);
    await expect(
      page.getByRole("link", { name: /Aloe Vera/i }).first(),
    ).toBeVisible();

    // Product page
    await page.getByRole("link", { name: /Aloe Vera/i }).first().click();
    await expect(page).toHaveURL(/\/shop\/aloe-vera$/);
    await expect(
      page.getByRole("heading", { name: "Aloe Vera" }),
    ).toBeVisible();

    // Add to basket, then check out as a guest with cash on delivery
    await addToCart(page, "aloe-vera");
    const orderNumber = await checkoutOrder(page, {
      email: "guest@example.com",
      fullName: "Guest Customer",
    });

    // The confirmation page names the order and clears the basket
    await expect(page.getByText(orderNumber).first()).toBeVisible();
  });
});