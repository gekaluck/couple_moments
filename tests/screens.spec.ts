/**
 * Screenshot capture harness (NOT a CI test — see testIgnore in playwright.config).
 *
 * Run:  CAPTURE_SCREENS=1 npx playwright test screens
 * Out:  .screenshots/*.png  (gitignored)
 *
 * Captures every key screen at mobile widths, seeded with realistic demo data,
 * so the design pass has reproducible before/after images. Each capture is
 * defensive: one screen failing does not abort the batch.
 */
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { test, type Page } from "playwright/test";
import { TEST_DATABASE_URL } from "./test-db";
import {
  createSpace,
  makeUser,
  registerUser,
} from "./helpers/auth";

const OUT = ".screenshots";
const MOBILE = { width: 390, height: 844 };
const NARROW = { width: 360, height: 800 };

mkdirSync(OUT, { recursive: true });

async function shoot(page: Page, name: string) {
  try {
    // Let async covers / maps settle so shots are stable.
    await page.waitForTimeout(600);
    // Fold = what's actually on screen (fixed elements like the FAB/tab-bar
    // render correctly). Full = the whole scrollable page for content review.
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
    await page.screenshot({ path: `${OUT}/${name}-full.png`, fullPage: true });
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.log(`  ✗ ${name}: ${String(err)}`);
  }
}

test("capture mobile screens", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize(MOBILE);

  // ---- Auth + first-run (fresh user, no space yet) ----
  const user = makeUser("shot");
  await registerUser(page, user);
  await shoot(page, "01-onboarding-default");

  await page.goto("/spaces/onboarding?invite=DEMO42");
  await shoot(page, "02-onboarding-invite");

  // ---- Empty space (before seeding): empty states ----
  await page.goto("/spaces/onboarding");
  const spaceId = await createSpace(page, "Design QA");
  // Tour auto-opens ~500ms after landing — capture it, then dismiss.
  await page.waitForTimeout(900);
  await shoot(page, "03-onboarding-tour");
  await page
    .getByRole("button", { name: "Skip tour" })
    .click({ timeout: 5_000 })
    .catch(() => {});

  await page.goto(`/spaces/${spaceId}/calendar`);
  await shoot(page, "04-calendar-empty");
  await page.goto(`/spaces/${spaceId}/memories`);
  await shoot(page, "05-memories-empty");
  await page.goto(`/spaces/${spaceId}/activity`);
  await shoot(page, "06-activity-empty");

  // ---- Seed realistic data ----
  execSync(`npx tsx scripts/seed-demo.ts ${spaceId} --reset`, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });

  // ---- Seeded screens ----
  await page.goto(`/spaces/${spaceId}/calendar`);
  await page
    .getByRole("button", { name: "Skip tour" })
    .click({ timeout: 3_000 })
    .catch(() => {});
  await shoot(page, "07-calendar-agenda");

  // Expand the month strip.
  await page
    .getByRole("button", { name: /full month/i })
    .click({ timeout: 3_000 })
    .catch(() => {});
  await shoot(page, "08-calendar-month-expanded");

  // Event detail (first agenda event link).
  const eventHref = await page
    .locator('a[href*="/events/"]')
    .first()
    .getAttribute("href")
    .catch(() => null);
  if (eventHref) {
    await page.goto(eventHref);
    await shoot(page, "09-event-detail");
  }

  // Idea detail (first ideas-rail link).
  await page.goto(`/spaces/${spaceId}/calendar`);
  const ideaHref = await page
    .locator('a[href*="/ideas/"]')
    .first()
    .getAttribute("href")
    .catch(() => null);
  if (ideaHref) {
    await page.goto(ideaHref);
    await shoot(page, "10-idea-detail");
  }

  await page.goto(`/spaces/${spaceId}/memories`);
  await shoot(page, "11-memories-list");
  await page.goto(`/spaces/${spaceId}/activity`);
  await shoot(page, "12-activity-list");
  await page.goto(`/spaces/${spaceId}/settings`);
  await shoot(page, "13-settings");

  // ---- Narrow (360px) re-shots of the densest screens ----
  await page.setViewportSize(NARROW);
  await page.goto(`/spaces/${spaceId}/calendar`);
  await page
    .getByRole("button", { name: "Skip tour" })
    .click({ timeout: 3_000 })
    .catch(() => {});
  await shoot(page, "14-calendar-agenda-360");
  await page.goto(`/spaces/${spaceId}/memories`);
  await shoot(page, "15-memories-list-360");
});
