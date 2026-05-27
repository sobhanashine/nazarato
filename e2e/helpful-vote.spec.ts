import { test, expect, type Page, type Locator } from "@playwright/test";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

/**
 * Read JWT_SECRET from `.env.local` if the test process didn't inherit it.
 * Next dev auto-loads `.env.local`, but Playwright's runner is a separate
 * Node process — so without this the mint uses the dev-fallback secret while
 * the server validates with the real one, and the cookie silently fails:
 * every server action returns `auth_required` and the button bounces the
 * page to /login mid-test.
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
    // .env.local optional in some environments — fall through to the dev secret.
  }
  return "dev-insecure-fallback-secret-do-not-ship";
}

function loadEnv(key: string): string | null {
  if (process.env[key]) return process.env[key] as string;
  try {
    const text = readFileSync(".env.local", "utf8");
    const match = text.match(new RegExp(`^${key}=(.+)$`, "m"));
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

/**
 * Sign a session payload the same way `lib/auth/session.ts` does, so we can
 * mint a logged-in cookie without driving the full OTP flow.
 */
function signSession(payload: { id: string; phone: string; name: string }): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", loadJwtSecret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

// A seeded user with no votes at the start. Owns no reviews on the surfaces we
// exercise, so we never accidentally vote on our own row.
const TEST_USER = {
  id: "a2cbde59-f330-4f5b-8a84-cd55963ea908",
  phone: "+989113456545",
  name: "محراب قربانی",
};

/**
 * Wipe every helpful vote belonging to the test user. Without this, a leaked
 * vote from a previous failed run flips the next run's `base` count by one,
 * the action sees an existing vote and deletes (instead of inserts), and the
 * `+1 after reload` assertion misses by two.
 */
async function resetTestUserVotes(): Promise<void> {
  const url = loadEnv("SUPABASE_URL") || loadEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = loadEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return; // best-effort — local-only runs without creds keep working
  const endpoint = `${url}/rest/v1/review_votes?user_id=eq.${TEST_USER.id}`;
  await fetch(endpoint, {
    method: "DELETE",
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  }).catch(() => {
    /* network blip — the inline `startPressed` cleanup below is the second line of defence */
  });
}

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
    await expect(btn).toHaveAttribute("aria-pressed", "false");
    await page.reload();
  }
  const cleanBtn = await firstHelpfulButton(page);
  const base = parseFaNum(await cleanBtn.innerText());

  await cleanBtn.click();
  // The button updates optimistically — `aria-pressed` flips synchronously
  // on click. `data-busy="false"` is the persistence sync point: the server
  // action has resolved, so a subsequent reload will see the new state.
  await expect(cleanBtn).toHaveAttribute("aria-pressed", "true");
  expect(parseFaNum(await cleanBtn.innerText())).toBe(base + 1);
  await expect(cleanBtn).toHaveAttribute("data-busy", "false");

  await page.reload();
  const reloaded = await firstHelpfulButton(page);
  expect(parseFaNum(await reloaded.innerText())).toBe(base + 1);
  await expect(reloaded).toHaveAttribute("aria-pressed", "true");

  await reloaded.click();
  await expect(reloaded).toHaveAttribute("aria-pressed", "false");
  expect(parseFaNum(await reloaded.innerText())).toBe(base);
  await expect(reloaded).toHaveAttribute("data-busy", "false");

  await page.reload();
  const final = await firstHelpfulButton(page);
  expect(parseFaNum(await final.innerText())).toBe(base);
  await expect(final).toHaveAttribute("aria-pressed", "false");
}

// Run serially so the three surfaces don't fight over the same vote rows.
test.describe.configure({ mode: "serial" });

test.describe("Helpful vote — multi-surface", () => {
  test.beforeEach(async ({}, testInfo) => {
    // Each round-trip touches 4 server-action paths and does 2 full reloads.
    // Under `next dev` with parallel workers, Turbopack's lazy compile can
    // push that past the 30s default — give it headroom rather than racing
    // the compiler.
    testInfo.setTimeout(90_000);
    await resetTestUserVotes();
  });

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
