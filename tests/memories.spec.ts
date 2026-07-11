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
});
