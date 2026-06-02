import { expect, test } from "@playwright/test";

/**
 * Contact form — issue #142. The server-side delivery (DB insert) is covered by
 * unit tests (validation) + a manual end-to-end insert check; these specs guard
 * the client form behaviour without writing rows to the production table on
 * every CI run, so they only exercise the validation paths (no successful
 * submit).
 */
test.describe("Contact form", () => {
  test("blocks submit and shows required-field errors when empty", async ({
    page,
  }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "ارسال پیام" }).click();

    await expect(page.getByText("نام الزامی است")).toBeVisible();
    await expect(page.getByText("ایمیل الزامی است")).toBeVisible();
    await expect(page.getByText("متن پیام الزامی است")).toBeVisible();
    // Still on the form — no success state.
    await expect(page.getByRole("heading", { name: "پیام شما ارسال شد" })).toHaveCount(0);
  });

  test("flags an invalid email format", async ({ page }) => {
    await page.goto("/contact");
    const email = page.getByLabel("ایمیل");
    await email.fill("not-an-email");
    await email.blur();
    await expect(page.getByText("فرمت نامعتبر")).toBeVisible();
  });
});
