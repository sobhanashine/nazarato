import { test, expect, type Page } from "@playwright/test";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

/**
 * Read JWT_SECRET from `.env.local` if the test process didn't inherit it.
 * Next dev auto-loads `.env.local`, but Playwright's runner is a separate
 * Node process — so without this the mint uses the dev-fallback secret while
 * the server validates with the real one, and the cookie silently fails.
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

/**
 * Issue #90 — voice-to-text dictation on the ReviewSheet write step.
 *
 * Real STT can't run in CI (no microphone, no Google STT credit). We inject a
 * scripted `webkitSpeechRecognition` shim that emits a final transcript when
 * `.start()` fires. The mic button then appears, clicking it appends the
 * shim's transcript to the textarea, and a second click stops. We also check
 * the absence-fallback: with no API on `window`, the button doesn't render.
 *
 * Cookie-minting helper mirrors `e2e/helpful-vote.spec.ts` so we skip the OTP
 * flow — the write step needs an authenticated session to render.
 */
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
 * Inject a fake Web Speech API that emits one OR MORE final results in a
 * single session. Overrides BOTH the standard `SpeechRecognition` and the
 * webkit alias, because Chromium ships a native `SpeechRecognition` that
 * the component would otherwise prefer (and would then try to open a real
 * microphone — failing in CI).
 */
function installShim(transcripts: string[]): string {
  const arr = JSON.stringify(transcripts);
  return `
    class FakeRec {
      constructor() {
        this.lang = "";
        this.continuous = false;
        this.interimResults = false;
      }
      start() {
        const transcripts = ${arr};
        // Emit each final result on its own tick so React state has a chance
        // to flush between them — mirrors how the real API delivers them.
        transcripts.forEach((t, i) => {
          setTimeout(() => {
            if (this.onresult) {
              const r = [{ transcript: t }];
              r.isFinal = true;
              this.onresult({ resultIndex: 0, results: [r] });
            }
            if (i === transcripts.length - 1 && this.onend) this.onend();
          }, i * 20);
        });
      }
      stop() { if (this.onend) this.onend(); }
    }
    window.SpeechRecognition = FakeRec;
    window.webkitSpeechRecognition = FakeRec;
  `;
}

test.describe.configure({ mode: "serial" });

test.describe("Voice dictation — issue #90", () => {
  test("button hidden when Web Speech API is absent", async ({ page }) => {
    await page.addInitScript(() => {
      // @ts-expect-error — clearing browser-provided globals for the test
      delete window.SpeechRecognition;
      // @ts-expect-error — clearing browser-provided globals for the test
      delete window.webkitSpeechRecognition;
    });
    await login(page);
    await page.goto("/company/digikala?review=1");
    await expect(page.getByRole("dialog", { name: "ثبت نظر" })).toBeVisible();
    // Even on the write step the button should not render.
    await page
      .getByRole("dialog", { name: "ثبت نظر" })
      .getByRole("radio", { name: /۵ ستاره/ })
      .click();
    await expect(page.getByPlaceholder(/مثلاً/)).toBeVisible({ timeout: 3_000 });
    await expect(page.getByTestId("voice-dictate")).toHaveCount(0);
  });

  test("clicking the mic appends recognized text to the textarea", async ({ page }) => {
    await page.addInitScript(installShim(["سلام دنیا"]));
    await login(page);

    await page.goto("/company/digikala?review=1");
    const dialog = page.getByRole("dialog", { name: "ثبت نظر" });
    await expect(dialog).toBeVisible();

    // Picker is skipped (prefill). Rate 5 stars to auto-advance to write step.
    await dialog.getByRole("radio", { name: /۵ ستاره/ }).click();
    const textarea = dialog.getByPlaceholder(/مثلاً/);
    await expect(textarea).toBeVisible({ timeout: 3_000 });

    // Seed text, then click mic — the recognition result must APPEND, not
    // overwrite — the heart of acceptance criterion #4.
    await textarea.fill("متن دستی");
    const mic = dialog.getByTestId("voice-dictate");
    await expect(mic).toBeVisible();
    await mic.click();

    await expect(textarea).toHaveValue("متن دستی سلام دنیا", { timeout: 3_000 });
  });

  test("multiple final results in one session stack instead of overwriting", async ({ page }) => {
    // Regression for the stale-closure bug in the `onAppend` wiring: if the
    // callback captures `body` from the click moment, the SECOND emission
    // would overwrite the first. The functional updater in WriteStep's
    // onAppend prevents that — this test would have caught the bug.
    await page.addInitScript(installShim(["یکی", "دوتا", "سه‌تا"]));
    await login(page);

    await page.goto("/company/digikala?review=1");
    const dialog = page.getByRole("dialog", { name: "ثبت نظر" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("radio", { name: /۵ ستاره/ }).click();
    const textarea = dialog.getByPlaceholder(/مثلاً/);
    await expect(textarea).toBeVisible({ timeout: 3_000 });

    await dialog.getByTestId("voice-dictate").click();

    await expect(textarea).toHaveValue("یکی دوتا سه‌تا", { timeout: 3_000 });
  });
});
