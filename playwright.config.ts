import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against a production build of the app (`next build && next start`)
 * pointed at its own SQLite file. `e2e/global-setup.ts` copies the seeded dev
 * database across before the server boots, so every run starts from the same
 * known catalogue and the tests can mutate it freely.
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
      DATABASE_URL: "file:./prisma/e2e.db",
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