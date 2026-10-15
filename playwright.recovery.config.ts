import { defineConfig, devices } from "@playwright/test";
const port = Number(process.env.NAZARATO_RECOVERY_PORT || 4321);
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["product-recovery.spec.ts", "mobile-redesign.spec.ts", "main-design.spec.ts"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  globalTimeout: 300_000,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: {
    channel: process.env.PLAYWRIGHT_CHANNEL,
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
    locale: "fa-IR",
    serviceWorkers: "block",
  },
  projects: [{ name: "isolated-chromium", use: devices["Desktop Chrome"] }],
  webServer: {
    command: "node e2e/support/recovery-server.mjs",
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: { NAZARATO_RECOVERY_PORT: String(port) },
  },
});
