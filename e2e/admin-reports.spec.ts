import { expect, test } from "@playwright/test";

/** Admin reports inbox — issue #32. Access boundary (admin-gated). */
test.describe("Admin reports console — issue #32", () => {
  test("redirects signed-out visitors to /login", async ({ page }) => {
    await page.goto("/admin/reports");
    await expect(page).toHaveURL(/\/login/);
  });
});
