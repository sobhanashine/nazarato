import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({
  channel: process.env.PLAYWRIGHT_CHANNEL,
  viewport: { width: 390, height: 844 },
});

async function reachWriting(dialog: Locator) {
  const picker = dialog.getByRole("searchbox");
  if (await picker.count()) {
    await dialog.locator("li button").first().click();
  }
  if (await dialog.getByRole("radio").count()) {
    await dialog.getByRole("radio", { name: "۴ ستاره", exact: true }).click();
    const next = dialog.getByRole("button", { name: "ادامه", exact: true });
    if (await next.count()) await next.click();
  }
  await expect(dialog.getByRole("textbox", { name: "متن تجربه" })).toBeVisible();
}

async function openLocalProfileReview(page: Page) {
  await page.goto("/search?area=golsar&type=biz&category=کافه");
  await page.locator('main a[href^="/company/"]').first().click();
  const opener = page.getByRole("button", { name: /نوشتن نظر|ثبت تجربه|نوشتن تجربه/ }).first();
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "ثبت نظر" });
  await expect(dialog).toBeVisible();
  return { dialog, opener };
}

test("review entry preserves area and keeps keyboard focus inside the modal", async ({ page }) => {
  await page.goto("/?review=1&area=golsar");
  const dialog = page.getByRole("dialog", { name: "ثبت نظر" });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/area=golsar/);
  await expect(page).not.toHaveURL(/review=1/);

  const close = dialog.getByRole("button", { name: "بستن", exact: true }).last();
  await close.focus();
  await page.keyboard.press("Shift+Tab");
  await expect.poll(() => dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  for (let index = 0; index < 14; index += 1) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
});

test("closing and reopening a local review retains the unsent business draft", async ({ page }) => {
  test.skip(process.env.NAZARATO_LOCAL_PREVIEW !== "true", "Requires the explicit loopback-only local catalog; no database review is created.");
  const { dialog, opener } = await openLocalProfileReview(page);
  await reachWriting(dialog);
  const draft = "برای کار با لپ‌تاپ رفتم؛ برخورد خوب بود و فضا آرام بود.";
  await dialog.getByRole("textbox", { name: "متن تجربه" }).fill(draft);
  await dialog.getByRole("button", { name: "بستن", exact: true }).last().click();
  const retain = dialog.getByRole("button", { name: "بستن و نگه‌داشتن پیش‌نویس", exact: true });
  if (await retain.count()) await retain.click();
  await expect(dialog).toBeHidden();

  await opener.click();
  await expect(dialog).toBeVisible();
  await reachWriting(dialog);
  await expect(dialog.getByRole("textbox", { name: "متن تجربه" })).toHaveValue(draft);
});

test("rating waits for an explicit next step and the local receipt stays readable", async ({ page }) => {
  test.skip(process.env.NAZARATO_LOCAL_PREVIEW !== "true", "Local browser save only; never a database review.");
  const posts: string[] = [];
  page.on("request", request => { if (request.method() === "POST") posts.push(new URL(request.url()).pathname); });
  const { dialog, opener } = await openLocalProfileReview(page);
  const close = dialog.getByRole("button", { name: "بستن", exact: true });
  const bounds = await close.boundingBox();
  expect(bounds?.width).toBeGreaterThanOrEqual(44);
  expect(bounds?.height).toBeGreaterThanOrEqual(44);

  const firstRating = dialog.getByRole("radio", { name: "۱ ستاره", exact: true });
  await firstRating.focus();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByRole("radio", { name: "۲ ستاره", exact: true })).toHaveAttribute("aria-checked", "true");
  await page.waitForTimeout(1100); // Beyond the old 850ms auto-advance.
  await expect(dialog.getByRole("textbox", { name: "متن تجربه" })).toHaveCount(0);
  await dialog.getByRole("button", { name: "ادامه", exact: true }).click();
  await dialog.getByRole("textbox", { name: "متن تجربه" }).fill("برای گفت‌وگو رفتم؛ فضای آرام و برخورد خوبی داشت.");
  await dialog.getByRole("button", { name: "ثبت نظر", exact: true }).click();
  const receipt = dialog.getByRole("heading", { name: "در این مرورگر ذخیره شد", exact: true });
  await expect(receipt).toBeVisible();
  await expect(receipt).toBeFocused();
  await expect(dialog.getByRole("status")).toContainText("نظر عمومی نیست");
  await page.waitForTimeout(3600); // The previous receipt closed itself at 3400ms.
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "بازگشت به صفحه", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  expect(posts).toEqual([]);
});

test("local storage failure announces the error and retains the typed experience", async ({ page }) => {
  test.skip(process.env.NAZARATO_LOCAL_PREVIEW !== "true", "Requires the existing local experience adapter; no service write.");
  const { dialog } = await openLocalProfileReview(page);
  await reachWriting(dialog);
  const text = "فضای مناسبی برای کار داشت و سفارش به‌موقع آماده شد.";
  await dialog.getByRole("textbox", { name: "متن تجربه" }).fill(text);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new DOMException("Test storage quota", "QuotaExceededError"); };
  });
  await dialog.getByRole("button", { name: "ثبت نظر", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("متن تو هنوز اینجاست");
  await expect(dialog.getByRole("textbox", { name: "متن تجربه" })).toHaveValue(text);
  await expect(dialog.getByRole("button", { name: "ثبت نظر", exact: true })).toBeEnabled();
});

test("rating targets fit a 320px viewport without clipping", async ({ page }) => {
  test.skip(process.env.NAZARATO_LOCAL_PREVIEW !== "true", "Existing local catalog only; no review is submitted.");
  await page.setViewportSize({ width: 320, height: 844 });
  const { dialog } = await openLocalProfileReview(page);
  const ratings = dialog.getByRole("radiogroup", { name: "امتیاز", exact: true });
  expect(await ratings.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  const groupBounds = await ratings.boundingBox();
  for (const radio of await ratings.getByRole("radio").all()) {
    const bounds = await radio.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    expect(bounds?.x).toBeGreaterThanOrEqual(groupBounds?.x ?? 0);
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual((groupBounds?.x ?? 0) + (groupBounds?.width ?? 0));
  }
});
