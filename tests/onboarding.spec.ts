import { test, expect } from "playwright/test";
import { makeUser, registerUser } from "./helpers/auth";

// Mobile viewport: first-run is reviewed mobile-first.
test.use({ viewport: { width: 390, height: 844 } });

test.describe("onboarding first-run", () => {
  test("default onboarding leads with Create", async ({ page }) => {
    await registerUser(page, makeUser("onb"));
    await expect(
      page.getByRole("heading", { name: "Create your cozy space" }),
    ).toBeVisible();
  });

  test("invite link leads with Join (FR-1)", async ({ page }) => {
    await registerUser(page, makeUser("onbinv"));
    // Arrive as a partner following an invite link.
    await page.goto("/spaces/onboarding?invite=ABC123");
    await expect(
      page.getByRole("heading", { name: "Join your partner on Duet" }),
    ).toBeVisible();

    // The Join form must render above the Create form in the visual order.
    const joinBox = await page
      .locator("form", { has: page.locator('input[name="inviteCode"]') })
      .boundingBox();
    const createBox = await page
      .locator("form", { has: page.locator('input[name="name"]') })
      .boundingBox();
    expect(joinBox).not.toBeNull();
    expect(createBox).not.toBeNull();
    expect(joinBox!.y).toBeLessThan(createBox!.y);

    // The invite code is prefilled from the query param.
    await expect(page.locator('input[name="inviteCode"]')).toHaveValue(
      "ABC123",
    );
  });
});
