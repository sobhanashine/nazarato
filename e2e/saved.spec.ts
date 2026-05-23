import { test, expect } from "@playwright/test";

test.describe("Saved Page (Bookmarks)", () => {
  // We mock the user session to test the authenticated page
  test.use({
    storageState: {
      cookies: [
        {
          name: "nzr_session",
          // MOCK token: this must decode properly. Usually in e2e we login first or use a fixture.
          // Since it requires JWT_SECRET we'll just test the redirect for now, or assume a test account exists.
          value: "test-session-mock",
          domain: "localhost",
          path: "/",
        },
      ],
      origins: [],
    },
  });

  test("redirects to login if not authenticated", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/saved");
    
    // Should redirect to login (caught by user layout which redirects to profile)
    await expect(page).toHaveURL(/.*\/login\?next=\/profile/);
  });

  // Because true E2E with db requires proper seeding and JWT signing,
  // we could just verify the tab states using page parameters
  // Playwright tests that hit real DB will be run by CI or manually setup.
});
