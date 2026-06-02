import { expect, test } from "@playwright/test";

/**
 * Branded not-found UI — issues #143 (global) + #145 (segment-scoped).
 *
 * The 404 *status* already worked (see blog-taxonomy.spec.ts); these specs
 * guard the *UI*: unknown URLs and `notFound()` calls must render the Persian,
 * RTL, Header/Footer-wrapped page with a back-link — not Next's plain English
 * "404 | This page could not be found." default.
 */
test.describe("Not-found pages", () => {
  test("unknown top-level URL renders the branded 404 (and 404 status)", async ({
    page,
  }) => {
    const resp = await page.goto("/this-route-does-not-exist");
    expect(resp?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "صفحه پیدا نشد" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "بازگشت به خانه" }),
    ).toBeVisible();
  });

  test("/blog/[slug] not-found links back to the blog", async ({ page }) => {
    const resp = await page.goto("/blog/this-post-does-not-exist");
    expect(resp?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "مطلب پیدا نشد" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "بازگشت به وبلاگ" }),
    ).toHaveAttribute("href", "/blog");
  });

  test("/categories/[slug] not-found links back to categories", async ({
    page,
  }) => {
    const resp = await page.goto("/categories/this-category-does-not-exist");
    expect(resp?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "دسته‌بندی پیدا نشد" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "بازگشت به دسته‌بندی‌ها" }),
    ).toHaveAttribute("href", "/categories");
  });

  test("/users/[username] not-found renders the branded page", async ({
    page,
  }) => {
    const resp = await page.goto("/users/this-user-does-not-exist");
    expect(resp?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "کاربر پیدا نشد" }),
    ).toBeVisible();
  });
});
