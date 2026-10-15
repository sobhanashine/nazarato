import { expect, test } from "@playwright/test";

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL });
test.beforeEach(async ({page}) => {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, route => route.abort());
});
const widths = [320, 360, 390, 430];

for (const width of widths) {
  test(`local discovery and owner pages fit a ${width}px mobile viewport`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 844 });
    for (const route of ["/", "/search?area=tohid", "/categories?area=tohid", "/for-business", "/about", "/contact", "/login"]) {
      await page.goto(route);
      await expect(page.locator("main")).toHaveCount(1);
      await expect(page.getByRole("heading", {level:1})).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const fields = page.locator('main input:is([type="text"], [type="tel"], [type="email"], [type="search"], [type="number"], [type="password"]), main textarea, main select');
      for (const field of await fields.all()) {
        if (await field.isVisible()) expect(await field.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
      }
      if (width === 390 && route === "/") {
        await page.screenshot({ path: testInfo.outputPath("discovery-mobile.png"), fullPage: true });
      }
    }
  });
}

test("choosing a neighborhood survives the homepage search", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: "محدودهٔ جستجو" }).selectOption("tohid");
  await expect(page.locator('form[role="search"] input[name="area"]')).toHaveValue("tohid");
  await page.getByRole("button", { name: "جستجو", exact: true }).click();
  await expect(page).toHaveURL(/area=tohid/);
  await expect(page.getByRole("combobox", { name: "محدودهٔ جستجو" })).toHaveValue("tohid");
});

test("a restaurant link remains a restaurant search when only cafes exist", async ({ page }) => {
  await page.goto("/categories?area=tohid");
  await page.locator('main a[href*="category=%D8%B1%D8%B3%D8%AA%D9%88%D8%B1%D8%A7%D9%86"]').click();
  await expect(page).toHaveURL(/area=tohid/);
  await expect(page.getByText("چیزی پیدا نشد", { exact: true })).toBeVisible();
  await expect(page.locator('main a[href^="/company/"]')).toHaveCount(0);
});

test("the owner path reaches contact and invalid input never posts", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", request => { if (request.method() === "POST") posts.push(request.url()); });
  await page.goto("/for-business");
  await page.locator('main a[href="/contact#contact-form"]').first().click();
  await expect(page.locator("#contact-form")).toBeVisible();
  await page.getByRole("button", { name: "ارسال پیام", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "نام", exact: true })).toBeFocused();
  await expect(page.getByRole("textbox", { name: "نام", exact: true })).toHaveAttribute("aria-invalid", "true");
  expect(posts).toEqual([]);
});

test("profile tab keyboard works and a failed share falls back to copying", async ({ page }) => {
  await page.goto("/company/isolated-cafe-1");
  await page.getByRole("tab", { name: "نمای کلی" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("tab", { name: "نظرات", exact: true })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("نظرات");
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "مشابه", exact: true })).toBeFocused();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: async () => { throw new DOMException("Unavailable", "NotAllowedError"); } });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => {} } });
  });
  await page.getByRole("button", { name: "اشتراک", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("لینک کپی شد");
});
