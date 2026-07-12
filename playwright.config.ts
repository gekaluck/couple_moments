import { defineConfig, devices } from "playwright/test";
import { TEST_DATABASE_URL } from "./tests/test-db";

const PORT = 3100;

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global-setup.ts",
  // The screenshot-capture spec is a dev tool, not a CI check. It only runs when
  // CAPTURE_SCREENS is set: `CAPTURE_SCREENS=1 npx playwright test screens`.
  testIgnore: process.env.CAPTURE_SCREENS ? [] : ["**/screens.spec.ts"],
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
