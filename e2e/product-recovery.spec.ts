import { createHmac } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
const port = Number(process.env.NAZARATO_RECOVERY_PORT || 4321);
const id = (n:number) => `10000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
test.beforeEach(async({request,page})=>{await request.get(`http://127.0.0.1:${port+1}/__control`, {timeout:5_000});await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,route=>route.abort());});
async function completeChoices(page: Page) {
  await page.goto("/nabz");await page.getByRole("button",{name:"قرار دونفره",exact:true}).click();
  for(let n=0;n<5;n++){await expect(page.getByText(`انتخاب ${(n+1).toLocaleString("fa-IR")} از ۵`,{exact:false})).toBeVisible();await page.getByTestId("real-duel-option").first().click();}
  await expect(page.getByRole("heading",{name:"پنج انتخاب کامل شد؛ سلیقهٔ اولیهٔ تو"})).toBeVisible();
}
function sessionCookie(userId:string){const body=Buffer.from(JSON.stringify({id:userId,phone:"+989000000001",name:"آزمایش"})).toString("base64url");return `${body}.${createHmac("sha256","isolated-nazarato-recovery-secret-32-chars").update(body).digest("base64url")}`;}
test("five server-persisted choices produce cited recommendations and private restore",async({page,context}, testInfo)=>{
  await page.setViewportSize({width:390,height:844});await completeChoices(page);
  await expect(page.getByRole("link",{name:"بررسی تجربه"}).first()).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath("real-result-mobile.png"),fullPage:true});
  await context.addCookies([{name:"nzr_session",value:sessionCookie(id(900)),url:`http://127.0.0.1:${port}`}]);
  await page.getByRole("button",{name:"ذخیرهٔ سلیقه در حساب"}).click();await expect(page.getByRole("button",{name:"در حساب خصوصی ذخیره شد"})).toBeVisible();
  await page.reload();await expect(page.getByRole("heading",{name:"سلیقهٔ خصوصی ذخیره‌شده"})).toBeVisible();
  await context.addCookies([{name:"nzr_session",value:sessionCookie(id(901)),url:`http://127.0.0.1:${port}`}]);await page.reload();await expect(page.getByRole("heading",{name:"سلیقهٔ خصوصی ذخیره‌شده"})).toHaveCount(0);
});
test("weak evidence, sparse supply and revoked sources never produce a fixture payoff",async({page,request})=>{
  await request.get(`http://127.0.0.1:${port+1}/__control?mode=weak`);await completeChoices(page);await expect(page.getByText(/داده کافی نداریم؛ پنج انتخابت/)).toBeVisible();await expect(page.getByRole("link",{name:"بررسی تجربه"})).toHaveCount(0);
  for(const mode of ["sparse","revoked","unavailable"]){await request.get(`http://127.0.0.1:${port+1}/__control?mode=${mode}`);await page.goto("/nabz");await page.getByRole("button",{name:"قرار دونفره",exact:true}).click();await expect(page.locator("main").getByRole("alert")).toBeVisible({timeout:15_000});await expect(page.getByTestId("real-duel-option")).toHaveCount(0);}
});
test("failed vote preserves the text and round; retry completes the result",async({page})=>{
  await page.goto("/nabz");await page.getByRole("button",{name:"قرار دونفره",exact:true}).click();await page.getByLabel("دلیل کوتاه (اختیاری)").fill("دلیل آزمایشی جدا");
  await page.route("**/api/nabz/votes",route=>route.fulfill({status:503,body:'{"ok":false}'}),{times:1});await page.getByTestId("real-duel-option").first().click();await expect(page.locator("main").getByRole("alert")).toContainText("ثبت نشد");await expect(page.getByLabel("دلیل کوتاه (اختیاری)")).toHaveValue("دلیل آزمایشی جدا");await expect(page.getByText("انتخاب ۱ از ۵",{exact:false})).toBeVisible();await page.getByTestId("real-duel-option").first().click();await expect(page.getByText("انتخاب ۲ از ۵",{exact:false})).toBeVisible();
});
test("owner observation is authorized and visible with a fixed denominator",async({page,context}, testInfo)=>{
  await context.addCookies([{name:"nzr_session",value:sessionCookie(id(900)),url:`http://127.0.0.1:${port}`}]);await page.goto("/business/insights");await page.getByRole("button",{name:"سنجش و ثبت مشاهده"}).click();await expect(page.getByRole("article",{name:"مشاهدهٔ بعد از اقدام"})).toContainText("بعد: ۰٪");await expect(page.getByRole("article",{name:"مشاهدهٔ بعد از اقدام"})).toContainText("اثر قطعی اقدام را ثابت نمی‌کند");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({path:testInfo.outputPath("owner-observation-desktop.png"),fullPage:true});
  await page.getByRole("link", {name:"منبع ↗", exact:true}).first().click();
  await expect(page.getByRole("tab", {name:"تجربه‌ها",exact:true})).toHaveAttribute("aria-selected","true");
});
test("public profile carries attribution and citation links open reviews",async({page})=>{
  await page.goto(`/company/isolated-cafe-1?review=${id(101)}`);await expect(page.getByRole("complementary",{name:"منبع اطلاعات کسب‌وکار"})).toContainText("منبع مصنوعی آزمون");await expect(page.getByRole("tab",{name:"تجربه‌ها",exact:true})).toHaveAttribute("aria-selected","true");
});

test("hidden public profiles do not reveal their identity in metadata", async ({page,request}) => {
  await request.get(`http://127.0.0.1:${port+1}/__control?mode=private-user`);
  await page.goto("/users/isolated-901");
  expect(await page.title()).not.toContain("PRIVATE_PROFILE_IDENTITY");
  expect(await page.content()).not.toContain("PRIVATE_PROFILE_IDENTITY");
});

test("experience intake reaches moderation, versioned correction and a new owner action", async ({page, context}) => {
  await context.addCookies([{name:"nzr_session",value:sessionCookie(id(901)),url:`http://127.0.0.1:${port}`}]);
  await page.goto("/company/isolated-cafe-1");
  await page.getByRole("button", {name:"نوشتن تجربه",exact:true}).click();
  const dialog = page.getByRole("dialog", {name:"ثبت نظر"});
  await dialog.getByRole("radio", {name:"۲ ستاره",exact:true}).click();
  await dialog.getByRole("button", {name:"ادامه",exact:true}).click();
  const experience = "سرویس بد بود و برخورد کارکنان افتضاح بود. فضای آرام و خوب بود.";
  await dialog.getByRole("textbox", {name:"متن تجربه"}).fill(experience);
  await dialog.getByRole("button", {name:"ثبت نظر",exact:true}).click();
  await expect(dialog.getByRole("heading", {name:"تجربه‌ات ثبت شد",exact:true})).toBeVisible();

  await context.addCookies([{name:"nzr_session",value:sessionCookie(id(902)),url:`http://127.0.0.1:${port}`}]);
  await page.goto("/admin/moderation");
  await expect(page.getByText(experience, {exact:true})).toBeVisible();
  await page.getByRole("button", {name:"تأیید نظر",exact:true}).click();
  await expect(page.getByRole("heading", {name:"همه کارها انجام شده!"})).toBeVisible();

  await context.addCookies([{name:"nzr_session",value:sessionCookie(id(900)),url:`http://127.0.0.1:${port}`}]);
  await page.goto("/business/insights");
  await page.getByRole("combobox", {name:"نظر مرجع"}).selectOption(id(706));
  await page.getByRole("combobox", {name:"حس درست"}).selectOption("negative");
  await page.getByRole("button", {name:"ثبت اصلاح با حفظ تاریخچه",exact:true}).click();
  await expect(page.getByText("اصلاح شما بدون حذف خروجی قبلی ثبت شد.",{exact:true})).toBeVisible();
  // The due historical action supplies fixed before/after windows. The newly
  // created action below keeps its future due date; we never bypass that gate.
  await page.getByRole("button", {name:"سنجش و ثبت مشاهده",exact:true}).click();
  await expect(page.getByRole("article", {name:"مشاهدهٔ بعد از اقدام"})).toContainText("بعد: ۰٪");
  await page.getByRole("textbox", {name:"عنوان اقدام"}).fill("بهبود سرویس پس از بررسی تجربه");
  const future = new Date();future.setDate(future.getDate()+30);
  await page.locator('input[name="followUpDate"]').fill(future.toISOString().slice(0,10));
  await page.getByRole("button", {name:"ثبت اقدام و خط پایه",exact:true}).click();
  await expect(page.getByRole("heading", {name:"بهبود سرویس پس از بررسی تجربه",exact:true})).toBeVisible();
  await expect(page.getByRole("article").filter({hasText:"بهبود سرویس پس از بررسی تجربه"})).toContainText("۴ از ۷ نظر");
});
