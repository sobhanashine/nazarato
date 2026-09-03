import { expect, test } from "@playwright/test";

test.describe("Nabz Rasht demo loop", () => {
  test("turns five anonymous duel choices into an explained result", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /با پنج انتخاب بگو/ })).toBeVisible();
    await expect(page.getByText("نسخه نمایشی · نام‌ها ساختگی‌اند")).toBeVisible();
    await page.getByRole("button", { name: /قرار دونفره/ }).click();

    const reason = page.getByLabel(/اگر دلیل کوتاهی داری بنویس/);
    await reason.fill("برای حرف زدن آرام‌تره");

    for (let round = 0; round < 5; round += 1) {
      await page.getByTestId("duel-option").first().click();
    }

    await expect(page.getByRole("heading", { name: "سلیقه‌ات لو رفت!" })).toBeVisible();
    await expect(page.getByTestId("nabz-recommendations").locator("li")).toHaveCount(3);
    await expect(page.getByText(/هیچ کسب‌وکار واقعی رتبه‌بندی نشده/)).toBeVisible();
  });

  test("stays within a narrow mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: /کار با لپ‌تاپ/ }).click();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);
    await expect(page.getByTestId("duel-option")).toHaveCount(2);
  });

  test("keeps fictional demo IDs out of the persistence endpoint", async ({ page }) => {
    await page.goto("/");

    const response = await page.evaluate(async () => {
      const result = await fetch("/api/nabz/votes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          citySlug: "rasht",
          scenarioSlug: "date",
          winnerBusinessId: "baran",
          loserBusinessId: "roshan",
        }),
      });
      return { status: result.status, body: await result.json() as unknown };
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({ ok: false, error: "اطلاعات رأی معتبر نیست." }),
    );
  });
});
