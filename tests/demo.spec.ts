import { test, expect } from "playwright/test";

import {
  buildDemoContent,
  DEMO_REAL_PLACES,
} from "../src/lib/demo/fixture";

/**
 * Demo mode smoke tests.
 *
 * These run against the disposable test database, with `DEMO_MODE_ENABLED=true`
 * supplied by `playwright.config.ts`.
 */

test.describe("demo fixture", () => {
  test("always has something today, ahead, and behind", () => {
    const now = new Date();
    const content = buildDemoContent(now);

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const today = content.events.filter(
      (event) =>
        event.dateTimeStart >= startOfToday && event.dateTimeStart <= endOfToday,
    );
    const upcoming = content.events.filter(
      (event) => event.dateTimeStart > endOfToday,
    );
    const past = content.events.filter(
      (event) => event.dateTimeStart < startOfToday,
    );

    // An empty "today" is the failure mode that makes a stale demo look broken.
    expect(today.length).toBeGreaterThanOrEqual(1);
    expect(upcoming.length).toBeGreaterThanOrEqual(5);
    expect(past.length).toBeGreaterThanOrEqual(8);
    expect(content.ideas.length).toBeGreaterThanOrEqual(7);
  });

  test("nothing claims to have been created in the future", () => {
    const now = new Date();
    const content = buildDemoContent(now);

    for (const event of content.events) {
      expect(event.createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
    }
    for (const idea of content.ideas) {
      expect(idea.createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
    }
  });

  test("uses stored real Place IDs without persisting Google photo URLs", () => {
    const content = buildDemoContent(new Date());
    const places = [
      ...content.events.map((event) => event.place),
      ...content.ideas.map((idea) => idea.place),
    ].filter((place) => place !== null);

    expect(Object.keys(DEMO_REAL_PLACES).length).toBeGreaterThanOrEqual(15);
    expect(places.some((place) => place.placeAddress.includes("Chicago"))).toBe(true);
    expect(places.some((place) => place.placeAddress.includes("Canada"))).toBe(true);
    expect(places.some((place) => place.placeAddress.includes("Portugal"))).toBe(true);
    for (const place of places) {
      // Only stable Place IDs are persisted; photo URLs are fetched fresh.
      expect(place.placeId).toMatch(/^ChIJ/);
      expect(place.placePhotoUrls).toBeNull();
    }
  });

  test("exactly one idea is scheduled into an event", () => {
    const content = buildDemoContent(new Date());
    const scheduledIdeas = content.ideas.filter((idea) => idea.status === "PLANNED");
    const eventsFromIdeas = content.events.filter((event) => event.fromIdeaSlug);

    expect(scheduledIdeas).toHaveLength(1);
    expect(eventsFromIdeas).toHaveLength(1);
    expect(eventsFromIdeas[0].fromIdeaSlug).toBe(scheduledIdeas[0].slug);
  });
});

test.describe("demo sandbox", () => {
  test("entering /demo lands in a populated space", async ({ page }) => {
    test.slow();

    await page.goto("/demo");
    await page.waitForURL("**/spaces/*/calendar");

    await expect(
      page.getByText("Demo space — everything here is made up"),
    ).toBeVisible();
    // The layout renders mobile and desktop variants together, so filter to the
    // one the current viewport actually shows.
    await expect(
      page
        .getByText("Dinner at Cindy's Rooftop")
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
  });

  test("two visitors get separate sandboxes", async ({ browser }) => {
    test.slow();

    const first = await browser.newContext();
    const second = await browser.newContext();

    const firstPage = await first.newPage();
    const secondPage = await second.newPage();

    await firstPage.goto("/demo");
    await firstPage.waitForURL("**/spaces/*/calendar");
    await secondPage.goto("/demo");
    await secondPage.waitForURL("**/spaces/*/calendar");

    expect(firstPage.url()).not.toBe(secondPage.url());

    await first.close();
    await second.close();
  });

  test("re-entering /demo reuses the same sandbox", async ({ page }) => {
    test.slow();

    await page.goto("/demo");
    await page.waitForURL("**/spaces/*/calendar");
    const firstUrl = page.url();

    await page.goto("/demo");
    await page.waitForURL("**/spaces/*/calendar");

    expect(page.url()).toBe(firstUrl);
  });

  test("invites and Google Calendar are switched off in settings", async ({
    page,
  }) => {
    test.slow();

    await page.goto("/demo");
    await page.waitForURL("**/spaces/*/calendar");
    const spaceId = new URL(page.url()).pathname.split("/")[2];

    await page.goto(`/spaces/${spaceId}/settings`);
    await expect(
      page.getByText("Invite codes are switched off here"),
    ).toBeAttached();
    await expect(
      page.getByText("Connecting Google Calendar needs a real Google sign-in"),
    ).toBeAttached();
  });
});
