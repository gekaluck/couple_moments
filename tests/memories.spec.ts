import { test, expect } from "playwright/test";
import { registerWithSpace } from "./helpers/auth";

function isoDateDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Regression test for the "clicking a memory doesn't navigate" bug: the card's
// stretched <Link> overlay sat below the content (z-order), so taps never hit it.
test("memory card navigates to the event page", async ({ page }) => {
  test.slow();

  const title = `Memory Nav ${Date.now()}`;
  const { spaceId } = await registerWithSpace(page, "mem");

  await test.step("create a past-dated event (becomes a memory)", async () => {
    await page.getByRole("button", { name: "Create a new event" }).click();
    await page.fill('input[name="title"]', title);
    await page.fill('input[name="date"]', isoDateDaysFromNow(-3));
    await page
      .locator("form")
      .filter({ has: page.locator('input[name="title"]') })
      .first()
      .getByRole("button", { name: /save|create|add/i })
      .click();
    await expect(
      page.getByText(title).filter({ visible: true }).first(),
    ).toBeVisible();
  });

  await test.step("open Memories and tap the card", async () => {
    await page.goto(`/spaces/${spaceId}/memories`);
    // The whole card is a stretched overlay link; tapping anywhere on the card
    // must reach it (this is the regression: it used to sit under the content).
    const card = page.getByRole("link", { name: `Open ${title}` });
    await expect(card).toBeVisible();
    await card.click();
    await page.waitForURL(/\/events\//);
    await expect(
      page.getByRole("heading", { name: title }).first(),
    ).toBeVisible();
  });

  await test.step("event page keeps the mobile nav shell (F15)", async () => {
    // The bottom tab bar (md:hidden) must be present on the event route — it
    // lives outside the space layout and previously lost all global navigation.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    const bottomNav = page.getByRole("navigation").filter({
      has: page.getByRole("link", { name: "Activity" }),
    });
    await expect(
      bottomNav.getByRole("link", { name: "Calendar" }),
    ).toBeVisible();
    await expect(
      bottomNav.getByRole("link", { name: "Activity" }),
    ).toBeVisible();

    // ...but the create FAB is intentionally hidden on detail pages, where it
    // used to float over the photo Upload / Paste-URL controls (bug #2).
    await expect(
      page.getByRole("button", { name: "Create new item" }),
    ).toHaveCount(0);
  });
});
