import { chromium } from "@playwright/test";

const BASE = "https://nazarato.vercel.app";
const OTP = "123456";

function randomPhone() {
  let d = "9";
  for (let i = 0; i < 9; i++) d += Math.floor(Math.random() * 10);
  return "+98" + d;
}

async function fillPhone(page, phone) {
  await page.fill('input[name="phone"]', phone.replace(/^\+98/, ""));
  await page.check('input[name="terms"]');
  await page.getByRole("button", { name: "ارسال کد" }).click();
}

async function fillOtp(page) {
  await page.waitForURL(/\/login\/verify/, { timeout: 15_000 });
  const inputs = page.locator("form input[inputmode='numeric']");
  await inputs.first().waitFor({ timeout: 10_000 });
  for (let i = 0; i < 6; i++) await inputs.nth(i).fill(OTP[i]);
  await Promise.race([
    page.locator('input[name="name"]').waitFor({ timeout: 20_000 }),
    page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 }),
  ]).catch(() => {});
}

async function maybeName(page) {
  const n = page.locator('input[name="name"]');
  if (await n.count()) {
    await n.fill("کاربر تست " + Math.floor(Math.random() * 1000));
    await page.getByRole("button", { name: /ورود|ادامه|تایید/ }).first().click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 }).catch(() => {});
  }
}

async function login(ctx, phone) {
  const p = await ctx.newPage();
  await p.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await fillPhone(p, phone);
  await fillOtp(p);
  await maybeName(p);
  return p;
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ locale: "fa-IR" });

// capture browser console + network failures
ctx.on("console", (msg) => {
  if (msg.type() === "error") console.log("[console.error]", msg.text());
});
ctx.on("requestfailed", (req) =>
  console.log("[requestfailed]", req.method(), req.url(), req.failure()?.errorText)
);

const phone = randomPhone();
console.log("[user] phone:", phone);
const page = await login(ctx, phone);
console.log("[user] logged in, URL:", page.url());

await page.goto(`${BASE}/company/digikala/write-review`, { waitUntil: "domcontentloaded" });

const ratingFour = page.locator('input[name="rating"][value="4"]');
if (await ratingFour.count()) await ratingFour.first().click({ force: true });
else await page.locator('button[aria-label*="ستاره"]').nth(3).click();

await page.fill('input[name="title"]', "تست تشخیص باگ اعلان");
await page.fill(
  'textarea[name="body"]',
  "این نظر صرفاً برای بازتولید مشکل عدم ساخت نوتیفیکیشن نوشته شده است؛ لطفاً نادیده بگیرید."
);

// capture server response by listening to the POST
page.on("response", (resp) => {
  const u = resp.url();
  if (u.includes("/company/") && resp.request().method() === "POST") {
    console.log("[POST]", resp.status(), u);
  }
});

const beforeUrl = page.url();
await page.getByRole("button", { name: /ثبت|ارسال/ }).first().click();
await page.waitForLoadState("networkidle", { timeout: 20_000 });
console.log("[user] after submit:", page.url(), "(was", beforeUrl, ")");
// look for any error toast or inline error
const bodyText = await page.content();
const errMatch = bodyText.match(/خطا[^"<\n]{0,80}|error[^"<\n]{0,80}/i);
console.log("[user] page error hint:", errMatch ? errMatch[0] : "none");

await browser.close();
