import { describe, expect, it, vi } from "vitest";
import { buildHealthReport, resolveReleaseSha } from "./health-report";

const NOW = new Date("2026-09-04T10:30:00.000Z");

describe("resolveReleaseSha", () => {
  it("prefers an explicit valid release SHA and normalizes it", () => {
    expect(
      resolveReleaseSha({
        RELEASE_SHA: " A3E4E87 ",
        VERCEL_GIT_COMMIT_SHA: "4722f06",
      }),
    ).toBe("a3e4e87");
  });

  it("does not expose an invalid environment value", () => {
    expect(resolveReleaseSha({ RELEASE_SHA: "latest-main" })).toBe("unknown");
  });
});

describe("buildHealthReport", () => {
  it("is ready only when release, database, and non-demo data are verified", async () => {
    const probeDatabase = vi.fn(async () => undefined);

    const report = await buildHealthReport({
      env: {
        RELEASE_SHA: "7b37c33",
        VERCEL_ENV: "preview",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "test-only-key",
      },
      dataMode: "pilot",
      probeDatabase,
      now: () => NOW,
    });

    expect(report).toEqual({
      schemaVersion: 1,
      service: "nazarato",
      ok: true,
      releaseSha: "7b37c33",
      environment: "preview",
      database: "ok",
      demoMode: false,
      checkedAt: NOW.toISOString(),
    });
    expect(probeDatabase).toHaveBeenCalledOnce();
  });

  it("fails closed without database configuration or a release SHA", async () => {
    const probeDatabase = vi.fn(async () => undefined);

    const report = await buildHealthReport({
      env: { NODE_ENV: "development" },
      dataMode: "fictional-demo",
      probeDatabase,
      now: () => NOW,
    });

    expect(report).toMatchObject({
      ok: false,
      releaseSha: "unknown",
      environment: "development",
      database: "unconfigured",
      demoMode: true,
    });
    expect(probeDatabase).not.toHaveBeenCalled();
  });

  it("reports a database failure without leaking the thrown error", async () => {
    const report = await buildHealthReport({
      env: {
        RELEASE_SHA: "7b37c33",
        NODE_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "test-only-key",
      },
      dataMode: "production",
      probeDatabase: async () => {
        throw new Error("secret database detail");
      },
      now: () => NOW,
    });

    expect(report.database).toBe("error");
    expect(report.ok).toBe(false);
    expect(JSON.stringify(report)).not.toContain("secret database detail");
  });
});
