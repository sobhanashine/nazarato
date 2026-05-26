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
 * The transcription path went through three iterations; this spec exercises
 * the current one: `MediaRecorder` → POST `/api/transcribe` → Gemini.
 *
 * Real STT isn't reachable in CI (no mic, no Gemini key in the test runner),
 * so we shim `MediaRecorder`/`getUserMedia` in the browser and intercept the
 * `/api/transcribe` POST with `page.route()` to return a canned transcript.
 * The "absent API" test removes `MediaRecorder` from `window`; the absence
 * fallback then hides the mic.
 *
 * Cookie-minting helper mirrors `e2e/helpful-vote.spec.ts` so we skip the
 * OTP flow — the write step needs an authenticated session to render.
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
 * Install a fake MediaRecorder + mediaDevices.getUserMedia. Returns minimal
 * shapes — just enough for the component's state machine to make a Blob and
 * fire `onstop`. Real audio data isn't needed because we stub `/api/transcribe`.
 */
const MEDIA_RECORDER_SHIM = `
  if (!navigator.mediaDevices) {
    Object.defineProperty(navigator, "mediaDevices", { value: {}, writable: true });
  }
  navigator.mediaDevices.getUserMedia = async () => ({
    getTracks: () => [{ stop: () => {} }],
  });
  class FakeRec {
    constructor(stream, options) { this.mimeType = (options && options.mimeType) || "audio/webm"; }
    static isTypeSupported(type) {
      return type === "audio/webm;codecs=opus" || type === "audio/webm";
    }
    start() {
      setTimeout(() => {
        if (this.ondataavailable) this.ondataavailable({ data: new Blob(["x"], { type: this.mimeType }) });
      }, 0);
    }
    stop() {
      setTimeout(() => { if (this.onstop) this.onstop(); }, 0);
    }
  }
  window.MediaRecorder = FakeRec;
`;

/** Route handler — answers /api/transcribe with a canned transcript. */
async function stubTranscribe(page: Page, text: string) {
  await page.route("**/api/transcribe", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ text }),
    });
  });
}

test.describe.configure({ mode: "serial" });

test.describe("Voice dictation — issue #90", () => {
  test("button hidden when MediaRecorder is absent", async ({ page }) => {
    await page.addInitScript(() => {
      // @ts-expect-error — clearing browser-provided globals for the test
      delete window.MediaRecorder;
    });
    await login(page);
    await page.goto("/company/digikala?review=1");
    await expect(page.getByRole("dialog", { name: "ثبت نظر" })).toBeVisible();
    await page
      .getByRole("dialog", { name: "ثبت نظر" })
      .getByRole("radio", { name: /۵ ستاره/ })
      .click();
    await expect(page.getByPlaceholder(/مثلاً/)).toBeVisible({ timeout: 3_000 });
    await expect(page.getByTestId("voice-dictate")).toHaveCount(0);
  });

  test("record → transcribe → text appends to the textarea", async ({ page }) => {
    await page.addInitScript(MEDIA_RECORDER_SHIM);
    await stubTranscribe(page, "سلام دنیا");
    await login(page);

    await page.goto("/company/digikala?review=1");
    const dialog = page.getByRole("dialog", { name: "ثبت نظر" });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("radio", { name: /۵ ستاره/ }).click();
    const textarea = dialog.getByPlaceholder(/مثلاً/);
    await expect(textarea).toBeVisible({ timeout: 3_000 });

    await textarea.fill("متن دستی");
    const mic = dialog.getByTestId("voice-dictate");
    await expect(mic).toBeVisible();

    // Click 1: start recording.
    await mic.click();
    await expect(mic).toHaveAttribute("data-state", "recording");

    // Click 2: stop → upload → /api/transcribe responds → text appears.
    await mic.click();
    await expect(textarea).toHaveValue("متن دستی سلام دنیا", { timeout: 3_000 });
    await expect(mic).toHaveAttribute("data-state", "idle");
  });

  test("multiple sessions stack instead of overwriting", async ({ page }) => {
    // Regression for the stale-closure bug fixed in PR #94: if `body` is
    // captured at click-time, the SECOND record session would overwrite.
    await page.addInitScript(MEDIA_RECORDER_SHIM);
    let call = 0;
    const transcripts = ["یکی", "دوتا", "سه‌تا"];
    await page.route("**/api/transcribe", async (route) => {
      const text = transcripts[call++] ?? "";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ text }),
      });
    });
    await login(page);

    await page.goto("/company/digikala?review=1");
    const dialog = page.getByRole("dialog", { name: "ثبت نظر" });
    await dialog.getByRole("radio", { name: /۵ ستاره/ }).click();
    const textarea = dialog.getByPlaceholder(/مثلاً/);
    await expect(textarea).toBeVisible({ timeout: 3_000 });

    const mic = dialog.getByTestId("voice-dictate");
    for (let i = 0; i < 3; i++) {
      await mic.click(); // start
      await expect(mic).toHaveAttribute("data-state", "recording");
      await mic.click(); // stop
      await expect(mic).toHaveAttribute("data-state", "idle", { timeout: 3_000 });
    }
    await expect(textarea).toHaveValue("یکی دوتا سه‌تا");
  });

  test("server error surfaces a Persian toast and resets to idle", async ({ page }) => {
    await page.addInitScript(MEDIA_RECORDER_SHIM);
    await page.route("**/api/transcribe", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "سرویس دیکته در حال حاضر در دسترس نیست." }),
      });
    });
    await login(page);

    await page.goto("/company/digikala?review=1");
    const dialog = page.getByRole("dialog", { name: "ثبت نظر" });
    await dialog.getByRole("radio", { name: /۵ ستاره/ }).click();
    const textarea = dialog.getByPlaceholder(/مثلاً/);
    await expect(textarea).toBeVisible({ timeout: 3_000 });

    const mic = dialog.getByTestId("voice-dictate");
    await mic.click();
    await mic.click();

    // Body unchanged + button reset to idle.
    await expect(textarea).toHaveValue("");
    await expect(mic).toHaveAttribute("data-state", "idle", { timeout: 3_000 });
    await expect(
      page.getByText("سرویس دیکته در حال حاضر در دسترس نیست."),
    ).toBeVisible();
  });
});
