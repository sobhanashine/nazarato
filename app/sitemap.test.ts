import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";
import robots from "./robots";
import nextConfig from "../next.config";

describe("early SEO launch boundary", () => {
  it("only submits the ready homepage, never the unfinished catalog or accounts", () => {
    expect(sitemap().map(entry => entry.url)).toEqual(["https://nazarato.ir/"]);
    expect(sitemap().every(entry => entry.lastModified === undefined)).toBe(true);
  });

  it("lets crawlers read pages and their noindex while advertising the canonical sitemap", () => {
    expect(robots()).toMatchObject({
      rules: { userAgent: "*", allow: "/", disallow: "/api/" },
      sitemap: "https://nazarato.ir/sitemap.xml",
    });
  });

  it("keeps every non-home document noindex even if its own metadata overrides the default", async () => {
    const entries = await nextConfig.headers?.();
    expect(entries?.find(entry => entry.source === "/:path+")?.headers).toContainEqual({
      key: "X-Robots-Tag", value: "noindex, follow",
    });
    expect(entries?.filter(entry => entry.source === "/").flatMap(entry => entry.headers))
      .not.toContainEqual({ key: "X-Robots-Tag", value: "noindex, follow" });
  });
});
