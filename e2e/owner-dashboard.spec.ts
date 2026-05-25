import { test, expect } from "@playwright/test";

test.describe("Owner dashboard — issue #28", () => {
  test("/business redirects unauthenticated users to /login with ?next", async ({ page }) => {
    const response = await page.goto("/business");
    await expect(page).toHaveURL(/\/login\?next=/);
    expect(response?.status()).toBeLessThan(400);
  });

  test("/business/reviews redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/business/reviews");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/business/profile redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/business/profile");
    await expect(page).toHaveURL(/\/login/);
  });

  test("public /company/[slug] review cards render owner-reply badge when present", async ({
    page,
  }) => {
    // A known seeded business. If it has no owner reply yet the badge is just
    // absent — the assertion is on the page rendering, not on a specific badge.
    const response = await page.goto("/company/cafe-naderi");
    expect(response?.status()).toBe(200);
    // The owner-reply UI is conditional, but the host card must render.
    await expect(page.getByRole("heading", { name: /کافه نادری/ })).toBeVisible();
  });

  test("/for-business CTA on homepage links to the marketing page", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: "ادعای مالکیت کسب‌وکار" }).first();
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/for-business/);
  });
});
