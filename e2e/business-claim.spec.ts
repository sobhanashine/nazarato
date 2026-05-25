import { test, expect } from "@playwright/test";

test.describe("Business claim flow — issue #27", () => {
  test("/for-business renders hero + claim CTA", async ({ page }) => {
    await page.goto("/for-business");
    await expect(page.getByRole("heading", { name: /نظرات واقعی/ })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "ادعای مالکیت کسب‌وکار" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "ثبت کسب‌وکار جدید" }),
    ).toBeVisible();
  });

  test("/company/[slug]/claim redirects unauthenticated users to /login", async ({ page }) => {
    const response = await page.goto("/company/cafe-naderi/claim");
    await expect(page).toHaveURL(/\/login/);
    expect(response?.status()).toBeLessThan(400);
  });

  test("/company/[slug]/claim shows 404 for unknown business", async ({ page }) => {
    await page.goto("/company/this-business-does-not-exist-xyz/claim");
    const html = await page.content();
    expect(html).toContain("404");
  });

  test("/admin/claims gates non-admin visitors", async ({ page }) => {
    const response = await page.goto("/admin/claims");
    // Not signed in → redirect to /login; signed in but non-admin → 404 (notFound()).
    const url = page.url();
    expect(url.includes("/login") || (await page.content()).includes("404")).toBe(true);
    expect(response?.status()).toBeLessThan(500);
  });

  test("homepage owner-acquisition section links to /for-business", async ({ page }) => {
    await page.goto("/");
    const cta = page
      .getByRole("link", { name: "ادعای مالکیت کسب‌وکار" })
      .first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/for-business");
  });
});
