import { expect, test } from "@playwright/test";

import { addToCart, checkoutOrder } from "../helpers";

const ADMIN_EMAIL = "admin@verdant.dev";
const ADMIN_PASSWORD = "Admin@12345";

/**
 * The back office: a plain customer cannot reach it, an admin can. The admin
 * adds a plant to the catalogue at stock 5, a shopper buys one, and the admin
 * sees the stock fall to 4 and confirms the order.
 */
test.describe("admin back office", () => {
  test("a customer is bounced from /admin", async ({ page }) => {
    const email = `blocked-${Date.now()}@example.com`;

    await page.goto("/register");
    await page.getByLabel("Name").fill("Nosy Customer");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("Password123!");
    await page.getByLabel("Confirm password", { exact: true }).fill("Password123!");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/^((?!\/register).)*$/);

    // The desk is not for customers: they land back on their account.
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/account/);
  });

  test("an admin sells stock and advances an order", async ({
    page,
    browser,
  }) => {
    const stamp = Date.now();
    const productName = `Test Succulent ${stamp}`;
    const sku = `TEST-${stamp}`;
    const buyerEmail = `buyer-${stamp}@example.com`;

    // Sign in as admin and create the plant
    await page.goto("/login?callbackUrl=/admin");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    // Matches the dashboard path specifically: the login page's own URL carries
    // the callback (`/login?callbackUrl=/admin`), so a substring "/admin" match
    // resolves instantly and races away before the sign-in redirect lands.
    await page.waitForURL((url) => url.pathname === "/admin");

    await page.goto("/admin/products/new");
    await page.getByLabel("Name").fill(productName);
    await page.getByLabel("Description").fill(
      "A low-maintenance succulent grown for the e2e suite.",
    );
    await page.getByLabel("Price", { exact: true }).fill("18");
    await page.getByLabel("Stock").fill("5");
    await page.getByLabel("SKU").fill(sku);
    await page.getByLabel("Care notes").fill(
      "Copes with bright windowsills and the occasional forgotten watering.",
    );
    await page.getByRole("button", { name: "Create product" }).click();

    // Lands on the edit page for the fresh plant (the form routes there after
    // creating so photographs can be added). Must exclude the form's own
    // `/admin/products/new` path — a plain regex of trailing alphanumerics
    // matches both, which would race away before the create finished.
    await page.waitForURL(
      (url) => url.pathname.startsWith("/admin/products/") && !url.pathname.endsWith("/new"),
    );

    // A shopper buys one
    const buyer = await browser.newContext();
    const buyerPage = await buyer.newPage();
    await addToCart(buyerPage, "test-succulent-" + stamp);
    const orderNumber = await checkoutOrder(buyerPage, {
      email: buyerEmail,
      fullName: "Shopper One",
    });
    await buyer.close();

    // The admin sees the stock fall from 5 to 4
    await page.goto(`/admin/products?q=${encodeURIComponent(productName)}`);
    await expect(page.getByText("4 in stock").first()).toBeVisible();

    // And advances the order to confirmed
    await page.goto(`/admin/orders?q=${encodeURIComponent(buyerEmail)}`);
    await page.getByRole("link", { name: orderNumber }).click();
    await expect(page.getByRole("button", { name: "Mark confirmed" })).toBeVisible();
    await page.getByRole("button", { name: "Mark confirmed" }).click();
    await expect(page.getByText("Confirmed", { exact: true }).first()).toBeVisible();
  });
});