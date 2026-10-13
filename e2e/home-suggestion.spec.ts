import { expect, test } from "@playwright/test";

test.use({
  channel: process.env.PLAYWRIGHT_CHANNEL,
  viewport: { width: 390, height: 844 },
  hasTouch: true,
});

test("home suggestion survives a touch blur with an unknown focus destination", async ({ page }) => {
  test.skip(process.env.NAZARATO_LOCAL_PREVIEW !== "true", "Requires the existing private loopback catalog; no service mutation.");
  await page.goto("/");
  const place = page.locator('main a[href^="/company/"]').first();
  const href = await place.getAttribute("href");
  const name = await place.locator("span.break-words").first().innerText();
  const input = page.getByRole("searchbox", { name: "نام کافه یا رستوران" });
  await input.fill(name);
  const suggestion = page.locator('ul[aria-label="مکان‌های مطابق جستجو"] a').first();
  await expect(suggestion).toHaveAttribute("href", href ?? "");

  // Some touch browsers do not put a tapped link into relatedTarget.
  // Exercise that event order without cancelling the native touch gesture.
  const nativeTouchAllowed = await suggestion.evaluate(element => element.dispatchEvent(new PointerEvent("pointerdown", {
    pointerId: 1, pointerType: "touch", isPrimary: true, bubbles: true, cancelable: true,
  })));
  expect(nativeTouchAllowed).toBe(true);
  await suggestion.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", isPrimary: true, bubbles: true });
  await input.evaluate(element => element.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: null })));
  await expect(suggestion).toBeVisible();
  await suggestion.tap();
  await expect(page).toHaveURL(url => url.pathname === href);
});
