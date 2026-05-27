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
  // 15s default (vs Playwright's 5s) — Next dev compiles each route on first
  // hit, and a cold compile can blow a 5s budget on its own. Three separate
  // specs were carrying per-assertion `{ timeout: 15_000 }` bumps to work
  // around this; lifting the default centralises that and stops new specs
  // from re-discovering the same flake.
  expect: { timeout: 15_000 },
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
