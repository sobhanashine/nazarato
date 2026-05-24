import { test, expect } from "@playwright/test";

test.describe("Settings — issue #25", () => {
  test("unauthenticated /settings redirects to /login with next=/settings", async ({
    page,
  }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login(\?|$)/);
  });

  test("unauthenticated /settings/notifications redirects to /login", async ({
    page,
  }) => {
    await page.goto("/settings/notifications");
    await expect(page).toHaveURL(/\/login(\?|$)/);
  });

  test("unauthenticated /settings/privacy redirects to /login", async ({
    page,
  }) => {
    await page.goto("/settings/privacy");
    await expect(page).toHaveURL(/\/login(\?|$)/);
  });
});
