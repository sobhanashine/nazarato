import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT) || 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
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
