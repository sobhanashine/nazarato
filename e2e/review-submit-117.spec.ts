import { test, expect, type Page } from "@playwright/test";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

/**
 * Issue #117 regression — a 10–29 char review body must SUBMIT successfully
 * (the DB used to require ≥30 chars while the form floor was 10, so any
 * body in that gap exploded with «خطا در ثبت نظر» from the insert path).
 * The same spec also guards against the «در حال ثبت…» stuck-pending bug:
 * the success step must appear within a few seconds of clicking submit, not
 * 6+ after the host-route RSC payload finishes.
 *
 * Cookie-mint pattern mirrors `voice-dictation.spec.ts` / `helpful-vote.spec.ts`
 * so we skip OTP. We wipe the test user's prior review on `digikala` in
 * `beforeEach` via the Supabase REST API; otherwise the uniqueness constraint
 * fires on the second run and masks the body-length regression behind a
 * «شما قبلاً … نظر ثبت کرده‌اید» error.
 */

function loadEnvVar(name: string): string | null {
  const inherited = process.env[name];
  if (inherited && inherited.length > 0) return inherited;
  try {
    const text = readFileSync(".env.local", "utf8");
    const match = text.match(new RegExp(`^${name}=(.+)$`, "m"));
    if (match) return match[1].trim();
  } catch {
    /* .env.local optional */
  }
  return null;
}

function loadJwtSecret(): string {
  const fromEnv = loadEnvVar("JWT_SECRET");
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  return "dev-insecure-fallback-secret-do-not-ship";
}

function signSession(payload: { id: string; phone: string; name: string }): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", loadJwtSecret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

const TEST_USER = {
  id: "a2cbde59-f330-4f5b-8a84-cd55963ea908",
  phone: "+989113456545",
  name: "محراب قربانی",
};

async function login(page: Page) {
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
}

/**
 * Delete the test user's review on `digikala` (if any) so each test starts
 * from a clean (business, author) pair. Goes through the service-role REST
 * endpoint to bypass RLS — the spec runner doesn't carry a user JWT.
 */
async function wipeReview(): Promise<void> {
  const supabaseUrl = loadEnvVar("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = loadEnvVar("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "review-submit-117 spec needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }

  const bizRes = await fetch(
    `${supabaseUrl}/rest/v1/businesses?slug=eq.digikala&select=id`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  );
  const bizRows = (await bizRes.json()) as Array<{ id: string }>;
  if (!Array.isArray(bizRows) || bizRows.length === 0) return;
  const businessId = bizRows[0].id;

  await fetch(
    `${supabaseUrl}/rest/v1/reviews?business_id=eq.${businessId}&author_id=eq.${TEST_USER.id}`,
    {
      method: "DELETE",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  );
}

test.describe.configure({ mode: "serial" });

test.describe("ReviewSheet submit — issue #117", () => {
  test.beforeEach(async ({}, testInfo) => {
    // Under `next dev` with Turbopack's lazy compile, opening
    // `/company/[slug]` cold against a parallel suite can blow past the 30s
    // default before the page even renders. The submit itself is fast — this
    // headroom is purely for the route compile.
    testInfo.setTimeout(90_000);
    await wipeReview();
  });

  test("12-char body submits and the success step appears", async ({ page }) => {
    await login(page);
    await page.goto("/company/digikala?review=1");

    const dialog = page.getByRole("dialog", { name: "ثبت نظر" });
    await expect(dialog).toBeVisible();

    // Rate 5 stars → auto-advances to the write step.
    await dialog.getByRole("radio", { name: /۵ ستاره/ }).click();

    const textarea = dialog.getByPlaceholder(/مثلاً/);
    await expect(textarea).toBeVisible({ timeout: 5_000 });

    // 12 chars — squarely in the band that used to die with «خطا در ثبت نظر».
    await textarea.fill("نظر تست ۱۲۳");

    // Submit and assert the success heading lands quickly. Pre-fix, on a
    // data-heavy host page the button could sit at «در حال ثبت…» for 6+s;
    // the toBeVisible timeout below is intentionally tight to catch that.
    await dialog.getByRole("button", { name: "ثبت نظر" }).click();

    await expect(
      dialog.getByRole("heading", { name: "نظرت ثبت شد!" }),
    ).toBeVisible({ timeout: 8_000 });
  });
});
