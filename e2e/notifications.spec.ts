import { test, expect } from "@playwright/test";

test.describe("Notifications inbox — issue #25", () => {
  test("unauthenticated /profile/notifications redirects to /login", async ({
    page,
  }) => {
    await page.goto("/profile/notifications");
    await expect(page).toHaveURL(/\/login(\?|$)/);
  });
});
