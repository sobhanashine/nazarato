import { afterEach, expect, it, vi } from "vitest";
import { requestGemini } from "./gemini";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it("keeps the credential out of the URL and streams the configured model", async () => {
  vi.stubEnv("GEMINI_MODEL", "gemini-2.5-flash");
  const fetcher = vi.fn().mockResolvedValue(new Response("ok")); vi.stubGlobal("fetch", fetcher);
  await requestGemini("test-secret", { contents: [] });
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toContain("gemini-2.5-flash:streamGenerateContent?alt=sse");
  expect(url).not.toContain("test-secret");
  expect(options.headers["x-goog-api-key"]).toBe("test-secret");
  expect(options.redirect).toBe("manual");
  expect(options.signal).toBeInstanceOf(AbortSignal);
});
it("does not follow a redirect that could receive the API credential", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { location: "https://untrusted.invalid/" } }));
  vi.stubGlobal("fetch", fetcher);
  const response = await requestGemini("test-secret", {});
  expect(response.status).toBe(302);
  expect(fetcher).toHaveBeenCalledOnce();
  expect(fetcher.mock.calls[0][1].redirect).toBe("manual");
});
it("rejects invalid model paths without contacting a provider", async () => {
  vi.stubEnv("GEMINI_MODEL", "../other?key=anything");
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  await expect(requestGemini("test-secret", {})).rejects.toThrow("Invalid Gemini model");
  expect(fetcher).not.toHaveBeenCalled();
});
