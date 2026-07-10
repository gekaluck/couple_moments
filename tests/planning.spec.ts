import { test, expect } from "playwright/test";
import { registerWithSpace } from "./helpers/auth";

function isoDateDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

test("core planning flow: event, idea, schedule, delete reverts idea", async ({
  page,
}) => {
  test.slow(); // several full navigations on a dev server

  const eventTitle = `Smoke Dinner ${Date.now()}`;
  const ideaTitle = `Smoke Picnic ${Date.now()}`;

  await test.step("register and create a space", async () => {
    await registerWithSpace(page, "plan");
  });

  await test.step("create an event from the calendar", async () => {
    await page.getByRole("button", { name: "Create a new event" }).click();
    await page.fill('input[name="title"]', eventTitle);
    await page.fill('input[name="date"]', isoDateDaysFromNow(7));
    await page
      .locator("form")
      .filter({ has: page.locator('input[name="title"]') })
      .first()
      .getByRole("button", { name: /save|create|add/i })
      .click();
    await expect(
      page.getByText(eventTitle).filter({ visible: true }).first(),
    ).toBeVisible();
  });

  await test.step("create an idea", async () => {
    await page
      .getByRole("button", { name: "Create idea" })
      .filter({ visible: true })
      .first()
      .click();
    const modal = page.getByRole("dialog");
    await modal.locator('input[name="title"]').fill(ideaTitle);
    await modal.getByRole("button", { name: "Create idea" }).click();
    await expect(
      page.getByText(ideaTitle).filter({ visible: true }).first(),
    ).toBeVisible();
  });

  await test.step("schedule the idea into an event", async () => {
    // Desktop cards are not whole-card links; go straight to the idea page.
    const ideaHref = await page
      .locator('a[href*="/ideas/"]')
      .first()
      .getAttribute("href");
    expect(ideaHref).toBeTruthy();
    await page.goto(ideaHref!);
    await page.waitForURL(/\/ideas\//);
    await page.getByRole("button", { name: "Schedule" }).first().click();
    await page.fill('input[name="date"]', isoDateDaysFromNow(10));
    await page.getByRole("button", { name: "Create event" }).click();
    // Scheduling navigates to the created event's page
    await page.waitForURL(/\/events\//);
    await expect(
      page.getByText(ideaTitle).filter({ visible: true }).first(),
    ).toBeVisible();
  });

  await test.step("delete the event; idea reverts to the ideas list", async () => {
    await page.getByRole("button", { name: "Delete event" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();
    await page.waitForURL(/\/calendar/);
    // The idea is back in the planning rail
    await expect(
      page.getByText(ideaTitle).filter({ visible: true }).first(),
    ).toBeVisible();
  });
});
