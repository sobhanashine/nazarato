import { expect, test } from "@playwright/test";

/** Admin overview dashboard — issue #32. Access boundary (admin-gated). */
test.describe("Admin overview — issue #32", () => {
  test("redirects signed-out visitors to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});
