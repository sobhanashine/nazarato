import { test, expect, type Page, type Locator } from "@playwright/test";
import { createHmac } from "node:crypto";

/**
 * Sign a session payload the same way `lib/auth/session.ts` does, so we can
 * mint a logged-in cookie without driving the full OTP flow. Falls back to the
 * dev secret when JWT_SECRET isn't passed in.
 */
function signSession(payload: { id: string; phone: string; name: string }): string {
  const secret =
    process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16
      ? process.env.JWT_SECRET
      : "dev-insecure-fallback-secret-do-not-ship";
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

// A seeded user with no votes at the start. Owns no reviews on the surfaces we
// exercise, so we never accidentally vote on our own row.
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

function parseFaNum(input: string): number {
  const normalized = input.replace(/[۰-۹]/g, (d) =>
    String("0123456789"[d.charCodeAt(0) - 0x06f0])
  );
  const m = normalized.match(/-?\d+/);
  return m ? Number(m[0]) : 0;
}

async function firstHelpfulButton(page: Page): Promise<Locator> {
  const card = page.locator("article").first();
  await expect(card).toBeVisible();
  return card.getByRole("button", { name: /مفید/ });
}

/**
 * Drives the "vote → reload → vote state survives → unvote → reload → state
 * survives" round-trip on whatever the first review card on `path` happens to
 * be. Idempotent: ends with the vote removed regardless of prior state.
 */
async function exerciseVoteRoundTrip(page: Page, path: string) {
  await page.goto(path);
  const btn = await firstHelpfulButton(page);
  const startPressed = (await btn.getAttribute("aria-pressed")) === "true";
  if (startPressed) {
    // Leak from a prior failed run — clean it before we measure baseline.
    await btn.click();
    await expect(btn).toBeEnabled();
    await expect(btn).toHaveAttribute("aria-pressed", "false");
    await page.reload();
  }
  const cleanBtn = await firstHelpfulButton(page);
  const base = parseFaNum(await cleanBtn.innerText());

  await cleanBtn.click();
  // The server action is async via useTransition; the button stays disabled
  // until the write completes. Waiting on `toBeEnabled` is the correct sync
  // point — polling the optimistic UI races the DB write.
  await expect(cleanBtn).toBeEnabled();
  await expect(cleanBtn).toHaveAttribute("aria-pressed", "true");
  expect(parseFaNum(await cleanBtn.innerText())).toBe(base + 1);

  await page.reload();
  const reloaded = await firstHelpfulButton(page);
  expect(parseFaNum(await reloaded.innerText())).toBe(base + 1);
  await expect(reloaded).toHaveAttribute("aria-pressed", "true");

  await reloaded.click();
  await expect(reloaded).toBeEnabled();
  await expect(reloaded).toHaveAttribute("aria-pressed", "false");
  expect(parseFaNum(await reloaded.innerText())).toBe(base);

  await page.reload();
  const final = await firstHelpfulButton(page);
  expect(parseFaNum(await final.innerText())).toBe(base);
  await expect(final).toHaveAttribute("aria-pressed", "false");
}

// Run serially so the three surfaces don't fight over the same vote rows.
test.describe.configure({ mode: "serial" });

test.describe("Helpful vote — multi-surface", () => {
  test("homepage / RecentReviews", async ({ page }) => {
    await login(page);
    await exerciseVoteRoundTrip(page, "/");
  });

  test("/reviews global feed", async ({ page }) => {
    await login(page);
    await exerciseVoteRoundTrip(page, "/reviews");
  });

  test("/company/digikala overview tab", async ({ page }) => {
    await login(page);
    await exerciseVoteRoundTrip(page, "/company/digikala");
  });

  test("unauthenticated click redirects to /login", async ({ page }) => {
    await page.goto("/reviews");
    const btn = await firstHelpfulButton(page);
    await btn.click();
    await expect(page).toHaveURL(/\/login(\?|$)/);
  });
});
