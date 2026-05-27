import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("ReviewSheet picker — companies + Instagram shops", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Instagram shop appears in the picker search results", async ({
    page,
  }) => {
    // ?review=1 opens the sheet via ReviewSheetAutoOpen — auth gate fires for
    // anonymous viewers, but the picker step is what we care about. We open
    // unauthenticated and assert the picker list is fed shops too by checking
    // for one of the seeded shop names.
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ loggedIn: true, name: "تست" }),
      }),
    );
    await page.goto("/?review=1");
    const search = page.getByPlaceholder("مثلاً: دیجی‌کالا");
    await expect(search).toBeVisible({ timeout: 5000 });
    await search.fill("مانتو");
    await expect(
      page.getByRole("button", { name: /مانتو سارا/ }),
    ).toBeVisible();
  });
});

test.describe("Mobile hamburger menu — sticky chrome + scrollable nav", () => {
  test.use({ viewport: { width: 390, height: 600 } }); // short viewport forces overflow

  test("header + footer stay pinned while nav scrolls", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "باز کردن منو" }).click();
    const dialog = page.getByRole("dialog", { name: "منوی اصلی" });
    await expect(dialog).toBeVisible();

    const header = dialog.locator(".border-b").first();
    const footer = dialog.locator(".border-t").first();
    const nav = dialog.locator("nav").first();

    const headerBefore = await header.boundingBox();
    const footerBefore = await footer.boundingBox();
    expect(headerBefore).not.toBeNull();
    expect(footerBefore).not.toBeNull();

    // Scroll the nav region — header and footer should not move.
    await nav.evaluate((el) => el.scrollBy({ top: 200 }));
    await page.waitForTimeout(150);

    const headerAfter = await header.boundingBox();
    const footerAfter = await footer.boundingBox();
    expect(headerAfter?.y).toBe(headerBefore?.y);
    expect(footerAfter?.y).toBe(footerBefore?.y);
  });
});
