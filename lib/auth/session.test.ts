import { afterEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ values: new Map<string, string>() }));
vi.mock("next/headers", () => ({ cookies: async () => ({
  get: (key: string) => state.values.has(key) ? { value: state.values.get(key) } : undefined,
  set: (key: string, value: string) => state.values.set(key, value),
  delete: (key: string) => state.values.delete(key),
}) }));
import { getSession, setSession } from "./session";
afterEach(() => { state.values.clear(); vi.unstubAllEnvs(); vi.useRealTimers(); });
it("expires staging sessions server-side even when the client replays a cookie", async () => {
  vi.stubEnv("NAZARATO_DEPLOYMENT_ENV", "staging"); vi.stubEnv("JWT_SECRET", "x".repeat(64)); vi.useFakeTimers();
  await setSession({ id: "test", phone: "+989120000000", name: "test" });
  expect((await getSession())?.id).toBe("test");
  vi.setSystemTime(Date.now() + 31 * 86_400_000);
  expect(await getSession()).toBeNull();
});
it("rejects modified session cookies", async () => {
  vi.stubEnv("JWT_SECRET", "x".repeat(64));
  await setSession({ id: "test", phone: "+989120000000", name: "test" });
  state.values.set("nzr_session", `forged.${state.values.get("nzr_session")}`);
  expect(await getSession()).toBeNull();
});
