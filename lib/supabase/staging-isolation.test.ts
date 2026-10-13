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
