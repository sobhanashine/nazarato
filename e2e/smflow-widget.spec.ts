import { expect, test } from "@playwright/test";

/**
 * The SMFlow chat widget injects its FAB and iframe container into our
 * RTL body from staging.smflow.io. These specs verify (a) the loader
 * script is in the page, (b) on desktop the FAB pins to the bottom-right,
 * and (c) on mobile it lifts above the <MobileTabBar /> rather than
 * overlapping it.
 */
test.describe("SMFlow widget", () => {
  // The widget is gated behind NEXT_PUBLIC_SMFLOW_ENABLED. When it's off
  // (the default), there's nothing to test — skip rather than fail noisily.
  // We detect the enabled state by looking for our SSR'd mobile toggle (the
  // button is in the initial HTML; the loader <script> only appears after
  // hydration, so it's racey to gate on that).
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const hasToggle = await page
      .locator('button[aria-controls="smflow-widget-container"]')
      .count();
    test.skip(
      hasToggle === 0,
      "SMFlow widget disabled (NEXT_PUBLIC_SMFLOW_ENABLED != 'true')",
    );
  });

  test("loader script is present on the homepage", async ({ page }) => {
    await page.goto("/");
    const loader = page.locator(
      'script[src="https://staging.smflow.io/widget.js"]',
    );
    await expect(loader).toHaveCount(1);
    await expect(loader).toHaveAttribute(
      "data-business-id",
      "d8d67a59-c4c9-4b36-b739-13e8f07d3097",
    );
  });

  test("floating button is pinned to the bottom-right", async ({ page }) => {
    await page.goto("/");

    // Wait for the third-party loader to inject the FAB into the DOM.
    // Generous timeout because it depends on an external CDN.
    const fab = page.locator("#smflow-fab");
    await fab.waitFor({ state: "attached", timeout: 15_000 });

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    if (!viewport) return;

    const box = await fab.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    const rightGap = viewport.width - (box.x + box.width);
    const bottomGap = viewport.height - (box.y + box.height);

    // Our override targets `right: 20px; bottom: 20px`. Allow a 60px
    // tolerance for any internal padding the widget adds inside its host.
    expect(rightGap).toBeLessThan(60);
    expect(bottomGap).toBeLessThan(60);
    // And it must NOT be centered — left gap should be much larger than right.
    expect(box.x).toBeGreaterThan(viewport.width / 2);
  });

  // On mobile we hide the FAB by default and surface a right-edge toggle.
  // Tapping the toggle reveals the FAB; tapping again hides it. We verify
  // (a) hidden by default, (b) visible after tap, (c) sits above the tab bar
  // and stays pinned right, (d) hides again after second tap.
  for (const { name, width, height } of [
    { name: "iPhone SE", width: 375, height: 667 },
    { name: "iPhone 12", width: 390, height: 844 },
    { name: "Pixel 5", width: 393, height: 851 },
  ]) {
    test(`mobile (${name}): toggle reveals FAB above tab bar, stays right`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");

      // Toggle handle should be on the right edge, mobile-only.
      const toggle = page.getByRole("button", {
        name: /دستیار هوشمند/,
      });
      await expect(toggle).toBeVisible();

      // FAB hidden until toggled.
      const fab = page.locator("#smflow-fab");
      await fab.waitFor({ state: "attached", timeout: 15_000 });
      await expect(fab).toBeHidden();

      // Tap → reveal.
      await toggle.click();
      await expect(fab).toBeVisible();

      const box = await fab.boundingBox();
      expect(box).not.toBeNull();
      if (!box) return;

      // Tab bar tallest point ≈ 100px from viewport bottom. FAB must clear it.
      const fabBottomFromViewportBottom = height - (box.y + box.height);
      expect(fabBottomFromViewportBottom).toBeGreaterThanOrEqual(95);

      // Pinned right, not centered.
      const rightGap = width - (box.x + box.width);
      expect(rightGap).toBeLessThan(60);
      expect(box.x).toBeGreaterThan(width / 2);

      // Tap again → hidden.
      await toggle.click();
      await expect(fab).toBeHidden();
    });
  }
});
