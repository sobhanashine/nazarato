import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";
const port = Number(process.env.NAZARATO_RECOVERY_PORT || 4321);
test.beforeEach(async ({page, request}) => {
  await request.get(`http://127.0.0.1:${port+1}/__control`);
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, route => route.abort());
});
for (const width of [390, 1280]) {
  test(`main visual identity and the new Nabz entry at ${width}px`, async ({page}, info) => {
    await page.setViewportSize({width,height:900});
    await page.goto("/");
    await expect(page.getByRole("heading",{level:1})).toContainText(/اعتماد کن.*تجربه کن/);
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(11, 15, 20)");
    expect(await page.locator('form[role="search"] input[type="search"]').evaluate(el => parseFloat(getComputedStyle(el).borderRadius))).toBeGreaterThan(100);
    const primary = page.getByRole("link", {name:"شروع نبض رشت",exact:false});
    await expect(primary).toHaveCSS("color", "rgb(6, 35, 27)");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:info.outputPath(`main-design-${width}.png`),fullPage:true});
    await page.getByRole("link",{name:"کار با لپ‌تاپ برای وقتِ کار"}).click();
    await expect(page).toHaveURL(/scenario=laptop/);
    await expect(page.getByRole("button",{name:"کار با لپ‌تاپ",exact:true})).toHaveAttribute("aria-pressed","true");
    const duel = page.waitForRequest(request => request.url().includes("/api/nabz/duel") && request.url().includes("scenario=laptop"));
    await page.getByRole("button",{name:"کار با لپ‌تاپ",exact:true}).click();
    await duel;
    await expect(page.getByTestId("real-duel-option")).toHaveCount(2);
  });
}
test("a touch suggestion opens its profile from the restored homepage", async ({browser}) => {
  const context = await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:844}});
  const page = await context.newPage();
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, route => route.abort());
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.getByRole("searchbox",{name:"جستجو",exact:true}).fill("مکان آزمایشی");
  const suggestion = page.locator('form[role="search"] a[href="/company/isolated-cafe-1"]');
  await expect(suggestion).toBeVisible();
  await suggestion.tap();
  await expect(page).toHaveURL(/company\/isolated-cafe-1/);
  await context.close();
});
test("the main-themed review dialog retains a draft and traps keyboard focus", async ({page,context}) => {
  const body = Buffer.from(JSON.stringify({id:"10000000-0000-4000-8000-000000000901",phone:"+989000000001",name:"آزمایش"})).toString("base64url");
  const value = `${body}.${createHmac("sha256","isolated-nazarato-recovery-secret-32-chars").update(body).digest("base64url")}`;
  await context.addCookies([{name:"nzr_session",value,url:`http://127.0.0.1:${port}`}]);
  await page.goto("/company/isolated-cafe-1");
  const open = page.getByRole("button",{name:"نوشتن نظر",exact:true});
  await open.click();
  const dialog = page.getByRole("dialog",{name:"ثبت نظر"});
  await dialog.getByRole("radio",{name:"۴ ستاره",exact:true}).click();
  await expect(dialog.getByRole("textbox",{name:"متن تجربه"})).toHaveCount(0);
  await dialog.getByRole("button",{name:"ادامه",exact:true}).click();
  const draft = "برای کار رفتم؛ فضا آرام بود و برخورد خوبی داشتند.";
  await dialog.getByRole("textbox",{name:"متن تجربه"}).fill(draft);
  for (let n=0;n<12;n++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  }
  await dialog.getByRole("button",{name:"بستن",exact:true}).last().click();
  await dialog.getByRole("button",{name:"بستن و نگه‌داشتن پیش‌نویس",exact:true}).click();
  await expect(dialog).toBeHidden();
  await open.click();
  await expect(dialog.getByRole("textbox",{name:"متن تجربه"})).toHaveValue(draft);
});
