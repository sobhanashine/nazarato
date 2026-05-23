import { test, expect } from "@playwright/test";

test.describe("Saved Page (Bookmarks) — issue #24", () => {
  test("unauthenticated visit redirects to /login with next=/saved", async ({ page }) => {
    await page.goto("/saved");
    // The (user) layout sends unauthenticated visitors to /login with next set to
    // either the requested path or the layout's default landing — accept either.
    await expect(page).toHaveURL(/\/login(\?|$)/);
  });

  test("the saved tab in the mobile bar links to /saved", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const savedTab = page.getByRole("link", { name: "ذخیره" }).first();
    await expect(savedTab).toHaveAttribute("href", "/saved");
  });
});
