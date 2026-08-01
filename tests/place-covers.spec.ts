import { expect, test } from "playwright/test";

import { registerWithSpace } from "./helpers/auth";

const PLACE_PHOTO_URL = "https://place-photo.test/fresh-cover.png";
const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4WQAAAAASUVORK5CYII=",
  "base64",
);

function isoDateDaysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

test("place IDs resolve fresh covers for ideas and upcoming events", async ({
  page,
}) => {
  test.slow();

  await page.route("https://place-photo.test/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "image/png",
      body: ONE_PIXEL_PNG,
    });
  });
  await page.addInitScript((photoUrl) => {
    class StubPlace {
      photos = [{ getURI: () => photoUrl }];

      async fetchFields() {}
    }

    Object.defineProperty(window, "google", {
      configurable: true,
      value: {
        maps: {
          importLibrary: async () => ({ Place: StubPlace }),
        },
      },
    });
  }, PLACE_PHOTO_URL);

  const title = `Place cover ${Date.now()}`;
  const { spaceId } = await registerWithSpace(page, "covers");

  const createResponse = await page.request.post(
    `/api/couple-spaces/${spaceId}/ideas`,
    {
      data: {
        title,
        placeId: "test-place-id",
        placeName: "Test Place",
        placeAddress: "123 Test Street",
        placeLat: 41.88,
        placeLng: -87.63,
        placeUrl: "https://maps.google.com/?q=test",
      },
    },
  );
  expect(createResponse.ok()).toBeTruthy();
  const { idea } = (await createResponse.json()) as { idea: { id: string } };

  await test.step("idea uses the fresh Google place cover", async () => {
    await page.goto(`/spaces/${spaceId}/calendar`);
    const card = page.locator(`#idea-${idea.id}`);
    await expect(card).toBeVisible();
    await expect(card.locator("img").first()).toHaveAttribute(
      "src",
      PLACE_PHOTO_URL,
    );
    await expect(card.locator('[data-fallback-cover="true"]')).toHaveCount(0);
  });

  await test.step("scheduled event keeps resolving the place cover", async () => {
    await page.goto(`/spaces/${spaceId}/ideas/${idea.id}`);
    await page.getByRole("button", { name: "Schedule" }).first().click();
    await page.fill('input[name="date"]', isoDateDaysFromNow(7));
    await page.getByRole("button", { name: "Create event" }).click();
    await page.waitForURL(/\/events\//);

    await page.goto(`/spaces/${spaceId}/calendar`);
    const eventLink = page.getByRole("link", { name: `Open event: ${title}` });
    await expect(eventLink).toBeVisible();
    const card = eventLink.locator("..");
    await expect(card.locator("img").first()).toHaveAttribute(
      "src",
      PLACE_PHOTO_URL,
    );
    await expect(card.locator('[data-fallback-cover="true"]')).toHaveCount(0);
  });
});
