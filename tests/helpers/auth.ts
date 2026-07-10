import { expect, type Page } from "playwright/test";

export type Credentials = { name: string; email: string; password: string };

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;
}

export function makeUser(prefix: string): Credentials {
  return {
    name: `Test ${prefix}`,
    email: uniqueEmail(prefix),
    password: "smoke-test-pass-1",
  };
}

/** Registers a brand-new user via the UI; lands on /spaces/onboarding. */
export async function registerUser(page: Page, user: Credentials) {
  await page.goto("/register");
  await page.fill('input[name="name"]', user.name);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/spaces/onboarding");
}

/** Logs in via the UI. Does not assert the destination (depends on spaces). */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
}

/** From /spaces/onboarding, creates a couple space and lands on its calendar. */
export async function createSpace(page: Page, spaceName: string) {
  const createForm = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Create space" }) });
  await createForm.locator('input[name="name"]').fill(spaceName);
  await createForm.getByRole("button", { name: "Create space" }).click();
  await page.waitForURL(/\/spaces\/[^/]+\/calendar/);
  return page.url().match(/\/spaces\/([^/]+)\/calendar/)?.[1] as string;
}

/** Dismisses the first-run onboarding tour overlay if it shows up. */
export async function dismissOnboardingTour(page: Page) {
  await page
    .getByRole("button", { name: "Skip tour" })
    .click({ timeout: 5_000 })
    .catch(() => {});
}

/** Registers a fresh user and creates a space; resolves with the spaceId. */
export async function registerWithSpace(page: Page, prefix: string) {
  const user = makeUser(prefix);
  await registerUser(page, user);
  const spaceId = await createSpace(page, `${prefix} space`);
  expect(spaceId).toBeTruthy();
  await dismissOnboardingTour(page);
  return { user, spaceId };
}
