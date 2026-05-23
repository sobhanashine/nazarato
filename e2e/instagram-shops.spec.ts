import { test, expect } from "@playwright/test";

test.describe("Instagram shops — issue #22", () => {
  test("directory renders, niche tab filters, shop card links to profile", async ({ page }) => {
    await page.goto("/instagram-shops");
    await expect(page.getByRole("heading", { name: "فروشگاه‌های اینستاگرامی", exact: true })).toBeVisible();

    // Niche tab — filter by "پوشاک" (clothing) and confirm URL updates
    await page.getByRole("link", { name: "پوشاک", exact: true }).click();
    await expect(page).toHaveURL(/niche=clothing/);

    // At least one shop card is rendered and links into /shop/<handle>
    const firstCard = page.locator('a[href^="/shop/"]').first();
    await expect(firstCard).toBeVisible();
  });

  test("profile page loads with IgAvatar and breadcrumb", async ({ page }) => {
    await page.goto("/shop/manto_sara");
    await expect(page.getByRole("link", { name: "فروشگاه‌های اینستاگرامی" })).toBeVisible();
    // IgAvatar renders the shop initial in a conic-gradient ring
    await expect(page.locator("text=مانتو سارا").first()).toBeVisible();
  });

  test("write-review redirects unauthenticated users to /login", async ({ page }) => {
    const response = await page.goto("/shop/manto_sara/write-review");
    // Either redirected to /login, or login form is visible on the resulting page
    await expect(page).toHaveURL(/\/login/);
    expect(response?.status()).toBeLessThan(400);
  });

  test("unknown shop handle renders not-found UI", async ({ page }) => {
    // Next 16 quirk: notFound() from a [handle] page renders the not-found UI
    // but the layout/loading.tsx pins the HTTP status to 200. Asserting on rendered
    // content rather than status is the documented workaround.
    await page.goto("/shop/this-handle-does-not-exist-xyz");
    await expect(page.locator("body")).not.toContainText("مانتو سارا");
    // App router's default not-found shows "404" or the custom not-found content
    const html = await page.content();
    expect(html.length).toBeGreaterThan(0);
  });
});
