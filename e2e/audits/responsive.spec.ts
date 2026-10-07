import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

/**
 * The responsive audit.
 *
 * Every public storefront route is loaded at every width in the support
 * matrix — 320, 360, 390, 740 (phone held sideways), 768, 1024, 1280 and
 * 1536px — and must render without horizontal scroll. A full-page screenshot
 * of each combination is saved under `/docs/screenshots/<route>/<width>.png`
 * so a human can eyeball anything the assertion cannot see.
 *
 * `cart` and `checkout` start with one item in the basket so they exercise
 * their populated layouts rather than their empty states.
 */

type Route = { path: string; slug: string; needsCart?: boolean };

const WIDTHS = [320, 360, 390, 740, 768, 1024, 1280, 1536];

const ROUTES: Route[] = [
  { path: "/", slug: "home" },
  { path: "/shop", slug: "shop" },
  { path: "/shop/aloe-vera", slug: "product" },
  { path: "/journal", slug: "journal" },
  { path: "/journal/drainage-is-not-optional", slug: "journal-post" },
  { path: "/care", slug: "care" },
  { path: "/about", slug: "about" },
  { path: "/contact", slug: "contact" },
  { path: "/faq", slug: "faq" },
  { path: "/wishlist", slug: "wishlist" },
  { path: "/cart", slug: "cart", needsCart: true },
  { path: "/checkout", slug: "checkout", needsCart: true },
  { path: "/login", slug: "login" },
  { path: "/register", slug: "register" },
  { path: "/privacy", slug: "privacy" },
  { path: "/terms", slug: "terms" },
  { path: "/shipping-returns", slug: "shipping-returns" },
];

async function fillTheBasket(page: Page): Promise<void> {
  await page.goto("/shop/aloe-vera");
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.getByRole("button", { name: /^close$/i }).click().catch(() => {});
  await page.getByRole("button", { name: "Basket, 1 item" }).waitFor({
    state: "visible",
    timeout: 10_000,
  });
}

test.describe("responsive audit", () => {
  test.beforeAll(() => {
    for (const route of ROUTES) {
      mkdirSync(join("docs/screenshots", route.slug), { recursive: true });
    }
  });

  for (const route of ROUTES) {
    test(`${route.path} has no horizontal scroll at any supported width`, async ({
      page,
    }) => {
      if (route.needsCart) await fillTheBasket(page);

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route.path);
        await page.waitForLoadState("load");
        // Let images and fonts finish before measuring.
        await page.evaluate(
          () =>
            new Promise<void>((resolve) => {
              requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
            }),
        );

        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));

        expect(
          scrollWidth,
          `${route.path} overflows by ${scrollWidth - clientWidth}px at ${width}px`,
        ).toBeLessThanOrEqual(clientWidth);

        await page.screenshot({
          path: join("docs/screenshots", route.slug, `${width}.png`),
          fullPage: true,
        });
      }
    });
  }
});