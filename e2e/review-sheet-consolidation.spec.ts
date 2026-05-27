import { test, expect } from "@playwright/test";

/**
 * Issue #91 — every review-writing entry-point now opens the ReviewSheet
 * bottom-sheet wizard rather than the legacy `/write-review` page composers.
 *
 * Quirks to know:
 *  - `ReviewSheetAutoOpen` scrubs `?review=1` from the URL on mount via
 *    `history.replaceState`, so the final `page.url()` will NOT carry the
 *    param. We assert on the auto-open side-effect (dialog appears) and on
 *    the destination pathname instead.
 *  - The wizard auth-gates internally: an unauthenticated visit opens the
 *    sheet on the «برای ثبت نظر وارد شو» step rather than the rate step.
 */
// Several tests in this file hit the same dev-server routes in close
// succession; parallel browsers trigger duplicate route-compiles that race
// the 5s `toBeVisible` timeout. Serial mode keeps the contract clean.
test.describe.configure({ mode: "serial" });

test.describe("ReviewSheet consolidation — issue #91", () => {
  test("legacy /write-review redirects, sheet auto-opens on homepage", async ({ page }) => {
    const response = await page.goto("/write-review");
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/$|\/\?$/);
    await expect(page.getByRole("dialog", { name: "ثبت نظر" })).toBeVisible();
  });

  test("legacy /company/<slug>/write-review redirects, sheet auto-opens on the profile", async ({ page }) => {
    const response = await page.goto("/company/digikala/write-review");
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/company\/digikala(\?.*)?$/);
    await expect(page.getByRole("dialog", { name: "ثبت نظر" })).toBeVisible();
  });

  test("legacy /shop/<handle>/write-review redirects, sheet auto-opens on the profile", async ({ page }) => {
    const response = await page.goto("/shop/manto_sara/write-review");
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/shop\/manto_sara(\?.*)?$/);
    await expect(page.getByRole("dialog", { name: "ثبت نظر" })).toBeVisible();
  });

  test("homepage ?review=1 auto-opens the wizard and scrubs the param", async ({ page }) => {
    await page.goto("/?review=1");
    await expect(page.getByRole("dialog", { name: "ثبت نظر" })).toBeVisible();
    await expect(page).not.toHaveURL(/review=1/);
  });

  test("mobile tab-bar FAB opens the wizard", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "نوشتن نظر" }).first().click();
    await expect(page.getByRole("dialog", { name: "ثبت نظر" })).toBeVisible();
  });

  test("company-page CTA opens the wizard with the company pre-selected", async ({ page }) => {
    await page.goto("/company/digikala");
    // The «نوشتن نظر» CTA in CompanyProfile is a <button>, not a link —
    // server-rendered <Link>s would have been the legacy-route trap this PR removes.
    await page.getByRole("button", { name: "نوشتن نظر" }).first().click();
    await expect(page.getByRole("dialog", { name: "ثبت نظر" })).toBeVisible();
  });

  test("shop-page CTA opens the wizard with the shop pre-selected", async ({ page }) => {
    await page.goto("/shop/manto_sara");
    await page.getByRole("button", { name: "نوشتن نظر" }).first().click();
    await expect(page.getByRole("dialog", { name: "ثبت نظر" })).toBeVisible();
  });

  test("legacy form page headers no longer render", async ({ page }) => {
    // The old WriteReviewForm.tsx files are deleted — neither destination
    // should ever render their page-level headers again.
    await page.goto("/company/digikala/write-review");
    await expect(
      page.getByRole("heading", { name: "نوشتن نظر", exact: true }),
    ).toHaveCount(0);
    await page.goto("/shop/manto_sara/write-review");
    await expect(
      page.getByRole("heading", { name: "نوشتن نظر برای فروشگاه", exact: true }),
    ).toHaveCount(0);
  });
});
