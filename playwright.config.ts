import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against a production build of the app (`next build && next start`)
 * pointed at the real Postgres database in `DATABASE_URL`.
 *
 * There used to be a private SQLite copy per run; there is no file to copy once
 * the driver moved to Postgres, so the suite now shares the configured database
 * and leans on its tests being additive — every account, product and order a test
 * creates carries a timestamp in its name. `e2e/global-setup.ts` applies the
 * migrations first and fails with one clear line if the URL is missing or still
 * points at a SQLite file.
 *
 * Two browser projects: a desktop Chromium for the full journeys, and a mobile
 * project (390px, touch) for the menu and drawer flows. The responsive audit
 * is its own third project so it can run alone or as part of `npm run test:e2e`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3101",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run start -- -p 3101",
    url: "http://localhost:3101/",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      // Deliberately not overridden. `next start` loads `.env` itself, so the
      // server picks up the Postgres URL from there; pinning a `file:` URL here
      // is what broke the suite the day the adapter moved.
      PORT: "3101",
    },
  },
  projects: [
    {
      name: "responsive",
      testMatch: /e2e\/audits\/responsive\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "desktop-chromium",
      // Mobile-first flows run in their own project; everything else here.
      testMatch: /e2e\/specs\/(?!mobile\.spec\.ts).*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      testMatch: /e2e\/specs\/mobile\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});