import { defineConfig, devices } from "playwright/test";

const PORT = 3100;

/**
 * Tests always run against a dedicated throwaway database — never the one in
 * .env. Locally, global-setup boots a docker Postgres (duet-test-pg) unless
 * TEST_DATABASE_URL is provided; CI provides a service container.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5533/duet_test";

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global-setup.ts",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    viewport: { width: 1280, height: 800 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.CI
      ? `npx next start -p ${PORT}`
      : `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      // Keep integrations quiet in tests
      SENTRY_DSN: "",
      NEXT_PUBLIC_SENTRY_DSN: "",
    },
  },
});
