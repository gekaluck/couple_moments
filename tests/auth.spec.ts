import { test, expect } from "playwright/test";
import { login, makeUser, registerUser } from "./helpers/auth";

test.describe("auth smoke", () => {
  test("register lands on onboarding", async ({ page }) => {
    await registerUser(page, makeUser("reg"));
    await expect(page).toHaveURL(/\/spaces\/onboarding/);
    await expect(
      page.getByRole("button", { name: "Create space" }),
    ).toBeVisible();
  });

  test("logout, then login with valid credentials", async ({ page }) => {
    const user = makeUser("login");
    await registerUser(page, user);

    // Logout from onboarding
    await page.getByRole("button", { name: "Log out" }).click();
    await page.waitForURL(/logged-out|login/);

    // Login again → still no space, so onboarding
    await login(page, user.email, user.password);
    await page.waitForURL("**/spaces/onboarding");
    await expect(
      page.getByRole("button", { name: "Create space" }),
    ).toBeVisible();
  });

  test("login with wrong password shows inline error, no raw JSON", async ({
    page,
  }) => {
    const user = makeUser("badlogin");
    await registerUser(page, user);
    await page.getByRole("button", { name: "Log out" }).click();
    await page.waitForURL(/logged-out|login/);

    await login(page, user.email, "definitely-wrong-password");
    await expect(page).toHaveURL(/\/login/);
    // Inline error rendered by the login page (not a raw API response)
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
    await expect(page.locator("body")).not.toContainText('{"error"');
  });

  test("protected route redirects to login when signed out", async ({
    page,
  }) => {
    await page.goto("/spaces/onboarding");
    await page.waitForURL(/\/login/);
  });
});
