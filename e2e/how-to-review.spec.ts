import { expect, test } from "@playwright/test";

/**
 * Landing "how to review" section + animation box.
 * The box mirrors the real review wizard's four steps; clicking a step in the
 * guide drives the box (and works regardless of reduced-motion auto-advance).
 */
test.describe("How-to-review landing section", () => {
  test("renders the section heading and the four-step guide", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("section", {
      has: page.getByRole("heading", { name: "ثبت نظر فقط چند ثانیه طول می‌کشه" }),
    });
    await expect(section).toBeVisible();
    for (const label of [
      "کسب‌وکار را پیدا کن",
      "امتیاز بده",
      "تجربه‌ات را بنویس",
      "ثبت کن",
    ]) {
      await expect(section.getByRole("button", { name: new RegExp(label) })).toBeVisible();
    }
  });

  test("clicking a step updates the animation box", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("section", {
      has: page.getByRole("heading", { name: "ثبت نظر فقط چند ثانیه طول می‌کشه" }),
    });
    // Drive to the "rate" step and assert the box shows that step's wizard copy.
    await section.getByRole("button", { name: /امتیاز بده/ }).click();
    await expect(section.getByText("چه‌قدر راضی بودی؟")).toBeVisible();
    // And the final step shows the success copy.
    await section.getByRole("button", { name: /ثبت کن/ }).click();
    await expect(section.getByText("نظرت ثبت شد!")).toBeVisible();
  });

  test("CTA opens the review sheet", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "همین حالا نظر بده" }).click();
    await expect(page.getByRole("dialog", { name: "ثبت نظر" })).toBeVisible();
  });
});
