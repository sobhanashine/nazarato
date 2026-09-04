import { expect, test } from "@playwright/test";

/** Admin businesses console — issue #32. Access boundary (admin-gated). */
test.describe("Admin businesses console — issue #32", () => {
  test("redirects signed-out visitors to /login", async ({ page }) => {
    await page.goto("/admin/businesses");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects signed-out visitors away from the OSM review queue", async ({
    page,
  }) => {
    await page.goto("/admin/businesses/osm-review");
    await expect(page).toHaveURL(/\/login/);
  });
});
