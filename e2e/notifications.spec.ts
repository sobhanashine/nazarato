import { test, expect } from "@playwright/test";

// Both specs hit the `(user)` layout which runs an auth fetch + redirect on
// every load. Parallel browsers race the first compile and one of the two
// will tail off past the 5s assertion timeout. Serial keeps it clean.
test.describe.configure({ mode: "serial" });

test.describe("Notifications page — issue #30", () => {
  test("unauthenticated /notifications redirects to /login with ?next", async ({
    page,
  }) => {
    await page.goto("/notifications");
    await expect(page).toHaveURL(/\/login(\?|$)/);
    const url = new URL(page.url());
    expect(url.searchParams.get("next")).toBe("/notifications");
  });

  test("legacy /profile/notifications eventually lands on /login?next=/notifications", async ({
    page,
  }) => {
    // The redirect chain is: /profile/notifications → /notifications →
    // (unauth gate) → /login?next=/notifications.
    await page.goto("/profile/notifications");
    await expect(page).toHaveURL(/\/login(\?|$)/);
    const url = new URL(page.url());
    expect(url.searchParams.get("next")).toBe("/notifications");
  });
});
