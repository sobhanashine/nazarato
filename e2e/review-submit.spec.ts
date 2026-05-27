import { test, expect } from "@playwright/test";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

/**
 * Regression for the "submit-stuck on data-heavy host page" bug — the
 * ReviewSheet used `useActionState`, whose pending state stays true until the
 * host route's RSC payload re-renders. On a company / shop profile that
 * re-render is 3–6s on dev, so users saw «در حال ثبت…» forever and assumed
 * the form had crashed. The fix calls the server action manually and flips
 * to the success step the instant it returns.
 */
function loadJwtSecret(): string {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16) {
    return process.env.JWT_SECRET;
  }
  try {
    const text = readFileSync(".env.local", "utf8");
    const match = text.match(/^JWT_SECRET=(.+)$/m);
    if (match && match[1].length >= 16) return match[1].trim();
  } catch {
    // optional
  }
  return "dev-insecure-fallback-secret-do-not-ship";
}

function signSession(p: { id: string; phone: string; name: string }) {
  const body = Buffer.from(JSON.stringify(p)).toString("base64url");
  const mac = createHmac("sha256", loadJwtSecret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

const TEST_USER = {
  id: "a2cbde59-f330-4f5b-8a84-cd55963ea908",
  phone: "+989113456545",
  name: "محراب قربانی",
};

test.describe.configure({ mode: "serial" });

test.describe("Review submit — text path lands on success", () => {
  test("submitting on a company profile transitions to the success step", async ({
    page,
  }) => {
    await page.goto("/");
    await page.context().addCookies([
      {
        name: "nzr_session",
        value: signSession(TEST_USER),
        url: page.url(),
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await page.goto("/company/digikala?review=1");

    const dialog = page.getByRole("dialog", { name: "ثبت نظر" });
    await expect(dialog).toBeVisible();

    // Auto-skipped to "rate" step because of prefill — click 5 stars.
    await page.getByRole("radio", { name: "۵ ستاره" }).click();

    // Auto-advances to write step after ~850ms.
    const textarea = page.locator('textarea[name="body"]');
    await expect(textarea).toBeVisible();
    await textarea.fill("این یک نظر تستی برای رگرسیون فلوی ثبت نظر است.");

    await page.getByRole("button", { name: /^ثبت نظر$/ }).click();

    // The success step should appear well within 15s. Old useActionState
    // path could leave the button stuck «در حال ثبت…» 5s+ on dev.
    await expect(
      page.getByRole("heading", { name: "نظرت ثبت شد!" }),
    ).toBeVisible();
  });

  test("submitting on a shop profile also lands on success", async ({ page }) => {
    await page.goto("/");
    await page.context().addCookies([
      {
        name: "nzr_session",
        value: signSession(TEST_USER),
        url: page.url(),
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await page.goto("/shop/manto_sara?review=1");

    const dialog = page.getByRole("dialog", { name: "ثبت نظر" });
    await expect(dialog).toBeVisible();

    await page.getByRole("radio", { name: "۴ ستاره" }).click();
    const textarea = page.locator('textarea[name="body"]');
    await expect(textarea).toBeVisible();
    await textarea.fill("نظر تست برای فروشگاه اینستاگرامی روی شاخه شاپ.");

    await page.getByRole("button", { name: /^ثبت نظر$/ }).click();
    await expect(
      page.getByRole("heading", { name: "نظرت ثبت شد!" }),
    ).toBeVisible();
  });
});
