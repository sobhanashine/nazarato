import { expect, test } from "@playwright/test";

/**
 * Admin users console — issue #32. The page is gated by the (admin) layout
 * (session + admin role). Without an admin session we can't drive the
 * ban/role mutations in E2E, so this guards the access boundary: a signed-out
 * visitor is bounced to /login, never seeing the console.
 */
test.describe("Admin users console — issue #32", () => {
  test("redirects signed-out visitors to /login", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/login/);
  });
});
