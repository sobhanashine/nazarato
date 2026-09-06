import { test, expect } from "@playwright/test";

test.describe("Recent reviews feed — issue #23", () => {
  test("renders approved reviews or an honest empty state", async ({ page }) => {
    await page.goto("/reviews");

    await expect(
      page.getByRole("heading", { name: "آخرین نظرات کاربران", exact: true }),
    ).toBeVisible();

    // Approved review cards render when present; an empty approved dataset must
    // never be replaced by legacy fixture reviews.
    const reviewCards = page.locator("article");
    const emptyState = page.getByRole("heading", {
      name: "هنوز نظر عمومیِ تأییدشده‌ای نداریم",
    });
    const hasReviews = (await reviewCards.count()) > 0;
    if (hasReviews) {
      await expect(reviewCards.first()).toBeVisible();
    } else {
      await expect(emptyState).toBeVisible();
      await expect(page.getByText("خرید از دیجی‌کالا همیشه تجربه خوبی بوده")).toHaveCount(0);
    }

    // Non-numeric ?page param should NOT crash — server falls back to page 1
    const response = await page.goto("/reviews?page=abc");
    expect(response?.status()).toBeLessThan(500);
    await expect(
      page.getByRole("heading", { name: "آخرین نظرات کاربران", exact: true }),
    ).toBeVisible();
  });

  test("homepage review rail also fails closed", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const heading = page.getByRole("heading", {
      name: /نظرات اخیر کسب‌وکارهای تأییدشده رشت/,
    });
    await expect(heading).toBeVisible();

    const reviewSection = page.locator("section").filter({ has: heading });
    const reviewCards = reviewSection.locator("article");
    if ((await reviewCards.count()) === 0) {
      await expect(
        reviewSection.getByRole("heading", {
          name: "هنوز نظر عمومیِ تأییدشده‌ای نداریم",
        }),
      ).toBeVisible();
      await expect(reviewSection.getByRole("link", { name: "تمامی نظرات" })).toHaveCount(0);
    }

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
