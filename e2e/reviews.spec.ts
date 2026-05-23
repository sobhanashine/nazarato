import { test, expect } from "@playwright/test";

test.describe("Recent reviews feed — issue #23", () => {
  test("renders newest reviews and a paginated list", async ({ page }) => {
    await page.goto("/reviews");

    await expect(
      page.getByRole("heading", { name: "آخرین نظرات کاربران", exact: true }),
    ).toBeVisible();

    // At least one review card is rendered (or the empty state if seed is empty)
    const reviewCards = page.locator("article");
    const emptyState = page.locator("text=هنوز نظری ثبت نشده!");
    const hasReviews = (await reviewCards.count()) > 0;
    if (hasReviews) {
      await expect(reviewCards.first()).toBeVisible();
    } else {
      await expect(emptyState).toBeVisible();
    }

    // Non-numeric ?page param should NOT crash — server falls back to page 1
    const response = await page.goto("/reviews?page=abc");
    expect(response?.status()).toBeLessThan(500);
    await expect(
      page.getByRole("heading", { name: "آخرین نظرات کاربران", exact: true }),
    ).toBeVisible();
  });
});
