import { describe, expect, it } from "vitest";
import { assertStagingDatabaseIsolation } from "./staging-isolation";

const ref = "abcdefghijklmnopqrst";
describe("staging database isolation", () => {
  it("allows the explicitly configured isolated HTTPS project", () => {
    expect(() => assertStagingDatabaseIsolation(`https://${ref}.supabase.co`, ref)).not.toThrow();
  });
  it.each<[string, string | undefined]>([
    ["https://sdlmjdxrfyhuiegjysac.supabase.co", undefined],
    ["https://sdlmjdxrfyhuiegjysac.supabase.co", "sdlmjdxrfyhuiegjysac"],
    ["https://sdlmjdxrfyhuiegjysac.supabase.co", ref],
    [`http://${ref}.supabase.co`, ref],
    [`https://${ref}.supabase.co.attacker.test`, ref],
    [`https://user:pass@${ref}.supabase.co`, ref],
    [`https://${ref}.supabase.co/rest/v1`, ref],
    ["invalid", ref],
  ])("rejects an unsafe or unconfigured target", (url, projectRef) => {
    expect(() => assertStagingDatabaseIsolation(url, projectRef)).toThrow();
  });
});


describe("explicit shared-main staging database", () => {
  const mainRef = "sdlmjdxrfyhuiegjysac";
  it("allows the exact founder-approved main project only with explicit mode", () => {
    expect(() => assertStagingDatabaseIsolation(`https://${mainRef}.supabase.co`, mainRef, "shared-main")).not.toThrow();
  });
  it("does not allow shared-main mode to select another project", () => {
    expect(() => assertStagingDatabaseIsolation(`https://${ref}.supabase.co`, ref, "shared-main")).toThrow();
  });
  it("rejects misspelled modes and URL variants", () => {
    expect(() => assertStagingDatabaseIsolation(`https://${mainRef}.supabase.co`, mainRef, "shared")).toThrow();
    expect(() => assertStagingDatabaseIsolation(`https://${mainRef}.supabase.co/other`, mainRef, "shared-main")).toThrow();
  });
});
