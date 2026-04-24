import { defineConfig, devices } from "@playwright/test";

const ADMIN_STATE = "playwright/.auth/admin.json";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    viewport: { width: 1366, height: 820 },
    // Next.js dev mode compiles each route on first hit; bump navigation
    // timeout so cold-compile pages (charts, maps, etc.) don't flake.
    navigationTimeout: 60_000,
    launchOptions: process.env.PW_SLOWMO
      ? { slowMo: Number(process.env.PW_SLOWMO) }
      : undefined,
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ADMIN_STATE,
      },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts|public\..*\.spec\.ts/,
    },
    {
      name: "public-chromium",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /public\..*\.spec\.ts|kirana\.spec\.ts/,
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        storageState: ADMIN_STATE,
      },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts|public\..*\.spec\.ts/,
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        storageState: ADMIN_STATE,
      },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts|public\..*\.spec\.ts/,
    },
  ],
});
