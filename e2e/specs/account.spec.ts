import { expect, test } from "@playwright/test";

import { addToCart, checkoutOrder } from "../helpers";

/**
 * The account lifecycle: a customer registers, signs out, signs back in,
 * places an order while signed in, sees it under their account, and signs
 * out again.
 */
test.describe("account lifecycle", () => {
  test("register → sign out → sign in → order → view order → sign out", async ({
    page,
  }) => {
    const email = `tester-${Date.now()}@example.com`;
    const password = "Password123!";

    // Register
    await page.goto("/register");
    await page.getByLabel("Name").fill("Tester Fern");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/^((?!\/register).)*$/);

    // Sign out
    await page.goto("/account");
    await page.getByRole("button", { name: "Sign out" }).first().click();
    await expect(page).toHaveURL("/");

    // Sign back in
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/^((?!\/login).)*$/);

    // Place an order while signed in
    await addToCart(page);
    const orderNumber = await checkoutOrder(page, {
      email,
      fullName: "Tester Fern",
    });

    // The order is attached to the account
    await page.goto("/account/orders");
    await expect(page.getByText(orderNumber).first()).toBeVisible();

    // And the session still signs out
    await page.goto("/account");
    await page.getByRole("button", { name: "Sign out" }).first().click();
    await expect(page).toHaveURL("/");
  });
});