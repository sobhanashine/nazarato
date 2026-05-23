import { test, expect } from "@playwright/test";

test.describe("Global Reviews Feed — issue #23", () => {
  test("renders reviews feed page, sorts and filters reviews robustly", async ({ page }) => {
    // 1. Visit page
    await page.goto("/reviews");
    await expect(page.getByRole("heading", { name: "نظرات کاربران", exact: true })).toBeVisible();

    // 2. Verify reviews grid contains cards
    const reviewCards = page.locator("article");
    await expect(reviewCards.first()).toBeVisible();

    // 3. Test sorting on page load
    const sortSelect = page.locator("select");
    await expect(sortSelect).toBeVisible();
    await sortSelect.selectOption("helpful");
    await expect(page).toHaveURL(/sort=helpful/);

    // Reset sort
    await sortSelect.selectOption("newest");
    await expect(page).toHaveURL(/reviews/);

    // 4. Test category filtering: "کالای دیجیتال" (digital)
    const digitalFilter = page.getByRole("link", { name: "کالای دیجیتال", exact: true });
    await expect(digitalFilter).toBeVisible();
    await digitalFilter.click();
    await expect(page).toHaveURL(/category=digital/);
    await expect(reviewCards.first()).toBeVisible();

    // Reset category
    const allCategoriesFilter = page.getByRole("link", { name: "همه دسته‌ها", exact: true });
    await expect(allCategoriesFilter).toBeVisible();
    await allCategoriesFilter.click();
    await expect(page).not.toHaveURL(/category=/);

    // 5. Test rating filtering: "۵ ★" (5 stars)
    const fiveStarFilter = page.getByRole("link", { name: "۵ ★", exact: true });
    await expect(fiveStarFilter).toBeVisible();
    await fiveStarFilter.click();
    await expect(page).toHaveURL(/rating=5/);
    await expect(reviewCards.first()).toBeVisible();

    // Reset rating
    const allRatingsFilter = page.getByRole("link", { name: "همه امتیازها", exact: true });
    await expect(allRatingsFilter).toBeVisible();
    await allRatingsFilter.click();
    await expect(page).not.toHaveURL(/rating=/);

    // 6. Test IG-only filtering (will be empty since seed has no IG reviews, verifies empty state)
    const igToggle = page.getByRole("link", { name: "فقط فروشگاه‌های اینستاگرامی", exact: true });
    await expect(igToggle).toBeVisible();
    await igToggle.click();
    await expect(page).toHaveURL(/ig=1/);

    // Empty state should be visible
    await expect(page.locator("text=هیچ نظری یافت نشد!")).toBeVisible();
  });
});
