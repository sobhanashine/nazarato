import { test, expect } from "@playwright/test";

test.describe("Public user profile — issue #26", () => {
  test("non-existent username returns 404 status", async ({ page }) => {
    const response = await page.goto("/users/non_existent_username_xyz");
    expect(response?.status()).toBe(404);
  });
});
