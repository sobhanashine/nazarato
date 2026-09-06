import { expect, test } from "@playwright/test";

test.describe("Nabz Rasht demo loop", () => {
  test("uses five real pairs and retries a failed vote without losing the round", async ({ page }) => {
    const votes: unknown[] = [];
    let roundOneLoads = 0;
    const ids = Array.from(
      { length: 10 },
      (_, index) => `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    );

    await page.route("**/api/nabz/duel?**", async (route) => {
      const url = new URL(route.request().url());
      const round = Number(url.searchParams.get("round"));
      if (round === 1 && roundOneLoads++ === 0) {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ ok: false }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          status: "ready",
          scenario: "date",
          round,
          availablePairCount: 5,
          pair: {
            prompt: `دوئل واقعی ${round + 1}`,
            options: [
              {
                id: ids[round * 2],
                slug: `real-${round * 2 + 1}`,
                name: `کافه واقعی ${round * 2 + 1}`,
                kind: "کافه",
                neighborhoodSlug: "golsar",
                priceBand: 2,
              },
              {
                id: ids[round * 2 + 1],
                slug: `real-${round * 2 + 2}`,
                name: `رستوران واقعی ${round * 2 + 2}`,
                kind: "رستوران",
                neighborhoodSlug: "sabze-meydan",
                priceBand: 3,
              },
            ],
          },
        }),
      });
    });
    await page.route("**/api/nabz/votes", async (route) => {
      votes.push(route.request().postDataJSON() as unknown);
      if (votes.length === 1) {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ ok: false }),
        });
        return;
      }
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, stored: true, duplicate: false }),
      });
    });

    await page.goto("/");
    await page.getByRole("button", { name: /قرار دونفره/ }).click();
    await expect(page.getByText("پایلوت واقعی", { exact: true })).toBeVisible();
    await page.getByLabel(/اگر دلیل کوتاهی داری بنویس/).fill("فضای آرام‌تر");
    await expect(page.getByRole("heading", { name: "دوئل واقعی 1" })).toBeVisible();
    await page.getByTestId("duel-option").first().click();
    await expect(page.getByText(/رأی ثبت نشد/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "دوئل واقعی 1" })).toBeVisible();
    await page.getByTestId("duel-option").first().click();
    await expect(page.getByText(/رأی قبلی محفوظ است/)).toBeVisible();
    await page.getByRole("button", { name: "تلاش دوباره" }).click();

    for (let round = 1; round < 5; round += 1) {
      await expect(
        page.getByRole("heading", { name: `دوئل واقعی ${round + 1}` }),
      ).toBeVisible();
      await page.getByTestId("duel-option").first().click();
    }

    await expect(
      page.getByRole("heading", { name: "پنج انتخاب واقعی ثبت شد" }),
    ).toBeVisible();
    expect(votes).toHaveLength(6);
    expect(votes[0]).toEqual(
      expect.objectContaining({
        citySlug: "rasht",
        scenarioSlug: "date",
        reasonText: "فضای آرام‌تر",
      }),
    );
    await expect(page.getByText("سلیقه‌ات لو رفت!")).toHaveCount(0);
  });

  test("turns five anonymous duel choices into an explained result", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /با پنج انتخاب بگو/ })).toBeVisible();
    await expect(page.getByText("نسخه نمایشی · نام‌ها ساختگی‌اند")).toBeVisible();
    const dataReadiness = page.getByRole("region", {
      name: "وضعیت داده‌های واقعی نبض رشت",
    });
    await expect(dataReadiness).toBeVisible();
    await expect(dataReadiness).toContainText(/داده کافی نداریم|دوئل واقعی آماده است|قابل بررسی نیست/);
    await expect(dataReadiness).toContainText("آماده توصیه");
    await page.getByRole("button", { name: /قرار دونفره/ }).click();

    const reason = page.getByLabel(/اگر دلیل کوتاهی داری بنویس/);
    await reason.fill("برای حرف زدن آرام‌تره");

    for (let round = 0; round < 5; round += 1) {
      await page.getByTestId("duel-option").first().click();
    }

    await expect(page.getByRole("heading", { name: "سلیقه‌ات لو رفت!" })).toBeVisible();
    await expect(page.getByLabel("موقعیت کجابریم")).toBeVisible();
    await page.getByLabel("بودجه کجابریم").selectOption("متوسط");
    await page.getByLabel("محله کجابریم").selectOption("گلسار");
    await page.getByText("فضای دنج", { exact: true }).last().click();
    await page.getByRole("button", { name: "پیشنهادها را دوباره بچین" }).click();
    await expect(page.getByTestId("nabz-recommendations").locator("li")).toHaveCount(3);
    await expect(
      page.getByTestId("nabz-recommendations").locator('a[href^="#taste-evidence-"]').first(),
    ).toBeVisible();
    await expect(page.getByText(/هیچ کسب‌وکار واقعی رتبه‌بندی نشده/)).toBeVisible();
  });

  test("restores a short-lived anonymous session without storing its free text", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /قرار دونفره/ }).click();
    await page.getByLabel(/اگر دلیل کوتاهی داری بنویس/).fill("یک دلیل خصوصی آزمایشی");
    await page.getByTestId("duel-option").first().click();

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.localStorage.getItem("nazarato:nabz-taste:v1"),
        ),
      )
      .not.toContain("یک دلیل خصوصی آزمایشی");

    const storedBeforeReload = await page.evaluate(() =>
      window.localStorage.getItem("nazarato:nabz-taste:v1"),
    );

    await page.reload();

    await expect(page.getByText("جلسه ناشناس قبلی روی همین دستگاه بازیابی شد.")).toBeVisible();
    await expect(page.getByText(/انتخاب ۲ از ۵/)).toBeVisible();
    expect(
      await page.evaluate(() =>
        window.localStorage.getItem("nazarato:nabz-taste:v1"),
      ),
    ).toBe(storedBeforeReload);
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
