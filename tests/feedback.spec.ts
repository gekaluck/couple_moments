import { test, expect } from "playwright/test";
import { registerWithSpace } from "./helpers/auth";

// Regression: /feedback had no working submit. Enter did nothing and, without
// NEXT_PUBLIC_SUPPORT_EMAIL, the email button only toasted an error.
test("feedback form gives clear feedback on submit without a support email", async ({
  page,
  context,
}) => {
  test.slow();
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
  const { spaceId } = await registerWithSpace(page, "fb");

  await page.goto(`/feedback?from=/spaces/${spaceId}/calendar&spaceId=${spaceId}`);
  const summary = page.getByPlaceholder("Short description of the issue");
  await summary.fill("Something broke");
  await summary.press("Enter");
  await expect(page.getByRole("status")).toContainText(/Duet team/);

  await page.getByRole("button", { name: "Send report" }).click();
  await expect(page.getByRole("status")).toContainText(/Duet team/);
});
