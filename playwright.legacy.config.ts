import { defineConfig, devices } from "@playwright/test";

// Historical tests can write to a configured Supabase. They are outside the
// default suite and require explicit selection plus an isolated test project.
if (process.env.NAZARATO_LEGACY_E2E_ALLOW_REMOTE_WRITES !== "true") {
  throw new Error("Legacy E2E writes require explicit authorization and an isolated database; use npm run test:e2e instead.");
}

const PORT = Number(process.env.PORT) || 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/product-recovery.spec.ts", "**/mobile-redesign.spec.ts", "**/review-redesign.spec.ts", "**/home-suggestion.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    locale: "fa-IR",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 60_000,
    // Enable the SMFlow widget for E2E runs even though it ships off by
    // default. This only applies when Playwright is the one starting the
    // server (reuseExistingServer: true keeps an existing dev session,
    // whatever its env). For a clean local run, kill the dev server first.
    env: {
      NEXT_PUBLIC_SMFLOW_ENABLED: "true",
    },
  },
});
