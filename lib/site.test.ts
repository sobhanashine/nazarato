import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
describe("staging discovery by crawlers", () => {
  it("uses the staging origin and blocks all crawler discovery", async () => {
    vi.stubEnv("NEXT_PUBLIC_NAZARATO_ENV", "staging");
    vi.resetModules();
    const { SITE_URL } = await import("./site");
    const { default: robots } = await import("../app/robots");
    const { default: sitemap } = await import("../app/sitemap");
    expect(SITE_URL).toBe("https://staging.nazarato.ir");
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    expect(sitemap()).toEqual([]);
  });
  it("keeps the existing production origin and homepage sitemap", async () => {
    vi.stubEnv("NEXT_PUBLIC_NAZARATO_ENV", "");
    vi.resetModules();
    const { SITE_URL } = await import("./site");
    const { default: sitemap } = await import("../app/sitemap");
    expect(SITE_URL).toBe("https://nazarato.ir");
    expect(sitemap()).toEqual([{ url: "https://nazarato.ir/" }]);
  });
});
